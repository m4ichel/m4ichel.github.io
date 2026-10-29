/* =========================================================
   hero.js — CH.01
   · fundo holográfico em WebGL que se torce em volta do cursor (7.jpg)
   · nome feito de quadradinhos luminosos (2.gif): o cursor empurra,
     segurar o clique colapsa tudo numa esfera girando e soltar explode
   Otimizações: ~metade das partículas, um único traço por cor, canvas
   em resolução reduzida, 30 fps quando o mouse está fora e pausa
   completa quando o nome está parado.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  const hero = S.$('#top');
  if (!hero) return;
  S.watch(hero);

  /* ========== fundo holográfico ========== */
  const holo = S.$('#holo');
  const gl = holo.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'low-power' });
  let U = null;
  if (gl) {
    const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    const FS = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uGlitch;
uniform float uPress;
uniform float uInfra;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
vec3 iri(float t){ return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float row = floor(uv.y * 46.0);
  float tick = floor(t * 14.0);
  float gb = step(1.0 - uGlitch * 0.6, hash(vec2(row, tick)));
  p.x += gb * (hash(vec2(row * 1.3, tick + 3.0)) - 0.5) * 0.4;
  // torção em volta do cursor
  vec2 d = p - m;
  float k = exp(-dot(d, d) * 7.0);
  float a = k * (1.4 + uPress * 4.0);
  float c = cos(a), s = sin(a);
  vec2 q = m + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  float v = (q.x * 0.9 + q.y * 1.7) * 6.5 + fbm(q * 1.35 + vec2(t * 0.045, -t * 0.03)) * 7.5 + k * sin(t * 2.2) * 3.0;
  // aberração cromática como deslocamento de fase por canal
  float ca = 0.35 + uGlitch * 1.4;
  vec3 band = smoothstep(0.42, 0.95, 0.5 + 0.5 * sin(vec3(v + ca, v, v - ca)));
  // máscara com piso: as manchas escurecem mas nunca apagam de vez
  float mask = 0.38 + 0.62 * smoothstep(0.2, 0.55, fbm(p * 1.05 + vec2(-t * 0.025, t * 0.018) + 4.0));
  vec3 base = vec3(0.30, 0.20, 1.0) * band + vec3(0.8, 0.7, 1.0) * band * band * band;
  // brilho ambiente fraco nos vãos entre as faixas
  vec3 amb = vec3(0.10, 0.06, 0.26) * (0.55 + 0.45 * sin(v * 0.37 + t * 0.2));
  float edge = pow(1.0 - abs(sin(v)), 9.0);
  vec3 col = (base * 0.75 + amb + iri(v * 0.045 + t * 0.05) * edge * 0.9) * mask;
  col = mix(col, vec3(dot(col, vec3(0.6, 0.3, 0.1)) * 1.5, 0.02, 0.07), uInfra);
  col *= 0.86 + 0.14 * sin(gl_FragCoord.y * 3.14159);
  col *= smoothstep(1.45, 0.2, length(uv - 0.5) * 1.5);
  gl_FragColor = vec4(col, 1.0);
}`;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (vs && fs) {
      const pr = gl.createProgram();
      gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (gl.getProgramParameter(pr, gl.LINK_STATUS)) {
        gl.useProgram(pr);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(pr, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        U = {};
        ['uRes', 'uTime', 'uMouse', 'uGlitch', 'uPress', 'uInfra'].forEach((n) => { U[n] = gl.getUniformLocation(pr, n); });
      }
    }
  }
  if (!U) holo.style.background = 'radial-gradient(ellipse at 60% 40%, #2a1a7a, #06050b 70%)';

  const hm = { x: 0.62, y: 0.42, p: 0, infra: 0 };
  function drawHolo(lx, ly, w, h) {
    if (!U) return;
    S.size(holo, 1, 0.4);
    gl.viewport(0, 0, holo.width, holo.height);
    const tx = S.mouse.active ? lx / w : 0.62 + Math.sin(S.time * 0.3) * 0.15;
    const ty = S.mouse.active ? ly / h : 0.42 + Math.cos(S.time * 0.23) * 0.1;
    hm.x += (tx - hm.x) * 0.06; hm.y += (ty - hm.y) * 0.06;
    hm.p += ((mode === 'sphere' ? 1 : 0) - hm.p) * 0.05;
    hm.infra += ((S.infrared ? 1 : 0) - hm.infra) * 0.05;
    gl.uniform2f(U.uRes, holo.width, holo.height);
    gl.uniform1f(U.uTime, S.time);
    gl.uniform2f(U.uMouse, hm.x * holo.width, (1 - hm.y) * holo.height);
    gl.uniform1f(U.uGlitch, S.glitch);
    gl.uniform1f(U.uPress, hm.p);
    gl.uniform1f(U.uInfra, hm.infra);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ========== mosaico de partículas ========== */
  const mc = S.$('#mosaic'), mx = mc.getContext('2d');
  const PAL_BASE = ['#ff3fd8', '#ff7ad9', '#b04bff', '#6f8bff', '#ffffff', '#ffd166', '#ff6a3d'];
  const PAL_INFRA = ['#ff1f4b', '#ff5470', '#a0102a', '#3d2bff', '#ffd0d6', '#ff8a3d', '#ff3d3d'];
  let PAL = PAL_BASE;
  addEventListener('lmp:palette', () => { PAL = S.infrared ? PAL_INFRA : PAL_BASE; wake(); });

  let N = 0, HX, HY, X, Y, VX, VY, Z, SU, SV, buckets = [];
  let step = 7, cw = 0, ch = 0, built = false, firstBuild = true;
  let mode = 'home', scx = 0, scy = 0, rot = 0;
  let asleep = false, awakeUntil = 0, frameN = 0;
  const wake = (ms = 600) => { asleep = false; awakeUntil = Math.max(awakeUntil, performance.now() + ms); };

  function colorIndex(x, y) {
    if (Math.random() < 0.14) return (Math.random() * PAL_BASE.length) | 0;
    const n = (Math.sin(x * 0.011 + y * 0.006) + Math.sin(x * 0.004 - y * 0.015 + 1.3) + 2) / 4;
    return n < 0.36 ? 0 : n < 0.5 ? 1 : n < 0.6 ? 2 : n < 0.7 ? 3 : n < 0.78 ? 4 : n < 0.9 ? 5 : 6;
  }

  function build() {
    const w = mc._w || mc.clientWidth, h = mc._h || mc.clientHeight;
    if (!w || !h) return;
    cw = w; ch = h;
    const off = document.createElement('canvas');
    off.width = Math.ceil(w); off.height = Math.ceil(h);
    const o = off.getContext('2d', { willReadFrequently: true });
    const lines = w < 760 ? ['LUCAS', 'MICHEL', 'PEREIRA'] : ['LUCAS MICHEL', 'PEREIRA'];
    const FONT = '"Unbounded", "Arial Black", sans-serif';
    o.font = `900 100px ${FONT}`;
    const mw = Math.max(...lines.map((l) => o.measureText(l).width));
    let fs = (100 * w * (w < 760 ? 0.88 : 0.82)) / mw;
    fs = Math.min(fs, (h * (lines.length === 3 ? 0.46 : 0.4)) / lines.length);
    o.font = `900 ${fs}px ${FONT}`;
    o.textAlign = 'center';
    o.textBaseline = 'middle';
    o.fillStyle = '#fff';
    const lh = fs * 1.04, cy = h * (w < 760 ? 0.4 : 0.43);
    lines.forEach((l, i) => o.fillText(l, w / 2, cy + (i - (lines.length - 1) / 2) * lh));
    // grade mais espaçada = menos partículas (cerca de metade da versão anterior)
    step = Math.max(5, Math.round(fs / 14));
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const pts = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 140) pts.push(x, y);
    }
    const oldN = N, oX = X, oY = Y;
    N = pts.length / 2;
    HX = new Float32Array(N); HY = new Float32Array(N);
    X = new Float32Array(N); Y = new Float32Array(N);
    VX = new Float32Array(N); VY = new Float32Array(N);
    Z = new Float32Array(N); SU = new Float32Array(N); SV = new Float32Array(N);
    const cols = PAL_BASE.map(() => []);
    for (let i = 0; i < N; i++) {
      HX[i] = pts[i * 2]; HY[i] = pts[i * 2 + 1];
      if (firstBuild) { X[i] = Math.random() * w; Y[i] = Math.random() * h; }
      else if (i < oldN) { X[i] = oX[i]; Y[i] = oY[i]; }
      else { X[i] = HX[i]; Y[i] = HY[i]; }
      SU[i] = Math.random(); SV[i] = Math.random();
      cols[colorIndex(HX[i], HY[i])].push(i);
    }
    buckets = cols.map((c) => Int32Array.from(c));
    firstBuild = false;
    built = true;
    wake(1500);
  }

  function explode(cx, cy, power, radius) {
    for (let i = 0; i < N; i++) {
      const dx = X[i] - cx, dy = Y[i] - cy;
      const d = Math.hypot(dx, dy) + 0.01;
      if (d > radius) continue;
      const f = radius === Infinity ? S.rand(6, 22) * power : (1 - d / radius) * 26 * power;
      VX[i] += (dx / d) * f; VY[i] += (dy / d) * f;
    }
    wake(1500);
  }

  // faixa de glitch que desloca um pedaço do nome de vez em quando
  const band = { y: 0, h: 0, off: 0, until: 0, next: 3000 };

  // devolve a maior velocidade² (para saber quando o nome parou)
  function physics(lx, ly, inside) {
    const holding = mode === 'sphere';
    const now = performance.now();
    if (now > band.next) {
      band.y = S.rand(ch * 0.25, ch * 0.62); band.h = S.rand(step * 2, step * 6);
      band.off = S.rand(-60, 60); band.until = now + S.rand(90, 220);
      band.next = band.until + S.rand(3000, 6500);
      wake(900);
    }
    const bandOn = now < band.until;
    if (holding) {
      rot += 0.018;
      if (S.mouse.down && inside) { scx += (lx - scx) * 0.12; scy += (ly - scy) * 0.12; }
    }
    const sphR = Math.min(cw, ch) * 0.23 * (1 + Math.sin(S.time * 3) * 0.03);
    const cT = Math.cos(0.45), sT = Math.sin(0.45);
    const R = Math.max(90, cw * 0.085), R2 = R * R;
    const mvx = S.mouse.vx, mvy = S.mouse.vy;
    const k = holding ? 0.075 : 0.05, damp = holding ? 0.82 : 0.86;
    let maxV = 0;
    for (let i = 0; i < N; i++) {
      let tx, ty;
      if (holding) {
        const th = Math.acos(1 - 2 * SU[i]), ph = SV[i] * 6.2832 + rot;
        const st = Math.sin(th);
        const sx = st * Math.cos(ph), sy = Math.cos(th), sz = st * Math.sin(ph);
        tx = scx + sx * sphR; ty = scy + (sy * cT - sz * sT) * sphR; Z[i] = sy * sT + sz * cT;
      } else {
        tx = HX[i]; ty = HY[i]; Z[i] = 0;
        if (bandOn && ty > band.y && ty < band.y + band.h) tx += band.off;
      }
      let ax = (tx - X[i]) * k, ay = (ty - Y[i]) * k;
      if (inside && !holding) {
        const dx = X[i] - lx, dy = Y[i] - ly, d2 = dx * dx + dy * dy;
        if (d2 < R2) {
          const d = Math.sqrt(d2) + 0.01, f = 1 - d / R;
          ax += (dx / d) * f * 3.4 + mvx * f * 0.09;
          ay += (dy / d) * f * 3.4 + mvy * f * 0.09;
        }
      }
      const vx = (VX[i] + ax) * damp, vy = (VY[i] + ay) * damp;
      VX[i] = vx; VY[i] = vy;
      X[i] += vx; Y[i] += vy;
      const v2 = vx * vx + vy * vy + ax * ax + ay * ay;
      if (v2 > maxV) maxV = v2;
    }
    return maxV;
  }

  function drawMosaic() {
    const { d } = S.size(mc, 1.25);
    mx.setTransform(d, 0, 0, d, 0, 0);
    mx.clearRect(0, 0, cw, ch);
    mx.globalCompositeOperation = 'lighter';
    mx.lineWidth = 1.2;
    const s = step - 2, g = S.glitch;
    const sphere = mode === 'sphere';
    const passes = sphere ? 2 : 1;
    for (let b = 0; b < buckets.length; b++) {
      const idx = buckets[b];
      if (!idx.length) continue;
      mx.strokeStyle = PAL[b];
      for (let pass = 0; pass < passes; pass++) {
        mx.beginPath();
        for (let j = 0; j < idx.length; j++) {
          const i = idx[j];
          if (sphere && (pass === 0) !== (Z[i] >= 0)) continue;
          const vx = VX[i], vy = VY[i];
          const sw = s + Math.abs(vx) * 1.3;
          const sh = s + Math.abs(vy) * 1.3 + ((i % 13 === 0) ? g * 34 : 0);
          mx.rect(X[i] - (vx > 0 ? sw - s : 0), Y[i] - (vy > 0 ? sh - s : 0), sw, sh);
        }
        mx.globalAlpha = sphere && pass === 1 ? 0.25 : 0.95;
        mx.stroke();
      }
    }
    mx.globalAlpha = 1;
    mx.globalCompositeOperation = 'source-over';
  }

  /* ---------- interação ---------- */
  let pressing = false, holdTimer = 0;
  const local = () => ({ x: S.mouse.x, y: S.mouse.y + scrollY - S.rect(hero).y });
  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button') || e.button > 0) return;
    pressing = true;
    wake();
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      if (!pressing) return;
      const p = local();
      scx = p.x; scy = p.y;
      mode = 'sphere';
      S.kick(0.4);
    }, 200);
  });
  hero.addEventListener('contextmenu', (e) => { if (mode === 'sphere') e.preventDefault(); });
  addEventListener('pointerup', () => {
    if (!pressing) return;
    pressing = false;
    clearTimeout(holdTimer);
    const p = local();
    if (mode === 'sphere') {
      mode = 'home';
      explode(scx, scy, 1.2, Infinity);
      S.staticBurst(160, 0.6);
      S.kick(0.9);
      S.shake && S.shake(5);
    } else {
      explode(p.x, p.y, 1, 300);
    }
  });

  // intro: os pixels se juntam numa esfera e explodem formando o nome
  S.onBoot(() => {
    if (!built) build();
    if (S.reduced) { for (let i = 0; i < N; i++) { X[i] = HX[i]; Y[i] = HY[i]; } wake(); return; }
    scx = cw / 2; scy = ch * 0.43;
    mode = 'sphere';
    wake(1500);
    setTimeout(() => {
      if (pressing) return;
      mode = 'home';
      explode(scx, scy, 1.3, Infinity);
      S.staticBurst(180, 0.7);
      S.kick(0.8);
    }, 1150);
  });

  /* ---------- loop ---------- */
  let acc = 0;
  const rebuild = () => { built = false; };
  addEventListener('resize', () => { clearTimeout(rebuild._t); rebuild._t = setTimeout(rebuild, 200); });
  if (document.fonts) document.fonts.ready.then(rebuild);

  S.loop((dt) => {
    if (!hero._vis || !S.booted) return;
    const rc = S.rect(hero);
    const p = local();
    const inside = S.mouse.active && p.y > 0 && p.y < rc.h;
    drawHolo(p.x, p.y, rc.w, rc.h);

    S.size(mc, 1.25);
    if (!built || cw !== mc._w || ch !== mc._h) build();
    if (!N) return;

    const now = performance.now();
    const moving = inside && S.mouse.speed > 20;
    const busy = moving || mode === 'sphere' || pressing || now < awakeUntil || S.glitch > 0.05;
    if (busy) asleep = false;
    if (asleep) return;

    acc += dt;
    let n = 0, maxV = 0;
    while (acc >= 16.67 && n < 3) { maxV = Math.max(maxV, physics(p.x, p.y, inside)); acc -= 16.67; n++; }
    if (n === 3) acc = 0;
    if (!busy && maxV < 0.003) { asleep = true; drawMosaic(); return; }

    // assentando sem interação: desenha a 30 fps
    frameN++;
    if (!busy && (frameN & 1)) return;
    drawMosaic();
  });
})();
