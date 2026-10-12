(async () => {
  const DAY_MS = 86400000;
  const $ = (id) => document.getElementById(id);
  const ext = typeof chrome !== "undefined" && !!chrome.runtime?.id;
  let settings = await Store.get();

  // ---- Countdown -----------------------------------------------------------

  const pad = (n) => String(n).padStart(2, "0");

  function renderText() {
    $("label").textContent = settings.title;
    $("logo").src = settings.logo || "icons/logo.svg";
    $("when").textContent = new Date(settings.deadline).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  }

  function tick() {
    requestAnimationFrame(tick);
    const ms = Math.max(0, new Date(settings.deadline).getTime() - Date.now());
    const days = ms / DAY_MS;
    const whole = Math.floor(days);
    $("days-int").textContent = whole;
    $("days-frac").textContent = (days - whole).toFixed(7).slice(1);
    document.body.classList.toggle("done", ms === 0);
    if (ms === 0) {
      $("clock").textContent = "TIME'S UP. HOPE YOU SHIPPED IT.";
      return;
    }
    const s = Math.floor(ms / 1000);
    $("clock").textContent =
      `${whole}d ${pad(Math.floor(s / 3600) % 24)}h ${pad(Math.floor(s / 60) % 60)}m ${pad(s % 60)}s`;
  }

  renderText();
  tick();

  // ---- Wallpapers ----------------------------------------------------------

  function sceneForNow() {
    const h = new Date().getHours();
    if (h >= 6 && h < 16) return "day";
    if (h >= 16 && h < 19) return "sunset";
    if (h >= 19 && h < 22) return "city";
    if (h >= 22 || h < 2) return "rain";
    return "aurora";
  }

  const dots = $("dots");
  Scenes.list().forEach((def) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.dataset.id = def.id;
    b.dataset.name = def.name;
    b.title = def.name;
    b.addEventListener("click", () => Scenes.goTo(def.id));
    dots.append(b);
  });

  let toastTimer;
  function toast(html) {
    const el = $("toast");
    el.innerHTML = html;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  Scenes.onChange((def, byUser) => {
    const root = document.documentElement.style;
    root.setProperty("--shadow", def.theme.shadow);
    root.setProperty("--accent", def.theme.accent);
    root.setProperty("--dim", def.theme.dim);
    root.setProperty("--btn", def.theme.btn ?? "#ff6600");
    const [r, g, b] = Pixel.hex(def.theme.shadow);
    root.setProperty("--scrim", `rgba(${r}, ${g}, ${b}, ${def.theme.scrim ?? 0.4})`);
    for (const d of dots.children) d.setAttribute("aria-current", String(d.dataset.id === def.id));
    if (byUser) {
      toast(def.name.toUpperCase());
      Store.set({ scene: def.id }).then((s) => (settings = s));
    }
  });
  // A #scene-id hash (e.g. newtab.html#aurora) opens a specific wallpaper.
  Scenes.init($("scene"), location.hash.slice(1) || settings.scene || sceneForNow());
  toast(`${Scenes.current().name.toUpperCase()}<small>scroll for more wallpapers</small>`);

  const blocked = (e) => $("settings").open || e.target.closest?.("input, select, textarea");
  let wheelAcc = 0;
  let wheelLock = 0;
  addEventListener(
    "wheel",
    (e) => {
      if (blocked(e)) return;
      if (performance.now() < wheelLock) return;
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) < 40) return;
      wheelAcc > 0 ? Scenes.next() : Scenes.prev();
      wheelAcc = 0;
      wheelLock = performance.now() + 900;
    },
    { passive: true },
  );
  addEventListener("keydown", (e) => {
    if (blocked(e)) return;
    if (["ArrowDown", "PageDown", "j"].includes(e.key)) Scenes.next();
    if (["ArrowUp", "PageUp", "k"].includes(e.key)) Scenes.prev();
  });
  let touchY = null;
  addEventListener("pointerdown", (e) => (touchY = blocked(e) ? null : e.clientY));
  addEventListener("pointerup", (e) => {
    if (touchY === null) return;
    const dy = touchY - e.clientY;
    if (Math.abs(dy) > 60) dy > 0 ? Scenes.next() : Scenes.prev();
    touchY = null;
  });

  // ---- Music ---------------------------------------------------------------
  // In the extension, audio runs in an offscreen document via the background
  // worker, so it keeps playing while you browse. Opened as a plain file, the
  // page plays it itself.

  function send(cmd, extra = {}) {
    if (ext) return chrome.runtime.sendMessage({ to: "background", cmd, ...extra });
    if (cmd === "play") return Player.play(extra.station, extra.volume);
    if (cmd === "stop") return Promise.resolve(Player.stop());
    if (cmd === "volume") return Promise.resolve(Player.setVolume(extra.volume));
    return Promise.resolve(Player.status());
  }

  let musicState = "stopped";
  const stationName = (id) => (STATIONS.find((s) => s.id === id) ?? STATIONS[0]).name;

  function renderMusic(status) {
    if (status) musicState = status.state;
    const btn = $("music");
    btn.setAttribute("aria-pressed", String(settings.musicOn));
    btn.textContent = `♫ LOFI: ${settings.musicOn ? "ON" : "OFF"}`;
    $("volume").value = settings.volume;
    const name = stationName(settings.station);
    const line = {
      playing: `<span class="blink">●</span> LIVE · ${name}`,
      loading: `<span class="blink">TUNING IN</span> · ${name}`,
      blocked: `<span class="blink">CLICK ANYWHERE TO PLAY</span>`,
      error: `${name} IS OFFLINE · TRY ▶▶`,
    }[settings.musicOn ? musicState : "stopped"];
    $("station").innerHTML = line ?? `STATION: ${name}`;
  }

  const play = () => send("play", { station: settings.station, volume: settings.volume }).then(renderMusic);

  if (ext) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "music-status") renderMusic(msg);
    });
  } else {
    Player.onStatus(renderMusic);
  }

  $("music").addEventListener("click", async () => {
    settings = await Store.set({ musicOn: !settings.musicOn });
    if (settings.musicOn) play();
    else send("stop").then(renderMusic);
    renderMusic();
  });

  $("next-station").addEventListener("click", async () => {
    const i = STATIONS.findIndex((s) => s.id === settings.station);
    settings = await Store.set({ station: STATIONS[(i + 1) % STATIONS.length].id });
    if (settings.musicOn) play();
    renderMusic();
  });

  let volTimer;
  $("volume").addEventListener("input", (e) => {
    settings.volume = Number(e.target.value);
    send("volume", { volume: settings.volume });
    clearTimeout(volTimer);
    volTimer = setTimeout(() => Store.set({ volume: settings.volume }), 300);
  });

  // Autoplay can be refused until the user interacts with the page.
  addEventListener("pointerdown", (e) => {
    if (musicState === "blocked" && settings.musicOn && !e.target.closest(".music")) play();
  });

  const status = await send("status").catch(() => ({ state: "stopped" }));
  renderMusic(status);
  if (settings.musicOn && (status.state === "stopped" || status.state === "error")) play();

  // Keep every open tab in sync when settings change elsewhere.
  if (ext) {
    chrome.storage.onChanged.addListener(async (changes) => {
      if (!changes.settings || $("settings").open) return;
      settings = await Store.get();
      renderText();
      renderMusic();
    });
  }

  // ---- Settings panel ------------------------------------------------------

  const dialog = $("settings");
  let pendingLogo = null;

  const toLocalInput = (iso) => {
    const d = new Date(iso);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  for (const p of PRESETS) $("f-preset").append(new Option(p.name, p.id));
  $("f-preset").append(new Option("Custom deadline", "custom"));
  $("f-scene").append(new Option("Auto (by time of day)", ""));
  for (const s of Scenes.list()) $("f-scene").append(new Option(s.name, s.id));

  function fillForm(s) {
    pendingLogo = s.logo;
    $("logo-preview").src = s.logo || "icons/logo.svg";
    $("f-preset").value = s.preset;
    $("f-title").value = s.title;
    $("f-deadline").value = toLocalInput(s.deadline);
    $("f-scene").value = s.scene ?? "";
  }

  $("open-settings").addEventListener("click", () => {
    fillForm(settings);
    dialog.showModal();
  });
  $("cancel").addEventListener("click", () => dialog.close());

  $("f-preset").addEventListener("change", (e) => {
    const p = PRESETS.find((x) => x.id === e.target.value);
    if (!p) return;
    $("f-title").value = p.title;
    $("f-deadline").value = toLocalInput(p.deadline);
  });
  $("f-deadline").addEventListener("input", () => ($("f-preset").value = "custom"));

  // Uploaded logos are shrunk to 256px and stored as a data URL.
  $("logo-upload").addEventListener("click", () => $("logo-file").click());
  $("logo-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
    const img = new Image();
    img.src = url;
    await img.decode();
    const size = 256;
    const scale = Math.min(1, size / Math.max(img.naturalWidth || size, img.naturalHeight || size));
    const c = document.createElement("canvas");
    c.width = Math.round((img.naturalWidth || size) * scale);
    c.height = Math.round((img.naturalHeight || size) * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    pendingLogo = c.toDataURL("image/png");
    $("logo-preview").src = pendingLogo;
    e.target.value = "";
  });
  $("logo-reset").addEventListener("click", () => {
    pendingLogo = null;
    $("logo-preview").src = "icons/logo.svg";
  });

  $("settings-form").addEventListener("submit", async () => {
    const preset = PRESETS.find((p) => p.id === $("f-preset").value);
    const local = $("f-deadline").value;
    const deadline =
      preset && local === toLocalInput(preset.deadline) ? preset.deadline : new Date(local).toISOString();
    settings = await Store.set({
      logo: pendingLogo,
      preset: preset && deadline === preset.deadline ? preset.id : "custom",
      title: $("f-title").value.trim() || "Deadline",
      deadline,
      scene: $("f-scene").value || null,
    });
    renderText();
    Scenes.goTo(settings.scene || sceneForNow(), false);
  });

  $("reset-all").addEventListener("click", async () => {
    const { musicOn, station, volume } = settings;
    settings = await Store.set({ ...DEFAULTS, musicOn, station, volume });
    dialog.close();
    renderText();
    Scenes.goTo(sceneForNow(), false);
  });
})();
