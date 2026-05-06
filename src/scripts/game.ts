type Pair<T> = [T, T];

interface HistoryEntry {
  hp: Pair<number>;
  pending: Pair<number>;
  pendingHeal: Pair<number>;
  action: 'attack' | 'heal';
}

interface GameState {
  hp: Pair<number>;
  pending: Pair<number>;
  pendingHeal: Pair<number>;
  history: Pair<HistoryEntry[]>;
  gameOver: boolean;
  winner: number;
}

interface LogEntry {
  msg: string;
  type?: string;
  ts: number;
}

const STARTING_HP = 50;

// ── STAR FIELD ───────────────────────────────────────────────────────────────
function startStarField() {
  const canvas = document.getElementById('stars') as HTMLCanvasElement | null;
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  type Star = { x: number; y: number; r: number; a: number; speed: number; phase: number };
  let stars: Star[] = [];

  function buildStars() {
    stars = [];
    const n = Math.floor((canvas!.width * canvas!.height) / 2000);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * canvas!.width,
        y: Math.random() * canvas!.height,
        r: Math.random() * 1.2 + 0.2,
        a: Math.random(),
        speed: Math.random() * 0.3 + 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  function resize() {
    canvas!.width = window.innerWidth;
    canvas!.height = window.innerHeight;
    buildStars();
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    const t = frame * 0.01;
    for (const s of stars) {
      const alpha = s.a * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,220,255,${alpha})`;
      ctx.fill();
    }
    frame++;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

// ── AUDIO ────────────────────────────────────────────────────────────────────
type AnyAudioCtx = typeof AudioContext;
const AudioCtor: AnyAudioCtx =
  (window.AudioContext as AnyAudioCtx) ||
  ((window as unknown as { webkitAudioContext: AnyAudioCtx }).webkitAudioContext);

let audioCtx: AudioContext | null = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtor();
  if (audioCtx.state === 'suspended') void audioCtx.resume();
}

function playAttackSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, t);
  filter.frequency.exponentialRampToValueAtTime(120, t + 0.3);
  filter.Q.value = 2;

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.3);

  gain.gain.setValueAtTime(0.3, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start(t);
  osc.stop(t + 0.35);

  const noise = audioCtx.createOscillator();
  const ng = audioCtx.createGain();
  noise.type = 'square';
  noise.frequency.setValueAtTime(55, t + 0.05);
  noise.frequency.exponentialRampToValueAtTime(30, t + 0.25);
  ng.gain.setValueAtTime(0.2, t + 0.05);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  noise.connect(ng);
  ng.connect(audioCtx.destination);
  noise.start(t + 0.05);
  noise.stop(t + 0.3);
}

function playClickSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, t);
  osc.frequency.exponentialRampToValueAtTime(800, t + 0.04);
  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.06);
}

function playUndoSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, t);
  osc.frequency.exponentialRampToValueAtTime(700, t + 0.1);
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + 0.15);
}

function playHealSound() {
  ensureAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(440, t);
  osc1.frequency.exponentialRampToValueAtTime(880, t + 0.2);
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(660, t + 0.1);
  osc2.frequency.exponentialRampToValueAtTime(1320, t + 0.3);
  gain.gain.setValueAtTime(0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);
  osc1.start(t);
  osc1.stop(t + 0.35);
  osc2.start(t + 0.1);
  osc2.stop(t + 0.35);
}

// ── STATE ────────────────────────────────────────────────────────────────────
function loadState(): GameState | null {
  try {
    const s = localStorage.getItem('sr_state');
    return s ? (JSON.parse(s) as GameState) : null;
  } catch {
    return null;
  }
}

function defaultState(): GameState {
  return {
    hp: [STARTING_HP, STARTING_HP],
    pending: [0, 0],
    pendingHeal: [0, 0],
    history: [[], []],
    gameOver: false,
    winner: -1,
  };
}

let state: GameState = loadState() ?? defaultState();
if (!state.pendingHeal) state.pendingHeal = [0, 0];

function saveState() {
  try {
    localStorage.setItem('sr_state', JSON.stringify(state));
  } catch {
    /* ignore quota errors */
  }
}

// ── DOM ──────────────────────────────────────────────────────────────────────
function $<T extends HTMLElement = HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const hpEls = [$('hp1'), $('hp2')];
const dmgEls = [$('dmg1'), $('dmg2')];
const healEls = [$('heal1'), $('heal2')];
const pendingEls = [$('pending1'), $('pending2')];
const attackBtns = [$<HTMLButtonElement>('attack1'), $<HTMLButtonElement>('attack2')];
const healBtns = [$<HTMLButtonElement>('healBtn1'), $<HTMLButtonElement>('healBtn2')];
const undoBtns = [$<HTMLButtonElement>('undo1'), $<HTMLButtonElement>('undo2')];
const winFlashes = [$('win1'), $('win2')];
const vBanners = [$('vb1'), $('vb2')];

// ── LOG ──────────────────────────────────────────────────────────────────────
const logData: Pair<LogEntry[]> = [
  JSON.parse(localStorage.getItem('sr_log_0') || '[]') as LogEntry[],
  JSON.parse(localStorage.getItem('sr_log_1') || '[]') as LogEntry[],
];

function addLog(player: 0 | 1, msg: string, type?: string) {
  logData[player].unshift({ msg, type, ts: Date.now() });
  if (logData[player].length > 20) logData[player].pop();
  try {
    localStorage.setItem('sr_log_' + player, JSON.stringify(logData[player]));
  } catch {
    /* ignore */
  }
}

// ── RENDER ───────────────────────────────────────────────────────────────────
function render() {
  for (let p = 0; p < 2; p++) {
    const hp = state.hp[p];
    const dmg = state.pending[p];
    const healAmt = state.pendingHeal[p];

    hpEls[p].textContent = String(Math.max(0, hp));
    hpEls[p].className = 'health-number' + (hp <= 0 ? ' dead' : '');

    dmgEls[p].textContent = String(dmg);
    healEls[p].textContent = String(healAmt);

    attackBtns[p].disabled = dmg === 0 || state.gameOver;
    healBtns[p].disabled = healAmt === 0 || state.gameOver;
    undoBtns[p].disabled = state.history[p].length === 0 || state.gameOver;

    const target = (1 - p) as 0 | 1;
    if (dmg > 0) {
      pendingEls[target].textContent = `−${dmg}`;
      pendingEls[target].classList.add('visible');
    } else {
      pendingEls[target].classList.remove('visible');
    }
  }

  if (state.gameOver && state.winner >= 0) {
    const w = state.winner;
    winFlashes[w].classList.add('active');
    vBanners[w].classList.add('visible');
  } else {
    winFlashes.forEach((w) => w.classList.remove('active'));
    vBanners.forEach((v) => v.classList.remove('visible'));
  }
}

// ── ACTIONS ──────────────────────────────────────────────────────────────────
function changeDamage(player: 0 | 1, delta: number) {
  const opponentHp = state.hp[1 - player];
  state.pending[player] = Math.max(0, Math.min(opponentHp, state.pending[player] + delta));
  playClickSound();
  render();
  saveState();
}

function changeHeal(player: 0 | 1, delta: number) {
  const maxHeal = STARTING_HP - state.hp[player];
  state.pendingHeal[player] = Math.max(0, Math.min(maxHeal, state.pendingHeal[player] + delta));
  playClickSound();
  render();
  saveState();
}

function attack(attacker: 0 | 1) {
  if (state.gameOver) return;
  const dmg = state.pending[attacker];
  if (dmg <= 0) return;
  const target = (1 - attacker) as 0 | 1;

  state.history[attacker].push({
    hp: [...state.hp] as Pair<number>,
    pending: [...state.pending] as Pair<number>,
    pendingHeal: [...state.pendingHeal] as Pair<number>,
    action: 'attack',
  });

  state.hp[target] = Math.max(0, state.hp[target] - dmg);
  state.pending[attacker] = 0;

  hpEls[target].classList.remove('damaged');
  void hpEls[target].offsetWidth;
  hpEls[target].classList.add('damaged');
  setTimeout(() => hpEls[target].classList.remove('damaged'), 500);

  const attName = attacker === 0 ? 'Alpha' : 'Beta';
  const defName = target === 0 ? 'Alpha' : 'Beta';
  addLog(attacker, `▶ Dealt ${dmg} damage to ${defName}`, 'damage-entry');
  addLog(target, `◀ Took ${dmg} damage from ${attName}`, 'damage-entry');

  playAttackSound();

  if (state.hp[target] <= 0) {
    state.gameOver = true;
    state.winner = attacker;
    addLog(attacker, '★ AUTHORITY ELIMINATED — VICTORY', 'damage-entry');
    addLog(target, '✕ AUTHORITY AT ZERO — DEFEATED', 'damage-entry');
  }

  saveState();
  render();
}

function heal(player: 0 | 1) {
  if (state.gameOver) return;
  const amt = state.pendingHeal[player];
  if (amt <= 0) return;

  state.history[player].push({
    hp: [...state.hp] as Pair<number>,
    pending: [...state.pending] as Pair<number>,
    pendingHeal: [...state.pendingHeal] as Pair<number>,
    action: 'heal',
  });

  state.hp[player] = Math.min(STARTING_HP, state.hp[player] + amt);
  state.pendingHeal[player] = 0;

  hpEls[player].classList.remove('healed', 'damaged');
  void hpEls[player].offsetWidth;
  hpEls[player].classList.add('healed');
  setTimeout(() => hpEls[player].classList.remove('healed'), 500);

  addLog(player, `✦ Restored ${amt} authority`, 'undo-entry');

  playHealSound();
  saveState();
  render();
}

function undo(player: 0 | 1) {
  if (state.history[player].length === 0) return;
  const prev = state.history[player].pop()!;
  state.hp = prev.hp;
  state.pending = prev.pending;
  state.pendingHeal = prev.pendingHeal || [0, 0];
  state.gameOver = false;
  state.winner = -1;

  winFlashes.forEach((w) => w.classList.remove('active'));
  vBanners.forEach((v) => v.classList.remove('visible'));

  for (let p = 0; p < 2; p++) {
    logData[p].shift();
    try {
      localStorage.setItem('sr_log_' + p, JSON.stringify(logData[p]));
    } catch {
      /* ignore */
    }
  }

  playUndoSound();
  saveState();
  render();
}

// ── RESET FLOW ───────────────────────────────────────────────────────────────
const HOLD_DURATION = 2500;
const CIRCUMFERENCE = 175.9;
let resetInterval: number | null = null;

function startResetHold() {
  if (resetInterval !== null) return;
  const overlay = $('reset-overlay');
  const ringFill = $<SVGCircleElement & HTMLElement>('ring-fill');
  const ringText = $('ring-text');

  overlay.classList.add('visible');
  ringFill.style.strokeDashoffset = String(CIRCUMFERENCE);
  ringText.textContent = '3';

  const startTime = Date.now();
  resetInterval = window.setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / HOLD_DURATION, 1);
    ringFill.style.strokeDashoffset = String(CIRCUMFERENCE * (1 - progress));
    ringText.textContent = String(Math.ceil(3 * (1 - progress)));
    if (progress >= 1) {
      window.clearInterval(resetInterval!);
      resetInterval = null;
      executeReset();
    }
  }, 50);
}

function cancelResetHold() {
  if (resetInterval === null) return;
  window.clearInterval(resetInterval);
  resetInterval = null;
  $('reset-overlay').classList.remove('visible');
}

function executeReset() {
  state = defaultState();
  logData[0] = [];
  logData[1] = [];
  winFlashes.forEach((w) => w.classList.remove('active'));
  vBanners.forEach((v) => v.classList.remove('visible'));
  try {
    localStorage.removeItem('sr_log_0');
    localStorage.removeItem('sr_log_1');
  } catch {
    /* ignore */
  }
  saveState();
  $('reset-overlay').classList.remove('visible');
  render();
  playClickSound();
}

// ── WIRE UP EVENTS ───────────────────────────────────────────────────────────
function openLogOverlay(player: 0 | 1) {
  const body = $(`logFull${player + 1}`);
  body.innerHTML = '';
  for (const e of logData[player]) {
    const el = document.createElement('div');
    el.className = 'log-entry ' + (e.type || '');
    el.textContent = e.msg;
    body.appendChild(el);
  }
  $(`logOverlay${player + 1}`).classList.add('visible');
  playClickSound();
}

function closeLogOverlay(player: 0 | 1) {
  $(`logOverlay${player + 1}`).classList.remove('visible');
}

function wirePlayerEvents() {
  for (const i of [0, 1] as const) {
    const n = i + 1;
    $(`plus${n}`).addEventListener('click', () => changeDamage(i, 1));
    $(`minus${n}`).addEventListener('click', () => changeDamage(i, -1));
    $(`hplus${n}`).addEventListener('click', () => changeHeal(i, 1));
    $(`hminus${n}`).addEventListener('click', () => changeHeal(i, -1));
    $(`attack${n}`).addEventListener('click', () => attack(i));
    $(`healBtn${n}`).addEventListener('click', () => heal(i));
    $(`undo${n}`).addEventListener('click', () => undo(i));
    $(`logBtn${n}`).addEventListener('click', () => openLogOverlay(i));
    $(`logClose${n}`).addEventListener('click', () => closeLogOverlay(i));
  }
}

function wireResetEvents() {
  const seamCenter = $('seam-center');
  seamCenter.addEventListener('mousedown', (e) => {
    e.preventDefault();
    startResetHold();
  });
  seamCenter.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      startResetHold();
    },
    { passive: false },
  );
  seamCenter.addEventListener('mouseup', cancelResetHold);
  seamCenter.addEventListener('touchend', cancelResetHold);
  seamCenter.addEventListener('touchcancel', cancelResetHold);
  document.addEventListener('mouseup', cancelResetHold);
  document.addEventListener('touchend', cancelResetHold);

  $('modal-cancel').addEventListener('click', cancelResetHold);
  $('modal-confirm').addEventListener('click', executeReset);
}

// ── INIT ─────────────────────────────────────────────────────────────────────
startStarField();
wirePlayerEvents();
wireResetEvents();
document.addEventListener('dblclick', (e) => e.preventDefault());

render();
