// Neon dusk over a scrolling city skyline.
Scenes.register({
  id: "city",
  name: "Neon Dusk",
  theme: { shadow: "#1a0f2e", accent: "#ff6600", dim: "#c9b8ff", scrim: 0.4 },
  build({ W, H, g, rand }) {
    const { dith } = Pixel;
    const horizon = Math.round(H * 0.74);

    const sky = Pixel.canvas(W, H);
    const sg = sky.getContext("2d");
    Pixel.gradient(sg, [
      "#1a0f2e", "#21123b", "#2a1648", "#351a56", "#431e63", "#55246c",
      "#6c2b73", "#883376", "#a63e74", "#c64f6e", "#e06664", "#f2845a",
    ], 0, 0, W, horizon);
    sg.fillStyle = "#f2845a";
    sg.fillRect(0, horizon, W, H - horizon);

    // Striped synthwave sun.
    const r = 26;
    const cx = Math.round(W * 0.74);
    const cy = horizon - 22;
    const sun = ["#ffe66b", "#ffc85c", "#ff9a5a", "#ff6f6a", "#ff4f7a"];
    for (let y = cy - r; y <= cy; y++) {
      const d = y - (cy - r * 0.35);
      if (d > 0 && d % 6 < 1 + Math.floor(d / 6)) continue;
      const half = Math.floor(Math.sqrt(r * r - (y - cy) ** 2));
      const tt = ((y - (cy - r)) / r) * (sun.length - 1);
      for (let x = cx - half; x <= cx + half; x++) {
        sg.fillStyle = sun[Math.min(sun.length - 1, Math.floor(tt) + (dith(x, y, tt % 1) ? 1 : 0))];
        sg.fillRect(x, y, 1, 1);
      }
    }

    const P = W * 2;
    const mountains = Pixel.canvas(P, H);
    Pixel.fillRidge(mountains.getContext("2d"), Pixel.ridge(P, rand, horizon - 18, 9), "#4a1f63", "#6e2c72", H);

    function city(opts) {
      const c = Pixel.canvas(P, H);
      const cg = c.getContext("2d");
      const beacons = [];
      let x = 0;
      while (x < P) {
        const w = Math.min(P - x, opts.minW + Math.floor(rand() * opts.varW));
        const top = opts.base - (opts.minH + Math.floor(rand() * opts.varH));
        cg.fillStyle = opts.body;
        cg.fillRect(x, top, w, H - top);
        cg.fillStyle = opts.rim;
        cg.fillRect(x, top, 1, H - top);
        cg.fillRect(x, top, w, 1);

        const roll = rand();
        cg.fillStyle = opts.body;
        if (roll < 0.25 && w > 8) {
          const ax = x + 2 + Math.floor(rand() * (w - 4));
          const ah = 4 + Math.floor(rand() * 8);
          cg.fillRect(ax, top - ah, 1, ah);
          if (opts.beacons) beacons.push({ x: ax, y: top - ah - 1, phase: rand() * 6 });
        } else if (roll < 0.4 && w > 10) {
          cg.fillRect(x + 2, top - 3, 4, 3);
          cg.fillRect(x + 3, top - 5, 2, 2);
        }

        for (let wy = top + 3; wy < opts.base - 2; wy += opts.gapY) {
          for (let wx = x + 2; wx < x + w - 2; wx += opts.gapX) {
            cg.fillStyle = rand() < opts.lit
              ? opts.windows[Math.floor(rand() * opts.windows.length)]
              : opts.unlit;
            cg.fillRect(wx, wy, opts.winW, opts.winH);
          }
        }
        x += w + (rand() < 0.3 ? 1 + Math.floor(rand() * 3) : 0);
      }
      return { c, beacons };
    }

    const far = city({
      base: Math.round(H * 0.86), minW: 10, varW: 14, minH: 18, varH: 34,
      body: "#2b1347", rim: "#3b1b5c", unlit: "#33184f",
      windows: ["#7a5cc8", "#ffb35c"], lit: 0.18, gapX: 3, gapY: 4, winW: 1, winH: 2,
    });
    const near = city({
      base: H, minW: 14, varW: 18, minH: 34, varH: 40,
      body: "#140a22", rim: "#24133f", unlit: "#1d1030",
      windows: ["#ffd36b", "#ffd36b", "#ffb35c", "#ffe9a8", "#8fe3ff"], lit: 0.32,
      gapX: 4, gapY: 5, winW: 2, winH: 2, beacons: true,
    });

    const stars = Pixel.makeStars(rand, Math.floor((W * horizon) / 260), W, horizon * 0.6);
    const shoot = Pixel.shootingStars(W, horizon * 0.3);
    const clouds = Array.from({ length: 5 }, () => {
      const img = Pixel.cloud(rand, 26 + Math.floor(rand() * 26), 12, "#b0508a", "#8a3a7e");
      return { img, x: rand() * W, y: Math.round(H * 0.3 + rand() * H * 0.3), speed: 1 + rand() * 2.5 };
    });

    return (t, dt) => {
      g.drawImage(sky, 0, 0);
      Pixel.drawStars(g, stars, t);
      shoot(g, t, dt);
      for (const c of clouds) {
        const span = W + c.img.width;
        g.drawImage(c.img, Math.floor(((c.x + t * c.speed) % span) - c.img.width), c.y);
      }
      Pixel.scroll(g, mountains, t * 1.5, W);
      Pixel.scroll(g, far.c, t * 4, W);
      const off = Pixel.scroll(g, near.c, t * 9, W);

      // Blinking rooftop beacons.
      g.fillStyle = "#ff3b5c";
      for (const b of near.beacons) {
        if (Math.sin(t * 2.5 + b.phase) < 0.4) continue;
        let x = b.x - off;
        if (x < 0) x += P;
        if (x < W) g.fillRect(x, b.y, 1, 1);
      }
    };
  },
});
