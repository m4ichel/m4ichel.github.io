/* =========================================================
   i18n.js — versão em inglês do site
   O português fica no próprio HTML; aqui só mora o inglês.
   Carregado antes do core.js: guarda o português original de
   cada elemento marcado e, se o idioma for inglês, já troca o
   texto antes de qualquer efeito embaralhar as letras.
   · data-i18n="chave"            → conteúdo (innerHTML)
   · data-i18n-a="attr:chave,..." → atributos
   ========================================================= */
(() => {
  'use strict';

  const EN = {
    'boot.skip': 'click or press any key to skip',
    'nosig.t': 'NO SIGNAL',
    'nosig.s': 'bring the cursor back',

    'logo.l': 'home',
    'nav.a': 'Sections',
    'nav.3': '03 projects',
    'nav.4': '04 education',
    'nav.5': '05 contact',
    'lang.l': 'português',
    'lang.a': 'Mudar para português',
    'fx.l': 'toggle effects',

    'ch.1': 'SIGNAL',
    'ch.4': 'PROJECTS',
    'ch.5': 'EDUCATION',
    'ch.6': 'CONTACT',

    'hero.kicker': '<span class="blink">●</span> portfolio.exe — v2026.10 — são paulo, brazil',
    'hero.role': 'Computer Science student at Inteli',
    'hero.tags': 'data science · software engineering · optimization',
    'hero.cta1': 'view projects',
    'hero.cta2': 'get in touch',
    'hero.keys.a': 'How to interact',
    'hero.k1': '<kbd>move</kbd> track words and push the pixels',
    'hero.k2': '<kbd>hold</kbd> collapse the name into a sphere',
    'hero.k3': '<kbd>click</kbd> crack the screen',

    'about.p1': 'I\'m a Computer Science student at Inteli, in São Paulo, and I like problems that mix data, math and engineering. On projects with <b>Suzano</b>, <b>Banco PAN</b>, <b>Grupo Globo</b> and <b>Fadel Transportes</b>, I worked on optimization, data modeling and systems architecture, from the mathematical model all the way to the API and the infrastructure.',
    'about.p2': 'I\'m currently looking for an opportunity in <b>Data Science</b> or <b>Software Engineering</b>.',
    'stat.1': 'projects with real companies',
    'stat.2': 'expected graduation from Inteli',
    'stat.3': 'gold at the Kangaroo Math Olympiad',
    'stat.4': 'native Portuguese · advanced English',
    'term.hint': 'type <b>help</b>',
    'term.intro':
      '<div class="line"><span class="ps1">lucas@inteli:~$</span> whoami</div>' +
      '<div class="line hl">lucas michel pereira</div>' +
      '<div class="line">computer science student · inteli · 2025 — 2028</div>' +
      '<div class="line"><span class="ps1">lucas@inteli:~$</span> cat goal.txt</div>' +
      '<div class="line">looking for an opportunity in <span class="hl">data science</span> or <span class="hl">software engineering</span>, with hands-on experience in optimization, data modeling and systems architecture.</div>' +
      '<div class="line"><span class="ps1">lucas@inteli:~$</span> ls ./partners</div>' +
      '<div class="line">suzano/&nbsp;&nbsp;banco-pan/&nbsp;&nbsp;grupo-globo/&nbsp;&nbsp;fadel-transportes/</div>' +
      '<div class="line dim">— type <span class="hl">help</span> to see the commands —</div>',
    'term.in.a': 'Terminal: type a command',
    'donut.a': '3D torus rendered on an LED matrix',
    'donut.cap': '<span>donut.c // LED matrix</span><span>drag to spin · the light follows the cursor</span>',

    'stack.lead': 'Each node is a technology, and each edge links it to a project where I used it. Hover to track the nodes, drag to rearrange the graph and click a project to open it.',
    'stack.legend.a': 'Filter by category',
    'cat.lang': 'languages &amp; frameworks',
    'cat.infra': 'data &amp; infrastructure',
    'cat.data': 'data science &amp; optimization',
    'cat.fund': 'fundamentals',
    'graph.a': 'Interactive graph of technologies and projects',
    'sk.kmeans': 'Clustering',
    'sk.algo': 'Algorithms &amp; Data Structures',
    'sk.graphs': 'Graph Theory',
    'sk.lp': 'Linear Programming',

    'proj.ch': '<b>CH.04</b> projects',
    'proj.h2': 'PROJECTS',
    'proj.lead': 'Four highlights from the eight projects I built with Inteli\'s partner companies. Each monitor is an interactive simulation of the problem, so try moving your mouse over each one.',
    'mon.sim': 'illustrative sim.',

    'pan.a': 'Customer clustering simulation',
    'pan.hint': 'drag the centroids',
    'pan.h3': 'Pre-Approved Credit Limit Optimization',
    'pan.p': 'Decision-support system for Banco PAN to set pre-approved credit card limits, balancing commercial appeal, repayment capacity and the portfolio\'s default risk.',
    'pan.ul':
      '<li>Implemented and compared linear optimization algorithms (Simplex, OR-Tools, Branch &amp; Bound)</li>' +
      '<li>Segmented customers by risk profile with clustering (KMeans / MiniBatchKMeans)</li>' +
      '<li>Built a REST API in FastAPI with asynchronous queue-based processing (RabbitMQ)</li>',

    'globo.a': 'Telemetry simulation with anomaly detection',
    'globo.mon': 'CH.04-B // live telemetry',
    'globo.hint': 'scribble over a channel to trigger an anomaly',
    'globo.h3': 'Frontend Telemetry Platform',
    'globo.p': 'Telemetry platform for Globoplay that collects and correlates playback and error events from different frontends, including legacy Smart TVs, to spot experience degradation in real time.',
    'globo.ul':
      '<li>Designed the API for high-scale ingestion and querying of telemetry events</li>' +
      '<li>Implemented anomaly detection and probable-cause correlation across incidents</li>' +
      '<li>Provisioned infrastructure as code (Terraform) on AWS: ECS Fargate, DynamoDB and Amplify</li>',

    'suz.a': 'Simulation of shortest routes to a wildfire',
    'suz.mon': 'CH.04-C // dispatch graph',
    'suz.hint': 'the cursor is the fire',
    'suz.h3': 'Wildfire Response Resource Optimization',
    'suz.p': 'Optimization system that allocates vehicles and aircraft to fight forest fires at Suzano, replacing manual analysis with automatic recommendations based on graph theory.',
    'suz.ul':
      '<li>Modeled the allocation as a graph, taking distance, weather and fire severity into account</li>' +
      '<li>Implemented and compared two optimization algorithms (shortest path and Network Simplex) in Java</li>' +
      '<li>Built the backend in Spring Boot, with the domain covered by tests (JUnit)</li>',
    'suz.tags': '<span class="tag">Java</span><span class="tag">Spring Boot</span><span class="tag">Next.js</span><span class="tag">Maven</span><span class="tag">Graph Theory</span><span class="tag">Combinatorial Optimization</span>',

    'fadel.a': 'Mechanical failure risk simulation with SHAP explanation',
    'fadel.mon': 'CH.04-D // predictive maintenance',
    'fadel.hint': 'move the truck across the risk map',
    'fadel.h3': 'Predictive Vehicle Maintenance Model',
    'fadel.p': 'Machine learning model that predicts mechanical failures in Fadel\'s truck fleet, anticipating part replacements and reducing unplanned downtime.',
    'fadel.ul':
      '<li>Did the exploratory data analysis (EDA) and feature engineering in Python (Pandas, NumPy)</li>' +
      '<li>Trained and compared models (Random Forest, XGBoost, Logistic Regression)</li>' +
      '<li>Interpreted the results with SHAP and built a dashboard in Streamlit</li>',

    'edu.ch': '<b>CH.05</b> education &amp; awards',
    'edu.h2': 'Education',
    'edu.melt': 'hover to melt the pixels',
    'edu.tag': 'bachelor\'s degree',
    'edu.h3': 'Computer Science',
    'edu.school': 'Inteli — Institute of Technology and Leadership · São Paulo, Brazil',
    'edu.p': 'A curriculum built on real projects in partnership with multinational companies, focused on software engineering, data science, systems architecture and optimization.',
    'edu.from': 'jan 2025',
    'edu.to': 'dec 2028',
    'edu.courses': 'courses &amp; certifications',
    'edu.courses.ul':
      '<li><b>Machine Learning Specialization</b><span>Coursera · Andrew Ng</span></li>' +
      '<li><b>Python for Data Analysis</b><span>Alura</span></li>' +
      '<li><b>Software Engineering Foundations</b><span>Alura · Design Patterns, SOLID, Clean Code</span></li>',
    'edu.langs': 'languages',
    'edu.langs.ul':
      '<li><b>Portuguese</b><span>native</span></li>' +
      '<li><b>English</b><span>advanced · fluent in conversation and technical communication</span></li>',
    'badge.1': '<b>Gold</b><p>Kangaroo Math Olympiad · 2022–2024</p>',
    'badge.2': '<b>Silver</b><p>Brazilian Physics Olympiad · 2022</p>',
    'badge.3m': 'HM',
    'badge.3': '<b>Honorable Mention</b><p>OBMEP · Brazilian Math Olympiad · 2022</p>',
    'badge.4': '<b>1st Place</b><p>Pentágono Essay Contest · 2023</p>',

    'ct.ch': '<b>CH.06</b> contact',
    'ct.h2': 'ERROR_404',
    'ct.big': 'Position not found… yet.',
    'ct.lead': 'I\'m looking for an opportunity in Data Science or Software Engineering. If you have a hard problem involving data, optimization or systems, let\'s talk.',
    'ct.mail.l': 'send email',
    'ct.copy': '[ copy email ]',
    'ct.copy.l': 'copy email',
    'ct.loc': 'São Paulo, SP · Brazil',
    'ct.wire': 'the shape is looking for your cursor',
    'foot.made': 'handmade with vanilla JavaScript, canvas and WebGL',
    'foot.tip': 'tip: try the konami code',
  };
  const DESC_EN = 'Lucas Michel Pereira — Computer Science student at Inteli. Data Science, Software Engineering and Optimization, with projects for Banco PAN, Grupo Globo, Suzano and Fadel.';

  // escolha salva; na primeira visita, o idioma do navegador
  let saved = null;
  try { saved = localStorage.getItem('lmp-lang'); } catch (e) { /* sem storage */ }
  const lang = saved === 'pt' || saved === 'en' ? saved : /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en';

  const els = Array.from(document.querySelectorAll('[data-i18n], [data-i18n-a]'));
  const attrs = (el) => (el.dataset.i18nA || '').split(',').filter(Boolean).map((s) => s.split(':'));
  els.forEach((el) => {
    if (el.dataset.i18n) el._pt = el.innerHTML;
    el._pta = {};
    attrs(el).forEach(([a]) => { el._pta[a] = el.getAttribute(a); });
  });
  const desc = document.querySelector('meta[name="description"]');
  const descPT = desc && desc.content;

  function apply(l) {
    const en = l === 'en';
    els.forEach((el) => {
      const k = el.dataset.i18n;
      if (k) el.innerHTML = en ? EN[k] : el._pt;
      attrs(el).forEach(([a, key]) => el.setAttribute(a, en ? EN[key] : el._pta[a]));
    });
    document.documentElement.lang = en ? 'en' : 'pt-BR';
    if (desc) desc.content = en ? DESC_EN : descPT;
  }

  window.I18N = { lang, apply };
  if (lang === 'en') apply('en');
})();
