/* =========================================================
   projects.js — CH.04
   Cada projeto tem um "monitor CRT" com uma simulação
   interativa do problema (dados fictícios, só ilustração):
   · pan    → k-means com centróides arrastáveis + limite por cluster
   · globo  → telemetria em 3 canais com detecção de anomalia (z-score)
   · suzano → grafo de estradas, Dijkstra até o foco de incêndio (cursor)
   · fadel  → superfície de risco de um modelo + barras estilo SHAP
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  const VIZ = {};
  const clamp = S.clamp;
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.283 * v); };
  const MONO = '"JetBrains Mono", monospace';
  const brl = (v) => 'R$ ' + Math.round(v).toLocaleString(S.locale());
  // t é o tempo nos frames, então a tradução aqui é tt
  const tt = S.t;
  const tr = (l) => (Array.isArray(l) ? tt(l[0], l[1]) : l);

  /* ================= BANCO PAN: k-means ================= */
  VIZ.pan = () => {
    const COLS = ['#ff3fd8', '#4fd8ff', '#ffd23f', '#7dffc8'];
    const pts = [], cents = [];
    const L = 46, R = 18, T = 64, B = 40;
    let drag = -1, hover = -1, W = 0, H = 0;
    const centers = [[0.22, 0.3], [0.72, 0.22], [0.3, 0.74], [0.76, 0.7]];
    for (let i = 0; i < 260; i++) {
      const c = centers[i % 4];
      pts.push({ x: clamp(c[0] + gauss() * 0.09, 0.03, 0.97), y: clamp(c[1] + gauss() * 0.09, 0.03, 0.97), k: 0, ph: Math.random() * 6.28 });
    }
    [[0.48, 0.5], [0.44, 0.42], [0.55, 0.58], [0.58, 0.46]].forEach(([x, y]) => cents.push({ x, y, n: 0 }));
    const px = (x) => L + x * (W - L - R), py = (y) => T + y * (H - T - B);
    const ix = (x) => clamp((x - L) / (W - L - R), 0, 1), iy = (y) => clamp((y - T) / (H - T - B), 0, 1);
    // eixo y: topo = risco alto
    const limit = (c) => 1500 + 19000 * Math.pow(c.x, 1.1) * Math.pow(c.y, 1.3);
    const risk = (c) => (1 - c.y) * 0.16 + 0.01;
    const nearest = (m) => {
      let best = -1, bd = 26 * 26;
      cents.forEach((c, i) => { const d = (px(c.x) - m.x) ** 2 + (py(c.y) - m.y) ** 2; if (d < bd) { bd = d; best = i; } });
      return best;
    };
    return {
      resize(w, h) { W = w; H = h; },
      move(m) { if (drag >= 0) { cents[drag].x = ix(m.x); cents[drag].y = iy(m.y); } else hover = nearest(m); },
      down(m) {
        drag = nearest(m);
        if (drag < 0) {
          let bi = 0, bd = Infinity;
          cents.forEach((c, i) => { const d = (px(c.x) - m.x) ** 2 + (py(c.y) - m.y) ** 2; if (d < bd) { bd = d; bi = i; } });
          drag = bi;
          cents[bi].x = ix(m.x); cents[bi].y = iy(m.y);
        }
      },
      up() { drag = -1; },
      frame(ctx, w, h, dt, m, t) {
        const sums = cents.map(() => [0, 0, 0]);
        for (const p of pts) {
          p.x = clamp(p.x + Math.sin(t * 0.6 + p.ph) * 0.0003, 0, 1);
          p.y = clamp(p.y + Math.cos(t * 0.5 + p.ph) * 0.0003, 0, 1);
          let bk = 0, bd = Infinity;
          for (let k = 0; k < cents.length; k++) { const d = (p.x - cents[k].x) ** 2 + (p.y - cents[k].y) ** 2; if (d < bd) { bd = d; bk = k; } }
          p.k = bk;
          sums[bk][0] += p.x; sums[bk][1] += p.y; sums[bk][2]++;
        }
        cents.forEach((c, k) => {
          c.n = sums[k][2];
          if (k !== drag && c.n) { c.x += (sums[k][0] / c.n - c.x) * 0.035; c.y += (sums[k][1] / c.n - c.y) * 0.035; }
        });

        ctx.fillStyle = '#07060d';
        ctx.fillRect(0, 0, w, h);
        // regiões de Voronoi em matriz de pontos
        const cell = 11;
        const paths = cents.map(() => []);
        for (let y = T; y < h - B; y += cell) {
          for (let x = L; x < w - R; x += cell) {
            const nx = ix(x), ny = iy(y);
            let bk = 0, bd = Infinity;
            for (let k = 0; k < cents.length; k++) { const d = (nx - cents[k].x) ** 2 + (ny - cents[k].y) ** 2; if (d < bd) { bd = d; bk = k; } }
            paths[bk].push(x, y);
          }
        }
        ctx.globalAlpha = 0.3;
        paths.forEach((p, k) => {
          ctx.fillStyle = COLS[k];
          ctx.beginPath();
          for (let i = 0; i < p.length; i += 2) ctx.rect(p[i] - 1, p[i + 1] - 1, 2, 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        // eixos
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, T - 8); ctx.lineTo(L, h - B); ctx.lineTo(w - R + 4, h - B); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.font = `9px ${MONO}`;
        ctx.fillText(tt('renda →', 'income →'), w - R - 50, h - B + 16);
        ctx.save(); ctx.translate(L - 14, T + 40); ctx.rotate(-Math.PI / 2); ctx.fillText(tt('risco →', 'risk →'), -40, 0); ctx.restore();

        // clientes
        for (let k = 0; k < cents.length; k++) {
          ctx.fillStyle = COLS[k];
          ctx.beginPath();
          for (const p of pts) if (p.k === k) ctx.rect(px(p.x) - 1.5, py(p.y) - 1.5, 3, 3);
          ctx.fill();
        }

        // centróides
        let total = 0, rsum = 0;
        cents.forEach((c, k) => {
          const x = px(c.x), y = py(c.y), on = k === drag || k === hover;
          const s = on ? 13 : 10;
          ctx.strokeStyle = COLS[k];
          ctx.lineWidth = on ? 2 : 1.2;
          ctx.strokeRect(x - s, y - s, s * 2, s * 2);
          ctx.beginPath(); ctx.moveTo(x - s - 6, y); ctx.lineTo(x + s + 6, y); ctx.moveTo(x, y - s - 6); ctx.lineTo(x, y + s + 6); ctx.stroke();
          ctx.fillStyle = '#000';
          ctx.fillRect(x + s + 4, y - s - 2, 92, 26);
          ctx.fillStyle = COLS[k];
          ctx.font = `700 10px ${MONO}`;
          ctx.fillText(`C${k + 1} · n=${c.n}`, x + s + 8, y - s + 9);
          ctx.font = `10px ${MONO}`;
          ctx.fillText(brl(limit(c)), x + s + 8, y - s + 21);
          total += limit(c) * c.n;
          rsum += risk(c) * c.n;
        });

        // painel
        const n = pts.length;
        ctx.fillStyle = 'rgba(0,0,0,.75)';
        ctx.fillRect(14, 30, 228, 28);
        ctx.fillStyle = '#fff';
        ctx.font = `10px ${MONO}`;
        ctx.fillText(`${tt('limite médio', 'avg. limit')}  ${brl(total / n)}`, 20, 42);
        ctx.fillStyle = rsum / n > 0.09 ? '#ff3d6e' : '#7dffc8';
        ctx.fillText(`${tt('inadimplência esperada', 'expected default')}  ${((rsum / n) * 100).toFixed(1)}%`, 20, 54);
      },
    };
  };

  /* ================= GLOBOPLAY: telemetria ================= */
  VIZ.globo = () => {
    const LANES = [
      { name: 'smart-tv', col: '#ff3fd8', cause: 'tizen-2017 · drm_license_timeout', base: 3.2 },
      { name: 'web', col: '#4fd8ff', cause: ['chrome · manifest_404 na cdn', 'chrome · manifest_404 on cdn'], base: 2.1 },
      { name: 'mobile', col: '#7dffc8', cause: 'android-tv · buffer_underrun', base: 2.6 },
    ];
    const LEN = 120;
    LANES.forEach((l) => { l.buf = new Float32Array(LEN).fill(l.base); l.inject = 0; l.anom = 0; l.z = 0; l.scale = l.base * 3; });
    const logs = [];
    let acc = 0, ingest = 48213, W = 0, H = 0;
    const top = 58, bottom = 74;
    const clock = () => new Date().toTimeString().slice(0, 8);
    return {
      resize(w, h) { W = w; H = h; },
      frame(ctx, w, h, dt, m) {
        const laneH = (h - top - bottom) / LANES.length;
        if (m.in) {
          const li = Math.floor((m.y - top) / laneH);
          const lane = LANES[li];
          if (lane) lane.inject = Math.min(14, lane.inject + (Math.abs(m.vx) + Math.abs(m.vy)) * 0.03);
          m.vx *= 0.5; m.vy *= 0.5;
        }
        acc += dt;
        while (acc >= 70) {
          acc -= 70;
          for (const l of LANES) {
            if (Math.random() < 0.003) l.inject += S.rand(3, 8);
            const v = Math.max(0, l.base + gauss() * 0.35 + l.inject);
            l.inject *= 0.72;
            l.buf.copyWithin(0, 1);
            l.buf[LEN - 1] = v;
            let mean = 0, sq = 0;
            for (let i = LEN - 61; i < LEN - 1; i++) mean += l.buf[i];
            mean /= 60;
            for (let i = LEN - 61; i < LEN - 1; i++) sq += (l.buf[i] - mean) ** 2;
            const sd = Math.sqrt(sq / 60) || 0.1;
            l.mean = mean; l.sd = sd;
            const z = (v - mean) / sd;
            if (z > 3.2 && v > l.base * 1.7) {
              if (performance.now() > l.anom - 600) {
                logs.unshift({ t: clock(), txt: `${l.name.padEnd(9)} ${tt('ANOMALIA', 'ANOMALY')} z=${z.toFixed(1)} → ${tr(l.cause)}`, col: l.col });
                if (logs.length > 4) logs.pop();
              }
              l.anom = performance.now() + 1500; l.z = Math.max(l.z, z);
            }
            if (performance.now() > l.anom) l.z = 0;
          }
          ingest += (48000 + Math.random() * 900 + LANES.reduce((a, l) => a + l.inject * 600, 0) - ingest) * 0.3;
        }

        ctx.fillStyle = '#07060d';
        ctx.fillRect(0, 0, w, h);
        ctx.font = `10px ${MONO}`;
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fillText(`${tt('ingestão', 'ingest')}  ${Math.round(ingest).toLocaleString(S.locale())} ev/s`, 18, 44);
        ctx.fillText(tt('erros de reprodução / s', 'playback errors / s'), w - 168, 44);
        const x0 = 92, x1 = w - 18;
        LANES.forEach((l, li) => {
          const y0 = top + li * laneH, y1 = y0 + laneH - 10;
          const mx = Math.max(...l.buf);
          l.scale += (Math.max(l.base * 3, mx * 1.15) - l.scale) * 0.05;
          const Y = (v) => y1 - (v / l.scale) * (y1 - y0 - 6);
          ctx.strokeStyle = 'rgba(255,255,255,.08)';
          ctx.beginPath(); ctx.moveTo(x0, y1 + 0.5); ctx.lineTo(x1, y1 + 0.5); ctx.stroke();
          // banda μ ± 3σ
          if (l.mean) {
            ctx.fillStyle = 'rgba(255,255,255,.05)';
            const ya = Y(l.mean + 3 * l.sd), yb = Y(Math.max(0, l.mean - 3 * l.sd));
            ctx.fillRect(x0, ya, x1 - x0, yb - ya);
          }
          ctx.fillStyle = l.col;
          ctx.font = `700 10px ${MONO}`;
          ctx.fillText(l.name, 18, y0 + laneH / 2);
          ctx.font = `9px ${MONO}`;
          ctx.fillStyle = 'rgba(255,255,255,.45)';
          ctx.fillText(l.buf[LEN - 1].toFixed(1), 18, y0 + laneH / 2 + 13);
          // série em degraus + pontos
          const dx = (x1 - x0) / (LEN - 1);
          ctx.strokeStyle = l.col;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (let i = 0; i < LEN; i++) {
            const x = x0 + i * dx, y = Y(l.buf[i]);
            if (i === 0) ctx.moveTo(x, y); else { ctx.lineTo(x, Y(l.buf[i - 1])); ctx.lineTo(x, y); }
          }
          ctx.stroke();
          ctx.globalAlpha = 0.1;
          ctx.lineTo(x1, y1); ctx.lineTo(x0, y1); ctx.closePath();
          ctx.fillStyle = l.col; ctx.fill();
          ctx.globalAlpha = 1;
          if (l.z) {
            const bx = x1 - dx * 16, by = y0 + 2;
            ctx.strokeStyle = '#ff1f4b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, dx * 16, y1 - by);
            ctx.fillStyle = '#ff1f4b';
            ctx.fillRect(bx, by, 126, 14);
            ctx.fillStyle = '#000';
            ctx.font = `700 9px ${MONO}`;
            ctx.fillText(`${tt('ANOMALIA', 'ANOMALY')} z=${l.z.toFixed(1)}`, bx + 4, by + 10);
          }
        });
        ctx.lineWidth = 1;
        // log de eventos
        ctx.font = `9px ${MONO}`;
        const ly = h - bottom + 14;
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        ctx.fillText(tt('> correlação de causa provável', '> probable-cause correlation'), 18, ly);
        logs.forEach((g, i) => {
          ctx.globalAlpha = 1 - i * 0.22;
          ctx.fillStyle = g.col;
          ctx.fillText(`[${g.t}] ${g.txt}`, 18, ly + 13 + i * 12);
        });
        ctx.globalAlpha = 1;
      },
    };
  };

  /* ================= SUZANO: grafo + Dijkstra ================= */
  VIZ.suzano = () => {
    let W = 0, H = 0, nodes = [], adj = [], bases = [], terrain = null, built = false;
    const fire = { x: 0, y: 0, sev: 0.3, node: -1, still: 0 };
    let dist = [], prev = [], wave = 0;
    const embers = [];
    const noise = (x, y) => (Math.sin(x * 0.021 + y * 0.013) + Math.sin(x * 0.007 - y * 0.019 + 2) + 2) / 4;

    function build(w, h) {
      nodes = []; adj = [];
      const cols = 9, rows = 6, mx = 34, top = 60, bot = 46;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = mx + (c / (cols - 1)) * (w - mx * 2) + S.rand(-14, 14);
          const y = top + (r / (rows - 1)) * (h - top - bot) + S.rand(-10, 10);
          nodes.push({ x, y, clima: noise(x, y) });
          adj.push([]);
        }
      }
      const id = (c, r) => r * cols + c;
      const link = (a, b) => {
        const A = nodes[a], B = nodes[b];
        const w = Math.hypot(A.x - B.x, A.y - B.y) * (1 + (A.clima + B.clima) * 0.9);
        adj[a].push([b, w]); adj[b].push([a, w]);
      };
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c < cols - 1 && Math.random() > 0.08) link(id(c, r), id(c + 1, r));
          if (r < rows - 1 && Math.random() > 0.08) link(id(c, r), id(c, r + 1));
          if (c < cols - 1 && r < rows - 1 && Math.random() < 0.3) link(id(c, r), id(c + 1, r + 1));
          if (c > 0 && r < rows - 1 && Math.random() < 0.2) link(id(c, r), id(c - 1, r + 1));
        }
      }
      bases = [
        { node: id(0, 0), label: 'BASE A', kind: ['caminhão', 'truck'] },
        { node: id(cols - 1, 1), label: 'BASE B', kind: ['caminhão', 'truck'] },
        { node: id(1, rows - 1), label: ['AERÓDROMO', 'AIRFIELD'], kind: ['aeronave', 'aircraft'], air: true },
      ];
      terrain = document.createElement('canvas');
      terrain.width = Math.ceil(w); terrain.height = Math.ceil(h);
      const o = terrain.getContext('2d');
      for (let y = 6; y < h; y += 9) {
        for (let x = 6; x < w; x += 9) {
          const v = noise(x, y);
          o.fillStyle = `rgba(${40 + v * 60},${150 + v * 90},${110 + v * 40},${0.08 + v * 0.22})`;
          o.fillRect(x, y, 2, 2);
        }
      }
      fire.x = w * 0.55; fire.y = h * 0.5;
      built = true;
    }

    function dijkstra(src) {
      const n = nodes.length;
      dist = new Array(n).fill(Infinity); prev = new Array(n).fill(-1);
      const done = new Array(n).fill(false);
      dist[src] = 0;
      for (let it = 0; it < n; it++) {
        let u = -1, bd = Infinity;
        for (let i = 0; i < n; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; }
        if (u < 0) break;
        done[u] = true;
        for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = u; }
      }
    }

    return {
      resize(w, h) { W = w; H = h; build(w, h); },
      frame(ctx, w, h, dt, m, t) {
        if (!built) return;
        const tx = m.in ? m.x : w * (0.52 + 0.3 * Math.sin(t * 0.21)), ty = m.in ? m.y : h * (0.52 + 0.25 * Math.sin(t * 0.33 + 1));
        const mv = Math.hypot(tx - fire.x, ty - fire.y);
        fire.x += (tx - fire.x) * 0.2; fire.y += (ty - fire.y) * 0.2;
        fire.sev = clamp(fire.sev + (mv < 2 ? 0.004 : -0.01), 0.2, 1);
        let fn = 0, fd = Infinity;
        nodes.forEach((nd, i) => { const d = (nd.x - fire.x) ** 2 + (nd.y - fire.y) ** 2; if (d < fd) { fd = d; fn = i; } });
        if (fn !== fire.node) { fire.node = fn; wave = 0; }
        dijkstra(fn);
        wave = Math.min(1, wave + dt / 700);
        const maxD = Math.max(1, ...dist.filter(isFinite));

        ctx.fillStyle = '#060a09';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(terrain, 0, 0, w, h);

        // estradas coloridas pela onda do Dijkstra
        ctx.lineWidth = 1;
        for (let a = 0; a < nodes.length; a++) {
          for (const [b] of adj[a]) {
            if (b < a) continue;
            const reach = Math.max(dist[a], dist[b]) / maxD;
            const lit = reach < wave;
            ctx.strokeStyle = lit ? `rgba(255,${120 + reach * 120},60,${0.55 - reach * 0.4})` : 'rgba(125,255,200,.12)';
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y); ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        nodes.forEach((nd) => ctx.fillRect(nd.x - 1.5, nd.y - 1.5, 3, 3));

        // rotas de cada base
        const etas = bases.map((b) => {
          const nb = nodes[b.node];
          if (b.air) return { b, eta: 4 + (Math.hypot(nb.x - fire.x, nb.y - fire.y) / w) * 22 };
          return { b, eta: isFinite(dist[b.node]) ? 2 + (dist[b.node] / maxD) * 34 : 99 };
        });
        const best = etas.reduce((a, e) => (e.eta < a.eta ? e : a));
        ctx.lineDashOffset = -t * 40;
        etas.forEach((e) => {
          const nb = nodes[e.b.node];
          const isBest = e === best;
          ctx.strokeStyle = isBest ? '#ffd23f' : e.b.air ? 'rgba(79,216,255,.7)' : 'rgba(255,63,216,.75)';
          ctx.lineWidth = isBest ? 2.6 : 1.4;
          ctx.setLineDash(e.b.air ? [2, 5] : [7, 5]);
          ctx.beginPath();
          if (e.b.air) { ctx.moveTo(nb.x, nb.y); ctx.lineTo(fire.x, fire.y); }
          else {
            let u = e.b.node;
            ctx.moveTo(nodes[u].x, nodes[u].y);
            while (prev[u] >= 0) { u = prev[u]; ctx.lineTo(nodes[u].x, nodes[u].y); }
            ctx.lineTo(fire.x, fire.y);
          }
          ctx.stroke();
        });
        ctx.setLineDash([]);
        ctx.lineWidth = 1;

        // bases
        ctx.font = `9px ${MONO}`;
        etas.forEach((e) => {
          const nb = nodes[e.b.node];
          const isBest = e === best;
          ctx.fillStyle = isBest ? '#ffd23f' : '#fff';
          if (e.b.air) { ctx.beginPath(); ctx.moveTo(nb.x, nb.y - 7); ctx.lineTo(nb.x + 7, nb.y + 5); ctx.lineTo(nb.x - 7, nb.y + 5); ctx.fill(); }
          else ctx.fillRect(nb.x - 6, nb.y - 6, 12, 12);
          const txt = `${tr(e.b.label)} · ${Math.round(e.eta)} min`;
          const tw = ctx.measureText(txt).width;
          const lx = clamp(nb.x - tw / 2, 6, w - tw - 6), ly = nb.y > h / 2 ? nb.y - 14 : nb.y + 20;
          ctx.fillStyle = 'rgba(0,0,0,.75)';
          ctx.fillRect(lx - 4, ly - 10, tw + 8, 14);
          ctx.fillStyle = isBest ? '#ffd23f' : 'rgba(255,255,255,.8)';
          ctx.fillText(txt, lx, ly);
        });

        // fogo
        if (Math.random() < 0.9) embers.push({ x: fire.x + S.rand(-10, 10) * fire.sev * 2, y: fire.y + S.rand(-6, 6), vy: S.rand(-1.4, -0.4), life: 1, s: S.rand(2, 5) });
        ctx.globalCompositeOperation = 'lighter';
        for (let i = embers.length - 1; i >= 0; i--) {
          const p = embers[i];
          p.y += p.vy; p.x += S.rand(-0.6, 0.6); p.life -= 0.025;
          if (p.life <= 0) { embers.splice(i, 1); continue; }
          ctx.fillStyle = p.life > 0.6 ? '#ffd23f' : p.life > 0.3 ? '#ff6a3d' : '#ff1f4b';
          ctx.globalAlpha = p.life;
          ctx.fillRect(p.x, p.y, p.s, p.s);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        const rr = 14 + fire.sev * 26 + Math.sin(t * 6) * 2;
        ctx.strokeStyle = 'rgba(255,31,75,.8)';
        ctx.strokeRect(fire.x - rr, fire.y - rr, rr * 2, rr * 2);
        ctx.fillStyle = '#ff1f4b';
        ctx.fillText(`${tt('FOCO · severidade', 'FIRE · severity')} ${(fire.sev * 10).toFixed(1)}`, fire.x - rr, fire.y - rr - 5);

        // painel
        const l1 = tt('caminho mínimo (dijkstra) · clima pesa nas arestas', 'shortest path (dijkstra) · weather weighs on the edges');
        const l2 = `${tt('despachar', 'dispatch')}: ${tr(best.b.kind).toUpperCase()} (${tr(best.b.label)}) · ETA ${Math.round(best.eta)} min`;
        ctx.font = `700 10px ${MONO}`;
        const pw = Math.max(ctx.measureText(l2).width, (ctx.font = `9px ${MONO}`, ctx.measureText(l1).width)) + 14;
        ctx.fillStyle = 'rgba(0,0,0,.78)';
        ctx.fillRect(14, 30, pw, 30);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        ctx.fillText(l1, 20, 42);
        ctx.fillStyle = '#ffd23f';
        ctx.font = `700 10px ${MONO}`;
        ctx.fillText(l2, 20, 55);
      },
    };
  };

  /* ================= FADEL: risco + SHAP ================= */
  VIZ.fadel = () => {
    let W = 0, H = 0, surf = null, area = null;
    const st = { km: 0.3, carga: 0.4 };
    const trail = [];
    // "modelo": soma de degraus como num boosting de árvores
    const score = (km, cg) => {
      const parts = {
        km: (km > 0.35 ? 1.1 : 0) + (km > 0.6 ? 1.3 : 0) + (km > 0.82 ? 1.1 : 0) - 0.9,
        carga: (cg > 0.5 ? 0.8 : 0) + (cg > 0.75 ? 0.9 : 0) - 0.5,
        temp: 0.9 * cg * km - 0.15,
        vib: (km > 0.5 && cg > 0.6 ? 0.9 : 0) + 0.25 * km - 0.3,
      };
      const f = -1.6 + parts.km + parts.carga + parts.temp + parts.vib;
      return { p: 1 / (1 + Math.exp(-f)), parts };
    };
    const COL = (p) => p < 0.3 ? [125, 255, 200] : p < 0.55 ? [255, 210, 63] : p < 0.75 ? [255, 63, 216] : [255, 31, 75];

    function buildSurf(w, h) {
      area = { x: 18, y: 52, w: Math.round(w * 0.56), h: Math.round(h - 52 - 64) };
      surf = document.createElement('canvas');
      surf.width = Math.ceil(w); surf.height = Math.ceil(h);
      const o = surf.getContext('2d');
      const c = 9;
      for (let y = 0; y < area.h; y += c) {
        for (let x = 0; x < area.w; x += c) {
          const { p } = score(x / area.w, 1 - y / area.h);
          const [r, g, b] = COL(p);
          o.fillStyle = `rgba(${r},${g},${b},${0.18 + p * 0.5})`;
          const s = 2 + p * 4;
          o.fillRect(area.x + x + (c - s) / 2, area.y + y + (c - s) / 2, s, s);
        }
      }
    }

    return {
      resize(w, h) { W = w; H = h; buildSurf(w, h); },
      frame(ctx, w, h, dt, m, t) {
        if (!surf) return;
        let tk, tc;
        if (m.in && m.x >= area.x && m.x <= area.x + area.w && m.y >= area.y && m.y <= area.y + area.h) {
          tk = (m.x - area.x) / area.w; tc = 1 - (m.y - area.y) / area.h;
        } else {
          tk = 0.5 + Math.sin(t * 0.17) * 0.42; tc = 0.5 + Math.sin(t * 0.29 + 1) * 0.4;
        }
        st.km += (tk - st.km) * 0.15; st.carga += (tc - st.carga) * 0.15;
        const { p, parts } = score(st.km, st.carga);
        const cx = area.x + st.km * area.w, cy = area.y + (1 - st.carga) * area.h;
        trail.push(cx, cy);
        if (trail.length > 80) trail.splice(0, 2);

        ctx.fillStyle = '#07060d';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(surf, 0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,.2)';
        ctx.strokeRect(area.x + 0.5, area.y + 0.5, area.w, area.h);
        ctx.font = `9px ${MONO}`;
        ctx.fillStyle = 'rgba(255,255,255,.5)';
        ctx.fillText(tt('km desde a última troca →', 'km since last service →'), area.x, area.y + area.h + 13);
        ctx.fillText(tt('↑ carga', '↑ load'), area.x + 4, area.y + 12);

        // rastro + caminhão
        ctx.fillStyle = 'rgba(255,255,255,.35)';
        for (let i = 0; i < trail.length; i += 4) ctx.fillRect(trail[i] - 1, trail[i + 1] - 1, 2, 2);
        ctx.strokeStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 8, cy - 5, 11, 7);
        ctx.fillRect(cx + 4, cy - 2, 5, 4);
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - 6, cy + 2, 3, 3); ctx.fillRect(cx + 3, cy + 2, 3, 3);

        // leitura grande
        const rx = area.x + area.w + 22;
        const rw = w - rx - 16;
        const [r, g, b] = COL(p);
        ctx.fillStyle = 'rgba(255,255,255,.55)';
        ctx.fillText(tt('P(falha em 30 dias)', 'P(failure in 30 days)'), rx, area.y + 8);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.font = `800 ${Math.min(42, rw * 0.32)}px "Unbounded", sans-serif`;
        ctx.fillText(Math.round(p * 100) + '%', rx, area.y + 50);
        ctx.font = `700 9px ${MONO}`;
        const alert = p > 0.6;
        if (!alert || Math.sin(t * 8) > -0.3) ctx.fillText(alert ? tt('▲ MANUTENÇÃO PREVENTIVA', '▲ PREVENTIVE MAINTENANCE') : tt('● OPERAÇÃO NORMAL', '● NORMAL OPERATION'), rx, area.y + 68);

        // barras SHAP
        const feats = [
          ['km', `km: ${Math.round(st.km * 80000).toLocaleString(S.locale())}`, parts.km],
          ['carga', `${tt('carga', 'load')}: ${Math.round(st.carga * 100)}%`, parts.carga],
          ['temp', `${tt('temp. motor', 'engine temp.')}: ${Math.round(72 + st.carga * 26 + st.km * 8)}°C`, parts.temp],
          ['vib', `${tt('vibração', 'vibration')}: ${(1.2 + st.km * 3 + st.carga * 1.2).toFixed(1)} mm/s`, parts.vib],
        ];
        const axis = rx + rw / 2;
        ctx.fillStyle = 'rgba(255,255,255,.45)';
        ctx.font = `9px ${MONO}`;
        ctx.fillText(tt('contribuição (shap)', 'contribution (shap)'), rx, area.y + 96);
        ctx.strokeStyle = 'rgba(255,255,255,.25)';
        ctx.beginPath(); ctx.moveTo(axis + 0.5, area.y + 104); ctx.lineTo(axis + 0.5, area.y + 104 + feats.length * 34); ctx.stroke();
        feats.forEach(([, label, v], i) => {
          const y = area.y + 112 + i * 34;
          const bw = clamp(v, -1.6, 1.6) / 1.6 * (rw / 2 - 4);
          ctx.fillStyle = v > 0 ? '#ff3fd8' : '#7dffc8';
          ctx.fillRect(bw > 0 ? axis : axis + bw, y + 10, Math.abs(bw), 9);
          ctx.fillStyle = 'rgba(255,255,255,.75)';
          ctx.fillText(label, rx, y + 5);
        });

        // vibração
        const wy = h - 34;
        ctx.strokeStyle = `rgba(${r},${g},${b},.9)`;
        ctx.beginPath();
        for (let x = 18; x < w - 16; x += 2) {
          const amp = 3 + p * 12;
          const y = wy + Math.sin(x * 0.12 + t * 9) * amp * 0.6 + Math.sin(x * 0.031 - t * 3) * amp * 0.4 + (Math.random() - 0.5) * p * 10;
          if (x === 18) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.4)';
        ctx.fillText(tt('sensor de vibração', 'vibration sensor'), 18, h - 10);
      },
    };
  };

  /* ================= monitores ================= */
  const items = [];
  S.$$('.monitor').forEach((mon) => {
    const cv = mon.querySelector('canvas');
    const make = VIZ[cv.dataset.viz];
    if (!make) return;
    const st = { mon, cv, ctx: cv.getContext('2d'), viz: make(), m: { x: 0, y: 0, vx: 0, vy: 0, in: false }, staticT: 0 };
    S.watch(mon);
    const loc = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    cv.addEventListener('pointermove', (e) => {
      const [x, y] = loc(e);
      if (st.m.in) { st.m.vx += x - st.m.x; st.m.vy += y - st.m.y; }
      st.m.x = x; st.m.y = y; st.m.in = true;
      st.viz.move && st.viz.move(st.m);
    });
    cv.addEventListener('pointerleave', () => { st.m.in = false; });
    cv.addEventListener('pointerdown', (e) => {
      const [x, y] = loc(e);
      st.m.x = x; st.m.y = y; st.m.in = true;
      cv.setPointerCapture(e.pointerId);
      st.viz.down && st.viz.down(st.m);
    });
    const up = () => { st.viz.up && st.viz.up(st.m); };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    mon.addEventListener('pointerenter', () => { st.staticT = 1; });
    items.push(st);
  });

  function staticOver(ctx, w, h, a) {
    ctx.globalAlpha = a;
    for (let i = 0; i < 260; i++) {
      const v = Math.random();
      ctx.fillStyle = v > 0.85 ? '#fff' : v > 0.5 ? '#ff3fd8' : '#5a1a6e';
      ctx.fillRect(Math.random() * w, Math.random() * h, S.rand(2, 18), S.rand(1, 3));
    }
    const by = (performance.now() * 0.4) % h;
    ctx.fillStyle = 'rgba(0,0,0,.6)';
    ctx.fillRect(0, by, w, 18);
    ctx.globalAlpha = 1;
  }

  // monitor com o mouse em cima: 60 fps; os outros visíveis: 30 fps
  S.loop((dt, t) => {
    for (const st of items) {
      if (!st.mon._vis) continue;
      const el = S.throttle(st, dt, st.m.in || st.staticT > 0);
      if (!el) continue;
      const { w, h, d, changed } = S.size(st.cv, 1.5);
      if (!w || !h) continue;
      if (changed) st.viz.resize(w, h);
      st.ctx.setTransform(d, 0, 0, d, 0, 0);
      st.viz.frame(st.ctx, w, h, el, st.m, t);
      if (st.staticT > 0 && S.fx) {
        staticOver(st.ctx, w, h, Math.min(1, st.staticT * 1.4));
        st.staticT -= el / 420;
      }
    }
  });
})();
