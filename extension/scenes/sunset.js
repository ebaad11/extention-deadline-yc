// Golden-hour beach: shimmering sea, rolling foam, swaying palms.
Scenes.register({
  id: "sunset",
  name: "Golden Beach",
  seed: 21,
  theme: { shadow: "#3a1030", accent: "#ffe08a", dim: "#ffd9c2", btn: "#e0553d", scrim: 0.5 },
  build({ W, H, g, rand }) {
    const { dith } = Pixel;
    const horizon = Math.round(H * 0.58);
    const shore = Math.round(H * 0.8);
    const sunX = Math.round(W * 0.28);

    const bg = Pixel.canvas(W, H);
    const b = bg.getContext("2d");
    Pixel.gradient(b, [
      "#2b1b4a", "#3e1f5c", "#5a2468", "#7a2b6e", "#9c3570",
      "#c0466c", "#dd5f63", "#ef7f5c", "#f8a35c", "#fdc66e",
    ], 0, 0, W, horizon);
    Pixel.glow(b, sunX, horizon - 4, 46, "#ffd08a", 0.4);

    const r = 20;
    const sunCols = ["#fff0a8", "#ffe08a", "#ffc46e", "#ffaa5a", "#ff9a4a"];
    for (let y = horizon - 4 - r; y <= horizon; y++) {
      const dy = y - (horizon - 4);
      const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
      const tt = ((dy + r) / (r * 2)) * (sunCols.length - 1);
      for (let x = sunX - half; x <= sunX + half; x++) {
        b.fillStyle = sunCols[Math.min(sunCols.length - 1, Math.floor(tt) + (dith(x, y, tt % 1) ? 1 : 0))];
        b.fillRect(x, y, 1, 1);
      }
    }

    // Island on the horizon.
    const isle = { x: Math.round(W * 0.72), w: 46 };
    b.fillStyle = "#5a2a5e";
    for (let i = 0; i < isle.w; i++) {
      const h = Math.round(Math.sin((i / isle.w) * Math.PI) * 6 + Math.sin(i * 0.4) * 1.2);
      b.fillRect(isle.x + i, horizon - h, 1, h + 1);
    }

    Pixel.gradient(b, ["#e2706a", "#b4506e", "#87406e", "#5e3266", "#40285a"], 0, horizon + 1, W, shore - horizon);
    Pixel.gradient(b, ["#f0b48a", "#e3a07c", "#d48c70", "#c27a66"], 0, shore, W, H - shore);
    b.fillStyle = "#cf8a72";
    b.fillRect(0, shore, W, 10);

    const clouds = Array.from({ length: 6 }, () => {
      const img = Pixel.cloud(rand, 40 + Math.floor(rand() * 50), 7 + Math.floor(rand() * 4), "#f59a8e", "#c75a7a", 3);
      return { img, x: rand() * W, y: 18 + Math.round(rand() * 60), speed: 1.2 + rand() * 2 };
    });

    const glints = Array.from({ length: Math.floor(W * 0.35) }, () => ({
      x: rand() * W,
      y: horizon + 2 + Math.floor(rand() * (shore - horizon - 3)),
      len: 2 + Math.floor(rand() * 5),
      phase: rand() * 6,
      drift: 0.5 + rand(),
    }));

    const palms = [
      { x: Math.round(W * 0.9), h: 92, lean: 18, scale: 1 },
      { x: Math.round(W * 0.97), h: 70, lean: -10, scale: 0.8 },
      { x: Math.round(W * 0.05), h: 64, lean: -14, scale: 0.75 },
    ];

    function palm(p, t) {
      const top = { x: p.x + p.lean, y: H - p.h };
      const ctrl = { x: p.x + p.lean * 0.1, y: H - p.h * 0.5 };
      for (let s = 0; s <= 1; s += 1 / p.h) {
        const x = (1 - s) ** 2 * p.x + 2 * (1 - s) * s * ctrl.x + s * s * top.x;
        const y = (1 - s) ** 2 * H + 2 * (1 - s) * s * ctrl.y + s * s * top.y;
        const w = s < 0.5 ? 3 : 2;
        g.fillStyle = Math.floor(y) % 4 === 0 ? "#1c0d1a" : "#2a1426";
        g.fillRect(Math.round(x - w / 2), Math.round(y), w, 1);
      }
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.55 + Math.sin(t * 1.1 + i + p.x) * 0.06;
        const L = (26 + (i % 2) * 6) * p.scale;
        for (let s = 0; s < 1; s += 0.03) {
          const x = Math.round(top.x + Math.cos(a) * s * L * 1.2);
          const y = Math.round(top.y + Math.sin(a) * s * L + s * s * L * 0.9);
          g.fillStyle = "#1c0d1a";
          g.fillRect(x, y, s < 0.6 ? 2 : 1, 1);
          if (s > 0.15 && Math.round(s * 33) % 2 === 0) g.fillRect(x, y + 1, 1, Math.round(3 * (1 - s)) + 1);
        }
      }
      g.fillStyle = "#3a1a2a";
      g.fillRect(top.x - 2, top.y + 1, 2, 2);
      g.fillRect(top.x + 1, top.y + 2, 2, 2);
    }

    return (t) => {
      g.drawImage(bg, 0, 0);

      for (const c of clouds) {
        const span = W + c.img.width;
        g.drawImage(c.img, Math.floor(((c.x + t * c.speed) % span) - c.img.width), c.y);
      }

      // Sailboat creeping along the horizon.
      const bx = Math.round(((t * 1.6) % (W + 30)) - 15);
      g.fillStyle = "#2a1838";
      g.fillRect(bx - 4, horizon - 1, 9, 2);
      for (let i = 0; i < 7; i++) g.fillRect(bx, horizon - 3 - i, Math.max(1, 4 - Math.floor(i / 2)), 1);

      // Broken sun reflection, wider near the viewer.
      for (let y = horizon + 1; y < shore; y += 2) {
        const d = y - horizon;
        const hw = Math.round(3 + d * 0.55);
        g.fillStyle = d < 12 ? "#ffe08a" : "#ffc070";
        for (let x = sunX - hw; x <= sunX + hw; x++) {
          if (Math.sin(x * 0.6 + t * 2.4 + y * 1.7) > 0.25) g.fillRect(x, y, 1, 1);
        }
      }

      g.fillStyle = "#ffb59a";
      for (const s of glints) {
        const v = Math.sin(t * 1.5 + s.phase);
        if (v < 0.2) continue;
        g.globalAlpha = v;
        g.fillRect(Math.round((s.x + Math.sin(t * 0.3 + s.phase) * 3 * s.drift + W) % W), s.y, s.len, 1);
      }
      g.globalAlpha = 1;

      // Waves wash up and recede.
      const reach = 4 + Math.sin(t * 0.7) * 3.5;
      for (let x = 0; x < W; x++) {
        const fy = Math.round(shore + reach + Math.sin(x * 0.12 + t * 1.3) * 1.5);
        g.fillStyle = "#5a3266";
        g.fillRect(x, shore, 1, fy - shore);
        g.fillStyle = "#ffe6ee";
        g.fillRect(x, fy, 1, 1);
        if (Math.sin(x * 0.9 + t * 3) > 0.3) {
          g.fillStyle = "#f8c8d8";
          g.fillRect(x, fy - 1, 1, 1);
        }
      }

      [[0, 0], [9, 4], [16, -2]].forEach(([dx, dy], i) =>
        Pixel.bird(g, ((t * 6 + dx) % (W + 40)) - 20, 46 + dy + Math.sin(t * 0.8 + i) * 2, t * 0.6 + i, "#3a1e40"),
      );

      palms.forEach((p) => palm(p, t));
    };
  },
});
