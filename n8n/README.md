# n8n — Website Chatbot (EVA) knowledge base

The homepage chat and `/assistant` are powered by an n8n **Webhook → AI Agent** workflow.
The website posts each message to the `evan-chat` webhook (see `VITE_N8N_WEBHOOK_URL`).

**Architecture: Supabase RAG (since Jul 2026).** The agent no longer carries the whole
knowledge base in its System Message. Instead it has a compact prompt (rules, identity,
guardrails, special responses — see `EVA-system-prompt-RAG.md`) plus an **`ev_knowledge_base`
retrieval tool** backed by a Supabase pgvector table. On every question the agent searches
the vector store and answers from the passages it gets back. This keeps per-message tokens
low (~4k vs ~45k baked-in) and lets the corpus grow without bloating the prompt.

The knowledge base source documents (chunked + embedded into the vector store):

- `EVNoire_EV_Charging_101_v2_Updated.docx` — *EV Charging 101 & Beyond* (DOCUMENT 1)
- `EVNoire_EV101_v2_Updated.docx` — *Multimodal EV101* (DOCUMENT 2)
- `Michigan EV Charging Incentives Guide_2026-07-28.docx` — *Michigan EV & Charging Incentives Guide* (state-specific; DOCUMENT 3)
- `GM EV Knowledge Base_2026-07-28.docx` — *General Motors: EV & EV Charging* (DOCUMENT 4) and *Gasoline-Powered Vehicle Lineup* (DOCUMENT 5)
- `Washington_SeattleCityLight_EV_Incentives_Guide.docx` — *Washington State & Seattle City Light EV & Charging Incentives Guide* (state-specific; DOCUMENT 6)
- `oregon-ev-incentives-kb.md` — *Oregon EV & Charging Incentives Guide* (state-specific; DOCUMENT 7). Lives in this folder as markdown, unlike the .docx documents above: it was written here rather than supplied, so the source of every figure is reviewable in git.
- `seattle-city-light-kb.md` — *Seattle City Light EV & Charging Incentives Guide* (utility-specific; DOCUMENT 8). **Supersedes the Seattle City Light half of DOCUMENT 6**, whose figures came from a City Light manual that has since been replaced. Markdown in this folder for the same reason as the Oregon guide.
- `puget-sound-energy-kb.md` — *Puget Sound Energy EV & Charging Incentives Guide* (utility-specific; DOCUMENT 9). Companion to DOCUMENT 8: PSE bills the parts of Burien, Renton, SeaTac, Shoreline and Tukwila that Seattle City Light does not, and unlike City Light it pays a residential home charger rebate. The two guides cross-reference each other.

Key files in this folder:

> - **`EVA-system-prompt.md`** — the full knowledge base (DOCUMENTS 1–5). This is the **ingestion source** (chunked + embedded), no longer pasted into the agent.
> - **`EVA-system-prompt-RAG.md`** — the compact prompt actually running in the live agent's System Message.
> - **`etus_kb_documents.sql`** — the Supabase table + match function DDL.
> - **`oregon-ev-incentives-kb.md`** — the Oregon state guide, ready to paste or upload
>   into the CMS (admin → EVan knowledge base → new document → **Save & re-embed**),
>   which chunks and embeds it into `etus_kb_documents` with no deploy.
> - **`puget-sound-energy-kb.md`** — the Puget Sound Energy guide, loaded the same way.
>   Carries time-sensitive status: PSE HELP is paused for September 2026 and the TER
>   Project Grant is closed until 2027, so re-check those two before a later re-embed.
> - **`seattle-city-light-kb.md`** — the Seattle City Light guide, loaded the same way.
>   It contradicts DOCUMENT 6 on purpose: City Light reactivated market-rate multifamily
>   incentives on 12 Nov 2025 and renamed the fleet programme, so the older document is
>   wrong on those points. Re-embed this one; do not delete DOCUMENT 6, which still
>   carries the Washington State and federal programmes.

> **When you add a state guide,** also add the state to the grounding-rules sentence in
> `EVA-system-prompt-RAG.md` (it names which state guides the corpus holds) and to the
> list above. Retrieval is semantic and will surface the document either way, but the
> prompt tells the agent what it is allowed to believe it knows.

## The live workflow

`https://n8n-9odn.srv1570441.hstgr.cloud`, workflow `Y6kahfizPcdz5MMy`
(**"EVan Chat → Slack Leads"**, webhook path `evan-chat`). Relevant nodes:

- **EVan Agent** — System Message = `EVA-system-prompt-RAG.md`; OpenRouter `google/gemini-2.5-flash`.
- **ETUS Knowledge Base** — `vectorStoreSupabase` (retrieve-as-tool, tool name `ev_knowledge_base`), table `etus_kb_documents`, RPC `match_etus_kb_documents`.
- **KB Embeddings** — Google Gemini (`gemini-embedding-001`, 3072-dim). The **same** embedding model must be used for ingestion and retrieval.
- Brave web-search fallback fires when the agent returns the "Concierges will reach out" message.

Supabase project **"Electrifying the US"** (`wmwjjejrgequyersrjnh`), table `etus_kb_documents`.

> Other EVan workflows exist on this instance (e.g. `p7VVAh6DWMlo667A` uses `kb_documents`,
> `Oq5led9c71ulGftw` uses `emr_kb_documents`). The **live website** agent is the `evan-chat`
> workflow above, using `etus_kb_documents`. Update that one.

## Updating the knowledge base later

1. Edit `EVA-system-prompt.md` (or drop new `.docx` files and re-assemble it).
2. In Supabase, `truncate table public.etus_kb_documents;` (see `etus_kb_documents.sql`).
3. Re-chunk DOCUMENTS 1–5 (≤~1000 chars each, tagged with a `source` metadata label) and
   POST them in batches to an ingestion workflow that runs: Code (emit `{content, metadata}`)
   → Doc Loader → Recursive splitter → Gemini embeddings → `vectorStoreSupabase` **insert**
   into `etus_kb_documents`. (The project assistant scripted this; a deactivated
   "ETUS KB — Ingestion" workflow on the instance is the template.)
4. If only the **rules/guardrails** change (not the KB facts), just update the **EVan Agent**
   System Message from `EVA-system-prompt-RAG.md` — no re-ingestion needed.

> Heads-up: the Hostinger/Cloudflare proxy in front of this instance drops many webhook
> requests and cuts responses at ~21s. Bulk ingestion must use modest batches and verify
> progress against the live row count / executions API, not the HTTP response.

## Lead fields the website sends to the webhook

The homepage chat (`AgentChatSection`) and `/assistant` collect the visitor's
details once, before answering the first question, and POST them to the same
webhook. Two payload shapes are sent:

**On lead capture** (`action: "captureLead"`):

| field            | type   | required | notes                                      |
|------------------|--------|----------|--------------------------------------------|
| `firstName`      | string | yes      | First name                                 |
| `email`          | string | yes      | Validated email                            |
| `phone`          | string | no       | Mobile number                              |
| `zip`            | string | no       | 5-digit ZIP                                |
| `currentVehicle` | string | no       | What they currently drive                  |
| `timeframe`      | string | no       | EV purchase window (e.g. `0–3 months`)     |
| `sessionId`      | string | —        | Stable per-tab id for agent memory         |

**On each question** (`action: "sendMessage"`): the same lead fields are
included alongside `chatInput` / `message` (the question) and `sessionId`.

To persist or route these, map them in the workflow **after** the Chat Trigger
(e.g. a Set node → Google Sheets / CRM / email). No frontend change is needed;
the fields are already in the request body. Branch on `action` to separate a
pure lead-capture event from a question.
