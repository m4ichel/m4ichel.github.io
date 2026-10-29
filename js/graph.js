/* =========================================================
   graph.js — CH.03
   Grafo de força: tecnologias <-> projetos, com sobreposição de
   rastreamento estilo visão computacional (3.jpg): grade de
   "Life / ID", caixas de tracking, linhas convergindo ao cursor.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  const cv = S.$('#graph');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const tip = S.$('#graph-tip');
  S.watch(cv);

  const CAT = { lang: '#4fd8ff', infra: '#7dffc8', data: '#ff86e0', fund: '#ffd23f' };
  const CAT_NAME = {
    lang: ['linguagens & frameworks', 'languages & frameworks'], infra: ['dados & infraestrutura', 'data & infrastructure'],
    data: ['ciência de dados & otimização', 'data science & optimization'], fund: ['fundamentos', 'fundamentals'],
  };
  const SKILLS = [
    ['py', 'Python', 'lang'], ['java', 'Java', 'lang'], ['ts', 'TypeScript', 'lang'], ['js', 'JavaScript', 'lang'],
    ['sql', 'SQL', 'lang'], ['node', 'Node.js / Express', 'lang'], ['fastapi', 'FastAPI', 'lang'],
    ['spring', 'Spring Boot', 'lang'], ['next', 'Next.js / React', 'lang'],
    ['pg', 'PostgreSQL', 'infra'], ['docker', 'Docker', 'infra'], ['aws', 'AWS', 'infra'], ['tf', 'Terraform', 'infra'],
    ['rabbit', 'RabbitMQ', 'infra'], ['graf', 'Grafana / Prometheus', 'infra'], ['dynamo', 'DynamoDB', 'infra'], ['ecs', 'ECS Fargate', 'infra'],
    ['ml', 'Machine Learning', 'data'], ['eda', 'EDA', 'data'], ['fe', 'Feature Engineering', 'data'], ['pandas', 'Pandas / NumPy', 'data'],
    ['sk', 'Scikit-learn', 'data'], ['xgb', 'XGBoost', 'data'], ['shap', 'SHAP', 'data'], ['ortools', 'OR-Tools', 'data'],
    ['simplex', 'Simplex', 'data'], ['bnb', 'Branch & Bound', 'data'], ['kmeans', ['Clusterização', 'Clustering'], 'data'], ['streamlit', 'Streamlit', 'data'],
    ['algo', ['Algoritmos & ED', 'Algorithms & DS'], 'fund'], ['graphs', ['Teoria dos Grafos', 'Graph Theory'], 'fund'], ['lp', ['Programação Linear', 'Linear Programming'], 'fund'],
    ['scrum', 'Scrum / Agile', 'fund'], ['git', 'Git / GitHub', 'fund'], ['junit', ['JUnit / Testes', 'JUnit / Testing'], 'fund'],
  ];
  const PROJECTS = [
    ['pan', 'BANCO PAN', 'p-pan', ['py', 'fastapi', 'ortools', 'sk', 'rabbit', 'pg', 'next', 'docker', 'simplex', 'bnb', 'kmeans', 'lp']],
    ['globo', 'GLOBOPLAY', 'p-globo', ['ts', 'node', 'next', 'aws', 'dynamo', 'ecs', 'tf', 'graf']],
    ['suzano', 'SUZANO', 'p-suzano', ['java', 'spring', 'next', 'graphs', 'junit', 'algo', 'lp']],
    ['fadel', 'FADEL', 'p-fadel', ['py', 'pandas', 'sk', 'xgb', 'shap', 'streamlit', 'eda', 'fe', 'ml']],
  ];
  const EXTRA = [['js', 'ts'], ['sql', 'pg'], ['git', 'scrum'], ['ml', 'sk'], ['dynamo', 'aws'], ['ecs', 'aws'], ['docker', 'ecs'], ['lp', 'simplex'], ['algo', 'graphs'], ['me', 'scrum'], ['me', 'git'], ['me', 'algo']];

  const nodes = [], byId = {}, edges = [];
  // IDs em hexadecimal: números de 4 dígitos pareciam anos
  const add = (n) => {
    const i = nodes.length;
    const code = '0x' + ((i * 37 + 0x1b) & 255).toString(16).toUpperCase().padStart(2, '0');
    Object.assign(n, { x: 0, y: 0, vx: 0, vy: 0, uid: i, code, uses: [], nb: new Set() });
    nodes.push(n); byId[n.id] = n;
  };
  add({ id: 'me', label: 'LUCAS', kind: 'core' });
  // rótulo [pt, en] quando muda com o idioma
  const tr = (l) => (Array.isArray(l) ? S.t(l[0], l[1]) : l);
  SKILLS.forEach(([id, label, cat]) => add({ id, labels: label, label: tr(label), cat, kind: 'skill' }));
  addEventListener('lmp:lang', () => nodes.forEach((n) => { if (n.labels) n.label = tr(n.labels); n.tw = 0; }));
  PROJECTS.forEach(([id, label, target]) => add({ id, label, target, kind: 'proj' }));
  const link = (a, b, L) => {
    const A = byId[a], B = byId[b];
    if (!A || !B) return;
    edges.push({ a: A, b: B, L });
    A.nb.add(B); B.nb.add(A);
  };
  PROJECTS.forEach(([id, label, , sk]) => {
    link('me', id, 170);
    sk.forEach((s) => { link(id, s, 105); byId[s].uses.push(label); });
  });
  EXTRA.forEach(([a, b]) => link(a, b, 80));

  let W = 0, H = 0, placed = false;
  function place() {
    nodes.forEach((n, i) => {
      const a = (i / nodes.length) * 6.283;
      n.x = W / 2 + Math.cos(a) * W * 0.3 + S.rand(-20, 20);
      n.y = H / 2 + Math.sin(a) * H * 0.3 + S.rand(-20, 20);
    });
    PROJECTS.forEach(([id], i) => {
      const n = byId[id];
      n.x = W * (0.2 + 0.2 * i); n.y = H * (i % 2 ? 0.35 : 0.65);
    });
    byId.me.x = W / 2; byId.me.y = H / 2;
    placed = true;
  }

  /* ---------- interação ---------- */
  const mouse = { x: -999, y: -999, in: false };
  let hover = null, drag = null, filter = null, focusSkill = null;
  const sparks = [];

  function hit(x, y) {
    let best = null, bd = Infinity;
    for (const n of nodes) {
      const r = n.kind === 'skill' ? Math.max(18, n.tw / 2 + 6) : n.kind === 'proj' ? 36 : 30;
      const dx = x - n.x, dy = y - n.y;
      const inside = n.kind === 'skill' ? Math.abs(dx) < r && Math.abs(dy) < 13 : dx * dx + dy * dy < r * r;
      if (!inside) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  const localXY = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointermove', (e) => {
    [mouse.x, mouse.y] = localXY(e);
    mouse.in = true;
    if (drag) { drag.n.x = mouse.x + drag.ox; drag.n.y = mouse.y + drag.oy; drag.n.vx = 0; drag.n.vy = 0; drag.moved += 1; }
    else hover = hit(mouse.x, mouse.y);
  });
  cv.addEventListener('pointerleave', () => { mouse.in = false; if (!drag) hover = null; });
  cv.addEventListener('pointerdown', (e) => {
    [mouse.x, mouse.y] = localXY(e);
    const n = hit(mouse.x, mouse.y);
    if (!n) return;
    drag = { n, ox: n.x - mouse.x, oy: n.y - mouse.y, moved: 0 };
    cv.setPointerCapture(e.pointerId);
    burst(n.x, n.y);
  });
  const release = () => {
    if (!drag) return;
    const n = drag.n;
    if (drag.moved < 4 && n.kind === 'proj') {
      const el = document.getElementById(n.target);
      if (el) {
        el.scrollIntoView({ behavior: S.reduced ? 'auto' : 'smooth', block: 'center' });
        el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      }
    }
    drag = null;
  };
  cv.addEventListener('pointerup', release);
  cv.addEventListener('pointercancel', release);

  S.$$('.legend .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filter = filter === chip.dataset.cat ? null : chip.dataset.cat;
      S.$$('.legend .chip').forEach((c) => c.classList.toggle('on', c.dataset.cat === filter));
      nodes.forEach((n) => { if (n.cat === filter) burst(n.x, n.y); });
    });
  });
  S.$$('.skill-cols .tag[data-skill]').forEach((tag) => {
    tag.addEventListener('pointerenter', () => { focusSkill = byId[tag.dataset.skill] || null; if (focusSkill) burst(focusSkill.x, focusSkill.y); });
    tag.addEventListener('pointerleave', () => { focusSkill = null; });
  });

  function burst(x, y) { sparks.push({ x, y, t: 0, rays: 10 + ((Math.random() * 8) | 0), rot: Math.random() * 6.28 }); }

  /* ---------- física ---------- */
  function physics() {
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = nodes[j];
        let dx = a.x - b.x, dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
        const big = (a.kind !== 'skill' ? 2.2 : 1) * (b.kind !== 'skill' ? 2.2 : 1);
        const f = Math.min(4, (2600 * big) / d2);
        const d = Math.sqrt(d2);
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
    }
    for (const e of edges) {
      const dx = e.b.x - e.a.x, dy = e.b.y - e.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - e.L) * 0.0035;
      e.a.vx += (dx / d) * f; e.a.vy += (dy / d) * f;
      e.b.vx -= (dx / d) * f; e.b.vy -= (dy / d) * f;
    }
    for (const nd of nodes) {
      nd.vx += (W / 2 - nd.x) * 0.0007;
      nd.vy += (H / 2 - nd.y) * 0.0022;
      if (mouse.in && !drag) {
        const dx = nd.x - mouse.x, dy = nd.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 9000 && nd !== hover) { const d = Math.sqrt(d2) + 0.1; nd.vx += (dx / d) * 0.35; nd.vy += (dy / d) * 0.35; }
      }
      nd.vx *= 0.84; nd.vy *= 0.84;
      if (drag && drag.n === nd) continue;
      nd.x += nd.vx; nd.y += nd.vy;
      const m = 40, mxx = nd.kind === 'skill' ? (nd.tw || 60) / 2 + 14 : 50;
      if (nd.x < mxx) { nd.x = mxx; nd.vx *= -0.5; }
      if (nd.x > W - mxx) { nd.x = W - mxx; nd.vx *= -0.5; }
      if (nd.y < m) { nd.y = m; nd.vy *= -0.5; }
      if (nd.y > H - m) { nd.y = H - m; nd.vy *= -0.5; }
    }
  }

  /* ---------- desenho ---------- */
  function bracket(x, y, w, h, s, col) {
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + s); ctx.lineTo(x, y); ctx.lineTo(x + s, y);
    ctx.moveTo(x + w - s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + s);
    ctx.moveTo(x + w, y + h - s); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - s, y + h);
    ctx.moveTo(x + s, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - s);
    ctx.stroke();
  }

  function draw(t) {
    const mx = mouse.in ? mouse.x : -9999, my = mouse.in ? mouse.y : -9999;
    const focus = drag ? drag.n : hover || focusSkill;
    ctx.clearRect(0, 0, W, H);

    // grade de rótulos "Life / ID": a versão apagada vem pronta do cache,
    // só as células perto do cursor são reescritas
    if (gridCv) ctx.drawImage(gridCv, 0, 0, W, H);
    if (mouse.in) {
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textBaseline = 'alphabetic';
      let gid = 0;
      for (let y = GY * 0.5; y < H; y += GY) {
        for (let x = 24; x < W; x += GX) {
          gid++;
          const dist = Math.hypot(x - mx, y - my);
          if (dist >= 280) continue;
          const near = 1 - dist / 280;
          ctx.clearRect(x - 2, y - 11, 86, 27);
          ctx.fillStyle = `rgba(205,212,255,${0.09 + near * 0.6})`;
          ctx.fillText('Life:' + (dist / 220).toFixed(3), x, y);
          ctx.fillText('ID: ' + gid, x, y + 12);
          ctx.strokeStyle = `rgba(205,212,255,${near * 0.22})`;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(x + GX, y + GY);
          ctx.moveTo(x, y); ctx.lineTo(x + GX, y - GY);
          ctx.stroke();
        }
      }
    }

    // arestas
    for (const e of edges) {
      const hot = focus && (e.a === focus || e.b === focus);
      const cat = filter && (e.a.cat === filter || e.b.cat === filter);
      const a = hot ? 0.85 : cat ? 0.45 : focus || filter ? 0.05 : 0.14;
      ctx.strokeStyle = hot ? '#ffffff' : cat ? CAT[filter] : `rgba(200,205,255,1)`;
      ctx.globalAlpha = a;
      ctx.lineWidth = hot ? 1.2 : 1;
      ctx.beginPath(); ctx.moveTo(e.a.x, e.a.y); ctx.lineTo(e.b.x, e.b.y); ctx.stroke();
      if (hot) {
        const p = (t * 0.6 + (e.a.uid % 10) / 10) % 1;
        const from = e.a === focus ? e.a : e.b, to = e.a === focus ? e.b : e.a;
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff2bd6';
        ctx.fillRect(from.x + (to.x - from.x) * p - 2, from.y + (to.y - from.y) * p - 2, 4, 4);
      }
    }
    ctx.globalAlpha = 1;

    // nós
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const n of nodes) {
      const dim = (focus && n !== focus && !focus.nb.has(n)) || (filter && n.cat !== filter && n.kind === 'skill');
      ctx.globalAlpha = dim ? 0.22 : 1;
      if (n.kind === 'skill') {
        ctx.font = '11px "JetBrains Mono", monospace';
        if (!n.tw) n.tw = ctx.measureText(n.label).width;
        const w = n.tw + 14, h = 20;
        ctx.fillStyle = 'rgba(6,5,11,.85)';
        ctx.fillRect(n.x - w / 2, n.y - h / 2, w, h);
        ctx.strokeStyle = n === focus ? '#fff' : CAT[n.cat];
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(n.x - w / 2) + 0.5, Math.round(n.y - h / 2) + 0.5, Math.round(w), h);
        ctx.fillStyle = n === focus ? '#fff' : CAT[n.cat];
        ctx.fillText(n.label, n.x, n.y + 0.5);
      } else {
        const r = n.kind === 'proj' ? 30 : 26;
        const g = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.4, r * 0.1, n.x, n.y, r);
        if (n.kind === 'proj') { g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(0.35, 'rgba(170,160,255,.75)'); g.addColorStop(1, 'rgba(61,107,255,.25)'); }
        else { g.addColorStop(0, '#fff'); g.addColorStop(0.4, 'rgba(255,134,224,.85)'); g.addColorStop(1, 'rgba(255,43,214,.25)'); }
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, 6.283); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.strokeRect(Math.round(n.x - r - 8) + 0.5, Math.round(n.y - r - 8) + 0.5, r * 2 + 16, r * 2 + 16);
        ctx.fillStyle = '#06050b';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(n.code, n.x, n.y);
        ctx.fillStyle = '#fff';
        ctx.font = '800 12px "Unbounded", sans-serif';
        ctx.fillText(n.label, n.x, n.y + r + 22);
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // rastreamento perto do cursor
    if (mouse.in) {
      const tracked = [];
      for (const n of nodes) {
        const d = Math.hypot(n.x - mx, n.y - my);
        if (d < 230) tracked.push([n, d]);
      }
      tracked.sort((a, b) => a[1] - b[1]);
      ctx.lineWidth = 1;
      ctx.font = '9px "JetBrains Mono", monospace';
      tracked.slice(0, 9).forEach(([n, d], i) => {
        const conf = (1 - d / 260).toFixed(2);
        const s = n.kind === 'skill' ? (n.tw || 40) / 2 + 12 : 46;
        const hh = n.kind === 'skill' ? 16 : 46;
        ctx.strokeStyle = `rgba(255,255,255,${0.75 - i * 0.06})`;
        ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(n.x, n.y); ctx.stroke();
        bracket(n.x - s, n.y - hh, s * 2, hh * 2, 6, i === 0 ? '#4fd8ff' : 'rgba(255,255,255,.7)');
        ctx.fillStyle = i === 0 ? '#4fd8ff' : 'rgba(255,255,255,.7)';
        ctx.fillText(`ID:${n.code} · ${conf}`, n.x - s, n.y - hh - 4);
        if (i > 0) {
          const p = tracked[i - 1][0];
          ctx.strokeStyle = 'rgba(255,43,214,.35)';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(n.x, n.y); ctx.stroke();
        }
      });
      if (tracked.length && Math.random() < 0.04) { const n = S.pick(tracked)[0]; burst(n.x, n.y); }
      ctx.fillStyle = 'rgba(255,255,255,.75)';
      ctx.fillText(`TRACKING ${String(Math.min(9, tracked.length)).padStart(2, '0')} OBJ`, mx + 14, my + 22);
    }

    // brilhos (as "estrelinhas" do 3.jpg)
    for (let i = sparks.length - 1; i >= 0; i--) {
      const sp = sparks[i];
      sp.t += 0.045;
      if (sp.t >= 1) { sparks.splice(i, 1); continue; }
      ctx.strokeStyle = `rgba(255,255,255,${1 - sp.t})`;
      ctx.beginPath();
      for (let k = 0; k < sp.rays; k++) {
        const a = sp.rot + (k / sp.rays) * 6.283;
        const r0 = 4 + sp.t * 10, r1 = r0 + 6 + (k % 3) * 6 * (1 - sp.t);
        ctx.moveTo(sp.x + Math.cos(a) * r0, sp.y + Math.sin(a) * r0);
        ctx.lineTo(sp.x + Math.cos(a) * r1, sp.y + Math.sin(a) * r1);
      }
      ctx.stroke();
    }

    // tooltip
    if (focus && (hover || drag)) {
      const lines = focus.kind === 'skill'
        ? `<b>${focus.label}</b>${tr(CAT_NAME[focus.cat])}<br>${focus.uses.length ? S.t('usado em: ', 'used in: ') + focus.uses.join(', ').toLowerCase() : S.t('fundamento do dia a dia', 'everyday fundamental')}`
        : focus.kind === 'proj'
          ? `<b>${focus.label}</b>${focus.nb.size - 1} ${S.t('tecnologias conectadas<br>clique para abrir o projeto', 'connected technologies<br>click to open the project')}`
          : `<b>LUCAS</b>${S.t('o nó central deste grafo', 'the central node of this graph')}`;
      if (tip._html !== lines) { tip.innerHTML = lines; tip._html = lines; }
      const tx = Math.min(W - 270, focus.x + 30), ty = Math.max(10, focus.y - 80);
      tip.style.transform = `translate(${tx}px, ${ty}px)`;
      tip.classList.add('show');
    } else tip.classList.remove('show');
  }

  const GX = 118, GY = 92;
  let gridCv = null;
  function buildGrid(w, h, d) {
    gridCv = document.createElement('canvas');
    gridCv.width = Math.round(w * d); gridCv.height = Math.round(h * d);
    const g = gridCv.getContext('2d');
    g.scale(d, d);
    g.font = '10px "JetBrains Mono", monospace';
    g.fillStyle = 'rgba(205,212,255,.09)';
    let gid = 0;
    for (let y = GY * 0.5; y < h; y += GY) {
      for (let x = 24; x < w; x += GX) {
        gid++;
        g.fillText('Life:' + (4 + Math.sin(gid * 1.7) * 0.4).toFixed(3), x, y);
        g.fillText('ID: ' + gid, x, y + 12);
      }
    }
  }
  if (document.fonts) document.fonts.ready.then(() => { if (W) buildGrid(W, H, cv._d || 1); });

  let acc = 0;
  const thr = {};
  S.loop((dt) => {
    if (!cv._vis) return;
    const { w, h, d, changed } = S.size(cv, 2);
    if (!w || !h) return;
    W = w; H = h;
    if (!placed) place();
    if (changed || !gridCv) {
      nodes.forEach((n) => { n.x = S.clamp(n.x, 40, W - 40); n.y = S.clamp(n.y, 40, H - 40); });
      buildGrid(w, h, d);
    }
    // sem ninguém mexendo: 30 fps
    const el = S.throttle(thr, dt, mouse.in || !!drag || !!focusSkill || sparks.length > 0);
    if (!el) return;
    acc += el;
    let k = 0;
    while (acc >= 16.67 && k < 3) { physics(); acc -= 16.67; k++; }
    if (k === 3) acc = 0;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    draw(S.time);
  });
})();
