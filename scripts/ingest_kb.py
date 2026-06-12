#!/usr/bin/env python3
"""
Ingest a .docx knowledge base into the Supabase `kb_documents` pgvector table for
the EVA chatbot RAG. Chunks by Markdown-ish headings, embeds each chunk with
Google Gemini `text-embedding-004` (768-dim), and inserts via the Supabase REST
API. Idempotent per source: deletes existing rows for this source first.

Run (PowerShell):
  $env:GEMINI_API_KEY="AIza..."; python scripts/ingest_kb.py "C:\\path\\AI Knowledge Base .docx"

Supabase URL + anon key are read from .env.local (VITE_SUPABASE_URL /
VITE_SUPABASE_ANON_KEY) unless SUPABASE_URL / SUPABASE_KEY env vars are set.
Prereq: run supabase/rag-kb.sql once in the Supabase SQL editor.
"""
import json, os, re, sys, time, urllib.request, urllib.error, zipfile, html

GEMINI_MODEL = "text-embedding-004"
EMBED_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:embedContent"
MAX_CHARS = 1600          # ~400 tokens/chunk
OVERLAP = 200
SOURCE = "ai-knowledge-base"


def load_env(path=".env.local"):
    env = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def docx_text(path):
    z = zipfile.ZipFile(path)
    xml = z.read("word/document.xml").decode("utf-8", "ignore")
    paras = re.split(r"</w:p>", xml)
    out = []
    for p in paras:
        txt = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", p, re.S))
        out.append(html.unescape(re.sub(r"<[^>]+>", "", txt)))
    return "\n".join(out)


def chunk(text):
    """Split on '### ' / '## ' headings, then hard-wrap long sections w/ overlap."""
    blocks, cur, title = [], [], "Intro"
    for line in text.split("\n"):
        m = re.match(r"^#{2,4}\s+(.*)", line.strip())
        if m:
            if cur:
                blocks.append((title, "\n".join(cur).strip()))
            title, cur = m.group(1).strip(), [line]
        else:
            cur.append(line)
    if cur:
        blocks.append((title, "\n".join(cur).strip()))

    chunks = []
    for title, body in blocks:
        body = re.sub(r"\n{3,}", "\n\n", body).strip()
        if not body:
            continue
        if len(body) <= MAX_CHARS:
            chunks.append((title, body))
        else:
            i = 0
            while i < len(body):
                chunks.append((title, body[i:i + MAX_CHARS]))
                i += MAX_CHARS - OVERLAP
    return chunks


def post(url, payload, headers):
    req = urllib.request.Request(url, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json", **headers}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode() or "{}")


def embed(text, key):
    for attempt in range(4):
        try:
            r = post(f"{EMBED_URL}?key={key}",
                     {"content": {"parts": [{"text": text}]}}, {})
            return r["embedding"]["values"]
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 503) and attempt < 3:
                time.sleep(2 * (attempt + 1)); continue
            raise


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\lemue\Downloads\AI Knowledge Base .docx"
    env = load_env()
    gkey = os.environ.get("GEMINI_API_KEY", "")
    surl = os.environ.get("SUPABASE_URL") or env.get("VITE_SUPABASE_URL", "")
    skey = os.environ.get("SUPABASE_KEY") or env.get("VITE_SUPABASE_ANON_KEY", "")
    if not gkey:
        sys.exit("Set GEMINI_API_KEY (AIza...).")
    if not surl or not skey:
        sys.exit("Missing Supabase URL/key (.env.local VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).")

    rest = surl.rstrip("/") + "/rest/v1/kb_documents"
    sup_headers = {"apikey": skey, "Authorization": f"Bearer {skey}"}

    text = docx_text(src)
    chunks = chunk(text)
    print(f"Source: {src}\nChunks: {len(chunks)}")

    # Idempotent: clear prior rows for this source.
    try:
        req = urllib.request.Request(f"{rest}?metadata->>source=eq.{SOURCE}",
                                     headers=sup_headers, method="DELETE")
        urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as e:
        print("delete warn:", e.code)

    ok = 0
    for i, (title, body) in enumerate(chunks):
        try:
            vec = embed(body, gkey)
            row = {
                "content": body,
                "metadata": {"source": SOURCE, "title": title, "chunk": i},
                "embedding": "[" + ",".join(f"{x:.6f}" for x in vec) + "]",
            }
            post(rest, row, {**sup_headers, "Prefer": "return=minimal"})
            ok += 1
            if ok % 10 == 0 or i == len(chunks) - 1:
                print(f"  {ok}/{len(chunks)} inserted")
            time.sleep(0.4)  # stay under Gemini free-tier RPM
        except Exception as e:  # noqa
            print(f"  chunk {i} failed: {e}")
    print(f"Done. {ok}/{len(chunks)} chunks embedded + stored.")


if __name__ == "__main__":
    main()
