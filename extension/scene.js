// Animated 8-bit dusk city. Drawn at a tiny resolution and upscaled with
// `image-rendering: pixelated`, so every canvas pixel is one chunky pixel.
(() => {
  const canvas = document.getElementById("scene");
  const ctx = canvas.getContext("2d");
  const H = 180;
  const FPS = 20;

  const SKY = [
    "#1a0f2e", "#21123b", "#2a1648", "#351a56", "#431e63",
    "#55246c", "#6c2b73", "#883376", "#a63e74", "#c64f6e",
    "#e06664", "#f2845a",
  ];
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const WINDOW_COLORS = ["#ffd36b", "#ffd36b", "#ffb35c", "#ffe9a8", "#8fe3ff"];

  function rng(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

  function offscreen(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  let W, horizon, layers, stars, clouds, beacons, sky, shooting, nextShot;

  function buildSky() {
    const c = offscreen(W, H);
    const g = c.getContext("2d");
    const img = g.createImageData(W, H);
    const rgb = SKY.map(hex);
    for (let y = 0; y < H; y++) {
      const t = Math.min(1, y / horizon) * (SKY.length - 1);
      const band = Math.floor(t);
      const f = t - band;
      for (let x = 0; x < W; x++) {
        const pick = BAYER[y & 3][x & 3] / 16 < f ? band + 1 : band;
        const [r, gg, b] = rgb[Math.min(pick, SKY.length - 1)];
        const i = (y * W + x) * 4;
        img.data[i] = r;
        img.data[i + 1] = gg;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);

    // Striped synthwave sun sitting on the horizon.
    const r = 26;
    const cx = Math.round(W * 0.74);
    const cy = horizon - 22;
    const sun = ["#ffe66b", "#ffc85c", "#ff9a5a", "#ff6f6a", "#ff4f7a"];
    for (let y = cy - r; y <= cy; y++) {
      const d = y - (cy - r * 0.35);
      if (d > 0 && d % 6 < 1 + Math.floor(d / 6)) continue;
      const half = Math.floor(Math.sqrt(r * r - (y - cy) * (y - cy)));
      const tt = ((y - (cy - r)) / r) * (sun.length - 1);
      for (let x = cx - half; x <= cx + half; x++) {
        const k = Math.floor(tt) + (BAYER[y & 3][x & 3] / 16 < tt % 1 ? 1 : 0);
        g.fillStyle = sun[Math.min(k, sun.length - 1)];
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  // Seamless ridge line: integer-frequency sines over the layer period.
  function buildMountains(P, rand) {
    const c = offscreen(P, H);
    const g = c.getContext("2d");
    const waves = [1, 2, 3, 5, 8].map((k, i) => ({
      k,
      a: 9 / (i + 1),
      p: rand() * Math.PI * 2,
    }));
    for (let x = 0; x < P; x++) {
      let h = 18;
      for (const w of waves) h += w.a * Math.sin((2 * Math.PI * w.k * x) / P + w.p);
      const top = Math.round(horizon - h);
      g.fillStyle = "#4a1f63";
      g.fillRect(x, top, 1, H - top);
      g.fillStyle = "#6e2c72";
      g.fillRect(x, top, 1, 1);
    }
    return c;
  }

  function buildCity(P, rand, opts) {
    const c = offscreen(P, H);
    const g = c.getContext("2d");
    const lights = [];
    let x = 0;
    while (x < P) {
      const w = Math.min(P - x, opts.minW + Math.floor(rand() * opts.varW));
      const h = opts.minH + Math.floor(rand() * opts.varH);
      const top = opts.base - h;
      g.fillStyle = opts.body;
      g.fillRect(x, top, w, H - top);
      g.fillStyle = opts.rim;
      g.fillRect(x, top, 1, H - top);
      g.fillRect(x, top, w, 1);

      // Rooftop clutter.
      const roll = rand();
      if (roll < 0.25 && w > 8) {
        const ax = x + 2 + Math.floor(rand() * (w - 4));
        const ah = 4 + Math.floor(rand() * 8);
        g.fillStyle = opts.body;
        g.fillRect(ax, top - ah, 1, ah);
        if (opts.beacons) lights.push({ x: ax, y: top - ah - 1, phase: rand() * 6 });
      } else if (roll < 0.4 && w > 10) {
        g.fillStyle = opts.body;
        g.fillRect(x + 2, top - 3, 4, 3);
        g.fillRect(x + 3, top - 5, 2, 2);
      }

      // Windows on a 3px grid.
      for (let wy = top + 3; wy < opts.base - 2; wy += opts.gapY) {
        for (let wx = x + 2; wx < x + w - 2; wx += opts.gapX) {
          if (rand() < opts.lit) {
            g.fillStyle = opts.windowColors[Math.floor(rand() * opts.windowColors.length)];
          } else {
            g.fillStyle = opts.unlit;
          }
          g.fillRect(wx, wy, opts.winW, opts.winH);
        }
      }
      x += w + (rand() < 0.3 ? 1 + Math.floor(rand() * 3) : 0);
    }
    return { canvas: c, beacons: lights };
  }

  function buildCloud(rand) {
    const w = 26 + Math.floor(rand() * 26);
    const h = 12;
    const c = offscreen(w, h);
    const g = c.getContext("2d");
    const puffs = [];
    for (let i = 0; i < 4; i++) {
      puffs.push({
        x: 6 + rand() * (w - 12),
        y: h - 4 - rand() * 4,
        r: 3 + rand() * 4,
      });
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const inside = puffs.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 < p.r * p.r);
        const flat = y >= h - 4 && x > 2 && x < w - 3;
        if (!inside && !flat) continue;
        const above = puffs.some((p) => (x - p.x) ** 2 + (y - 1 - p.y) ** 2 < p.r * p.r);
        g.fillStyle = above ? "#8a3a7e" : "#b0508a";
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }

  function build() {
    W = Math.max(160, Math.ceil((H * innerWidth) / innerHeight));
    canvas.width = W;
    canvas.height = H;
    horizon = Math.round(H * 0.74);
    const rand = rng(1337);

    sky = buildSky();
    const P = W * 2;
    const far = buildCity(P, rand, {
      base: Math.round(H * 0.86),
      minW: 10, varW: 14, minH: 18, varH: 34,
      body: "#2b1347", rim: "#3b1b5c", unlit: "#33184f",
      windowColors: ["#7a5cc8", "#ffb35c"], lit: 0.18,
      gapX: 3, gapY: 4, winW: 1, winH: 2,
    });
    const near = buildCity(P, rand, {
      base: H,
      minW: 14, varW: 18, minH: 34, varH: 40,
      body: "#140a22", rim: "#24133f", unlit: "#1d1030",
      windowColors: WINDOW_COLORS, lit: 0.32,
      gapX: 4, gapY: 5, winW: 2, winH: 2, beacons: true,
    });
    layers = [
      { canvas: buildMountains(P, rand), speed: 1.5, P },
      { canvas: far.canvas, speed: 4, P },
      { canvas: near.canvas, speed: 9, P },
    ];
    beacons = near.beacons;

    stars = [];
    const count = Math.floor((W * horizon) / 260);
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.floor(rand() * W),
        y: Math.floor(rand() * horizon * 0.6),
        phase: rand() * Math.PI * 2,
        speed: 0.6 + rand() * 2,
        big: rand() < 0.12,
        color: rand() < 0.7 ? "#fff8e7" : "#c9b8ff",
      });
    }

    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        img: buildCloud(rand),
        x: rand() * W,
        y: Math.round(H * 0.3 + rand() * H * 0.3),
        speed: 1 + rand() * 2.5,
      });
    }

    shooting = null;
    nextShot = 3;
  }

  function drawStars(t) {
    for (const s of stars) {
      const v = Math.sin(t * s.speed + s.phase);
      if (v < -0.6) continue;
      ctx.fillStyle = s.color;
      ctx.globalAlpha = v > 0.3 ? 1 : 0.55;
      ctx.fillRect(s.x, s.y, 1, 1);
      if (s.big && v > 0.75) {
        ctx.globalAlpha = 0.6;
        ctx.fillRect(s.x - 1, s.y, 1, 1);
        ctx.fillRect(s.x + 1, s.y, 1, 1);
        ctx.fillRect(s.x, s.y - 1, 1, 1);
        ctx.fillRect(s.x, s.y + 1, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawShootingStar(t, dt) {
    if (!shooting && t > nextShot) {
      shooting = {
        x: Math.random() * W * 0.8,
        y: Math.random() * horizon * 0.3,
        vx: 60 + Math.random() * 40,
        vy: 25 + Math.random() * 15,
        life: 0.9,
      };
    }
    if (!shooting) return;
    shooting.x += shooting.vx * dt;
    shooting.y += shooting.vy * dt;
    shooting.life -= dt;
    for (let i = 0; i < 8; i++) {
      ctx.globalAlpha = Math.max(0, shooting.life) * (1 - i / 8);
      ctx.fillStyle = i === 0 ? "#ffffff" : "#ffe9a8";
      ctx.fillRect(
        Math.round(shooting.x - (shooting.vx / 30) * i * 0.6),
        Math.round(shooting.y - (shooting.vy / 30) * i * 0.6),
        1, 1,
      );
    }
    ctx.globalAlpha = 1;
    if (shooting.life <= 0) {
      shooting = null;
      nextShot = t + 6 + Math.random() * 10;
    }
  }

  function drawLayer(layer, t) {
    const off = Math.floor((t * layer.speed) % layer.P);
    ctx.drawImage(layer.canvas, -off, 0);
    if (layer.P - off < W) ctx.drawImage(layer.canvas, layer.P - off, 0);
    return off;
  }

  let last = 0;
  let prevT = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - last < 1000 / FPS) return;
    last = now;
    const t = now / 1000;
    const dt = Math.min(0.1, t - prevT);
    prevT = t;

    ctx.drawImage(sky, 0, 0);
    drawStars(t);
    drawShootingStar(t, dt);

    for (const c of clouds) {
      const span = W + c.img.width;
      const x = Math.floor(((c.x + t * c.speed) % span) - c.img.width);
      ctx.drawImage(c.img, x, c.y);
    }

    drawLayer(layers[0], t);
    drawLayer(layers[1], t);
    const off = drawLayer(layers[2], t);

    // Blinking red aircraft beacons on the near rooftops.
    ctx.fillStyle = "#ff3b5c";
    for (const b of beacons) {
      if (Math.sin(t * 2.5 + b.phase) < 0.4) continue;
      let x = b.x - off;
      if (x < 0) x += layers[2].P;
      if (x < W) ctx.fillRect(x, b.y, 1, 1);
    }
  }

  build();
  addEventListener("resize", build);
  requestAnimationFrame(frame);
})();
