const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const lineEl = document.getElementById('win-line');
const scores = { X: 0, O: 0, D: 0 };
let state, turn, over, starter = 'X';

const X_SVG = '<svg viewBox="0 0 100 100" class="mark x"><path d="M20 20 L80 80" pathLength="100"/><path d="M80 20 L20 80" pathLength="100"/></svg>';
const O_SVG = '<svg viewBox="0 0 100 100" class="mark o"><circle cx="50" cy="50" r="32" pathLength="100"/></svg>';

function setStatus(html) {
  statusEl.innerHTML = html;
  statusEl.classList.remove('swap'); void statusEl.offsetWidth; statusEl.classList.add('swap');
}
const tag = p => `<span class="${p === 'X' ? 'text-pink-400' : 'text-cyan-300'}">${p}</span>`;

function updateActive() {
  ['X', 'O'].forEach(p => document.getElementById('score-' + p).classList.toggle('active', !over && turn === p));
}

function newRound() {
  state = Array(9).fill(null);
  over = false;
  turn = starter;
  starter = starter === 'X' ? 'O' : 'X';
  lineEl.classList.remove('show'); lineEl.setAttribute('opacity', 0);
  boardEl.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('button');
    c.className = 'cell hint-' + turn;
    c.style.animationDelay = i * 40 + 'ms';
    c.setAttribute('aria-label', 'Cell ' + (i + 1));
    c.addEventListener('click', () => play(i));
    boardEl.appendChild(c);
  }
  setStatus(`${tag(turn)}'s turn`);
  updateActive();
}

function play(i) {
  const cell = boardEl.children[i];
  if (over || state[i]) { cell.classList.add('shake'); setTimeout(() => cell.classList.remove('shake'), 400); return; }
  state[i] = turn;
  cell.classList.add('taken');
  cell.innerHTML = turn === 'X' ? X_SVG : O_SVG;
  beep(turn === 'X' ? 520 : 400);

  const combo = WINS.find(w => w.every(k => state[k] === turn));
  if (combo) return endGame(turn, combo);
  if (state.every(Boolean)) return endGame(null);

  turn = turn === 'X' ? 'O' : 'X';
  [...boardEl.children].forEach(c => c.className = c.className.replace(/hint-\w/, 'hint-' + turn));
  setStatus(`${tag(turn)}'s turn`);
  updateActive();
}

function endGame(winner, combo) {
  over = true;
  updateActive();
  const key = winner || 'D';
  scores[key]++;
  const el = document.getElementById(key === 'X' ? 'sx' : key === 'O' ? 'so' : 'sd');
  el.textContent = scores[key];
  el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');

  if (winner) {
    setStatus(`🎉 ${tag(winner)} wins!`);
    [...boardEl.children].forEach((c, i) => c.classList.add(combo.includes(i) ? 'win' : 'dim'));
    drawLine(combo);
    confetti();
    beep(780, .4);
  } else {
    setStatus("It's a draw! 🤝");
    [...boardEl.children].forEach(c => c.classList.add('dim'));
  }
  [...boardEl.children].forEach(c => c.classList.add('taken'));
}

function drawLine([a,, b]) {
  const p = i => [(i % 3) * 33.33 + 16.67, Math.floor(i / 3) * 33.33 + 16.67];
  const [x1, y1] = p(a), [x2, y2] = p(b);
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  // extend slightly past the centers
  const ex = dx / len * 8, ey = dy / len * 8;
  lineEl.setAttribute('x1', x1 - ex); lineEl.setAttribute('y1', y1 - ey);
  lineEl.setAttribute('x2', x2 + ex); lineEl.setAttribute('y2', y2 + ey);
  lineEl.setAttribute('pathLength', 200);
  lineEl.classList.remove('show'); void lineEl.getBoundingClientRect(); lineEl.classList.add('show');
}

/* Tiny sound */
let actx;
function beep(freq, dur = .12) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(.12, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination); o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
}

/* Confetti */
function confetti() {
  const cv = document.getElementById('confetti'), ctx = cv.getContext('2d');
  cv.width = innerWidth; cv.height = innerHeight;
  const colors = ['#f472b6', '#67e8f9', '#fde047', '#a78bfa', '#4ade80'];
  const ps = Array.from({ length: 140 }, () => ({
    x: cv.width / 2, y: cv.height / 2,
    vx: (Math.random() - .5) * 18, vy: Math.random() * -16 - 3,
    s: Math.random() * 8 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4,
    c: colors[Math.random() * colors.length | 0]
  }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ps.forEach(p => {
      p.vy += .35; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore();
    });
    if (++frames < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

document.getElementById('restart').onclick = newRound;
document.getElementById('reset').onclick = () => {
  scores.X = scores.O = scores.D = 0;
  ['sx', 'so', 'sd'].forEach(id => document.getElementById(id).textContent = 0);
  starter = 'X';
  newRound();
};

newRound();
