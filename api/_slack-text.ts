// Untrusted text bound for a Slack mrkdwn field. Slack treats <!channel>,
// <@U123> and <https://evil|label> as live markup, so a public form field could
// ping the whole workspace or plant a phishing link in a trusted channel. Slack's
// documented escape is & < > only. Truncate FIRST, then escape, so a cut never
// lands inside an entity like "&amp;".
export function slackText(v: unknown, max = Infinity): string {
  const s = String(v ?? "").trim();
  const cut = s.length > max ? `${s.slice(0, max)}…` : s;
  return cut.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
