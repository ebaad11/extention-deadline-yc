// Procedural lofi hip-hop with the Web Audio API: dusty Rhodes-style chords,
// a sine bass, swung boom-bap drums, tape wobble and vinyl crackle.
// Everything is synthesized live, so there are no audio files to license.
const Lofi = (() => {
  const BPM = 74;
  const BEAT = 60 / BPM;
  const STEP = BEAT / 4; // 16th notes
  const SWING = 0.18;
  const LOOKAHEAD = 0.15;

  // Dm9 – G13 – Cmaj9 – Am9 (two bars each would drag; one bar each).
  const CHORDS = [
    { root: 38, notes: [53, 57, 60, 64] },
    { root: 43, notes: [53, 59, 64, 65] },
    { root: 36, notes: [52, 55, 59, 62] },
    { root: 45, notes: [55, 60, 64, 67] },
  ];
  const SCALE = [62, 64, 65, 67, 69, 72, 74, 76];

  //            1 e & a 2 e & a 3 e & a 4 e & a
  const KICK = [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0];
  const SNARE = [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0];
  const HAT =  [1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0];

  let ctx = null;
  let master, music, drums, noiseBuf, wobble, crackle, timer;
  let step = 0;
  let nextTime = 0;
  let active = false;

  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function makeNoise() {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function makeReverb() {
    const len = ctx.sampleRate * 2.4;
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const conv = ctx.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  function setup() {
    ctx = new AudioContext();
    noiseBuf = makeNoise();

    master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 4;
    const tone = ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 3200;
    master.connect(tone).connect(comp).connect(ctx.destination);

    music = ctx.createGain();
    music.gain.value = 0.9;
    const verb = makeReverb();
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    music.connect(master);
    music.connect(verb).connect(wet).connect(master);

    drums = ctx.createGain();
    drums.gain.value = 0.8;
    drums.connect(master);

    // Tape wobble: a slow LFO shared by every pitched voice's detune.
    wobble = ctx.createOscillator();
    wobble.frequency.value = 0.45;
    const depth = ctx.createGain();
    depth.gain.value = 9; // cents
    wobble.connect(depth);
    wobble.depth = depth;
    wobble.start();

    // Vinyl: soft hiss plus random pops.
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuf;
    hiss.loop = true;
    const hissBand = ctx.createBiquadFilter();
    hissBand.type = "bandpass";
    hissBand.frequency.value = 5000;
    hissBand.Q.value = 0.6;
    const hissGain = ctx.createGain();
    hissGain.gain.value = 0.012;
    hiss.connect(hissBand).connect(hissGain).connect(master);
    hiss.start();
    crackle = ctx.createGain();
    crackle.gain.value = 0.22;
    crackle.connect(master);
  }

  function voice(midi, t, dur, gain, type = "sine") {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq(midi);
    wobble.depth.connect(osc.detune);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.02);
    env.gain.exponentialRampToValueAtTime(gain * 0.4, t + 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(music);
    osc.onended = () => wobble.depth.disconnect(osc.detune);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function keys(midi, t, dur, gain) {
    // Sine + soft triangle an octave up, lowpassed: a dusty electric piano.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1400;
    lp.connect(music);
    for (const [type, mult, g] of [["sine", 1, 1], ["triangle", 2, 0.18]]) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq(midi) * mult;
      wobble.depth.connect(osc.detune);
      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(gain * g, t + 0.015);
      env.gain.exponentialRampToValueAtTime(gain * g * 0.35, t + 0.6);
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(env).connect(lp);
      osc.onended = () => {
        wobble.depth.disconnect(osc.detune);
        lp.disconnect();
      };
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
  }

  function noiseHit(t, dur, gain, filterType, f, dest) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const filt = ctx.createBiquadFilter();
    filt.type = filterType;
    filt.frequency.value = f;
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt).connect(env).connect(dest);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur + 0.02);
  }

  function kick(t) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    env.gain.setValueAtTime(0.9, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(env).connect(drums);
    osc.start(t);
    osc.stop(t + 0.4);
  }

  function snare(t) {
    noiseHit(t, 0.18, 0.35, "bandpass", 1800, drums);
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.frequency.value = 190;
    env.gain.setValueAtTime(0.18, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(env).connect(drums);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  function schedule(s, t) {
    const bar = Math.floor(s / 16) % CHORDS.length;
    const i = s % 16;
    const chord = CHORDS[bar];

    if (KICK[i]) kick(t);
    if (SNARE[i]) snare(t);
    if (HAT[i]) noiseHit(t, 0.04, i % 4 === 0 ? 0.08 : 0.05, "highpass", 7000, drums);

    if (i === 0) {
      chord.notes.forEach((n, k) => keys(n, t + k * 0.012, BEAT * 3.8, 0.07));
      voice(chord.root, t, BEAT * 1.8, 0.28);
    }
    if (i === 10) voice(chord.root + (Math.random() < 0.5 ? 7 : 12), t, BEAT * 1.4, 0.2);
    if (i === 8 && Math.random() < 0.5) {
      chord.notes.forEach((n) => keys(n, t, BEAT * 1.6, 0.04));
    }

    // Sparse, lazy melody.
    if (i % 2 === 0 && Math.random() < 0.22) {
      const n = SCALE[Math.floor(Math.random() * SCALE.length)] + 12;
      keys(n, t, BEAT * 1.2, 0.045);
    }

    // Vinyl pops.
    if (Math.random() < 0.3) {
      noiseHit(t + Math.random() * STEP, 0.006, 0.4 + Math.random() * 0.5, "highpass", 2500, crackle);
    }
  }

  function pump() {
    while (nextTime < ctx.currentTime + LOOKAHEAD) {
      const swing = step % 2 === 1 ? STEP * SWING : 0;
      schedule(step, nextTime + swing);
      nextTime += STEP;
      step++;
    }
  }

  async function start() {
    if (!ctx) setup();
    if (ctx.state !== "running") {
      // Without a user gesture resume() can stay pending, so don't wait forever.
      await Promise.race([ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
    }
    if (ctx.state !== "running") return false;
    if (!active) {
      active = true;
      nextTime = ctx.currentTime + 0.1;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.8, ctx.currentTime, 0.6);
      timer = setInterval(pump, 25);
      pump();
    }
    return true;
  }

  function stop() {
    if (!ctx || !active) return;
    active = false;
    clearInterval(timer);
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    setTimeout(() => !active && ctx.suspend(), 800);
  }

  return { start, stop, isPlaying: () => active && ctx.state === "running" };
})();
