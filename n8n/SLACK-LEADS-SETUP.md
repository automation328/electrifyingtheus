# EVan chat → Slack lead capture

Sends every chatbot **lead** (first name + email) and every **inquiry + EVan's answer**
to the Slack **#lem-test** channel, while still answering the visitor in the chat.

## What the website sends

The homepage concierge + `/assistant` POST JSON to `VITE_N8N_WEBHOOK_URL`:

| Event | Payload |
|-------|---------|
| Lead captured | `{ "action": "captureLead", "sessionId", "firstName", "email" }` |
| Question asked | `{ "action": "sendMessage", "sessionId", "chatInput", "message", "firstName", "email" }` |

The lead form appears the first time a visitor sends/clicks a question (questions are shown first).

## Status (hstgr)

Already created on the live instance: workflow **`Y6kahfizPcdz5MMy`**
(`https://n8n-9odn.srv1570441.hstgr.cloud/workflow/Y6kahfizPcdz5MMy`), model node set to
**OpenRouter `google/gemini-2.5-flash`** (reusing the "OpenRouter account" credential).
It is **inactive**. Remaining: add a Slack credential, activate, repoint the site env var.

`evan-chat-slack-leads.workflow.json` is the importable copy (for a rebuild / other instance).

```
Webhook (POST /evan-chat, responseNode)
  └─ Switch on body.action
       ├─ "sendMessage" → EVan Agent (OpenAI) → Reply to Chat → Log Chat to Slack (#lem-test)
       └─ "captureLead" → Log Lead to Slack (#lem-test) → Reply OK
```

### After import — 3 things to set

1. **Slack credential** on both *Log … to Slack* nodes → pick the Slack account/bot that can
   post to **#lem-test** (invite the bot to the channel: `/invite @yourbot`). If the channel
   doesn't resolve by name, switch the channel field to **From list** and reselect `lem-test`.
2. **Model** — already OpenRouter `google/gemini-2.5-flash` on the live workflow. (The
   importable JSON also ships with this; on a fresh import, attach your OpenRouter credential.)
3. **System Message** on *EVan Agent* — for the full EVNoire knowledge base, paste the contents
   of `EVA-system-prompt.md` (replaces the short starter prompt in the import).

Then **Activate** the workflow and copy the **Production** webhook URL.

### Point the website at it

Set in `.env.local` / Vercel env:

```
VITE_N8N_WEBHOOK_URL="https://n8n-9odn.srv1570441.hstgr.cloud/webhook/evan-chat"
```

(Production path is `/webhook/evan-chat`; test path is `/webhook-test/evan-chat`.)

## Already-live reference copy

A working copy was built on the connected instance:
`https://automation.sgen.com/workflow/cdRDgixivTJynBo7`
(webhook `https://automation.sgen.com/webhook/evan-chat`, Slack cred "Sgen Automation" attached).
That instance is **not** the Hostinger one — use it only as a reference, or repoint the site there.

## Alternative — add Slack to the existing agent (no new webhook)

If you'd rather keep using `p7VVAh6DWMlo667A` for answers, just add a **Slack → message → post**
node after its AI Agent node with channel `lem-test` and this text, then a second Slack node off
the lead path:

```
:speech_balloon: *New EVan chat inquiry*
*Name:* {{ $('Webhook').item.json.body.firstName }}
*Email:* {{ $('Webhook').item.json.body.email }}
*Question:* {{ $('Webhook').item.json.body.chatInput }}
*EVan answered:* {{ $json.output }}
```

(Adjust node names to match that workflow.)
