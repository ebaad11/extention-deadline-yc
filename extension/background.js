importScripts("config.js");

const DAY_MS = 86400000;

function updateBadge() {
  const msLeft = new Date(DEADLINE.iso).getTime() - Date.now();
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
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "badge") updateBadge();
});

// Clicking the toolbar icon opens a new tab, which is the countdown.
chrome.action.onClicked.addListener(() => chrome.tabs.create({}));
