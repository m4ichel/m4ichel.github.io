/* =========================================================
   cursor.js — rastreamento em volta do cursor (inspiração: 1.jpg)
   O cursor é o normal do sistema; as palavras e os elementos
   mais próximos dele ganham caixas ciano que "travam" no alvo.
   Em links/botões aparece o rótulo grande em azul.
   Só redesenha quando o mouse, a rolagem ou uma animação mudam.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  if (!S.fine) return;

  /* ---------- alvos (coordenadas do documento) ---------- */
  const BOX_SEL = 'a, button, .chip, .tag, .h2, h3, .stat b, .medal, .kicker, .proj-meta, .card-tag, .list b, kbd';
  const WORD_SEL = '.lead, .proj p, .proj li, .term .line, .card p, .stat span, .badge p, .list span, .hero-role, .hero-tags, .legend-keys li';
  let anchors = [];
  let dirty = true, lastScan = 0, cover0 = 0, cover1 = 0;

  // varre só uma faixa em volta da tela (1 tela acima, 2 abaixo)
  function scan() {
    const out = [];
    const sx = scrollX, sy = scrollY, vh = innerHeight;
    const y0 = -vh, y1 = vh * 2;
    // a chave vem da posição: a mesma palavra mantém a caixa entre varreduras
    const push = (r, fixed) => {
      if (r.width < 3 || r.height < 3 || r.width > innerWidth * 0.9) return;
      const x = r.left + (fixed ? 0 : sx), y = r.top + (fixed ? 0 : sy);
      out.push({ x, y, w: r.width, h: r.height, fixed, id: `${x | 0}:${y | 0}:${r.width | 0}` });
    };
    S.$$(BOX_SEL).forEach((el) => {
      if (el.closest('#boot')) return;
      const r = el.getBoundingClientRect();
      const fixed = !!el.closest('.hud');
      if (!fixed && (r.bottom < y0 || r.top > y1)) return;
      push(r, fixed);
    });
    const range = document.createRange();
    S.$$(WORD_SEL).forEach((el) => {
      const er = el.getBoundingClientRect();
      if (er.bottom < y0 || er.top > y1 || !er.width) return;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.nodeValue;
        const re = /\S{3,}/g;
        let mm;
        while ((mm = re.exec(t))) {
          range.setStart(n, mm.index);
          range.setEnd(n, mm.index + mm[0].length);
          const rects = range.getClientRects();
          for (let i = 0; i < rects.length; i++) push(rects[i], false);
        }
      }
    });
    anchors = out;
    cover0 = sy + y0; cover1 = sy + y1;
    dirty = false;
    lastScan = performance.now();
  }
  const markDirty = () => { dirty = true; };
  addEventListener('resize', markDirty);
  addEventListener('lmp:layout', markDirty);
  if (document.fonts) document.fonts.ready.then(markDirty);

  /* ---------- seleção ---------- */
  const RADIUS = 130, KEEP = RADIUS * 1.3, MAX = 7;
  const boxes = new Map(); // id -> { a, t, out, fade, label, mark }
  const dist = (a, x, y) => {
    const ax = a.fixed ? a.x : a.x - scrollX, ay = a.fixed ? a.y : a.y - scrollY;
    const qx = x < ax ? ax : x > ax + a.w ? ax + a.w : x;
    const qy = y < ay ? ay : y > ay + a.h ? ay + a.h : y;
    return Math.hypot(qx - x, qy - y);
  };
  const near = [];
  function select(x, y) {
    near.length = 0;
    const sx = scrollX, sy = scrollY;
    for (const a of anchors) {
      const ax = a.fixed ? a.x : a.x - sx, ay = a.fixed ? a.y : a.y - sy;
      if (ax > x + KEEP || ax + a.w < x - KEEP || ay > y + KEEP || ay + a.h < y - KEEP) continue;
      const d = dist(a, x, y);
      const held = boxes.has(a.id) && !boxes.get(a.id).out;
      if (d < RADIUS || (held && d < KEEP)) near.push([d, a]);
    }
    near.sort((p, q) => p[0] - q[0]);
    const keep = new Set();
    for (let i = 0; i < near.length && i < MAX; i++) {
      const a = near[i][1];
      keep.add(a.id);
      const b = boxes.get(a.id);
      if (!b) {
        boxes.set(a.id, {
          a, t: 0, out: false, fade: 1,
          label: Math.random() < 0.4 ? '0x' + ((Math.random() * 0xffff) | 0).toString(16).padStart(4, '0') : '',
          mark: Math.random() < 0.18,
        });
      } else {
        b.a = a;
        if (b.out) { b.out = false; b.fade = 1; }
      }
    }
    for (const [id, b] of boxes) if (!keep.has(id)) b.out = true;
  }

  /* ---------- rótulo grande no hover de links ---------- */
  let hoverEl = null, hoverText = '', hoverAt = 0;
  const labelOf = (el) => (el.dataset.label || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 38);
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('a, button');
    if (t === hoverEl) return;
    hoverEl = t;
    if (t) {
      hoverText = labelOf(t);
      hoverAt = performance.now();
    }
    needs = true;
  });
  addEventListener('lmp:lang', () => { if (hoverEl) { hoverText = labelOf(hoverEl); needs = true; } });

  /* ---------- camada no canvas #fx ---------- */
  let lx = -1, ly = -1, lsx = -1, lsy = -1, wasActive = false, needs = false;
  S.fxLayers.push({
    update(dt) {
      const m = S.mouse;
      const active = m.active && !m.touch;
      let changed = needs;
      needs = false;
      if (active !== wasActive) { changed = true; wasActive = active; if (!active) for (const b of boxes.values()) b.out = true; }
      const moved = m.x !== lx || m.y !== ly || scrollX !== lsx || scrollY !== lsy;
      if (moved) {
        lx = m.x; ly = m.y; lsx = scrollX; lsy = scrollY;
        changed = true;
        const outside = scrollY < cover0 || scrollY + innerHeight > cover1;
        if ((dirty || outside) && performance.now() - lastScan > 350) scan();
        if (active) select(m.x, m.y);
      }
      for (const [id, b] of boxes) {
        if (b.out) {
          b.fade -= dt / 160;
          if (b.fade <= 0) boxes.delete(id);
          changed = true;
        } else if (b.t < 1) {
          b.t = Math.min(1, b.t + dt / 170);
          changed = true;
        }
      }
      if (hoverEl && performance.now() - hoverAt < 1000) changed = true;
      return changed;
    },
    draw(ctx, W, H) {
      if (!boxes.size && !hoverEl) return;
      const sx = scrollX, sy = scrollY;
      ctx.lineWidth = 1;
      ctx.font = '9px "JetBrains Mono", monospace';
      for (const b of boxes.values()) {
        const a = b.a;
        const x = a.fixed ? a.x : a.x - sx, y = a.fixed ? a.y : a.y - sy;
        const e = 1 - Math.pow(1 - b.t, 3);
        const pad = 2 + (1 - e) * 12;
        const al = e * b.fade;
        ctx.strokeStyle = `rgba(79,216,255,${0.85 * al})`;
        ctx.strokeRect(Math.round(x - pad) + 0.5, Math.round(y - pad) + 0.5, Math.round(a.w + pad * 2), Math.round(a.h + pad * 2));
        if (b.label) {
          ctx.fillStyle = `rgba(79,216,255,${0.8 * al})`;
          ctx.fillText(b.label, x - pad, y - pad - 3);
        }
        if (b.mark) {
          ctx.fillStyle = `rgba(255,43,214,${0.9 * al})`;
          ctx.fillRect(Math.round(x - pad) - 1, Math.round(y - pad) - 1, 4, 4);
        }
      }

      // rótulo grande azul (o "field guides to spiders ↗" do 1.jpg)
      const m = S.mouse;
      if (hoverEl && hoverText && m.active) {
        const tt = performance.now() - hoverAt;
        const n = Math.min(hoverText.length, Math.floor(tt / 18));
        let txt = hoverText.slice(0, n);
        for (let i = n; i < Math.min(hoverText.length, n + 4); i++) txt += S.glyph();
        const external = hoverEl.target === '_blank' || /^mailto:/.test(hoverEl.getAttribute('href') || '');
        if (external) txt += ' ↗';
        ctx.font = '600 24px "Unbounded", sans-serif';
        const tw = ctx.measureText(txt).width;
        let x = m.x - tw - 26, y = m.y + 52;
        if (x < 12) x = m.x + 26;
        if (y > H - 60) y = m.y - 34;
        ctx.fillStyle = 'rgba(6,5,11,.65)';
        ctx.fillRect(x - 6, y - 24, tw + 12, 32);
        ctx.fillStyle = '#5b8cff';
        ctx.fillText(txt, x, y);
      }
    },
  });
})();
