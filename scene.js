
(() => {
  "use strict";
  const CHARACTER_IMAGES = {
    columbina: "assets/columbina.png",
    aether: "assets/aether.png"
  };

  const TAU = Math.PI * 2;
  const RAMP = " .,:;-=+*^ox%#W@";
  const CW = 9, CH = 15, FONT = 13;
  const GROUND_Y = -1.12;
  const MOON = { x: -0.08, y: 1.70, z: -3.0, radius: 0.95 };
  const K = Object.freeze({ MOON: 1, FLOWER: 2, STEM: 3, COLUMBINA: 4, AETHER: 5, SPORE: 6, DEW: 7 });
  const LYRICS = [
    { t: 0.0, text: "M O O N L I T   D R E A M" },
    { t: 6.0, text: "B E N E A T H   T H E   S T A R S" },
    { t: 13.0, text: "A   F I E L D   O F   L I G H T" },
    { t: 20.0, text: "C O L U M B I N A   A N D   A E T H E R" }
  ];

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = x => { const a = clamp(x, 0, 1); return a * a * (3 - 2 * a); };
  const mix = (a, b, u) => a + (b - a) * u;
  function mulberry32(seed) { return () => { let t = seed += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  class Points {
    constructor() { this.x = []; this.y = []; this.z = []; this.nx = []; this.ny = []; this.nz = []; this.r = []; this.g = []; this.b = []; this.kind = []; this.appear = []; this.phase = []; }
    add(x, y, z, nx, ny, nz, r, g, b, kind, appear = 0, phase = 0) {
      let l = Math.hypot(nx, ny, nz) || 1;
      this.x.push(x); this.y.push(y); this.z.push(z);
      this.nx.push(nx / l); this.ny.push(ny / l); this.nz.push(nz / l);
      this.r.push(clamp(r, 0, 1)); this.g.push(clamp(g, 0, 1)); this.b.push(clamp(b, 0, 1));
      this.kind.push(kind); this.appear.push(appear); this.phase.push(phase);
    }
    compile() {
      let out = { count: this.x.length };
      for (const key of ['x', 'y', 'z', 'nx', 'ny', 'nz', 'r', 'g', 'b', 'appear', 'phase']) out[key] = new Float32Array(this[key]);
      out.kind = new Uint8Array(this.kind); return out;
    }
  }
  function createMoon(sb, rng) {
    const N = 11500;
    for (let i = 0; i < N; i++) {
      const yy = 1 - 2 * (i + .5) / N;
      const rad = Math.sqrt(Math.max(0, 1 - yy * yy));
      const phi = i * 2.399963229728653;
      const xx = Math.cos(phi) * rad, zz = Math.sin(phi) * rad;
      const light = clamp(xx * .34 - yy * .58 + zz * .45 + .48, 0, 1);
      const craters = .90 + .10 * Math.sin(xx * 12 + yy * 8) * Math.cos(zz * 13 - xx * 7);
      const rim = Math.pow(Math.max(0, 1 - Math.abs(zz)), 1.8);
      const level = craters * (.53 + .47 * smooth(light));
      let r = (.29 + rim * .10) * level + .34 * light;
      let g = (.48 + rim * .11) * level + .34 * light;
      let b = (.80 + rim * .07) * level + .27 * light;
      if (light > .78) { r += .20; g += .19; b += .10; }
      sb.add(MOON.x + xx * MOON.radius, MOON.y + yy * MOON.radius, MOON.z + zz * MOON.radius,
        xx, yy, zz, r, g, b, K.MOON, 0, rng() * TAU);
    }
  }
  function createFlowers(sb, rng) {
    const palettes = [
      [.72, .90, 1.00], [.63, .86, 1.00], [.90, .96, 1.00],
      [.54, .81, 1.00], [.80, .84, 1.00], [.75, 1.00, 1.00]
    ];
    const count = 530;
    for (let i = 0; i < count; i++) {
      const u = Math.pow(rng(), .67), radius = .65 + u * 5.15;
      const theta = i * 2.39996323 + (rng() - .5) * .35;
      const x = Math.cos(theta) * radius, z = .28 + Math.sin(theta) * radius * .92;
      if (Math.abs(x) < .95 && z < 1.15 && z > -.9 && rng() < .72) continue;
      const h = .048 + .044 * rng() + .035 * (1 - u);
      const ph = rng() * TAU, appear = 2.65 + 2.2 * u + rng() * .5;
      const chosen = palettes[Math.floor(rng() * palettes.length)];
      for (let s = 1; s <= 3; s++) {
        const a = s / 3;
        sb.add(x, GROUND_Y + a * h, z, 0, .72, .3, .15, .40, .60, K.STEM, appear, ph);
      }
      const n = 7 + Math.floor(rng() * 3);
      const size = .024 + .014 * rng();
      sb.add(x, GROUND_Y + h + .005, z, 0, 1, 0, .93, .98, 1, K.FLOWER, appear, ph);
      for (let p = 0; p < n; p++) {
        const a = p / n * TAU;
        const rr = size * (.7 + .5 * (p % 2));
        sb.add(x + Math.cos(a) * rr, GROUND_Y + h + Math.sin(a * 2) * .007, z + Math.sin(a) * rr,
          Math.cos(a) * .15, 1, Math.sin(a) * .15,
          chosen[0] * (.92 + rng() * .08), chosen[1], chosen[2], K.FLOWER, appear + .07, ph + p * .24);
      }
    }
    for (let i = 0; i < 550; i++) {
      const x = (rng() - .5) * 10.8, z = (rng() - .5) * 9;
      const shimmer = .4 + .6 * rng();
      sb.add(x, GROUND_Y + .003, z, 0, 1, 0, .19 * shimmer, .49 * shimmer, .77 * shimmer,
        K.DEW, 2.4 + rng() * 3.0, rng() * TAU);
    }
    for (let i = 0; i < 170; i++) {
      const x = (rng() - .5) * 8, z = (rng() - .5) * 5;
      sb.add(x, GROUND_Y + .1 + rng() * 2.0, z, 0, 1, 0, .56, .84, 1, K.SPORE, 3 + rng() * 2, rng() * TAU);
    }
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const im = new Image(); im.onload = () => resolve(im); im.onerror = reject; im.src = src;
    });
  }
  function createSprite(sb, im, kind, x, height, z, appear) {
    const can = document.createElement('canvas'); can.width = im.width; can.height = im.height;
    const ctx = can.getContext('2d', { willReadFrequently: true }); ctx.drawImage(im, 0, 0);
    const data = ctx.getImageData(0, 0, im.width, im.height).data;
    const w = im.width, h = im.height;
    const rng = mulberry32(kind * 31 + 11);
    for (let yy = 0; yy < h; yy += 2) {
      for (let xx = 0; xx < w; xx += 2) {
        const idx = (yy * w + xx) * 4, alpha = data[idx + 3] / 255;
        if (alpha < .48) continue;
        const nx = (xx + .5 - w / 2) / h * height;
        const py = GROUND_Y + (1 - (yy + .5) / h) * height;
        const shade = .89 + alpha * .11;
        sb.add(x + nx, py, z + (.006 * Math.sin(xx * .14 + yy * .08)), 0, .10, 1,
          data[idx] / 255 * shade, data[idx + 1] / 255 * shade, data[idx + 2] / 255 * shade,
          kind, appear + .24 * rng(), rng() * TAU);
      }
    }
  }
  function buildBaseWorld() {
    const rng = mulberry32(20261116);
    const sb = new Points();
    createMoon(sb, rng);
    createFlowers(sb, rng);
    return sb;
  }

  class Grid {
    constructor(canvas) {
      this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false });
      this.off = document.createElement('canvas'); this.offctx = this.off.getContext('2d', { alpha: false });
      this.blur = document.createElement('canvas'); this.blurctx = this.blur.getContext('2d', { alpha: true });
      this.resize();
    }
    resize() {
      this.w = Math.max(1, window.innerWidth); this.h = Math.max(1, window.innerHeight);
      this.canvas.width = this.w; this.canvas.height = this.h;
      this.off.width = this.w; this.off.height = this.h;
      this.blur.width = Math.max(1, Math.round(this.w / 5)); this.blur.height = Math.max(1, Math.round(this.h / 5));
      this.cols = Math.max(1, Math.floor(this.w / CW)); this.rows = Math.max(1, Math.floor(this.h / CH));
      const n = this.cols * this.rows;
      this.ch = new Uint16Array(n); this.r = new Float32Array(n); this.g = new Float32Array(n); this.b = new Float32Array(n); this.z = new Float32Array(n);
    }
    clear() { this.ch.fill(0); this.r.fill(0); this.g.fill(0); this.b.fill(0); this.z.fill(1e9); }
    stamp(c, row, char, r, g, b, depth = Infinity, mode = 'replace') {
      c = Math.round(c); row = Math.round(row);
      if (c < 0 || c >= this.cols || row < 0 || row >= this.rows) return;
      const i = row * this.cols + c;
      if (mode !== 'overlay') {
        if (Number.isFinite(depth)) {
          if (depth >= this.z[i]) return;
          this.z[i] = depth;
        } else if (this.z[i] < 1e9) {
          return;
        }
      }
      this.ch[i] = char.charCodeAt(0);
      this.r[i] = clamp(r, 0, 1); this.g[i] = clamp(g, 0, 1); this.b[i] = clamp(b, 0, 1);
    }
    paint(time) {
      const ctx = this.offctx, w = this.w, h = this.h;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#030713'); grad.addColorStop(.39, '#07132a');
      grad.addColorStop(.64, '#092341'); grad.addColorStop(.82, '#0c2d4b'); grad.addColorStop(1, '#061527');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
      const fog = ctx.createLinearGradient(0, h * .57, 0, h);
      fog.addColorStop(0, 'rgba(50,116,182,0)');
      fog.addColorStop(.45, 'rgba(27,86,147,.065)');
      fog.addColorStop(1, 'rgba(4,12,30,.24)');
      ctx.fillStyle = fog; ctx.fillRect(0, h * .57, w, h * .43);
      ctx.font = `bold ${FONT}px Consolas,Menlo,monospace`;
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      for (let row = 0; row < this.rows; row++) {
        const ofs = row * this.cols;
        for (let col = 0; col < this.cols; col++) {
          const i = ofs + col, code = this.ch[i]; if (code <= 32) continue;
          ctx.fillStyle = `rgb(${(this.r[i] * 255) | 0},${(this.g[i] * 255) | 0},${(this.b[i] * 255) | 0})`;
          ctx.fillText(String.fromCharCode(code), col * CW + 1, row * CH + CH - 2);
        }
      }
      const b = this.blurctx;
      b.clearRect(0, 0, this.blur.width, this.blur.height);
      b.filter = 'blur(2.8px)'; b.drawImage(this.off, 0, 0, this.blur.width, this.blur.height); b.filter = 'none';
      const front = this.ctx; front.globalCompositeOperation = 'source-over'; front.globalAlpha = 1;
      front.drawImage(this.off, 0, 0);
      front.globalCompositeOperation = 'screen'; front.globalAlpha = .28;
      front.drawImage(this.blur, 0, 0, w, h);
      front.globalCompositeOperation = 'source-over'; front.globalAlpha = 1;
    }
  }

  class Sky {
    constructor() {
      const rng = mulberry32(58119); this.stars = [];
      for (let i = 0; i < 315; i++)this.stars.push({ x: rng(), y: rng() * .60, phase: rng() * TAU, speed: .55 + rng() * 1.55, kind: i % 9 });
      this.rng = mulberry32(21702); this.reset();
    }
    reset() {
      this.meteors = [];
      this.spawn(false, -3.1);
      this.spawn(false, -9.0);
      this.spawn(true, -7.0);
      this.nextSpawn = 9.8;
    }
    spawn(front = false, initialAge = 0) {
      const rng = this.rng;
      this.meteors.push({
        front, age: initialAge, duration: front ? 11 + rng() * 2.4 : 13.5 + rng() * 3.7,
        x0: front ? .94 : .93, x1: front ? .16 : .13,
        y0: front ? .40 : .37, y1: front ? .46 : .43,
        height: front ? .12 + .045 * rng() : .22 + .045 * rng(),
        gold: rng() < .16, side: rng() - .5
      });
    }
    update(dt, t) {
      if (t >= this.nextSpawn && this.meteors.length < 7) {
        this.spawn(this.rng() < .28); this.nextSpawn = t + 7 + this.rng() * 4;
      }
      for (const m of this.meteors) m.age += dt;
      this.meteors = this.meteors.filter(m => m.age < m.duration + .7);
    }
    starsBackdrop(g, t) {
      for (const s of this.stars) {
        const r = s.y * g.rows, c = s.x * g.cols;
        const tw = .28 + .68 * (.5 + .5 * Math.sin(t * s.speed + s.phase));
        const ch = s.kind === 0 ? '+' : s.kind % 3 === 0 ? '*' : '.';
        g.stamp(c, r, ch, .52 * tw, .74 * tw, 1 * tw);
      }
      for (let i = 0; i < g.cols; i += 3) {
        let r = g.rows * (.77 + .018 * Math.sin(i * .19));
        const glow = .17 + .06 * Math.sin(i * 1.7 + t * .8);
        g.stamp(i, r, '.', glow * .66, glow, glow * 1.4);
      }
    }
    bezier(m, u) {
      const x = m.x0 + (m.x1 - m.x0) * u;
      const y = m.y0 + (m.y1 - m.y0) * u - 4 * m.height * u * (1 - u) + m.side * .016;
      return [x, y];
    }
    paintMeteors(g, t, front) {
      for (const m of this.meteors) {
        if (m.front !== front || m.age < 0) continue;
        const raw = clamp(m.age / m.duration, 0, 1);
        const u = smooth(raw);
        const entrance = smooth(m.age / 1.2);
        const exit = smooth((m.duration - m.age) / 1.3);
        const fade = entrance * exit;
        if (fade <= .005) continue;
        const L = 32;
        for (let s = L; s >= 0; s--) {
          const previous = u - s * .0043;
          if (previous < 0) continue;
          const [x, y] = this.bezier(m, previous);
          if (y < .015 || y > .62) continue;
          const k = 1 - s / (L + 1), lum = fade * Math.pow(k, 1.5);
          const chr = s === 0 ? '@' : s < 4 ? '*' : s < 12 ? '+' : s < 22 ? '-' : '.';
          const col = m.gold ? [1, .86, .51] : [.68, .90, 1];
          g.stamp(x * g.cols, y * g.rows, chr, col[0] * lum, col[1] * lum, col[2] * lum,
            front ? undefined : Infinity, front ? 'overlay' : 'replace');
          if (s < 10 && s % 3 === 0) {
            g.stamp(x * g.cols, y * g.rows - 1, '.', col[0] * lum * .20, col[1] * lum * .24, col[2] * lum * .27,
              Infinity, front ? 'overlay' : 'replace');
          }
        }
      }
    }
  }

  const canvas = document.getElementById('ascii-canvas');
  const grid = new Grid(canvas), sky = new Sky();
  const sceneBuilder = buildBaseWorld();
  let world = sceneBuilder.compile();
  let time = 0, last = performance.now();

  // Preserve the original character cutouts and reveal them after the camera pullback.
  const characterDefinitions = [
    {
      name: 'Columbina', src: CHARACTER_IMAGES.columbina,
      kind: K.COLUMBINA, x: -.52, height: 1.85, z: -1.13, appear: 8.65
    },
    {
      name: 'Aether', src: CHARACTER_IMAGES.aether,
      kind: K.AETHER, x: .48, height: 1.91, z: -1.12, appear: 8.85
    }
  ];

  for (const character of characterDefinitions) {
    loadImage(character.src)
      .then(image => {
        createSprite(sceneBuilder, image, character.kind,
          character.x, character.height, character.z, character.appear);
        world = sceneBuilder.compile();
      })
      .catch(error => {
        console.error(`Failed to load ${character.name} sprite from ${character.src}. ` +
          'Check that the assets folder is next to index.html.', error);
      });
  }

  window.addEventListener('resize', () => grid.resize());

  function projectScene() {
    if (!world) return;
    const zoom = smooth((time - 1.1) / 7.2);
    const targetY = mix(1.43, .55, zoom);
    const targetZ = mix(MOON.z, 0, zoom);
    const camDist = mix(3.0, 6.2, zoom);
    const pitch = .014, cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const fov = grid.rows * .45, aspect = CW / CH;
    const spin = time * .025, cs = Math.cos(spin), sn = Math.sin(spin);
    for (let i = 0; i < world.count; i++) {
      const kind = world.kind[i], appear = world.appear[i];
      if (time < appear) continue;
      let x = world.x[i], y = world.y[i], z = world.z[i];
      const phase = world.phase[i];
      if (kind === K.MOON) {
        const dx = x - MOON.x, dz = z - MOON.z;
        x = MOON.x + dx * cs - dz * sn;
        z = MOON.z + dx * sn + dz * cs;
      } else if (kind === K.FLOWER || kind === K.STEM) {
        x += Math.sin(time * .92 + phase) * .008;
      } else if (kind === K.COLUMBINA || kind === K.AETHER) {
        const height = clamp((y - GROUND_Y) / 1.95, 0, 1);
        x += .003 * Math.sin(time * 1.2 + kind) * height;
        y += .006 * Math.sin(time * 1.55 + kind) * height;
      } else if (kind === K.SPORE) {
        y = GROUND_Y + ((y - GROUND_Y + time * .08) % 2.1);
        x += .025 * Math.sin(time * .7 + phase);
      }
      const ry = (y - targetY) * cosP - (z - targetZ) * sinP;
      const rz = (y - targetY) * sinP + (z - targetZ) * cosP + camDist;
      if (rz <= .25) continue;
      const p = 2.55 / rz;
      const col = Math.round(grid.cols * .5 + x * p * fov / aspect);
      const row = Math.round(grid.rows * .51 - ry * p * fov);
      if (col < 0 || col >= grid.cols || row < 0 || row >= grid.rows) continue;
      let light = clamp(.30 + (.45 * world.ny[i] + .48 * world.nz[i] + .26 * world.nx[i]) * .68 + .48, .24, 1);
      if (kind === K.MOON) light = .72 + .28 * light;
      else if (kind === K.FLOWER) light = .75 + .18 * Math.sin(time * 1.7 + phase);
      else if (kind === K.COLUMBINA || kind === K.AETHER) light = .90 + .06 * Math.sin(time * .8 + phase);
      else if (kind === K.SPORE || kind === K.DEW) light = .44 + .28 * Math.sin(time * 2 + phase);
      const age = time - appear, fade = smooth(age / (kind === K.MOON ? .01 : .75));
      const l = clamp(light * fade, 0, 1);
      const code = RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.floor(l * (RAMP.length - 1))))];
      grid.stamp(col, row, code, world.r[i] * l, world.g[i] * l, world.b[i] * l, rz);
    }
  }
  function paintLyrics() {
    if (time < 5.8 || grid.cols < 52 || grid.rows < 30) return;
    const cycle = (time - 5.8) % 28.0;
    let phrase = LYRICS[0].text;
    for (const entry of LYRICS) if (cycle >= entry.t) phrase = entry.text;
    const y = grid.rows - 3, start = Math.max(0, Math.floor((grid.cols - phrase.length) / 2));
    for (let i = 0; i < phrase.length; i++) {
      if (phrase[i] === ' ') continue;
      const v = .36 + .1 * Math.sin(time * .85 + i * .2);
      grid.stamp(start + i, y, phrase[i], v * .75, v * .91, v, Infinity, 'overlay');
    }
  }
  function frame(now) {
    const dt = Math.min(.055, Math.max(0, (now - last) / 1000)); last = now;
    time += dt; sky.update(dt, time);
    grid.clear();
    sky.starsBackdrop(grid, time);
    sky.paintMeteors(grid, time, false);
    projectScene();
    sky.paintMeteors(grid, time, true);
    paintLyrics(); grid.paint(time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const bgMusic = document.getElementById("bg-music");

  bgMusic.volume = 0.6;

  function startBackgroundMusic() {
    bgMusic.play()
      .then(() => {
        console.log("Background music is playing.");
      })
      .catch((error) => {
        console.log("Background music could not start:", error.name);
      });
  }

  startBackgroundMusic();

  document.addEventListener("pointerdown", startBackgroundMusic, {
    once: true
  });
})();
