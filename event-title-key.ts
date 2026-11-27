// The part of an event title that identifies it, ignoring a trailing location.
//
// CMS rows are titled "<Title> - <City>, <ST>" (or "- Online"), while the
// built-in events in src/data/events.ts keep bare titles. Rows take over a
// built-in event by title + date, so renaming "Chicago Auto Show 2027" to
// "Chicago Auto Show 2027 - Chicago, IL" used to break the match and put the
// event on the site twice. Matching on this key keeps them paired.
//
// Only a suffix that looks like a place is removed: " - Online", or
// " - <something>, <something>" (city + state or country). A dash that is part
// of the real title ("Part 2: From The Pump To The Plug - How EVs Can Save You
// Thousands") has no comma after it and is left alone.
const LOCATION_SUFFIX = /\s+[-–—]\s+(?:online|[^-–—]{2,40},\s*[^-–—,]{2,30})$/i;

export const eventTitleKey = (title: string): string => title.trim().replace(LOCATION_SUFFIX, "");
