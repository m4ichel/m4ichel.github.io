/* =========================================================
   boot.js — sequência de boot (uma vez por sessão)
   Carregado por último: todos os módulos já registraram
   seus SYS.onBoot quando ele termina.
   ========================================================= */
(() => {
  'use strict';
  const S = SYS;
  const root = document.documentElement;
  const boot = S.$('#boot');

  const finish = () => {
    if (S.booted) return;
    S.booted = true;
    root.classList.add('booted');
    try { sessionStorage.setItem('lmp-booted', '1'); } catch (e) { /* sem storage */ }
    dispatchEvent(new Event('lmp:booted'));
  };

  if (!boot || root.classList.contains('skip-boot')) {
    if (boot) boot.remove();
    finish();
    return;
  }

  const linesEl = S.$('#boot-lines'), fill = S.$('#boot-fill');
  const t = S.t;
  const LINES = [
    ['LMP BIOS v26.10 · power-on self test', '', 'dim'],
    [t('CPU ........ ciência da computação @ inteli', 'CPU ........ computer science @ inteli'), 'OK', 'ok'],
    [t('MEM ........ 8 projetos reais carregados', 'MEM ........ 8 real-world projects loaded'), 'OK', 'ok'],
    ['NET ........ suzano · banco pan · grupo globo · fadel', 'LINK', 'ok'],
    ['GPU ........ glitch engine', t('INSTÁVEL', 'UNSTABLE'), 'warn'],
    [t('> montando /home/lucas', '> mounting /home/lucas'), '', ''],
  ];
  let i = 0, done = false;
  const timers = [];

  function addLine() {
    if (i >= LINES.length) return;
    const [txt, st, cls] = LINES[i++];
    const div = document.createElement('div');
    div.className = 'bl' + (cls === 'dim' ? ' dim' : '');
    const tx = document.createElement('span');
    tx.textContent = txt;
    div.appendChild(tx);
    if (st) {
      const s = document.createElement('span');
      s.className = 'st ' + cls;
      s.textContent = `[ ${st} ]`;
      div.appendChild(s);
    }
    linesEl.appendChild(div);
    S.decode(div, 260, true);
    fill.style.width = ((i / LINES.length) * 100).toFixed(0) + '%';
  }

  function out() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    fill.style.width = '100%';
    boot.classList.add('out');
    setTimeout(finish, 280);
    setTimeout(() => boot.remove(), 650);
  }

  for (let k = 0; k < LINES.length; k++) timers.push(setTimeout(addLine, 120 + k * 230));
  timers.push(setTimeout(out, 120 + LINES.length * 230 + 520));
  addEventListener('keydown', out, { once: true });
  boot.addEventListener('pointerdown', out);
})();
