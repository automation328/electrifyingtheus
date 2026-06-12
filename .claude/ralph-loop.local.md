---
active: true
iteration: 1
max_iterations: 10
completion_promise: "SHARING_UNIFIED_DONE"
started_at: "2026-06-12T01:20:53Z"
---

Unify sharing on all pages to match the calculator Email Text result flow. Generalize src/components/forms/ShareResultDialog.tsx into a reusable send-to-friend dialog with props formType shareUrl contentTitle summary and preset channel keeping the same design with Email and Text tabs plus sender and recipient fields. In src/components/forms/ShareGate.tsx make the Email and SMS options open that dialog prefilled with the gate name and email as sender instead of opening webmail or sms links. On send call submitLead with the surface formType passing recipient firstName email or phone plus senderName senderEmail senderPhone shareChannel shareUrl like the calculator does and for the email channel also call sendShareEmail so the recipient gets the branded HTML email. Relax the self-only recipient guard in api/share-email.ts to allow a different recipient while keeping recaptcha verification. Leave LinkedIn Facebook Instagram WhatsApp More and Copy link options unchanged. Run npx tsc --noEmit -p tsconfig.json and npm run build and both must pass. Commit all changes with a conventional commit message but do not push. When every criterion is complete output SHARING_UNIFIED_DONE
