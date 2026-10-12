importScripts("config.js");

const DAY_MS = 86400000;

async function updateBadge() {
  const { deadline } = await Store.get();
  const msLeft = new Date(deadline).getTime() - Date.now();
  const days = Math.max(0, Math.ceil(msLeft / DAY_MS));
  chrome.action.setBadgeText({ text: msLeft > 0 ? `${days}d` : "GO" });
  chrome.action.setBadgeBackgroundColor({ color: days <= 3 ? "#ff3b5c" : "#ff6600" });
  chrome.action.setBadgeTextColor?.({ color: "#ffffff" });
}

function init() {
  chrome.alarms.create("badge", { periodInMinutes: 15 });
  updateBadge();
}

chrome.runtime.onInstalled.addListener(init);
chrome.runtime.onStartup.addListener(init);
chrome.alarms.onAlarm.addListener((alarm) => alarm.name === "badge" && updateBadge());
chrome.storage.onChanged.addListener((changes) => changes.settings && updateBadge());

// Clicking the toolbar icon opens a new tab, which is the countdown.
chrome.action.onClicked.addListener(() => chrome.tabs.create({}));

// Music lives in an offscreen document so it keeps playing while you browse.
let creating = null;

async function hasOffscreen() {
  const contexts = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
  return contexts.length > 0;
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  creating ??= chrome.offscreen
    .createDocument({
      url: "offscreen.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Plays the lofi radio station the user turned on.",
    })
    .finally(() => (creating = null));
  await creating;
}

const toOffscreen = (msg) => chrome.runtime.sendMessage({ ...msg, to: "offscreen" });

async function handle(msg) {
  switch (msg.cmd) {
    case "play":
      await ensureOffscreen();
      return toOffscreen(msg);
    case "volume":
      return (await hasOffscreen()) ? toOffscreen(msg) : null;
    case "stop":
      if (!(await hasOffscreen())) return { state: "stopped" };
      await toOffscreen(msg);
      await chrome.offscreen.closeDocument();
      return { state: "stopped" };
    case "status":
      return (await hasOffscreen()) ? toOffscreen(msg) : { state: "stopped" };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.to !== "background") return;
  handle(msg).then(sendResponse, (err) => sendResponse({ state: "error", error: String(err) }));
  return true;
});
