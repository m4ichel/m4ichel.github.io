/* =========================================================
   core.js — estado global, loop de animação e utilitários
   Tudo fica em window.SYS para os outros módulos usarem.
   ========================================================= */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  // alfabeto "alienígena" dos terminais (inspiração: 0.gif)
  const GLYPHS = 'ᑎᑌᒧᒪᗯᕼᘔᓭᕮᖇᑕᘜᒍᖽᐸᐳᑭᒣᔕᗩᗷᑐᑯᕲᘻᘈᗰᑲᒥᓄ▙▟▛▜▞▚';
  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sem storage */ } },
  };

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const SYS = (window.SYS = {
    $, $$, clamp, lerp, rand, pick, glyph, store,
    reduced, fine,
    fx: store.get('lmp-fx') !== 'off' && !reduced,
    lang: window.I18N ? I18N.lang : 'pt',
    booted: false,
    mouse: {
      x: innerWidth / 2, y: innerHeight * 0.45, px: innerWidth / 2, py: innerHeight * 0.45,
      vx: 0, vy: 0, speed: 0, down: false, active: false, drag: 0, downAt: 0, pressMs: 0,
    },
    glitch: 0,      // 0..1, suavizado a partir da velocidade do mouse
    kickV: 0,       // picos de glitch disparados por eventos
    time: 0,
    fxLayers: [],   // camadas do canvas #fx: { update(dt) -> mudou?, draw(ctx, W, H) }
  });

  // textos gerados por código: S.t('português', 'english')
  SYS.t = (pt, en) => (SYS.lang === 'en' ? en : pt);
  SYS.locale = () => (SYS.lang === 'en' ? 'en-US' : 'pt-BR');

  /* ---------- loop ---------- */
  const loops = [];
  SYS.loop = (fn) => loops.push(fn);
  SYS.kick = (v) => { SYS.kickV = Math.max(SYS.kickV, v); };

  SYS.onBoot = (fn) => {
    if (SYS.booted) setTimeout(fn, 0);
    else addEventListener('lmp:booted', fn, { once: true });
  };

  let layoutT = 0;
  SYS.layoutChanged = () => {
    clearTimeout(layoutT);
    layoutT = setTimeout(() => dispatchEvent(new Event('lmp:layout')), 120);
  };

  /* ---------- posição em cache (evita forçar layout a cada quadro) ---------- */
  const cached = new Set();
  SYS.rect = (el) => {
    if (!el._rc || el._rcDirty) {
      const r = el.getBoundingClientRect();
      el._rc = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
      el._rcDirty = false;
      cached.add(el);
    }
    return el._rc;
  };
  const invalidateRects = () => cached.forEach((el) => { el._rcDirty = true; });
  addEventListener('resize', invalidateRects);
  addEventListener('lmp:layout', invalidateRects);
  setInterval(invalidateRects, 1500);

  /* ---------- visibilidade e tamanho de canvases ---------- */
  const vio = new IntersectionObserver((es) => es.forEach((e) => { e.target._vis = e.isIntersecting; }), { rootMargin: '100px 0px' });
  SYS.watch = (el) => { el._vis = false; vio.observe(el); };

  const ro = new ResizeObserver((es) => es.forEach((e) => {
    const el = e.target; el._w = e.contentRect.width; el._h = e.contentRect.height; el._dirty = true;
  }));
  // ajusta a resolução do canvas ao tamanho CSS (com cache via ResizeObserver)
  SYS.size = (cv, maxDpr = 2, scale = 1) => {
    if (!cv._ro) { cv._ro = true; ro.observe(cv); cv._w = cv.clientWidth; cv._h = cv.clientHeight; cv._dirty = true; }
    let changed = false;
    if (cv._dirty) {
      const d = Math.min(devicePixelRatio || 1, maxDpr) * scale;
      cv.width = Math.max(1, Math.round(cv._w * d));
      cv.height = Math.max(1, Math.round(cv._h * d));
      cv._d = d; cv._dirty = false; changed = true;
    }
    return { w: cv._w, h: cv._h, d: cv._d, changed };
  };

  // limita um canvas a ~30 fps quando ninguém está interagindo com ele
  SYS.throttle = (st, dt, busy) => {
    st._acc = (st._acc || 0) + dt;
    if (!busy && st._acc < 32) return 0;
    const e = st._acc;
    st._acc = 0;
    return e;
  };

  /* ---------- decodificação de texto (glifos -> texto real) ---------- */
  function textNodes(el, fresh) {
    if (el._nodes && !fresh) return el._nodes;
    const out = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) if (n.nodeValue.trim()) out.push({ node: n, text: n.nodeValue });
    el._nodes = out;
    return out;
  }
  const scrambleStr = (s) => s.replace(/[^\s ]/g, () => glyph());

  SYS.scramble = (el) => {
    if (!SYS.fx) return;
    textNodes(el).forEach((n) => { n.node.nodeValue = scrambleStr(n.text); });
    el._scrambled = true;
  };

  SYS.decode = (el, dur, fresh) => {
    const nodes = textNodes(el, fresh && !el._dec);
    const token = {};
    el._dec = token;
    if (!SYS.fx) { nodes.forEach((n) => { n.node.nodeValue = n.text; }); el._dec = null; return; }
    const total = nodes.reduce((a, n) => a + n.text.length, 0) || 1;
    dur = dur || clamp(total * 12, 380, 1300);
    const t0 = performance.now();
    let last = 0;
    const tick = (now) => {
      if (el._dec !== token) return;
      const p = clamp((now - t0) / dur, 0, 1);
      if (now - last > 40 || p === 1) { // ~25 fps, como o gif do terminal
        last = now;
        let i = 0;
        for (const n of nodes) {
          let out = '';
          const s = n.text;
          for (let k = 0; k < s.length; k++, i++) {
            const c = s[k];
            out += (c === ' ' || c === '\n' || c === ' ' || i / total < p) ? c : glyph();
          }
          n.node.nodeValue = out;
        }
      }
      if (p < 1) requestAnimationFrame(tick);
      else {
        nodes.forEach((n) => { n.node.nodeValue = n.text; });
        el._dec = null; el._scrambled = false;
        SYS.layoutChanged();
      }
    };
    requestAnimationFrame(tick);
  };

  /* ---------- toast ---------- */
  const toastEl = $('#toast');
  let toastT = 0;
  SYS.toast = (msg, ms = 2600) => {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    SYS.decode(toastEl, 380, true);
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), ms);
  };

  /* ---------- mouse ---------- */
  const m = SYS.mouse;
  addEventListener('pointermove', (e) => {
    if (m.down) m.drag += Math.abs(e.clientX - m.x) + Math.abs(e.clientY - m.y);
    m.x = e.clientX; m.y = e.clientY;
    if (!m.active) { m.px = m.x; m.py = m.y; }
    m.active = true;
    m.touch = e.pointerType !== 'mouse';
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    m.down = true; m.drag = 0; m.downAt = performance.now();
    m.x = e.clientX; m.y = e.clientY; m.active = true;
  }, { passive: true });
  addEventListener('pointerup', () => { m.down = false; m.pressMs = performance.now() - m.downAt; }, { passive: true });
  addEventListener('pointercancel', () => { m.down = false; }, { passive: true });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) { m.active = false; dispatchEvent(new Event('lmp:mouseleave')); } });

  /* ---------- liga/desliga efeitos ---------- */
  const fxBtn = $('#fx-toggle');
  SYS.setFx = (on) => {
    SYS.fx = on;
    root.classList.toggle('no-fx', !on);
    fxBtn.textContent = on ? 'FX:ON' : 'FX:OFF';
    fxBtn.setAttribute('aria-pressed', String(on));
    store.set('lmp-fx', on ? 'on' : 'off');
    if (!on) $$('[data-decode]').forEach((el) => { if (el._scrambled || el._dec) SYS.decode(el); });
    dispatchEvent(new Event('lmp:fx'));
  };
  fxBtn.addEventListener('click', () => {
    SYS.setFx(!SYS.fx);
    SYS.toast(SYS.fx ? SYS.t('efeitos ligados', 'effects on') : SYS.t('efeitos desligados · modo leitura', 'effects off · reading mode'));
  });
  if (!SYS.fx) { root.classList.add('no-fx'); fxBtn.textContent = 'FX:OFF'; fxBtn.setAttribute('aria-pressed', 'false'); }

  /* ---------- texto que decodifica ao aparecer / no hover ---------- */
  const dio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    dio.unobserve(e.target);
    SYS.decode(e.target);
  }), { threshold: 0.3 });
  $$('[data-decode]').forEach((el) => {
    SYS.scramble(el);
    if (el.hasAttribute('data-boot')) SYS.onBoot(() => setTimeout(() => SYS.decode(el, 900), 500));
    else dio.observe(el);
  });
  $$('[data-hover]').forEach((el) => {
    el.addEventListener('pointerenter', () => { if (!el._dec) SYS.decode(el, 320); });
  });

  /* ---------- idioma ----------
     Antes de trocar, devolve o texto real a quem está embaralhado
     (senão os glifos virariam o "original"); depois embaralha de novo
     o que ainda não apareceu e decodifica o que está na tela. */
  const onScreen = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; };
  SYS.setLang = (l) => {
    if (l === SYS.lang || !window.I18N) return;
    const els = $$('[data-decode], [data-hover]');
    const st = els.map((el) => {
      const s = el._dec ? 2 : el._scrambled ? 1 : 0;
      if (el._nodes) el._nodes.forEach((n) => { n.node.nodeValue = n.text; });
      el._nodes = null; el._dec = null; el._scrambled = false;
      return s;
    });
    SYS.lang = l;
    I18N.apply(l);
    store.set('lmp-lang', l);
    els.forEach((el, i) => {
      if (st[i] === 1) SYS.scramble(el);
      else if (st[i] === 2 || onScreen(el)) SYS.decode(el, 520);
    });
    dispatchEvent(new Event('lmp:lang'));
    SYS.layoutChanged();
  };
  const langBtn = $('#lang-toggle');
  if (langBtn) langBtn.addEventListener('click', () => {
    SYS.setLang(SYS.lang === 'en' ? 'pt' : 'en');
    if (SYS.staticBurst) SYS.staticBurst(200, 0.6);
    SYS.toast(SYS.t('idioma: português', 'language: english'));
  });

  const rio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    rio.unobserve(e.target);
    e.target.classList.add('in');
    setTimeout(() => e.target.classList.add('done'), 1100);
  }), { threshold: 0.12 });
  $$('.reveal').forEach((el) => rio.observe(el));

  /* ---------- canais (seções) ---------- */
  const chEl = $('#hud-ch');
  const navLinks = $$('.nav a');
  let current = null;
  const cio = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting || current === e.target) return;
    current = e.target;
    chEl.textContent = `CH.${e.target.dataset.ch} // ${e.target.dataset.chname}`;
    SYS.decode(chEl, 420, true);
    navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    if (SYS.booted && SYS.staticBurst) SYS.staticBurst(170, 0.55);
  }), { rootMargin: '-48% 0px -48% 0px' });
  $$('[data-ch]').forEach((s) => cio.observe(s));
  addEventListener('lmp:lang', () => {
    if (current) { chEl.textContent = `CH.${current.dataset.ch} // ${current.dataset.chname}`; SYS.decode(chEl, 420, true); }
  });

  /* ---------- HUD ---------- */
  const xyEl = $('#hud-xy'), velEl = $('#hud-vel'), entEl = $('#hud-ent'), fpsEl = $('#hud-fps'), clockEl = $('#clock');
  const pad = (n, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, '0');
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tickClock = () => { clockEl.textContent = 'SP ' + fmt.format(new Date()); };
  tickClock(); setInterval(tickClock, 1000);
  let frames = 0, fpsT = performance.now(), hudT = 0, hudXY = '', hudVel = '', hudEnt = '';

  /* ---------- konami: modo infravermelho ---------- */
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let ki = 0;
  addEventListener('keydown', (e) => {
    const k = (e.key || '').toLowerCase();
    ki = k === KONAMI[ki] ? ki + 1 : (k === KONAMI[0] ? 1 : 0);
    if (ki === KONAMI.length) {
      ki = 0;
      const on = root.classList.toggle('infrared');
      SYS.infrared = on;
      SYS.staticBurst && SYS.staticBurst(400, 1);
      SYS.kick(1);
      SYS.toast(on ? SYS.t('▲▲▼▼◀▶◀▶BA · modo infravermelho ativado', '▲▲▼▼◀▶◀▶BA · infrared mode on') : SYS.t('modo infravermelho desativado', 'infrared mode off'));
      dispatchEvent(new Event('lmp:palette'));
    }
  });

  /* ---------- brilho dos LEDs que segue o cursor ----------
     Um quadrado de 520px que só se move com transform (sem repintar a tela);
     a camada interna compensa o deslocamento para os pontos ficarem
     alinhados com a grade fixa do fundo. */
  const led = $('#led');
  const ledDots = led && led.firstElementChild;
  let ledOn = false, ledX = -1, ledY = -1;
  function updateLed() {
    if (!led) return;
    const want = SYS.fx && fine && m.active && !m.touch;
    if (want !== ledOn) { led.classList.toggle('on', want); ledOn = want; }
    if (!want) return;
    const ox = Math.round(m.x) - 260, oy = Math.round(m.y) - 260;
    if (ox === ledX && oy === ledY) return;
    ledX = ox; ledY = oy;
    const ix = (((7 - ox) % 14) + 14) % 14 - 14, iy = (((7 - oy) % 14) + 14) % 14 - 14;
    led.style.transform = `translate3d(${ox}px,${oy}px,0)`;
    ledDots.style.transform = `translate3d(${ix}px,${iy}px,0)`;
  }

  /* ---------- glitch dos títulos (variáveis só nos elementos que as usam) ---------- */
  const glitchEls = $$('.h2');
  let lastG = -1;
  function updateTitles() {
    const g = Math.round(SYS.glitch * 50) / 50;
    if (g === lastG && g < 0.15) return;
    lastG = g;
    const jx = g > 0.15 ? ((Math.random() - 0.5) * g * 16).toFixed(1) + 'px' : '0px';
    for (const el of glitchEls) { el.style.setProperty('--g', g); el.style.setProperty('--jx', jx); }
  }

  /* ---------- frame ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(64, now - last);
    last = now;
    SYS.time = now / 1000;
    SYS.dt = dt;

    const dx = m.x - m.px, dy = m.y - m.py;
    m.px = m.x; m.py = m.y;
    m.vx = dx; m.vy = dy;
    const inst = Math.hypot(dx, dy) / (dt / 1000 || 0.016);
    m.speed += (inst - m.speed) * 0.25;

    const live = SYS.fx && !m.touch;
    const target = live ? clamp((m.speed - 1600) / 3600, 0, 1) : 0;
    SYS.kickV *= Math.pow(0.9, dt / 16.67);
    const tg = Math.max(target, SYS.kickV);
    SYS.glitch += (tg - SYS.glitch) * (tg > SYS.glitch ? 0.35 : 0.07);
    if (SYS.glitch < 0.002) SYS.glitch = 0;

    // primeiro as leituras/desenhos dos módulos, depois as escritas de estilo
    for (let i = 0; i < loops.length; i++) loops[i](dt, SYS.time);
    updateLed();
    updateTitles();

    // HUD (só reescreve o texto quando muda)
    frames++;
    if (now - fpsT > 500) { fpsEl.textContent = pad(frames * 1000 / (now - fpsT), 2) + ' FPS'; frames = 0; fpsT = now; }
    if (now - hudT > 100) {
      hudT = now;
      const xy = `X:${pad(m.x)} Y:${pad(m.y + scrollY, 5)}`;
      const vel = `VEL:${pad(m.speed)}`;
      const lvl = clamp(Math.round(SYS.glitch * 8), 0, 8);
      const ent = SYS.t('ENTROPIA ', 'ENTROPY ') + '▮'.repeat(lvl) + '▯'.repeat(8 - lvl);
      if (xy !== hudXY) { xyEl.textContent = xy; hudXY = xy; }
      if (vel !== hudVel) { velEl.textContent = vel; hudVel = vel; }
      if (ent !== hudEnt) { entEl.textContent = ent; hudEnt = ent; }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
