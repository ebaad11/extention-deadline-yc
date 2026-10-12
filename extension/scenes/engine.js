// Runs the wallpapers. Each scene registers a `build(api)` that returns a
// `draw(t, dt)` function painting into its own low-res buffer; the engine
// blits the active buffer to the screen and slides between scenes.
const Scenes = (() => {
  const H = 180;
  const FPS = 24;
  const SLIDE_MS = 700;

  const defs = [];
  const instances = new Map();
  const listeners = [];
  let canvas, ctx, W;
  let index = 0;
  let slide = null;

  function register(def) {
    defs.push(def);
  }

  function instance(i) {
    const def = defs[i];
    let inst = instances.get(def.id);
    if (!inst) {
      const buf = Pixel.canvas(W, H);
      const g = buf.getContext("2d");
      const draw = def.build({ W, H, g, rand: Pixel.rng(def.seed ?? 1337) });
      inst = { buf, draw, last: null };
      instances.set(def.id, inst);
    }
    return inst;
  }

  function render(i, t) {
    const inst = instance(i);
    const dt = inst.last === null ? 0 : Math.min(0.1, t - inst.last);
    inst.last = t;
    inst.draw(t, dt);
    return inst.buf;
  }

  function resize() {
    W = Math.max(160, Math.ceil((H * innerWidth) / innerHeight));
    canvas.width = W;
    canvas.height = H;
    instances.clear();
  }

  const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  let lastFrame = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (now - lastFrame < 1000 / FPS) return;
    lastFrame = now;
    const t = now / 1000;

    if (slide) {
      const p = Math.min(1, (now - slide.start) / SLIDE_MS);
      const y = Math.round(ease(p) * H) * slide.dir;
      ctx.drawImage(render(slide.from, t), 0, -y);
      ctx.drawImage(render(index, t), 0, slide.dir * H - y);
      if (p === 1) slide = null;
    } else {
      ctx.drawImage(render(index, t), 0, 0);
    }
  }

  function go(i, dir, byUser = true) {
    if (slide || i === index) return;
    slide = { from: index, start: performance.now(), dir };
    index = i;
    listeners.forEach((fn) => fn(defs[index], byUser));
  }

  return {
    register,
    list: () => defs,
    current: () => defs[index],
    onChange: (fn) => listeners.push(fn),
    next: () => go((index + 1) % defs.length, 1),
    prev: () => go((index - 1 + defs.length) % defs.length, -1),
    // byUser=false switches without remembering the choice.
    goTo(id, byUser = true) {
      const i = defs.findIndex((d) => d.id === id);
      if (i >= 0) go(i, i > index ? 1 : -1, byUser);
    },
    init(el, startId) {
      canvas = el;
      ctx = canvas.getContext("2d");
      index = Math.max(0, defs.findIndex((d) => d.id === startId));
      resize();
      addEventListener("resize", resize);
      listeners.forEach((fn) => fn(defs[index], false));
      requestAnimationFrame(frame);
    },
  };
})();
