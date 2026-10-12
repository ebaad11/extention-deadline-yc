// Northern lights over snowy peaks, a warm cabin and falling snow.
Scenes.register({
  id: "aurora",
  name: "Aurora Cabin",
  seed: 42,
  theme: { shadow: "#020812", accent: "#7dffc4", dim: "#b5d8ff", btn: "#1f9e78", scrim: 0.4 },
  build({ W, H, g, rand }) {
    const { dith, hex } = Pixel;
    const horizon = Math.round(H * 0.7);
    const ground = Math.round(H * 0.8);

    const sky = Pixel.canvas(W, H);
    const s = sky.getContext("2d");
    Pixel.gradient(s, ["#020615", "#040b20", "#07122c", "#0b1a3a", "#102447", "#163052"], 0, 0, W, ground);

    // Crescent moon.
    const moon = Pixel.canvas(20, 20);
    const m = moon.getContext("2d");
    Pixel.disc(m, 10, 10, 7, "#e8eeff");
    m.globalCompositeOperation = "destination-out";
    Pixel.disc(m, 13, 8, 6, "#000");
    const mx = Math.round(W * 0.12);
    Pixel.glow(s, mx, 26, 18, "#2a3a66", 0.8);
    s.drawImage(moon, mx - 10, 16);

    // Land: two snowy ranges, rolling snowfield, pines, cabin.
    const land = Pixel.canvas(W, H);
    const l = land.getContext("2d");
    function range(base, amp, rock, lit, shade, ks) {
      const tops = Pixel.ridge(W, rand, base, amp, ks);
      Pixel.fillRidge(l, tops, rock, null, H);
      tops.forEach((top, x) => {
        const depth = 2 + Math.max(0, Math.round((base - top) / 5));
        l.fillStyle = top <= (tops[x - 1] ?? top) ? lit : shade;
        l.fillRect(x, top, 1, depth);
      });
    }
    range(horizon - 22, 16, "#1b2a48", "#e6eeff", "#9fb2d8", [1, 2, 3, 5, 7]);
    range(horizon - 4, 8, "#14203a", "#cfdcf5", "#8197c2", [1, 3, 4, 6]);

    const field = Pixel.ridge(W, rand, ground, 3, [1, 2, 3]);
    const fieldTop = Math.min(...field);
    const snow = Pixel.canvas(W, H);
    const sn = snow.getContext("2d");
    Pixel.gradient(sn, ["#8ea4cf", "#a9bde0", "#c4d4f0", "#d8e4fa"], 0, fieldTop, W, H - fieldTop);
    sn.globalCompositeOperation = "destination-in";
    sn.beginPath();
    field.forEach((top, x) => sn.rect(x, top, 1, H - top));
    sn.fill();
    l.drawImage(snow, 0, 0);

    const cabin = { x: Math.round(W * 0.7), y: field[Math.round(W * 0.7)] + 6 };
    Pixel.glow(l, cabin.x + 5, cabin.y - 2, 14, "#ffe2a0", 0.3);
    l.fillStyle = "#4a2c1c";
    l.fillRect(cabin.x - 9, cabin.y - 10, 19, 10);
    l.fillStyle = "#3a2216";
    for (let y = cabin.y - 9; y < cabin.y; y += 2) l.fillRect(cabin.x - 9, y, 19, 1);
    l.fillStyle = "#eef3ff";
    for (let i = 0; i < 7; i++) l.fillRect(cabin.x - 12 + i, cabin.y - 11 - i, 25 - i * 2, 1);
    l.fillStyle = "#c4d4f0";
    l.fillRect(cabin.x - 12, cabin.y - 11, 25, 1);
    l.fillStyle = "#3a2a2a";
    l.fillRect(cabin.x + 5, cabin.y - 20, 3, 6);
    l.fillStyle = "#eef3ff";
    l.fillRect(cabin.x + 5, cabin.y - 21, 3, 1);
    l.fillStyle = "#ffcf6b";
    l.fillRect(cabin.x + 3, cabin.y - 7, 4, 3);
    l.fillStyle = "#2a1a10";
    l.fillRect(cabin.x - 6, cabin.y - 6, 3, 6);
    const chimney = { x: cabin.x + 6, y: cabin.y - 22 };

    function pine(x, base, h) {
      l.fillStyle = "#2a1a12";
      l.fillRect(x, base - 2, 1, 3);
      for (let i = 0; i < h; i++) {
        const w = Math.floor((i % 5) * 0.6 + i * 0.28) + 1;
        const y = base - 2 - h + i;
        l.fillStyle = "#0e1c2c";
        l.fillRect(x - w, y, w * 2 + 1, 1);
        if (i % 5 === 0 || i === 0) {
          l.fillStyle = "#e6eeff";
          l.fillRect(x - w, y, Math.max(1, w), 1);
        }
      }
    }
    const pines = [];
    for (let i = 0; i < 14; i++) pines.push(rand() * W * 0.3);
    for (let i = 0; i < 10; i++) pines.push(W * 0.78 + rand() * W * 0.22);
    for (let i = 0; i < 4; i++) pines.push(W * 0.35 + rand() * W * 0.3);
    pines
      .map((x) => Math.round(x))
      .sort((a, b) => field[a] - field[b])
      .forEach((x) => pine(x, field[x] + 4 + Math.floor(rand() * 10), 12 + Math.floor(rand() * 16)));

    const stars = Pixel.makeStars(rand, Math.floor((W * horizon) / 150), W, horizon - 10);
    const shoot = Pixel.shootingStars(W, 40);

    // Aurora is written straight into pixel data each frame.
    const aurora = Pixel.canvas(W, 110);
    const ag = aurora.getContext("2d");
    const img = ag.createImageData(W, 110);
    const palette = ["#b4ffd8", "#7dffc4", "#3fe0a0", "#2ab8b0", "#2a8ac8", "#5a5ad8", "#8a4ad8"].map(hex);
    const curtains = [
      { y: 70, len: 44, a1: 10, f1: 0.021, s1: 0.25, a2: 6, f2: 0.057, s2: 0.18, speed: 0.6, phase: 0 },
      { y: 48, len: 32, a1: 8, f1: 0.015, s1: -0.2, a2: 5, f2: 0.043, s2: 0.31, speed: 0.45, phase: 2 },
    ];

    const flakes = Array.from({ length: 170 }, () => ({
      x: rand() * W,
      y: rand() * H,
      v: 6 + rand() * 16,
      sway: rand() * 6,
    }));
    const smoke = [];
    let nextPuff = 0;

    return (t, dt) => {
      g.drawImage(sky, 0, 0);
      Pixel.drawStars(g, stars, t);
      shoot(g, t, dt);

      const d = img.data;
      d.fill(0);
      for (const c of curtains) {
        for (let x = 0; x < W; x++) {
          const base = c.y + c.a1 * Math.sin(x * c.f1 + t * c.s1) + c.a2 * Math.sin(x * c.f2 - t * c.s2);
          const len = c.len * (0.6 + 0.4 * Math.sin(x * 0.05 + t * 0.4 + c.phase));
          let I = 0.55 + 0.45 * Math.sin(x * 0.031 + t * c.speed + c.phase) * Math.sin(x * 0.011 - t * 0.15);
          I *= 1.25 * (0.7 + 0.3 * Math.sin(x * 0.7 + t * 1.3 + c.phase));
          for (let y = Math.max(0, Math.floor(base - len)); y <= base && y < 110; y++) {
            const sPos = (base - y) / len;
            const a = I * (sPos < 0.12 ? sPos / 0.12 : Math.pow(1 - sPos, 1.4));
            if (!dith(x, y, a)) continue;
            const col = palette[Math.min(palette.length - 1, Math.floor(sPos * palette.length))];
            const k = (y * W + x) * 4;
            d[k] = col[0];
            d[k + 1] = col[1];
            d[k + 2] = col[2];
            d[k + 3] = 255;
          }
        }
      }
      ag.putImageData(img, 0, 0);
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.9;
      g.drawImage(aurora, 0, 0);
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = 1;

      g.drawImage(land, 0, 0);

      if (t > nextPuff) {
        smoke.push({ age: 0 });
        nextPuff = t + 0.8;
      }
      g.fillStyle = "#9fb2d8";
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.age += dt;
        if (p.age > 5) {
          smoke.splice(i, 1);
          continue;
        }
        g.globalAlpha = 0.6 * (1 - p.age / 5);
        const size = p.age > 2 ? 2 : 1;
        g.fillRect(Math.round(chimney.x + p.age * 2.5 + Math.sin(p.age * 1.7) * 1.5), Math.round(chimney.y - p.age * 5), size, size);
      }
      g.globalAlpha = 1;

      g.fillStyle = "#ffffff";
      for (const f of flakes) {
        f.y += f.v * dt;
        if (f.y > H) {
          f.y = -2;
          f.x = Math.random() * W;
        }
        const x = Math.round((f.x + Math.sin(t * 0.8 + f.sway) * 3 + W) % W);
        g.globalAlpha = f.v > 18 ? 1 : 0.7;
        g.fillRect(x, Math.round(f.y), f.v > 19 ? 2 : 1, f.v > 19 ? 2 : 1);
      }
      g.globalAlpha = 1;
    };
  },
});
