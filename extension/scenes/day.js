// Sunny meadow: drifting clouds, a cottage, a little train and swaying grass.
Scenes.register({
  id: "day",
  name: "Sunny Meadow",
  seed: 7,
  theme: { shadow: "#1f3d6b", accent: "#ffd23f", dim: "#eaf6ff", btn: "#ff7a1a", scrim: 0.5 },
  build({ W, H, g, rand }) {
    const horizon = Math.round(H * 0.6);
    const trackY = Math.round(H * 0.77);

    // Sky + sun.
    const sky = Pixel.canvas(W, H);
    const sg = sky.getContext("2d");
    Pixel.gradient(sg, [
      "#2f7fd8", "#3a8ee3", "#4a9de9", "#5cadf0", "#70bdf5", "#86ccf8", "#a0dafa", "#c4ebfc",
    ], 0, 0, W, horizon);
    sg.fillStyle = "#c4ebfc";
    sg.fillRect(0, horizon, W, H - horizon);
    const sun = { x: Math.round(W * 0.14), y: 30 };
    Pixel.glow(sg, sun.x, sun.y, 26, "#fff3b0", 0.55);
    Pixel.disc(sg, sun.x, sun.y, 11, "#ffe680");
    Pixel.disc(sg, sun.x, sun.y, 9, "#fff8d0");

    // Land behind the train: mountains, far hills, trees, cottage, track.
    const back = Pixel.canvas(W, H);
    const bg = back.getContext("2d");
    const peaks = Pixel.ridge(W, rand, horizon - 16, 13, [1, 2, 3, 5]);
    Pixel.fillRidge(bg, peaks, "#8fb0de", "#b9d0ef", H);
    bg.fillStyle = "#f2f7ff";
    peaks.forEach((top, x) => top < horizon - 26 && bg.fillRect(x, top, 1, Math.min(4, horizon - 26 - top + 1)));

    const hills = Pixel.ridge(W, rand, horizon + 8, 6, [1, 2, 4]);
    Pixel.fillRidge(bg, hills, "#6dbb5c", "#8fd16f", H);

    for (let i = 0; i < 9; i++) {
      const x = Math.floor(rand() * W);
      const y = hills[x] + 2 + Math.floor(rand() * 6);
      bg.fillStyle = "#6b4a2a";
      bg.fillRect(x, y - 2, 1, 3);
      Pixel.disc(bg, x, y - 5, 3, "#3f8f45");
      bg.fillStyle = "#5fb355";
      bg.fillRect(x - 1, y - 7, 2, 1);
    }

    const house = { x: Math.round(W * 0.8) };
    const hy = hills[house.x] + 4;
    bg.fillStyle = "#f4e3c1";
    bg.fillRect(house.x - 5, hy - 7, 11, 7);
    bg.fillStyle = "#c8553d";
    for (let i = 0; i < 5; i++) bg.fillRect(house.x - 7 + i, hy - 8 - i, 15 - i * 2, 1);
    bg.fillStyle = "#8a3b2a";
    bg.fillRect(house.x + 3, hy - 13, 2, 4);
    bg.fillStyle = "#7a4a2a";
    bg.fillRect(house.x - 1, hy - 4, 2, 4);
    bg.fillStyle = "#ffd36b";
    bg.fillRect(house.x - 4, hy - 5, 2, 2);
    bg.fillRect(house.x + 3, hy - 5, 2, 2);
    const chimney = { x: house.x + 4, y: hy - 14 };

    bg.fillStyle = "#58a04c";
    bg.fillRect(0, trackY + 1, W, 4);
    bg.fillStyle = "#7a6a5a";
    bg.fillRect(0, trackY, W, 1);
    bg.fillStyle = "#5a4632";
    for (let x = 0; x < W; x += 3) bg.fillRect(x, trackY + 1, 1, 1);

    // Foreground hills with wildflowers.
    const front = Pixel.canvas(W, H);
    const fg = front.getContext("2d");
    const near = Pixel.ridge(W, rand, Math.round(H * 0.88), 6, [1, 2, 3]);
    Pixel.gradient(fg, ["#4caa4c", "#3f9a45", "#358a3d", "#2c7a36"], 0, Math.min(...near), W, H - Math.min(...near));
    fg.globalCompositeOperation = "destination-in";
    fg.beginPath();
    near.forEach((top, x) => fg.rect(x, top, 1, H - top));
    fg.fill();
    fg.globalCompositeOperation = "source-over";
    fg.fillStyle = "#6cc35a";
    near.forEach((top, x) => fg.fillRect(x, top, 1, 1));
    const petals = ["#ff7eb6", "#fff3a0", "#ffffff", "#ffb347", "#c792ff"];
    for (let i = 0; i < W * 0.6; i++) {
      const x = Math.floor(rand() * W);
      const y = near[x] + 3 + Math.floor(rand() * (H - near[x] - 3));
      fg.fillStyle = petals[Math.floor(rand() * petals.length)];
      fg.fillRect(x, y, 1, 1);
    }
    const tufts = Array.from({ length: Math.floor(W / 3) }, () => {
      const x = Math.floor(rand() * W);
      return { x, y: near[x], h: 2 + Math.floor(rand() * 3) };
    });

    const clouds = Array.from({ length: 7 }, () => {
      const w = 34 + Math.floor(rand() * 40);
      const img = Pixel.cloud(rand, w, 14 + Math.floor(rand() * 8), "#ffffff", "#d3e6f8", 5);
      return { img, x: rand() * W, y: 6 + Math.round(rand() * 70), speed: 2 + rand() * 4 };
    });

    const birds = Array.from({ length: 4 }, (_, i) => ({ dx: i * 7, dy: (i % 2) * 3, phase: rand() * 6 }));
    const smoke = [];
    let nextPuff = 0;

    const TRAIN_SPEED = 34;
    const carLen = [16, 14, 14, 14];
    const trainLen = carLen.reduce((a, b) => a + b + 2, 0);
    const cycle = W + trainLen + TRAIN_SPEED * 12;

    function train(x) {
      const top = trackY - 8;
      let cx = Math.round(x);
      carLen.forEach((len, i) => {
        const loco = i === carLen.length - 1;
        g.fillStyle = loco ? "#d94a3a" : "#f2e2c4";
        g.fillRect(cx, top + 1, len, 6);
        g.fillStyle = loco ? "#a8342a" : "#d94a3a";
        g.fillRect(cx, top + 5, len, 1);
        g.fillStyle = loco ? "#ffe9a8" : "#7fc6ff";
        for (let wx = cx + 2; wx < cx + len - 2; wx += 4) g.fillRect(wx, top + 2, 2, 2);
        if (loco) {
          g.fillStyle = "#d94a3a";
          g.fillRect(cx + len, top + 3, 2, 4);
          g.fillStyle = "#444";
          g.fillRect(cx + 6, top - 1, 1, 2);
          g.fillRect(cx + 4, top - 1, 5, 1);
        }
        g.fillStyle = "#2a2a2a";
        g.fillRect(cx + 2, top + 7, 2, 1);
        g.fillRect(cx + len - 4, top + 7, 2, 1);
        cx += len + 2;
      });
    }

    return (t, dt) => {
      g.drawImage(sky, 0, 0);

      // Sun rays pulse between two lengths.
      g.fillStyle = "#fff3b0";
      const long = Math.floor(t * 1.5) % 2 ? 5 : 3;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Pixel.TAU + t * 0.1;
        for (let k = 14; k < 14 + long; k++) {
          g.fillRect(Math.round(sun.x + Math.cos(a) * k), Math.round(sun.y + Math.sin(a) * k), 1, 1);
        }
      }

      for (const c of clouds) {
        const span = W + c.img.width;
        g.drawImage(c.img, Math.floor(((c.x + t * c.speed) % span) - c.img.width), c.y);
      }

      const bx = W + 20 - ((t * 10) % (W + 80));
      birds.forEach((b) => Pixel.bird(g, bx + b.dx, 34 + b.dy + Math.sin(t + b.phase) * 2, t + b.phase, "#2b4f7a"));

      g.drawImage(back, 0, 0);

      if (t > nextPuff) {
        smoke.push({ x: chimney.x, y: chimney.y, age: 0 });
        nextPuff = t + 0.7;
      }
      g.fillStyle = "#ffffff";
      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.age += dt;
        if (p.age > 4) {
          smoke.splice(i, 1);
          continue;
        }
        g.globalAlpha = 0.8 * (1 - p.age / 4);
        const s = p.age > 1.5 ? 2 : 1;
        g.fillRect(Math.round(p.x + p.age * 3 + Math.sin(p.age * 2)), Math.round(p.y - p.age * 5), s, s);
      }
      g.globalAlpha = 1;

      train(((t * TRAIN_SPEED) % cycle) - trainLen);
      g.drawImage(front, 0, 0);

      // Grass blades lean with the breeze.
      for (const tf of tufts) {
        const sway = Math.round(Math.sin(t * 1.8 + tf.x * 0.15));
        g.fillStyle = "#2f7f3a";
        g.fillRect(tf.x, tf.y - tf.h + 1, 1, tf.h);
        g.fillStyle = "#7fd36a";
        g.fillRect(tf.x + sway, tf.y - tf.h, 1, 1);
      }
    };
  },
});
