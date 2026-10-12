// Broadcast player state to any open new tab pages.
Player.onStatus((s) => {
  chrome.runtime.sendMessage({ type: "music-status", ...s }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.to !== "offscreen") return;
  switch (msg.cmd) {
    case "play":
      Player.play(msg.station, msg.volume).then(sendResponse);
      return true;
    case "stop":
      sendResponse(Player.stop());
      break;
    case "volume":
      sendResponse(Player.setVolume(msg.volume));
      break;
    case "status":
      sendResponse(Player.status());
      break;
  }
});
