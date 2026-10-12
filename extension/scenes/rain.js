// Cozy room on a rainy night: rain on the window, city bokeh, a sleeping cat.
Scenes.register({
  id: "rain",
  name: "Rainy Night",
  seed: 99,
  theme: { shadow: "#05070f", accent: "#ffb35c", dim: "#a9bde6", btn: "#c8553d", scrim: 0.35 },
  build({ W, H, g, rand }) {
    const win = { x0: Math.round(W * 0.12), x1: Math.round(W * 0.88), y0: 14, y1: 122 };
    const ww = win.x1 - win.x0;
    const wh = win.y1 - win.y0;
    const deskY = 150;

    // The view outside.
    const out = Pixel.canvas(W, H);
    const o = out.getContext("2d");
    Pixel.gradient(o, ["#0a0f24", "#0f1733", "#152042", "#1c2a50", "#26365f"], win.x0, win.y0, ww, wh);
    let x = win.x0;
    while (x < win.x1) {
      const w = 6 + Math.floor(rand() * 12);
      const top = win.y1 - 20 - Math.floor(rand() * 46);
      o.fillStyle = "#121a34";
      o.fillRect(x, top, w, win.y1 - top);
      for (let wy = top + 2; wy < win.y1 - 2; wy += 4) {
        for (let wx = x + 1; wx < x + w - 1; wx += 3) {
          if (rand() < 0.25) {
            o.fillStyle = rand() < 0.7 ? "#4a4a3a" : "#3a4a66";
            o.fillRect(wx, wy, 1, 2);
          }
        }
      }
      x += w + Math.floor(rand() * 2);
    }

    const bokehColors = ["#ffb35c", "#ff6fa8", "#5fd3ff", "#ffe08a"];
    const bokeh = Array.from({ length: 16 }, () => {
      const r = 3 + Math.floor(rand() * 4);
      const sprite = Pixel.canvas(r * 2 + 1, r * 2 + 1);
      Pixel.glow(sprite.getContext("2d"), r, r, r + 1, bokehColors[Math.floor(rand() * 4)], 1.6);
      return {
        sprite,
        x: win.x0 + Math.floor(rand() * (ww - r * 2)),
        y: win.y0 + 30 + Math.floor(rand() * (wh - 40)),
        phase: rand() * 6,
      };
    });

    // The room, with a hole where the glass is.
    const room = Pixel.canvas(W, H);
    const r = room.getContext("2d");
    Pixel.gradient(r, ["#1f2238", "#1c1f33", "#181a2c", "#141624"], 0, 0, W, H);
    r.fillStyle = "#22263f";
    for (let sx = 0; sx < W; sx += 6) {
      for (let sy = 0; sy < H; sy++) if (Pixel.dith(sx, sy, 0.5)) r.fillRect(sx, sy, 1, 1);
    }
    const lamp = { x: Math.round(W * 0.15), y: 128 };
    Pixel.glow(r, lamp.x + 12, lamp.y + 4, 60, "#2a2434", 0.9);
    Pixel.glow(r, lamp.x + 12, lamp.y + 4, 34, "#3e2e30", 0.7);
    r.clearRect(win.x0, win.y0, ww, wh);

    r.fillStyle = "#4a3426";
    r.fillRect(win.x0 - 4, win.y0 - 4, ww + 8, 4);
    r.fillRect(win.x0 - 4, win.y0, 4, wh);
    r.fillRect(win.x1, win.y0, 4, wh);
    r.fillStyle = "#6b4a36";
    r.fillRect(win.x0 - 1, win.y0 - 1, ww + 2, 1);
    r.fillRect(win.x0 - 1, win.y0, 1, wh);
    r.fillRect(win.x1, win.y0, 1, wh);

    // Curtains gathered with tie-backs.
    r.fillStyle = "#8a6a4a";
    r.fillRect(win.x0 - 20, win.y0 - 8, ww + 40, 2);
    for (let y = win.y0 - 6; y < win.y1 + 8; y++) {
      const w = y < 80 ? 26 - (y / 80) * 14 : 12 + ((y - 80) / 50) * 8;
      for (let i = 0; i < w; i++) {
        r.fillStyle = (i + Math.floor(y / 30)) % 4 === 0 ? "#5e2638" : "#7a3348";
        r.fillRect(win.x0 - 18 + i, y, 1, 1);
        r.fillRect(win.x1 + 17 - i, y, 1, 1);
      }
    }
    r.fillStyle = "#d9a441";
    r.fillRect(win.x0 - 18, 80, 13, 2);
    r.fillRect(win.x1 + 6, 80, 13, 2);

    r.fillStyle = "#5a3e2c";
    r.fillRect(win.x0 - 8, win.y1, ww + 16, 6);
    r.fillStyle = "#7a5638";
    r.fillRect(win.x0 - 8, win.y1, ww + 16, 1);

    // Plant on the sill.
    const px = win.x0 + 10;
    r.fillStyle = "#b5603a";
    r.fillRect(px, win.y1 - 6, 7, 6);
    r.fillStyle = "#8f4a2c";
    r.fillRect(px, win.y1 - 6, 7, 1);
    r.fillStyle = "#3f8f55";
    [[3, -8], [2, -10], [4, -11], [1, -13], [5, -14], [3, -15], [0, -9], [6, -10], [3, -12]].forEach(([dx, dy]) =>
      r.fillRect(px + dx, win.y1 + dy, 2, 2),
    );

    // Desk, lamp, books, mug.
    r.fillStyle = "#2a1a10";
    r.fillRect(0, deskY, W, H - deskY);
    r.fillStyle = "#4a2e1c";
    r.fillRect(0, deskY, W, 3);
    r.fillStyle = "#6a4428";
    r.fillRect(0, deskY, W, 1);

    r.fillStyle = "#2a2a35";
    r.fillRect(lamp.x - 4, deskY - 2, 10, 2);
    for (let i = 0; i < 18; i++) r.fillRect(lamp.x + Math.round(i * 0.3), deskY - 2 - i, 1, 1);
    for (let i = 0; i < 8; i++) r.fillRect(lamp.x + 5 + i, deskY - 20 - Math.round(i * 0.6), 1, 1);
    r.fillStyle = "#e0a040";
    for (let i = 0; i < 6; i++) r.fillRect(lamp.x + 9 - i, lamp.y - 1 + i, 8 + i * 2, 1);
    r.fillStyle = "#fff0b0";
    r.fillRect(lamp.x + 10, lamp.y + 5, 6, 1);

    const books = [["#c8553d", 22], ["#3d7fc8", 18], ["#e0b040", 20]];
    let by = deskY;
    books.forEach(([c, w], i) => {
      r.fillStyle = c;
      r.fillRect(lamp.x + 24 + i, by - 4, w, 4);
      r.fillStyle = "#f2e2c4";
      r.fillRect(lamp.x + 24 + i + w - 2, by - 3, 1, 2);
      by -= 4;
    });

    const mug = { x: Math.round(W * 0.66), y: deskY - 8 };
    r.fillStyle = "#e8e0d0";
    r.fillRect(mug.x, mug.y, 7, 8);
    r.fillRect(mug.x + 7, mug.y + 2, 2, 1);
    r.fillRect(mug.x + 8, mug.y + 2, 1, 4);
    r.fillRect(mug.x + 7, mug.y + 5, 2, 1);
    r.fillStyle = "#c8553d";
    r.fillRect(mug.x, mug.y + 3, 7, 2);
    r.fillStyle = "#5a3a24";
    r.fillRect(mug.x + 1, mug.y, 5, 1);

    // Rain and drops on the glass.
    const drops = Array.from({ length: Math.floor(ww * 0.6) }, () => ({
      x: win.x0 + rand() * ww,
      y: win.y0 + rand() * wh,
      v: 140 + rand() * 80,
      len: 3 + Math.floor(rand() * 3),
    }));
    const beads = Array.from({ length: 30 }, () => ({
      x: win.x0 + 2 + Math.floor(rand() * (ww - 4)),
      y: win.y0 + 2 + rand() * (wh - 4),
      slide: 0,
    }));
    const lights = Array.from({ length: Math.floor(ww / 9) }, (_, i) => i);
    const cat = { x: win.x1 - 34, y: win.y1 };
    const steam = [];
    let nextSteam = 0;
    let flashAt = 8 + rand() * 10;

    return (t, dt) => {
      g.drawImage(out, 0, 0);

      for (const b of bokeh) {
        g.globalAlpha = 0.35 + 0.2 * Math.sin(t * 0.9 + b.phase);
        g.drawImage(b.sprite, b.x, b.y);
      }
      g.globalAlpha = 0.5;
      g.fillStyle = "#8fb4ff";
      for (const d of drops) {
        d.y += d.v * dt;
        d.x -= d.v * 0.12 * dt;
        if (d.y > win.y1) {
          d.y = win.y0 - d.len;
          d.x = win.x0 + Math.random() * (ww + 10);
        }
        g.fillRect(Math.round(d.x), Math.round(d.y), 1, d.len);
      }

      // Lightning: two quick flashes every so often.
      const since = t - flashAt;
      if (since > 0 && since < 0.45) {
        const a = since < 0.12 ? 0.45 : since > 0.22 && since < 0.32 ? 0.3 : 0;
        if (a) {
          g.globalAlpha = a;
          g.fillStyle = "#dfe8ff";
          g.fillRect(win.x0, win.y0, ww, wh);
        }
      } else if (since >= 0.45) {
        flashAt = t + 12 + Math.random() * 18;
      }

      g.globalAlpha = 0.9;
      for (const bd of beads) {
        if (!bd.slide && Math.random() < dt * 0.04) bd.slide = 8 + Math.random() * 14;
        if (bd.slide) {
          bd.y += bd.slide * dt;
          g.fillStyle = "#6f8fc8";
          g.fillRect(bd.x, Math.round(bd.y) - 3, 1, 3);
          if (bd.y > win.y1 - 2) {
            bd.y = win.y0 + 2 + Math.random() * 20;
            bd.slide = 0;
          }
        }
        g.fillStyle = "#c9dcff";
        g.fillRect(bd.x, Math.round(bd.y), 1, 1);
      }
      g.globalAlpha = 1;

      g.drawImage(room, 0, 0);

      // Fairy lights sagging across the top of the window.
      const warm = ["#ffd36b", "#ff8fb1", "#8fe3ff", "#ffb35c"];
      g.fillStyle = "#3a2a2a";
      for (let i = 0; i <= ww; i++) {
        g.fillRect(win.x0 + i, win.y0 + 2 + Math.round(Math.sin((i / ww) * Math.PI) * 7), 1, 1);
      }
      for (const i of lights) {
        const lx = win.x0 + 4 + i * 9;
        const ly = win.y0 + 3 + Math.round(Math.sin(((lx - win.x0) / ww) * Math.PI) * 7);
        g.globalAlpha = Math.sin(t * 1.4 + i * 1.7) > -0.3 ? 1 : 0.35;
        g.fillStyle = warm[i % warm.length];
        g.fillRect(lx, ly, 2, 2);
      }
      g.globalAlpha = 1;

      // Sleeping cat on the sill: breathing loaf, flicking tail.
      const breathe = Math.sin(t * 1.6) > 0 ? 1 : 0;
      g.fillStyle = "#2b2b38";
      g.fillRect(cat.x, cat.y - 6 - breathe, 16, 6 + breathe);
      g.fillRect(cat.x + 1, cat.y - 7 - breathe, 14, 1);
      g.fillRect(cat.x + 14, cat.y - 10, 7, 7);
      g.fillRect(cat.x + 14, cat.y - 12, 2, 2);
      g.fillRect(cat.x + 19, cat.y - 12, 2, 2);
      g.fillStyle = "#4a4a60";
      g.fillRect(cat.x + 1, cat.y - 7 - breathe, 13, 1);
      g.fillRect(cat.x + 15, cat.y - 10, 5, 1);
      g.fillStyle = "#15151d";
      g.fillRect(cat.x + 15, cat.y - 7, 2, 1);
      g.fillRect(cat.x + 18, cat.y - 7, 2, 1);
      const flick = Math.sin(t * 0.9) > 0.85 ? -2 : 0;
      g.fillStyle = "#2b2b38";
      g.fillRect(cat.x - 6, cat.y - 2, 7, 2);
      g.fillRect(cat.x - 7, cat.y - 4 + flick, 2, 3 - flick);

      if (t > nextSteam) {
        steam.push({ x: mug.x + 2 + Math.random() * 3, age: 0 });
        nextSteam = t + 0.5;
      }
      g.fillStyle = "#cfd6ea";
      for (let i = steam.length - 1; i >= 0; i--) {
        const s = steam[i];
        s.age += dt;
        if (s.age > 2.5) {
          steam.splice(i, 1);
          continue;
        }
        g.globalAlpha = 0.5 * (1 - s.age / 2.5);
        g.fillRect(Math.round(s.x + Math.sin(s.age * 3) * 1.5), Math.round(mug.y - 2 - s.age * 6), 1, 2);
      }
      g.globalAlpha = 1;
    };
  },
});
