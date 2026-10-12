// Single source of truth for the deadline. Shared by the new tab page and the
// background worker. Nov 2 2026 is after the DST switch, so PT is UTC-8.
const DEADLINE = {
  iso: "2026-11-02T20:00:00-08:00",
  batch: "W27",
  label: "YC Winter 2027 applications close",
  pretty: "Mon, Nov 2 · 8:00 PM PT",
  applyUrl: "https://www.ycombinator.com/apply",
};
