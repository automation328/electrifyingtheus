# n8n — Website Chatbot (EVA) knowledge base

The homepage chat and `/assistant` are powered by an n8n **Chat Trigger → AI Agent** workflow.
The agent answers **only** from EVNoire's two guides, which are baked into the agent's
**System Message**:

- `EVNoire_EV_Charging_101_v2_Updated.docx` — *EV Charging 101 & Beyond*
- `EVNoire_EV101_v2_Updated.docx` — *Multimodal EV101*

The full, ready-to-paste system prompt (rules + both documents) is in:

> **`EVA-system-prompt.md`**

## How to update the live agent (Hostinger instance)

The live workflow runs on `https://n8n-9odn.srv1570441.hstgr.cloud`
(workflow `p7VVAh6DWMlo667A`). To refresh its knowledge base:

1. Open the workflow → double-click the **Electrifying US Agent** node.
2. Open **Options → System Message**.
3. Replace its contents with the **entire** text of `EVA-system-prompt.md`.
4. **Save**, then make sure the workflow is **Active**.

No other node changes are needed — the webhook URL, OpenRouter/MiniMax model, and
per-session memory stay the same, so the website keeps working without any frontend change.

## Updating the source documents later

1. Drop the new `.docx` files in Downloads (or anywhere).
2. Re-extract + reassemble `EVA-system-prompt.md` (the project assistant can do this).
3. Repeat the paste steps above.

> Note: the whole knowledge base (~22k tokens) is sent as the system prompt on every
> message. That's the most reliable setup for these two guides. If the corpus grows much
> larger, switch to a persistent vector store (Supabase/Pinecone/Qdrant) for chunked RAG.
