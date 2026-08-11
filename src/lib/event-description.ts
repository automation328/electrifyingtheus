// An event description (static or CMS-edited) can carry its speaker panel inline
// as a run-on "Speakers Includes: • Name - Org • …" sentence. Splitting it out
// lets the prose stay a paragraph while the speakers render as a real bulleted
// list wherever the event is shown — detail page, featured card, and list card.

export type EventSpeaker = { name: string; org: string; role?: string };

const SPEAKERS_MARKER = /\s*speakers?\s+includes?\s*:?\s*/i;
const IS_MODERATOR = /^\(?\s*moderator\s*\)?$/i;
const MODERATOR_TAG = /\(\s*moderator\s*\)/i;
const TRAILING_PUNCT = /[.,;]+$/;

/**
 * Splits an event description into its prose intro and structured speakers.
 * Returns an empty `speakers` array when the description carries no speakers
 * list, so callers can decide whether to show a fallback panel.
 */
export function splitEventDescription(description: string): { intro: string; speakers: EventSpeaker[] } {
  const text = description ?? "";
  const marker = text.match(SPEAKERS_MARKER);
  if (!marker || marker.index === undefined) return { intro: text.trim(), speakers: [] };

  const speakers = text
    .slice(marker.index + marker[0].length)
    .split(/[•·|\n]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      // "Terry Travis (Moderator) - EVNoire" → name / role / org
      const parts = entry.split(/\s+[-–—]\s+/).map((p) => p.trim()).filter(Boolean);
      const role = parts.some((p) => IS_MODERATOR.test(p)) || MODERATOR_TAG.test(entry) ? "Moderator" : undefined;
      const kept = parts.filter((p) => !IS_MODERATOR.test(p));
      return {
        name: (kept[0] ?? "").replace(MODERATOR_TAG, "").replace(TRAILING_PUNCT, "").trim(),
        org: kept.slice(1).join(" · ").replace(TRAILING_PUNCT, "").trim(),
        role,
      };
    })
    .filter((s) => s.name);

  return { intro: text.slice(0, marker.index).trim(), speakers };
}
