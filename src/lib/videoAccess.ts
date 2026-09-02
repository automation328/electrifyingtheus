// Whether this browser has already paid for video: the full profile the CRM
// wants (name, contact, employer, role, industry) captured once, before the
// first gallery or home-page video plays. After that every video on the site
// plays straight away — asking again for a form the visitor already filled in
// is the fastest way to make them close the tab.
//
// Deliberately NOT keyed off leadIdentity. That store holds a first name and an
// email, which the lighter gates (share, calculator unlock, event actions)
// already capture on their own; treating those as video access would let the
// ten-field form be skipped by anyone who had ever shared a photo.
//
// localStorage, so the answer survives a new tab and a browser restart. Reads
// and writes are wrapped because private mode and blocked storage throw — the
// cost of that is being asked again, which is the safe way to fail.

const KEY = "etu_video_access";

/** Remember that this browser completed the video gate. */
export function saveVideoAccess(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode / storage disabled — the visitor is asked again next time */
  }
}

/** True once the gate has been completed in this browser. */
export function hasVideoAccess(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}
