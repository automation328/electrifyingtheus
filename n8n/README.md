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
