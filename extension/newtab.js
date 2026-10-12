(() => {
  const DAY_MS = 86400000;
  const deadline = new Date(DEADLINE.iso).getTime();

  const $ = (id) => document.getElementById(id);
  const intEl = $("days-int");
  const fracEl = $("days-frac");
  const clockEl = $("clock");

  $("label").textContent = DEADLINE.label;
  $("apply").href = DEADLINE.applyUrl;

  const local = new Date(deadline).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  // Only show local time when it differs from PT (PST is UTC-8 on Nov 2).
  const isPT = new Date(deadline).getTimezoneOffset() === 480;
  $("when").innerHTML = isPT ? DEADLINE.pretty : `${DEADLINE.pretty}<br>(${local} your time)`;

  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const ms = Math.max(0, deadline - Date.now());
    const days = ms / DAY_MS;
    const whole = Math.floor(days);

    intEl.textContent = whole;
    fracEl.textContent = (days - whole).toFixed(7).slice(1);

    const s = Math.floor(ms / 1000);
    clockEl.textContent =
      `${whole}d ${pad(Math.floor(s / 3600) % 24)}h ` +
      `${pad(Math.floor(s / 60) % 60)}m ${pad(s % 60)}s`;

    if (ms === 0) {
      document.body.classList.add("done");
      clockEl.textContent = "DEADLINE HIT. HOPE YOU SHIPPED IT.";
      return;
    }
    requestAnimationFrame(tick);
  }
  tick();

  // Music toggle. Remembered across tabs; only the visible tab plays.
  const btn = $("music");
  const stateEl = $("music-state");
  const hint = $("hint");
  const KEY = "lofi-on";
  let wanted = localStorage.getItem(KEY) === "1";

  function render() {
    const playing = Lofi.isPlaying();
    btn.setAttribute("aria-pressed", String(wanted));
    stateEl.textContent = wanted ? "LOFI: ON" : "LOFI: OFF";
    hint.hidden = !(wanted && !playing && !document.hidden);
  }

  async function sync() {
    if (wanted && !document.hidden) await Lofi.start();
    else Lofi.stop();
    render();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    wanted = !wanted;
    localStorage.setItem(KEY, wanted ? "1" : "0");
    sync();
  });

  // Browsers block audio until a user gesture; resume on the first one.
  const unlock = () => wanted && sync();
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
  document.addEventListener("visibilitychange", sync);

  sync();
})();
