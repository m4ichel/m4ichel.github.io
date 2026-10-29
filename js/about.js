/* =========================================================
   about.js — CH.02
   · terminal interativo (estética do 0.gif)
   · donut.c em matriz de LEDs rosa (4.jpg): arraste para girar,
     a luz vem da direção do cursor
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;

  /* ================= terminal ================= */
  const body = S.$('#term-body'), out = S.$('#term-out'), input = S.$('#term-in'), term = S.$('#term');
  const EMAIL = 'lucas.m4ichel.pereira@gmail.com';
  const LINKEDIN = 'https://www.linkedin.com/in/lucas-m4ichel-pereira';
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hl = (s) => `<span class="hl">${s}</span>`;
  const PS1 = '<span class="ps1">lucas@inteli:~$</span>';

  let queue = Promise.resolve();
  function print(html, cls = '') {
    const div = document.createElement('div');
    div.className = 'line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    S.decode(div, 240, true);
    body.scrollTop = body.scrollHeight;
    S.layoutChanged();
    return div;
  }
  // imprime linha a linha, como se estivesse digitando
  function printLines(lines, cls) {
    queue = queue.then(() => new Promise((res) => {
      let i = 0;
      const next = () => {
        if (i >= lines.length) return res();
        print(lines[i++], cls);
        setTimeout(next, 45);
      };
      next();
    }));
    return queue;
  }

  const t = S.t;
  // arquivos respondem pelo nome em português e em inglês
  const GOAL = () => t([
    `buscando oportunidade em ${hl('data science')} ou ${hl('engenharia de software')},`,
    'com experiência prática em otimização, modelagem de dados e arquitetura de',
    'sistemas em projetos com suzano, banco pan, grupo globo e fadel transportes.',
  ], [
    `looking for an opportunity in ${hl('data science')} or ${hl('software engineering')},`,
    'with hands-on experience in optimization, data modeling and systems',
    'architecture from projects with suzano, banco pan, grupo globo and fadel transportes.',
  ]);
  const STACK = () => t([
    '{',
    `  "linguagens": ["python", "java", "typescript", "javascript", "sql"],`,
    `  "frameworks": ["fastapi", "spring boot", "node/express", "next.js/react"],`,
    `  "dados_infra": ["postgresql", "docker", "aws", "terraform", "rabbitmq", "grafana"],`,
    `  "ciencia_de_dados": ["ml", "eda", "feature eng.", "xgboost", "shap", "clusterização"],`,
    `  "otimizacao": ["simplex", "branch & bound", "or-tools", "grafos"]`,
    '}',
  ], [
    '{',
    `  "languages": ["python", "java", "typescript", "javascript", "sql"],`,
    `  "frameworks": ["fastapi", "spring boot", "node/express", "next.js/react"],`,
    `  "data_infra": ["postgresql", "docker", "aws", "terraform", "rabbitmq", "grafana"],`,
    `  "data_science": ["ml", "eda", "feature eng.", "xgboost", "shap", "clustering"],`,
    `  "optimization": ["simplex", "branch & bound", "or-tools", "graphs"]`,
    '}',
  ]);
  const AWARDS = () => t([
    `[2022-2024] ${hl('OURO')}     olimpíada canguru de matemática`,
    `[2022]      ${hl('PRATA')}    olimpíada brasileira de física`,
    `[2022]      ${hl('MENÇÃO')}   obmep (menção honrosa)`,
    `[2023]      ${hl('1º')}       concurso pentágono de redação`,
  ], [
    `[2022-2024] ${hl('GOLD')}     kangaroo math olympiad`,
    `[2022]      ${hl('SILVER')}   brazilian physics olympiad`,
    `[2022]      ${hl('HONOR')}    obmep (honorable mention)`,
    `[2023]      ${hl('1ST')}      pentágono essay contest`,
  ]);
  const VCARD = () => [
    'BEGIN:VCARD',
    'FN:Lucas Michel Pereira',
    `EMAIL:<a href="mailto:${EMAIL}">${EMAIL}</a>`,
    `URL:<a href="${LINKEDIN}" target="_blank" rel="noopener">linkedin.com/in/lucas-m4ichel-pereira</a>`,
    t('ADR:São Paulo, SP', 'ADR:São Paulo, Brazil'),
    'END:VCARD',
  ];
  const FILES = {
    'objetivo.txt': GOAL, 'goal.txt': GOAL,
    'stack.json': STACK,
    'premios.log': AWARDS, 'awards.log': AWARDS,
    'contato.vcf': VCARD, 'contact.vcf': VCARD,
  };

  const PROJ = [
    ['p-pan', '2026', 'banco pan    ', 'otimização de limites pré-aprovados de crédito', 'pre-approved credit limit optimization'],
    ['p-globo', '2026', 'grupo globo  ', 'plataforma de telemetria de frontend (globoplay)', 'frontend telemetry platform (globoplay)'],
    ['p-suzano', '2026', 'suzano       ', 'otimização de recursos contra incêndios', 'wildfire response resource optimization'],
    ['p-fadel', '2025', 'fadel        ', 'modelo preditivo de manutenção veicular', 'predictive vehicle maintenance model'],
  ];
  const projName = (p) => t(p[3], p[4]);

  function goto(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: S.reduced ? 'auto' : 'smooth', block: 'center' });
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
  function copyEmail() {
    const done = () => S.toast(t('e-mail copiado ✓ ', 'email copied ✓ ') + EMAIL);
    if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(done, () => S.toast(EMAIL));
    else S.toast(EMAIL);
  }
  S.copyEmail = copyEmail;

  function hire() {
    printLines(t([
      '[sudo] senha para recrutador: ********',
      'verificando credenciais ........ ok',
      'carregando protocolo de contratação ........ ok',
      `${hl('acesso concedido.')} abrindo canal de contato ▸`,
    ], [
      '[sudo] password for recruiter: ********',
      'verifying credentials ........ ok',
      'loading hiring protocol ........ ok',
      `${hl('access granted.')} opening contact channel ▸`,
    ])).then(() => setTimeout(() => {
      S.$('#contato').scrollIntoView({ behavior: S.reduced ? 'auto' : 'smooth' });
      S.staticBurst(300, 1);
    }, 500));
  }

  const CMDS = {
    help: () => t([
      'comandos disponíveis:',
      `  ${hl('whoami')}      quem sou eu`,
      `  ${hl('objetivo')}    o que estou buscando`,
      `  ${hl('projetos')}    lista de projetos  (${hl('open 1')} … ${hl('open 4')})`,
      `  ${hl('stack')}       tecnologias que uso`,
      `  ${hl('premios')}     olimpíadas e concursos`,
      `  ${hl('contato')}     como falar comigo  (${hl('email')} copia o endereço)`,
      `  ${hl('ls')} / ${hl('cat')}    explorar os arquivos`,
      `  ${hl('clear')}       limpar a tela`,
      '<span class="dim">  …e alguns comandos secretos.</span>',
    ], [
      'available commands:',
      `  ${hl('whoami')}      who i am`,
      `  ${hl('goal')}        what i'm looking for`,
      `  ${hl('projects')}    project list  (${hl('open 1')} … ${hl('open 4')})`,
      `  ${hl('stack')}       technologies i use`,
      `  ${hl('awards')}      olympiads and contests`,
      `  ${hl('contact')}     how to reach me  (${hl('email')} copies the address)`,
      `  ${hl('ls')} / ${hl('cat')}    explore the files`,
      `  ${hl('clear')}       clear the screen`,
      '<span class="dim">  …and a few secret commands.</span>',
    ]),
    whoami: () => [
      hl('lucas michel pereira'),
      t('estudante de ciência da computação · inteli · 2025 — 2028', 'computer science student · inteli · 2025 — 2028'),
      t('são paulo, sp · português nativo · inglês avançado', 'são paulo, brazil · native portuguese · advanced english'),
    ],
    objetivo: GOAL,
    sobre: () => CMDS.whoami().concat(GOAL()),
    projetos: () => PROJ.map((p, i) => `[${i + 1}] ${p[1]}  ${p[2].replace(/ /g, '&nbsp;')}${projName(p)}`)
      .concat([t(`digite ${hl('open 1')} … ${hl('open 4')} para abrir um projeto.`, `type ${hl('open 1')} … ${hl('open 4')} to open a project.`)]),
    open: (a) => {
      const n = parseInt(a[0], 10);
      if (!(n >= 1 && n <= 4)) return [t('uso: ', 'usage: ') + `${hl('open')} &lt;1-4&gt;`];
      setTimeout(() => goto(PROJ[n - 1][0]), 250);
      return [t('abrindo ', 'opening ') + projName(PROJ[n - 1]) + ' …'];
    },
    stack: STACK,
    skills: STACK,
    premios: AWARDS,
    contato: VCARD,
    email: () => { copyEmail(); return [t('copiado: ', 'copied: ') + EMAIL]; },
    linkedin: () => { window.open(LINKEDIN, '_blank', 'noopener'); return [t('abrindo linkedin em uma nova aba …', 'opening linkedin in a new tab …')]; },
    ls: (a) => {
      if (a[0] && /parceiros|partners/.test(a[0])) return ['suzano/&nbsp;&nbsp;banco-pan/&nbsp;&nbsp;grupo-globo/&nbsp;&nbsp;fadel-transportes/'];
      if (a[0] && /projetos|projects/.test(a[0])) return CMDS.projetos();
      return [t('objetivo.txt  stack.json  premios.log  contato.vcf  projetos/  parceiros/', 'goal.txt  stack.json  awards.log  contact.vcf  projects/  partners/').replace(/ {2}/g, '&nbsp;&nbsp;')];
    },
    cat: (a) => {
      if (!a[0]) return [t('uso: cat &lt;arquivo&gt;', 'usage: cat &lt;file&gt;')];
      const f = FILES[a[0].replace(/^\.\//, '')];
      return f ? f() : [`cat: ${esc(a[0])}: ` + t('arquivo não encontrado', 'no such file')];
    },
    clear: () => { out.innerHTML = ''; S.layoutChanged(); return []; },
    date: () => [new Intl.DateTimeFormat(S.locale(), { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'medium' }).format(new Date())],
    echo: (a) => [esc(a.join(' '))],
    pwd: () => ['/home/lucas'],
    hire: () => { hire(); return []; },
    contratar: () => { hire(); return []; },
    glitch: () => {
      setTimeout(() => { S.kick(1); S.staticBurst(260, 0.8); S.shake && S.shake(8); }, 250);
      return [t('injetando ruído no sinal …', 'injecting noise into the signal …')];
    },
    crack: () => {
      for (let i = 0; i < 4; i++) setTimeout(() => S.crack(S.rand(innerWidth * 0.1, innerWidth * 0.9), S.rand(innerHeight * 0.1, innerHeight * 0.9)), i * 180);
      return [t('cuidado com a tela.', 'careful with the screen.')];
    },
    fx: (a) => {
      const on = a[0] ? a[0] !== 'off' : !S.fx;
      S.setFx(on);
      return [on ? t('efeitos ligados.', 'effects on.') : t('efeitos desligados.', 'effects off.')];
    },
    lang: (a) => {
      S.setLang(a[0] === 'pt' || a[0] === 'en' ? a[0] : S.lang === 'en' ? 'pt' : 'en');
      return [t('idioma: português', 'language: english')];
    },
    donut: () => {
      turbo = turbo > 1 ? 1 : 4;
      return [turbo > 1 ? t('donut em modo turbo.', 'donut in turbo mode.') : t('donut de volta ao normal.', 'donut back to normal.')];
    },
    exit: () => {
      document.documentElement.classList.add('reboot');
      S.staticBurst(500, 1);
      setTimeout(() => document.documentElement.classList.remove('reboot'), 750);
      return ['logout', t('não tem como sair daqui :)', 'there\'s no way out of here :)')];
    },
    oi: () => [t('olá, humano. digite ', 'hello, human. type ') + hl('help') + t(' para começar.', ' to get started.')],
    ola: () => CMDS.oi(),
    hello: () => CMDS.oi(),
    cafe: () => ['  ( (', '   ) )', ' ........', ' |      |]', ' \\      /', "  `----'   " + t('café carregado. produtividade +40%.', 'coffee loaded. productivity +40%.')],
    coffee: () => CMDS.cafe(),
    matrix: () => [t('neo, é você? tente ', 'neo, is that you? try ') + hl('glitch') + '.'],
    rm: (a) => {
      if (a.join(' ').includes('-rf')) {
        CMDS.crack();
        return ['<span class="err">' + t('rm: permissão negada. bela tentativa.', 'rm: permission denied. nice try.') + '</span>'];
      }
      return [t('rm: nada foi apagado.', 'rm: nothing was deleted.')];
    },
  };
  CMDS.goal = CMDS.objetivo;
  CMDS.about = CMDS.sobre;
  CMDS.projects = CMDS.projetos;
  CMDS.awards = CMDS.premios;
  CMDS.contact = CMDS.contato;
  CMDS['prêmios'] = CMDS.premios;
  CMDS['olá'] = CMDS.ola;
  CMDS['café'] = CMDS.cafe;

  const hist = [];
  let hi = 0;
  function run(raw) {
    const cmd = raw.trim();
    print(`${PS1} ${esc(cmd)}`);
    if (!cmd) return;
    hist.push(cmd);
    hi = hist.length;
    const low = cmd.toLowerCase();
    if (/^sudo\b/.test(low)) {
      if (/hire|contrat/.test(low)) hire();
      else printLines([
        t('lucas não está no arquivo sudoers. este incidente será reportado.', 'lucas is not in the sudoers file. this incident will be reported.'),
        `<span class="dim">(${t('dica', 'hint')}: ${hl('sudo hire lucas')})</span>`,
      ]);
      return;
    }
    const [name, ...args] = cmd.split(/\s+/);
    const fn = CMDS[name.toLowerCase()];
    if (!fn) {
      print(t(`comando não encontrado: ${esc(name)}. digite ${hl('help')}.`, `command not found: ${esc(name)}. type ${hl('help')}.`), 'err');
      return;
    }
    const res = fn(args.map((s) => s.toLowerCase()));
    if (res && res.length) printLines(res);
  }

  if (input) {
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { run(input.value); input.value = ''; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(0, hi - 1); input.value = hist[hi] || ''; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hist.length, hi + 1); input.value = hist[hi] || ''; }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const v = input.value.toLowerCase();
        if (!v) return;
        const match = Object.keys(CMDS).filter((k) => k.startsWith(v));
        if (match.length === 1) input.value = match[0] + ' ';
        else if (match.length > 1) print(match.join('&nbsp;&nbsp;'), 'dim');
      } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); CMDS.clear(); }
    });
    term.addEventListener('click', (e) => {
      if (e.target.closest('a')) return;
      if (String(getSelection())) return;
      input.focus({ preventScroll: true });
    });
  }

  /* ================= donut.c em LEDs ================= */
  const dc = S.$('#donut');
  if (!dc) return;
  const dctx = dc.getContext('2d');
  const read = S.$('#donut-read');
  S.watch(dc);

  let A = 1.1, B = 0.4, vA = 0.0105, vB = 0.0055, turbo = 1;
  let drag = null;
  const light = { x: -0.4, y: 0.6, z: -0.7 };
  const TH = [], PH = [];
  for (let t = 0; t < 6.283; t += 0.045) TH.push([Math.cos(t), Math.sin(t)]);
  for (let p = 0; p < 6.283; p += 0.016) PH.push([Math.cos(p), Math.sin(p)]);
  let zb = new Float32Array(0), lum = new Float32Array(0), cols = 0, rows = 0, cell = 8, offLed = null;

  dc.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    dc.setPointerCapture(e.pointerId);
    dc.style.cursor = 'grabbing';
  });
  dc.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    vB = dx * 0.004; vA = dy * 0.004;
    B += dx * 0.008; A += dy * 0.008;
  });
  const endDrag = () => { drag = null; dc.style.cursor = ''; };
  dc.addEventListener('pointerup', endDrag);
  dc.addEventListener('pointercancel', endDrag);

  function prepGrid(w, h, d) {
    cell = Math.max(7, Math.round(Math.min(w, h) / 62));
    cols = Math.floor(w / cell); rows = Math.floor(h / cell);
    zb = new Float32Array(cols * rows); lum = new Float32Array(cols * rows);
    offLed = document.createElement('canvas');
    offLed.width = Math.round(w * d); offLed.height = Math.round(h * d);
    const o = offLed.getContext('2d');
    o.scale(d, d);
    o.fillStyle = 'rgba(255,70,200,0.12)';
    const ox = (w - cols * cell) / 2, oy = (h - rows * cell) / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) o.fillRect(ox + x * cell + cell / 2 - 1, oy + y * cell + cell / 2 - 1, 2, 2);
  }

  const LV = ['#4a0f38', '#7a1a5e', '#b0257f', '#e436ae', '#ff5ccc', '#ff9ae0', '#ffd6f4', '#ffffff'];
  const paths = LV.map(() => []);
  let frameN = 0;
  const thr = {};

  // LEDs piscam a 30 fps (60 enquanto alguém arrasta)
  S.loop((dt) => {
    if (!dc._vis) return;
    const el = S.throttle(thr, dt, !!drag);
    if (!el) return;
    const f = el / 16.67;
    const { w, h, d, changed } = S.size(dc, 2);
    if (!w || !h) return;
    if (changed || !offLed) prepGrid(w, h, d);

    // luz na direção do cursor
    const r = S.rect(dc);
    const ux = S.clamp((S.mouse.x - (r.x - scrollX + r.w / 2)) / (r.w * 0.6), -1.4, 1.4);
    const uy = S.clamp((S.mouse.y - (r.y - scrollY + r.h / 2)) / (r.h * 0.6), -1.4, 1.4);
    const tl = S.mouse.active ? { x: ux, y: -uy, z: -0.45 } : { x: Math.cos(S.time * 0.6), y: 0.5, z: -0.45 };
    const lk = Math.min(1, 0.1 * f);
    light.x += (tl.x - light.x) * lk; light.y += (tl.y - light.y) * lk; light.z += (tl.z - light.z) * lk;
    const ln = Math.hypot(light.x, light.y, light.z) || 1;
    const lx = light.x / ln, ly = light.y / ln, lz = light.z / ln;

    if (!drag) {
      vA += (0.0105 * turbo - vA) * 0.02 * f; vB += (0.0055 * turbo - vB) * 0.02 * f;
      A += vA * f; B += vB * f;
    }

    zb.fill(0); lum.fill(-2);
    const cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
    const R1 = 1, R2 = 2, K2 = 5;
    const K1 = (Math.min(cols, rows) * K2 * 3) / (8 * (R1 + R2));
    for (let i = 0; i < TH.length; i++) {
      const ct = TH[i][0], st = TH[i][1];
      const cx = R2 + R1 * ct, cy = R1 * st;
      for (let j = 0; j < PH.length; j++) {
        const cp = PH[j][0], sp = PH[j][1];
        const x = cx * (cB * cp + sA * sB * sp) - cy * cA * sB;
        const y = cx * (sB * cp - sA * cB * sp) + cy * cA * cB;
        const z = K2 + cA * cx * sp + cy * sA;
        const ooz = 1 / z;
        const xp = (cols / 2 + K1 * ooz * x) | 0;
        const yp = (rows / 2 - K1 * ooz * y) | 0;
        if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;
        const k = yp * cols + xp;
        if (ooz <= zb[k]) continue;
        zb[k] = ooz;
        const nx = ct * (cB * cp + sA * sB * sp) - st * cA * sB;
        const ny = ct * (sB * cp - sA * cB * sp) + st * cA * cB;
        const nz = cA * ct * sp + st * sA;
        lum[k] = nx * lx + ny * ly + nz * lz;
      }
    }

    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, dc.width, dc.height);
    dctx.drawImage(offLed, 0, 0);
    dctx.setTransform(d, 0, 0, d, 0, 0);
    const ox = (w - cols * cell) / 2, oy = (h - rows * cell) / 2;
    for (const p of paths) p.length = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const L = lum[y * cols + x];
        if (L < -1.5) continue;
        const lv = L <= 0 ? 0 : 1 + Math.min(LV.length - 2, (Math.pow(L, 1.6) * (LV.length - 1)) | 0);
        paths[lv].push(x, y);
      }
    }
    dctx.globalCompositeOperation = 'lighter';
    for (let lv = 0; lv < LV.length; lv++) {
      const p = paths[lv];
      if (!p.length) continue;
      const sz = cell * (0.32 + 0.6 * (lv / (LV.length - 1)));
      dctx.fillStyle = LV[lv];
      dctx.beginPath();
      for (let i = 0; i < p.length; i += 2) dctx.rect(ox + p[i] * cell + (cell - sz) / 2, oy + p[i + 1] * cell + (cell - sz) / 2, sz, sz);
      dctx.fill();
      if (lv >= LV.length - 3) {
        const gs = sz * 2.2;
        dctx.globalAlpha = 0.12;
        dctx.beginPath();
        for (let i = 0; i < p.length; i += 2) dctx.rect(ox + p[i] * cell + (cell - gs) / 2, oy + p[i + 1] * cell + (cell - gs) / 2, gs, gs);
        dctx.fill();
        dctx.globalAlpha = 1;
      }
    }
    dctx.globalCompositeOperation = 'source-over';

    if ((frameN++ & 3) === 0) {
      read.textContent = `A=${(A % 6.283).toFixed(2)} B=${(B % 6.283).toFixed(2)} · ${S.t('LUZ', 'LIGHT')}=(${lx.toFixed(2)}, ${ly.toFixed(2)}, ${lz.toFixed(2)})`;
    }
  });
})();
