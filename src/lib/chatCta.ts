// Guarantees every EVan chatbot answer ends with a call-to-action pointing the
// visitor to the cost calculator or the incentives page. The n8n agent is asked
// to do this in its prompt, but model compliance is unreliable — so we enforce it
// on the rendered reply as the source of truth.
//
// Rules:
//  - Never touch the verbatim "E-Mobility Concierges will reach out" fallback.
//  - Don't double up if the reply already links the calculator or incentives.
//  - Incentive/rebate/price questions → incentives page; everything else → calculator.

const CALCULATOR_CTA =
  "\n\n**Want your own numbers?** Run them on our [EV vs Gas Savings Calculator](/electricity-vs-gasoline).";
const INCENTIVES_CTA =
  "\n\n**See the rebates & incentives in your area:** [Rebates & Incentives](/rebates-incentives).";

export function withChatCta(reply: string): string {
  const text = (reply ?? "").trim();
  if (!text) return text;
  // The exact concierge fallback must be returned word-for-word, nothing appended.
  if (text.includes("E-Mobility Concierges will reach out")) return text;
  // Already points at a tool — leave it (no duplicate CTA).
  if (/\/(electricity-vs-gasoline|rebates-incentives)\b/.test(text)) return text;

  const low = text.toLowerCase();
  const incentivesy =
    /(incentive|rebate|tax[ -]?credit|grant|qualif|msrp|sticker price|price of|cost to buy|how much.*(cost|save|spend))/.test(low);
  return text + (incentivesy ? INCENTIVES_CTA : CALCULATOR_CTA);
}
