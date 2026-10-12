// Shared pixel-art helpers for the wallpapers. Everything is drawn at a tiny
// resolution and upscaled with `image-rendering: pixelated`.
const Pixel = (() => {
  const BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];
  const TAU = Math.PI * 2;

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

  function canvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    return c;
  }

  // True on roughly `f` (0..1) of pixels, in an ordered-dither pattern.
  const dith = (x, y, f) => BAYER[y & 3][x & 3] / 16 < f;

  // Opaque vertical gradient through `colors`, banded with ordered dithering.
  function gradient(g, colors, x, y, w, h) {
    const img = g.createImageData(w, h);
    const rgb = colors.map(hex);
    const last = colors.length - 1;
    for (let j = 0; j < h; j++) {
      const t = (h > 1 ? j / (h - 1) : 0) * last;
      const band = Math.floor(t);
      for (let i = 0; i < w; i++) {
        const c = rgb[Math.min(last, dith(x + i, y + j, t - band) ? band + 1 : band)];
        const k = (j * w + i) * 4;
        img.data[k] = c[0];
        img.data[k + 1] = c[1];
        img.data[k + 2] = c[2];
        img.data[k + 3] = 255;
      }
    }
    g.putImageData(img, x, y);
  }

  // Seamless ridge line (period P) built from integer-frequency sines.
  function ridge(P, rand, base, amp, ks = [1, 2, 3, 5, 8]) {
    const waves = ks.map((k, i) => ({ k, a: amp / (i + 1), p: rand() * TAU }));
    const tops = new Array(P);
    for (let x = 0; x < P; x++) {
      let h = 0;
      for (const w of waves) h += w.a * Math.sin((TAU * w.k * x) / P + w.p);
      tops[x] = Math.round(base - h);
    }
    return tops;
  }

  function fillRidge(g, tops, color, rim, bottom) {
    for (let x = 0; x < tops.length; x++) {
      g.fillStyle = color;
      g.fillRect(x, tops[x], 1, bottom - tops[x]);
      if (rim) {
        g.fillStyle = rim;
        g.fillRect(x, tops[x], 1, 1);
      }
    }
  }

  function disc(g, cx, cy, r, color) {
    g.fillStyle = color;
    for (let dy = -r; dy <= r; dy++) {
      const half = Math.floor(Math.sqrt(r * r - dy * dy));
      g.fillRect(cx - half, cy + dy, half * 2 + 1, 1);
    }
  }

  // Dithered radial glow; pixel density falls off with distance.
  function glow(g, cx, cy, r, color, strength = 0.5) {
    g.fillStyle = color;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        const d = Math.hypot(x - cx, y - cy) / r;
        if (d < 1 && dith(x, y, (1 - d) * (1 - d) * strength)) g.fillRect(x, y, 1, 1);
      }
    }
  }

  // Puffy cloud sprite: a few overlapping circles on a flat base.
  function cloud(rand, w, h, light, shade, puffCount = 4) {
    const c = canvas(w, h);
    const g = c.getContext("2d");
    const puffs = [];
    for (let i = 0; i < puffCount; i++) {
      puffs.push({ x: 6 + rand() * (w - 12), y: h - 4 - rand() * (h / 3), r: 3 + rand() * (h / 2.6) });
    }
    const inside = (x, y) => puffs.some((p) => (x - p.x) ** 2 + (y - p.y) ** 2 < p.r * p.r);
    g.fillStyle = light;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const flat = y >= h - 4 && x > 2 && x < w - 3;
        if (inside(x, y) || flat) g.fillRect(x, y, 1, 1);
      }
    }
    // Shade the underside.
    g.globalCompositeOperation = "source-atop";
    g.fillStyle = shade;
    g.fillRect(0, h - 3, w, 3);
    g.globalCompositeOperation = "source-over";
    return c;
  }

  function makeStars(rand, count, w, maxY, colors = ["#fff8e7", "#fff8e7", "#c9d6ff"]) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.floor(rand() * w),
        y: Math.floor(rand() * maxY),
        phase: rand() * TAU,
        speed: 0.6 + rand() * 2,
        big: rand() < 0.1,
        color: colors[Math.floor(rand() * colors.length)],
      });
    }
    return stars;
  }

  function drawStars(g, stars, t) {
    for (const s of stars) {
      const v = Math.sin(t * s.speed + s.phase);
      if (v < -0.6) continue;
      g.fillStyle = s.color;
      g.globalAlpha = v > 0.3 ? 1 : 0.5;
      g.fillRect(s.x, s.y, 1, 1);
      if (s.big && v > 0.75) {
        g.globalAlpha = 0.6;
        g.fillRect(s.x - 1, s.y, 3, 1);
        g.fillRect(s.x, s.y - 1, 1, 3);
      }
    }
    g.globalAlpha = 1;
  }

  // Occasional streak across the upper sky.
  function shootingStars(w, maxY) {
    let star = null;
    let next = 3;
    return (g, t, dt) => {
      if (!star && t > next) {
        star = {
          x: Math.random() * w * 0.8,
          y: Math.random() * maxY,
          vx: 60 + Math.random() * 40,
          vy: 25 + Math.random() * 15,
          life: 0.9,
        };
      }
      if (!star) return;
      star.x += star.vx * dt;
      star.y += star.vy * dt;
      star.life -= dt;
      for (let i = 0; i < 8; i++) {
        g.globalAlpha = Math.max(0, star.life) * (1 - i / 8);
        g.fillStyle = i === 0 ? "#ffffff" : "#ffe9a8";
        g.fillRect(Math.round(star.x - star.vx * 0.02 * i), Math.round(star.y - star.vy * 0.02 * i), 1, 1);
      }
      g.globalAlpha = 1;
      if (star.life <= 0) {
        star = null;
        next = t + 6 + Math.random() * 10;
      }
    };
  }

  // Draws a layer of period P scrolled left by `off` pixels, wrapping.
  function scroll(g, img, off, w) {
    const P = img.width;
    const o = Math.floor(((off % P) + P) % P);
    g.drawImage(img, -o, 0);
    if (P - o < w) g.drawImage(img, P - o, 0);
    return o;
  }

  // Little "v" birds with a two-frame flap.
  function bird(g, x, y, t, color) {
    g.fillStyle = color;
    x = Math.round(x);
    y = Math.round(y);
    if (Math.floor(t * 4) % 2) {
      g.fillRect(x - 2, y - 1, 1, 1);
      g.fillRect(x - 1, y, 1, 1);
      g.fillRect(x, y + 1, 1, 1);
      g.fillRect(x + 1, y, 1, 1);
      g.fillRect(x + 2, y - 1, 1, 1);
    } else {
      g.fillRect(x - 2, y + 1, 2, 1);
      g.fillRect(x, y, 1, 1);
      g.fillRect(x + 1, y + 1, 2, 1);
    }
  }

  return {
    TAU, rng, hex, canvas, dith, gradient, ridge, fillRidge, disc, glow,
    cloud, makeStars, drawStars, shootingStars, scroll, bird,
  };
})();
