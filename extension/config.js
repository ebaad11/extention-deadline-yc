// Shared by the new tab page, the background worker and the offscreen player.

const PRESETS = [
  {
    id: "yc-w27",
    name: "YC Winter 2027 (Nov 2, 8pm PT)",
    // Nov 2 2026 is after the DST switch, so PT is UTC-8.
    deadline: "2026-11-02T20:00:00-08:00",
    title: "YC Winter 2027 applications close",
  },
];

const DEFAULTS = {
  preset: "yc-w27",
  deadline: PRESETS[0].deadline,
  title: PRESETS[0].title,
  logo: null, // data: URL of a custom logo; null uses icons/logo.svg
  scene: null, // wallpaper id; null picks one by time of day
  musicOn: false,
  station: "fluid",
  volume: 0.7,
};

// Internet radio stations that play lofi / instrumental hip-hop. `urls` are
// tried in order if a server is down.
const STATIONS = [
  {
    id: "fluid",
    name: "SomaFM Fluid",
    urls: [
      "https://ice6.somafm.com/fluid-128-mp3",
      "https://ice2.somafm.com/fluid-128-mp3",
      "https://ice5.somafm.com/fluid-128-mp3",
    ],
  },
  { id: "laut-lofi", name: "laut.fm Lofi", urls: ["https://stream.laut.fm/lofi"] },
  {
    id: "flux-chillhop",
    name: "FluxFM Chillhop",
    urls: ["https://streams.fluxfm.de/Chillhop/mp3-128/streams.fluxfm.de/"],
  },
  {
    id: "ilove-chillhop",
    name: "I Love Chillhop",
    urls: ["https://streams.ilovemusic.de/iloveradio17.mp3"],
  },
  {
    id: "groovesalad",
    name: "SomaFM Groove Salad",
    urls: [
      "https://ice6.somafm.com/groovesalad-128-mp3",
      "https://ice2.somafm.com/groovesalad-128-mp3",
    ],
  },
  { id: "synth", name: "Offline beat (built-in)", synth: true },
];

// chrome.storage when running as an extension, localStorage when the page is
// opened directly as a file (handy for development).
const Store = {
  ext: typeof chrome !== "undefined" && !!chrome.storage?.local,

  async get() {
    if (this.ext) {
      const { settings } = await chrome.storage.local.get("settings");
      return { ...DEFAULTS, ...settings };
    }
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem("settings") || "{}") };
  },

  async set(patch) {
    const next = { ...(await this.get()), ...patch };
    if (this.ext) await chrome.storage.local.set({ settings: next });
    else localStorage.setItem("settings", JSON.stringify(next));
    return next;
  },
};
