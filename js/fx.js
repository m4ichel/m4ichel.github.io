/* =========================================================
   fx.js — camadas globais de efeito
   · canvas #fx (rachaduras de tela + caixas do cursor)
   · poucas barras de glitch (blend "difference") só em movimentos bem rápidos
   · estática de TV entre canais e quando o cursor some
   Camadas com blend ficam em display:none enquanto não são usadas.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  const root = document.documentElement;
  const page = S.$('#page');

  const fx = S.$('#fx'), fctx = fx.getContext('2d');
  const gc = S.$('#glitch'), gx = gc.getContext('2d');
  let W = innerWidth, H = innerHeight, D = 1;
  function resize() {
    D = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    fx.width = Math.round(W * D); fx.height = Math.round(H * D);
    gc.width = Math.ceil(W / 3); gc.height = Math.ceil(H / 3);
    fxForce = true;
  }
  let fxForce = true;
  resize();
  addEventListener('resize', resize);

  /* ---------- canvas #fx: só limpa/redesenha quando alguma camada mudou ---------- */
  let fxDrawn = false;
  S.loop((dt) => {
    if (!S.fx) {
      if (fxDrawn) { fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fx.width, fx.height); fxDrawn = false; }
      return;
    }
    let changed = fxForce;
    for (const l of S.fxLayers) if (l.update(dt)) changed = true;
    if (!changed) return;
    fxForce = false;
    fctx.setTransform(1, 0, 0, 1, 0, 0);
    fctx.clearRect(0, 0, fx.width, fx.height);
    fctx.setTransform(D, 0, 0, D, 0, 0);
    for (const l of S.fxLayers) l.draw(fctx, W, H);
    fxDrawn = true;
  });
  addEventListener('lmp:fx', () => { fxForce = true; });

  /* ---------- barras de glitch ---------- */
  // discretas: só acima de um glitch forte, no máximo ~4 barras finas,
  // e trocam de lugar a cada 3 quadros (piscam bem menos)
  const GCOL = ['#ff2bd6', '#4fd8ff'];
  let gOn = false, gFrame = 0;
  S.loop(() => {
    const g = S.glitch;
    const want = g > 0.3 && S.fx;
    if (want !== gOn) {
      gc.style.display = want ? 'block' : 'none';
      gOn = want;
      if (!want) gx.clearRect(0, 0, gc.width, gc.height);
    }
    if (!want || (gFrame++ % 3)) return;
    const w = gc.width, h = gc.height;
    gx.clearRect(0, 0, w, h);
    const n = Math.round((g - 0.3) * 6);
    for (let i = 0; i < n; i++) {
      gx.globalAlpha = S.rand(0.12, 0.35) * g;
      gx.fillStyle = S.pick(GCOL);
      gx.fillRect(S.rand(0, w * 0.8), Math.random() * h, S.rand(8, 20 + w * 0.25 * g), S.rand(1, 1 + g * 3));
    }
    gx.globalAlpha = 1;
  });

  /* ---------- estática de TV (inspiração: 5.gif) ---------- */
  const sc = S.$('#static'), sx = sc.getContext('2d');
  const SW = 160, SH = 96;
  sc.width = SW; sc.height = SH;
  const img = sx.createImageData(SW, SH);
  const px = img.data;
  let until = 0, strength = 0, hold = 0, scOn = false;
  S.staticBurst = (ms = 240, s = 0.85) => {
    if (!S.fx || S.reduced) return;
    const now = performance.now();
    strength = now < until ? Math.max(strength, s) : s;
    until = Math.max(until, now + ms);
  };
  S.loop(() => {
    const now = performance.now();
    if (hold && S.mouse.active) {
      hold = 0;
      root.classList.remove('nosignal');
      S.staticBurst(260, 0.9);
    }
    const on = S.fx && (now < until || hold > 0);
    if (!on) {
      if (scOn) { sc.style.display = 'none'; scOn = false; }
      return;
    }
    if (!scOn) { sc.style.display = 'block'; scOn = true; }
    const band = (now * 0.05) % SH;
    for (let y = 0; y < SH; y++) {
      const dark = Math.abs(y - band) < 7 ? 0.3 : 1;
      let run = 0, v = 0;
      for (let x = 0; x < SW; x++) {
        if (run-- <= 0) { v = Math.random(); run = (Math.random() * 7) | 0; }
        const k = (y * SW + x) * 4, w3 = v * v * v;
        px[k] = (70 + 185 * v) * dark;
        px[k + 1] = (10 + 235 * w3) * dark;
        px[k + 2] = (110 + 145 * v * v) * dark;
        px[k + 3] = 255;
      }
    }
    sx.putImageData(img, 0, 0);
    const fade = now < until ? strength * Math.min(1, (until - now) / 120 + 0.35) : 0;
    sc.style.opacity = Math.max(fade, hold).toFixed(2);
  });

  // "sem sinal" quando o cursor sai da janela
  let nsT = 0;
  addEventListener('lmp:mouseleave', () => {
    if (!S.fine) return;
    clearTimeout(nsT);
    nsT = setTimeout(() => {
      if (!S.mouse.active && S.fx && !S.reduced) { hold = 0.28; root.classList.add('nosignal'); }
    }, 700);
  });

  /* ---------- tremida ---------- */
  function shake(p) {
    if (S.reduced || !page.animate) return;
    page.animate([
      { transform: 'translate(0,0)' },
      { transform: `translate(${-p}px, ${p * 0.5}px)` },
      { transform: `translate(${p * 0.8}px, ${-p * 0.6}px)` },
      { transform: 'translate(0,0)' },
    ], { duration: 240, easing: 'steps(4)' });
  }
  S.shake = shake;

  /* ---------- rachaduras (inspiração: 8.jpg e "bell-curve") ---------- */
  const cracks = [];
  const LCD = ['#ff2bd6', '#4fd8ff', '#7dffc8', '#ffffff', '#ff1f4b', '#ffd23f', '#3d6bff'];
  function branch(x, y, a, len, depth, out) {
    const pts = [x, y];
    let l = 0;
    while (l < len) {
      const seg = S.rand(9, 30);
      a += S.rand(-0.3, 0.3);
      x += Math.cos(a) * seg; y += Math.sin(a) * seg; l += seg;
      pts.push(x, y);
      if (depth < 2 && Math.random() < 0.09) branch(x, y, a + S.rand(-1.1, 1.1), (len - l) * S.rand(0.3, 0.6), depth + 1, out);
    }
    out.push({ pts, w: depth, rgb: depth === 0 && Math.random() < 0.45 });
  }
  S.crack = (x, y, power = 1) => {
    if (!S.fx) return;
    const rays = [], rings = [], lcd = [], blot = [];
    const n = 9 + ((Math.random() * 8) | 0), base = Math.random() * 6.283;
    for (let i = 0; i < n; i++) {
      const a = base + (i / n) * 6.283 + S.rand(-0.22, 0.22);
      branch(x + Math.cos(a) * 5, y + Math.sin(a) * 5, a, S.rand(140, 620) * power, 0, rays);
    }
    for (const rr of [S.rand(22, 36), S.rand(60, 100), S.rand(130, 200)]) {
      let seg = [];
      const k = 12 + ((Math.random() * 10) | 0);
      for (let i = 0; i <= k; i++) {
        if (Math.random() < 0.28) { if (seg.length >= 4) rings.push(seg); seg = []; continue; }
        const a = base + (i / k) * 6.283, r2 = rr * power * S.rand(0.85, 1.15);
        seg.push(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      }
      if (seg.length >= 4) rings.push(seg);
    }
    const nl = 2 + ((Math.random() * 5) | 0);
    for (let i = 0; i < nl; i++) {
      const vert = Math.random() < 0.78;
      lcd.push({ vert, p: vert ? x + S.rand(-160, 160) : y + S.rand(-90, 90), w: S.rand(1, 4), c: S.pick(LCD), a: S.rand(0.35, 0.85) });
    }
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * 6.283, rr = Math.pow(Math.random(), 0.7) * 24 * power;
      blot.push(Math.round((x + Math.cos(a) * rr) / 4) * 4, Math.round((y + Math.sin(a) * rr) / 4) * 4);
    }
    cracks.push({ rays, rings, lcd, blot, born: performance.now(), life: 3200, a: 1, flick: 1 });
    if (cracks.length > 6) cracks.shift();
    S.kick(0.75);
    S.staticBurst(110, 0.45);
    shake(6);
  };

  const poly = (c, p, ox, oy) => {
    c.moveTo(p[0] + ox, p[1] + oy);
    for (let i = 2; i < p.length; i += 2) c.lineTo(p[i] + ox, p[i + 1] + oy);
  };
  const RGB = ['#ff2b4a', '#2bff9a', '#3d6bff'];
  let hadCracks = false;
  S.fxLayers.push({
    update() {
      const now = performance.now();
      for (let i = cracks.length - 1; i >= 0; i--) {
        const k = cracks[i], age = now - k.born;
        if (age > k.life) { cracks.splice(i, 1); continue; }
        const fadeStart = k.life - 1000;
        k.a = age < fadeStart ? 1 : (k.life - age) / 1000;
        if (age > fadeStart && Math.random() < 0.25) k.a *= 0.25;
        k.flick = S.rand(0.75, 1);
      }
      const changed = cracks.length > 0 || hadCracks;
      hadCracks = cracks.length > 0;
      return changed;
    },
    draw(c, W, H) {
      if (!cracks.length) return;
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const k of cracks) {
        const a = k.a;
        // linhas de LCD queimado + franjas RGB de subpixel
        c.globalCompositeOperation = 'lighter';
        for (const L of k.lcd) {
          c.globalAlpha = L.a * a * k.flick;
          c.fillStyle = L.c;
          if (L.vert) c.fillRect(L.p, 0, L.w, H); else c.fillRect(0, L.p, W, L.w);
        }
        c.lineWidth = 1;
        for (let j = 0; j < 3; j++) {
          c.globalAlpha = 0.6 * a;
          c.strokeStyle = RGB[j];
          c.beginPath();
          for (const r of k.rays) if (r.rgb) poly(c, r.pts, (j - 1) * 2.2, (j - 1) * 0.6);
          c.stroke();
        }

        // vidro rachado: sombra escura + brilho deslocado
        c.globalCompositeOperation = 'source-over';
        c.globalAlpha = a;
        c.strokeStyle = 'rgba(0,0,0,.92)';
        for (let dpt = 0; dpt < 3; dpt++) {
          c.lineWidth = [3.6, 2.6, 1.8][dpt];
          c.beginPath();
          for (const r of k.rays) if (r.w === dpt) poly(c, r.pts, 0, 0);
          c.stroke();
        }
        c.lineWidth = 1.8;
        c.beginPath();
        for (const r of k.rings) poly(c, r, 0, 0);
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.8)';
        c.lineWidth = 0.8;
        c.beginPath();
        for (const r of k.rays) if (r.w < 2) poly(c, r.pts, 0.9, -0.7);
        c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.4)';
        c.lineWidth = 0.6;
        c.beginPath();
        for (const r of k.rings) poly(c, r, 0.8, -0.6);
        c.stroke();

        // pixels mortos no ponto de impacto
        c.fillStyle = '#000';
        for (let j = 0; j < k.blot.length; j += 2) c.fillRect(k.blot[j], k.blot[j + 1], 4, 4);
        c.fillStyle = '#ff2bd6';
        for (let j = 0; j < 14; j += 2) c.fillRect(k.blot[j] + 1, k.blot[j + 1] + 1, 2, 2);
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
    },
  });

  addEventListener('click', (e) => {
    if (!S.fx) return;
    if (e.target.closest('a, button, input, textarea, select, label, summary, [data-nocrack]')) return;
    if (S.mouse.drag > 10 || S.mouse.pressMs > 380) return;
    const sel = getSelection && getSelection();
    if (sel && String(sel).length) return;
    S.crack(e.clientX, e.clientY);
  });
})();
