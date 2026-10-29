/* =========================================================
   melt.js — CH.05
   Título "FORMAÇÃO" em listras de pixel sort (6.jpg).
   Onde o cursor passa, cada coluna de pixels escorre para baixo
   e depois se recompõe aos poucos.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;

  // progresso do curso (jan/2025 → dez/2028)
  const pctEl = S.$('#edu-pct'), barEl = S.$('#edu-bar');
  if (pctEl && barEl) {
    const a = new Date(2025, 0, 1).getTime(), b = new Date(2028, 11, 31).getTime();
    const pct = S.clamp((Date.now() - a) / (b - a), 0, 1);
    const showPct = () => { pctEl.textContent = `${S.t('progresso', 'progress')} ${Math.round(pct * 100)}%`; };
    showPct();
    addEventListener('lmp:lang', showPct);
    new IntersectionObserver((es, io) => {
      if (!es[0].isIntersecting) return;
      io.disconnect();
      barEl.style.width = (pct * 100).toFixed(1) + '%';
    }, { threshold: 0.5 }).observe(barEl);
  }

  const cv = S.$('#melt');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  S.watch(cv);

  const CW = 3;
  const STRIPES = ['#ffffff', '#ff3fd8', '#4fd8ff', '#ffd23f', '#c9c4e4', '#7dffc8', '#ff6a3d', '#8a85a8', '#ff86e0', '#3d6bff', '#ffffff'];
  let off = null, W = 0, H = 0, D = 1, cols = 0, len = null, start = null, mask = [];
  let built = false;

  function build(w, h, d) {
    W = w; H = h; D = d;
    off = document.createElement('canvas');
    off.width = Math.round(w * d); off.height = Math.round(h * d);
    const o = off.getContext('2d', { willReadFrequently: true });
    o.scale(d, d);
    const text = S.t('FORMAÇÃO', 'EDUCATION');
    const FONT = '"Unbounded", "Arial Black", sans-serif';
    o.font = `900 200px ${FONT}`;
    let fs = (200 * w * 0.94) / o.measureText(text).width;
    fs = Math.min(fs, h * 0.6);
    o.font = `900 ${fs}px ${FONT}`;
    o.textAlign = 'center';
    o.textBaseline = 'alphabetic';
    const base = fs * 1.05;
    o.fillStyle = '#fff';
    o.fillText(text, w / 2, base);
    o.globalCompositeOperation = 'source-atop';
    for (let x = 0; x < w;) {
      const sw = S.rand(1, 7);
      o.fillStyle = S.pick(STRIPES);
      o.fillRect(x, 0, sw, h);
      x += sw;
    }
    // blocos horizontais de "datamosh" dentro das letras
    for (let i = 0; i < 14; i++) {
      o.fillStyle = S.pick(STRIPES);
      o.globalAlpha = 0.5;
      o.fillRect(S.rand(0, w), S.rand(0, base), S.rand(20, 140), S.rand(2, 8));
    }
    o.globalAlpha = 1;
    const g = o.createLinearGradient(0, 0, 0, base);
    g.addColorStop(0, 'rgba(255,255,255,.2)');
    g.addColorStop(1, 'rgba(0,0,0,.35)');
    o.fillStyle = g;
    o.fillRect(0, 0, w, h);
    o.globalCompositeOperation = 'source-over';

    cols = Math.ceil(w / CW);
    len = new Float32Array(cols);
    start = new Float32Array(cols).fill(-1);
    const data = o.getImageData(0, 0, off.width, off.height).data;
    const hh = Math.floor(h);
    mask = [];
    for (let c = 0; c < cols; c++) {
      const arr = new Uint8Array(hh);
      const sx = Math.min(off.width - 1, Math.round((c * CW + CW / 2) * d));
      for (let y = 0; y < hh; y++) {
        const sy = Math.min(off.height - 1, Math.round(y * d));
        arr[y] = data[(sy * off.width + sx) * 4 + 3] > 100 ? 1 : 0;
      }
      mask.push(arr);
    }
    built = true;
  }

  const find = (c, y) => {
    const arr = mask[c];
    if (!arr) return -1;
    y = S.clamp(Math.round(y), 0, arr.length - 1);
    for (let k = y; k < arr.length; k++) if (arr[k]) return k;
    for (let k = y; k >= 0; k--) if (arr[k]) return k;
    return -1;
  };

  if (document.fonts) document.fonts.ready.then(() => { built = false; });
  addEventListener('lmp:lang', () => { built = false; });

  const thr = {};
  S.loop((dt) => {
    if (!cv._vis) return;
    const r = S.rect(cv);
    const mx = S.mouse.x - (r.x - scrollX), my = S.mouse.y - (r.y - scrollY);
    const inside = S.mouse.active && mx >= 0 && mx <= r.w && my >= 0 && my <= r.h;
    // sem o mouse em cima, 30 fps bastam para as goteiras
    if (!S.throttle(thr, dt, inside || S.glitch > 0.2)) return;
    const { w, h, d, changed } = S.size(cv, 1.5);
    if (!w || !h) return;
    if (changed || !built) build(w, h, d);
    const sp = S.mouse.speed;
    if (inside) {
      const rad = 70;
      const c0 = Math.max(0, Math.floor((mx - rad) / CW)), c1 = Math.min(cols - 1, Math.ceil((mx + rad) / CW));
      for (let c = c0; c <= c1; c++) {
        const f = 1 - Math.abs(c * CW - mx) / rad;
        if (f <= 0) continue;
        if (len[c] < 1) start[c] = find(c, my);
        if (start[c] < 0) continue;
        len[c] = Math.min(h - start[c], len[c] + f * (2.5 + sp * 0.012));
      }
    }
    // goteiras espontâneas para sugerir a interação
    if (Math.random() < 0.06) {
      const c = (Math.random() * cols) | 0;
      if (len[c] < 1) start[c] = find(c, S.rand(0, h * 0.5));
      if (start[c] >= 0) len[c] = Math.min(h - start[c], len[c] + S.rand(20, 90));
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    const g = S.glitch;
    if (g > 0.2) {
      // fatias deslocadas quando o mouse corre
      const n = 6;
      for (let i = 0; i < n; i++) {
        const y0 = Math.floor((i / n) * cv.height), hh = Math.ceil(cv.height / n);
        const dx = (Math.random() - 0.5) * g * 40 * D;
        ctx.drawImage(off, 0, y0, cv.width, hh, dx, y0, cv.width, hh);
      }
    } else ctx.drawImage(off, 0, 0);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    for (let c = 0; c < cols; c++) {
      const l = len[c];
      if (l > 0.5 && start[c] >= 0) {
        ctx.drawImage(off, c * CW * D, start[c] * D, CW * D, 1, c * CW, start[c], CW, l);
        len[c] = Math.max(0, l - 0.35 - l * 0.006);
      } else len[c] = 0;
    }
  });
})();
