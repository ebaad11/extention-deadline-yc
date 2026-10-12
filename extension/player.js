// Plays a station from STATIONS. Used by the offscreen document (and directly
// by the new tab page when it's opened outside the extension).
const Player = (() => {
  let audio = null;
  let station = null;
  let state = "stopped";
  let volume = 0.7;
  let listener = () => {};

  function emit(next) {
    state = next;
    listener(status());
  }

  function status() {
    return { state, station: station?.id ?? null };
  }

  function release() {
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load(); // drops the network stream
      audio = null;
    }
    Lofi.stop();
  }

  function tryUrl(i) {
    const url = station.urls[i];
    if (!url) return emit("error");
    const el = new Audio();
    el.preload = "none";
    el.volume = volume;
    el.addEventListener("playing", () => audio === el && emit("playing"));
    el.addEventListener("waiting", () => audio === el && emit("loading"));
    el.addEventListener("error", () => audio === el && tryUrl(i + 1));
    audio = el;
    el.src = url;
    el.play().catch((err) => {
      if (audio !== el) return;
      if (err.name === "NotAllowedError") emit("blocked");
      // Network failures surface through the "error" event above.
    });
  }

  async function play(id, vol = volume) {
    release();
    volume = vol;
    station = STATIONS.find((s) => s.id === id) ?? STATIONS[0];
    emit("loading");
    if (station.synth) {
      Lofi.setVolume(volume);
      emit((await Lofi.start()) ? "playing" : "blocked");
    } else {
      tryUrl(0);
    }
    return status();
  }

  function stop() {
    release();
    station = null;
    emit("stopped");
    return status();
  }

  function setVolume(v) {
    volume = v;
    if (audio) audio.volume = v;
    Lofi.setVolume(v);
    return status();
  }

  return { play, stop, setVolume, status, onStatus: (fn) => (listener = fn) };
})();
