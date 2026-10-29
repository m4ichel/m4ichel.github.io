/* =========================================================
   contact.js — CH.06
   Wireframe com aberração cromática vermelho/azul (o gif de
   "error 404"): um contorno que se deforma, puxado pelo cursor,
   com leques de linhas que convergem para onde o mouse está.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;

  const copyBtn = S.$('#copy-email');
  if (copyBtn) copyBtn.addEventListener('click', () => S.copyEmail && S.copyEmail());

  const cv = S.$('#wire');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  S.watch(cv);

  const m = { x: 0, y: 0, in: false };
  cv.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    m.x = e.clientX - r.left; m.y = e.clientY - r.top; m.in = true;
  });
  cv.addEventListener('pointerleave', () => { m.in = false; });

  const NP = 150, NH = 40;
  const P = new Float32Array(NP * 2), H1 = new Float32Array(NH * 2), H2 = new Float32Array(NH * 2);

  function blob(out, n, cx, cy, R, t, seed, sx, sy, hub, pull) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.2832;
      const r = R * (0.64 + 0.2 * Math.sin(3 * a + t * 0.7 + seed) + 0.11 * Math.sin(5 * a - t * 1.1 + seed * 2) + 0.05 * Math.sin(11 * a + t * 1.9));
      let x = cx + Math.cos(a) * r * sx, y = cy + Math.sin(a) * r * sy;
      if (pull) {
        const dx = hub.x - x, dy = hub.y - y;
        const f = Math.exp(-(dx * dx + dy * dy) / (2 * 120 * 120)) * pull;
        x += dx * f; y += dy * f;
      }
      out[i * 2] = x; out[i * 2 + 1] = y;
    }
  }
  const closed = (c, arr, n) => {
    c.moveTo(arr[0], arr[1]);
    for (let i = 1; i < n; i++) c.lineTo(arr[i * 2], arr[i * 2 + 1]);
    c.closePath();
  };

  function scene(c, w, h, hub) {
    const mg = 18, b = 12;
    c.lineWidth = 1.6;
    c.setLineDash([]);
    c.beginPath();
    c.moveTo(mg, mg);
    c.quadraticCurveTo(w / 2, mg - b, w - mg, mg);
    c.quadraticCurveTo(w - mg + b, h / 2, w - mg, h - mg);
    c.quadraticCurveTo(w / 2, h - mg + b, mg, h - mg);
    c.quadraticCurveTo(mg - b, h / 2, mg, mg);
    c.stroke();

    c.beginPath();
    closed(c, P, NP); closed(c, H1, NH); closed(c, H2, NH);
    c.stroke();

    const corners = [[mg, mg], [w - mg, mg], [w - mg, h - mg], [mg, h - mg]];
    c.lineWidth = 1;
    c.setLineDash([1.5, 3]);
    c.beginPath();
    for (let i = 0; i < NP; i += 3) { c.moveTo(P[i * 2], P[i * 2 + 1]); c.lineTo(hub.x, hub.y); }
    for (let i = 0; i < NP; i += 5) {
      const x = P[i * 2], y = P[i * 2 + 1];
      let best = corners[0], bd = Infinity;
      for (const k of corners) { const d = (k[0] - x) ** 2 + (k[1] - y) ** 2; if (d < bd) { bd = d; best = k; } }
      c.moveTo(x, y); c.lineTo(best[0], best[1]);
    }
    for (let i = 0; i < NP; i += 7) {
      const j = (i + Math.floor(NP * 0.38)) % NP;
      c.moveTo(P[i * 2], P[i * 2 + 1]); c.lineTo(P[j * 2], P[j * 2 + 1]);
    }
    for (let i = 0; i < NH; i += 4) { c.moveTo(H1[i * 2], H1[i * 2 + 1]); c.lineTo(hub.x, hub.y); }
    c.stroke();
    c.setLineDash([]);
  }

  const thr = {};
  S.loop((dt, t) => {
    if (!cv._vis) return;
    if (!S.throttle(thr, dt, m.in)) return;
    const { w, h, d } = S.size(cv, 1.5);
    if (!w || !h) return;
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.34;
    const hub = m.in ? { x: m.x, y: m.y } : { x: cx + Math.cos(t * 0.4) * w * 0.3, y: cy + Math.sin(t * 0.55) * h * 0.28 };
    blob(P, NP, cx, cy, R, t, 0, 1, 1.08, hub, m.in ? 0.55 : 0.25);
    blob(H1, NH, cx + R * 0.28, cy - R * 0.18, R * 0.2, t * 1.3, 2, 1, 1, hub, 0.3);
    blob(H2, NH, cx - R * 0.24, cy + R * 0.3, R * 0.13, t * 1.6, 4, 1, 1, hub, 0.3);

    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#12071a';
    ctx.fillRect(10, 10, w - 20, h - 20);

    const ox = (m.in ? (m.x - cx) / w : Math.sin(t * 0.5) * 0.5) * 10 + S.glitch * 14;
    const oy = (m.in ? (m.y - cy) / h : Math.cos(t * 0.4) * 0.5) * 5;
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(255,43,94,.85)';
    ctx.save(); ctx.translate(ox, oy); scene(ctx, w, h, hub); ctx.restore();
    ctx.strokeStyle = 'rgba(61,155,255,.85)';
    ctx.save(); ctx.translate(-ox, -oy); scene(ctx, w, h, hub); ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    if (m.in) {
      ctx.fillStyle = '#fff';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(`HUB (${Math.round(m.x)}, ${Math.round(m.y)})`, m.x + 12, m.y - 10);
    }
  });
})();
