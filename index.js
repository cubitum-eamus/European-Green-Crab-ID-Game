// --- GAME CONSTANTS ---
const GAME_DURATION = 60; // Seconds
const NUM_CRABS_PER_ROUND = 4;

const CRAB_TYPES = [
  {
    name: 'European Green Crab (EGC)',
    isEGC: true,
    spines: 5,
    imageUrl: './img/egC.png',
    fallbackText: 'EGC'
  },
  {
    name: 'Dungeness Crab',
    isEGC: false,
    spines: 9,
    imageUrl: './img/dc.png',
    fallbackText: 'Dungeness'
  },
  {
    name: 'Red Rock Crab',
    isEGC: false,
    spines: 9,
    imageUrl: './img/rrc.png',
    fallbackText: 'Red Rock'
  },
  {
    name: 'Kelp Crab',
    isEGC: false,
    spines: 3,
    imageUrl: './img/kc.png',
    fallbackText: 'Kelp Crab'
  }
];

// --- GAME STATE ---
let state = {
  score: 0,
  rounds: 0,
  timeLeft: GAME_DURATION,
  isRunning: false,
  crabs: [],
  animationFrameId: null,
  timerIntervalId: null,
  lastTime: 0,
  gameAreaWidth: 0,
  gameAreaHeight: 0,
  roundComplete: false,
};

// --- DOM ELEMENTS ---
const gameArea = document.getElementById('game-area');
const scoreDisplay = document.getElementById('score-display');
const timerDisplay = document.getElementById('timer-display');
const roundDisplay = document.getElementById('round-display');
const startRestartBtn = document.getElementById('start-restart-btn');
const instructions = document.getElementById('instructions');

// --- UTILITY FUNCTIONS ---
function updateDisplay() {
  state.timeLeft = Math.max(0, state.timeLeft);
  timerDisplay.textContent = `${state.timeLeft.toFixed(0)}s`;
  roundDisplay.textContent = state.rounds;

  // Цвет score
  if (state.score > 0) {
    scoreDisplay.classList.remove('text-red-400', 'text-yellow-300');
    scoreDisplay.classList.add('text-green-400');
  } else if (state.score < 0) {
    scoreDisplay.classList.remove('text-green-400', 'text-yellow-300');
    scoreDisplay.classList.add('text-red-400');
  } else {
    scoreDisplay.classList.remove('text-green-400', 'text-red-400');
    scoreDisplay.classList.add('text-yellow-300');
  }

  const oldScore = parseInt(scoreDisplay.dataset.oldScore || 0);
  const oldRound = parseInt(roundDisplay.dataset.oldRound || 0);
  const oldTimer = parseInt(timerDisplay.dataset.oldTimer || 0);

  const diff = state.score - oldScore;
  const roundDiff = state.rounds - oldRound;
  const timerDiff = state.timeLeft - oldTimer;

  // --- Анимация score ---
  if (diff !== 0) {
    scoreDisplay.textContent = state.score;
    scoreDisplay.style.transition = 'transform 0.3s ease-out';
    scoreDisplay.style.transform = `scale(1.25) rotate(${diff > 0 ? 5 : -5}deg)`;
    setTimeout(() => {
      scoreDisplay.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
  } else {
    scoreDisplay.textContent = state.score;
  }

  // --- Анимация round ---
  if (roundDiff !== 0) {
    roundDisplay.textContent = state.rounds;
    roundDisplay.style.transition = 'transform 0.3s ease-out';
    roundDisplay.style.transform = `scale(1.25)`;
    setTimeout(() => {
      roundDisplay.style.transform = 'scale(1)';
    }, 300);
  }

  // --- Анимация timer если < 10 ---
  if (state.timeLeft < 10 && timerDiff !== 0) {
    timerDisplay.textContent = `${state.timeLeft.toFixed(0)}s`;
    timerDisplay.style.transition = 'transform 0.3s ease-out';
    timerDisplay.style.transform = 'scale(1.25)';
    setTimeout(() => {
      timerDisplay.style.transform = 'scale(1)';
    }, 300);
  }

  // --- Сохраняем старые значения ---
  roundDisplay.dataset.oldRound = state.rounds;
  scoreDisplay.dataset.oldScore = state.score;
  timerDisplay.dataset.oldTimer = state.timeLeft;
}

// --- GAME LOGIC ---
function generateCrabData(crabType) {
  const crabElSize = window.innerWidth > 768 ? 100 : 75;
  const maxW = state.gameAreaWidth - crabElSize;
  const maxH = state.gameAreaHeight - crabElSize;

  return {
    ...crabType,
    id: Math.random().toString(36).substring(2, 9),
    size: crabElSize,
    x: Math.random() * maxW,
    y: Math.random() * maxH,
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 60,
    scale: 1, // добавляем scale для hover
  };
}

function startRound() {
  if (!state.isRunning) return;

  state.rounds++;
  state.roundComplete = false;

  gameArea.querySelectorAll('.crab-image').forEach(el => el.remove());
  state.crabs = [];

  const egcType = CRAB_TYPES.find(c => c.isEGC);
  state.crabs.push(generateCrabData(egcType));

  const nativeTypes = CRAB_TYPES.filter(c => !c.isEGC);
  const shuffledNatives = nativeTypes.sort(() => 0.5 - Math.random());

  for (let i = 0; i < Math.min(NUM_CRABS_PER_ROUND - 1, nativeTypes.length); i++) {
    state.crabs.push(generateCrabData(shuffledNatives[i]));
  }

  state.crabs.sort(() => 0.5 - Math.random());

  renderCrabs();
  updateDisplay();
}

function handleCrabClick(event) {
  if (!state.isRunning || state.roundComplete) return;
  state.roundComplete = true;

  const crabId = event.currentTarget.dataset.id;
  const clickedCrab = state.crabs.find(c => c.id === crabId);
  const crabEl = event.currentTarget;

  if (clickedCrab) {
    if (clickedCrab.isEGC) {
      state.score += 1;
      crabEl.classList.add('feedback-win');
    } else {
      state.score -= 1;
      crabEl.classList.add('feedback-lose');
      const correctEGC = gameArea.querySelector('.egc-target');
      if (correctEGC) correctEGC.classList.add('feedback-win');
    }

    updateDisplay();

    setTimeout(() => {
      startRound();
    }, 400);
  }
}

function renderCrabs() {
  gameArea.querySelectorAll('.crab-image').forEach(el => el.remove());

  state.crabs.forEach(crab => {
    const crabEl = document.createElement('img');
    crabEl.className = 'crab-image';
    if (crab.isEGC) crabEl.classList.add('egc-target');

    crabEl.src = crab.imageUrl;
    crabEl.title = `${crab.name} (${crab.spines} Spines)`;
    crabEl.alt = crab.fallbackText;
    crabEl.dataset.id = crab.id;

    crabEl.style.width = `${crab.size}px`;
    crabEl.style.height = `${crab.size}px`;
    crabEl.style.transform = `translate(${crab.x}px, ${crab.y}px) scale(${crab.scale})`;
    crabEl.style.transition = 'transform 0.1s ease-in-out, z-index 0.1s';

    // Hover
    crabEl.addEventListener("mouseenter", () => { crab.scale = 1.25; });
    crabEl.addEventListener("mouseleave", () => { crab.scale = 1; });
    crabEl.addEventListener("click", () => { crab.scale = 0.85; })

    crabEl.addEventListener('click', handleCrabClick);

    crabEl.onerror = function () {
      this.outerHTML = `<div class="crab-image flex items-center justify-center text-xs ${this.classList.contains('egc-target') ? 'egc-target' : ''}" style="width: ${crab.size}px; height: ${crab.size}px; transform: translate(${crab.x}px, ${crab.y}px) scale(1);" data-id="${crab.id}" title="${crab.name}">${crab.fallbackText}</div>`;

      const newEl = gameArea.querySelector(`[data-id="${crab.id}"]`);
      if (newEl) {
        newEl.addEventListener('click', handleCrabClick);
        newEl.addEventListener("mouseenter", () => { crab.scale = 1.25; });
        newEl.addEventListener("mouseleave", () => { crab.scale = 1; });
      }
    };

    gameArea.appendChild(crabEl);
  });
}

function animate(timestamp) {
  if (!state.isRunning) return;

  if (state.lastTime === 0) state.lastTime = timestamp;
  const deltaTime = (timestamp - state.lastTime) / 1000;
  state.lastTime = timestamp;

  const maxW = state.gameAreaWidth - (state.crabs[0]?.size || 100);
  const maxH = state.gameAreaHeight - (state.crabs[0]?.size || 100);
  const friction = 0.999;

  state.crabs.forEach(crab => {
    crab.x += crab.vx * deltaTime;
    crab.y += crab.vy * deltaTime;

    if (crab.x < 0) { crab.vx *= -1; crab.x = 0; }
    else if (crab.x > maxW) { crab.vx *= -1; crab.x = maxW; }

    if (crab.y < 0) { crab.vy *= -1; crab.y = 0; }
    else if (crab.y > maxH) { crab.vy *= -1; crab.y = maxH; }

    if (Math.random() < 0.005) {
      crab.vx = (Math.random() - 0.5) * 60;
      crab.vy = (Math.random() - 0.5) * 60;
    }

    crab.vx *= friction;
    crab.vy *= friction;

    const crabEl = gameArea.querySelector(`[data-id="${crab.id}"]`);
    if (crabEl) {
      crabEl.style.transform = `translate(${crab.x}px, ${crab.y}px) scale(${crab.scale})`;
      crabEl.style.zIndex = crab.scale > 1 ? 10 : 1;
    }
  });

  state.animationFrameId = requestAnimationFrame(animate);
}

function startGame() {
  instructions.classList.add('hidden');
  startRestartBtn.disabled = true;
  startRestartBtn.textContent = "Game In Progress...";
  startRestartBtn.classList.remove('bg-green-500', 'hover:bg-green-600', 'bg-teal-600', 'hover:bg-teal-700');
  startRestartBtn.classList.add('bg-gray-500');

  const rect = gameArea.getBoundingClientRect();
  state.gameAreaWidth = rect.width;
  state.gameAreaHeight = rect.height;

  state.score = 0;
  state.rounds = 0;
  state.timeLeft = GAME_DURATION;
  state.isRunning = true;
  state.lastTime = 0;

  updateDisplay();
  startRound();

  if (state.timerIntervalId) clearInterval(state.timerIntervalId);
  if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);

  state.animationFrameId = requestAnimationFrame(animate);

  state.timerIntervalId = setInterval(() => {
    state.timeLeft -= 1;
    updateDisplay();
    if (state.timeLeft <= 0) endGame();
  }, 1000);
}

function endGame() {
  state.isRunning = false;
  clearInterval(state.timerIntervalId);
  cancelAnimationFrame(state.animationFrameId);
  gameArea.querySelectorAll('.crab-image').forEach(el => el.remove());

  instructions.classList.remove('hidden');
  instructions.querySelector('p').innerHTML = `
    TIME UP! Final Score: <span class="font-bold">${state.score}</span> over ${state.rounds} rounds.
    <br>
    Click 'Play Again!' to restart.
  `;

  startRestartBtn.disabled = false;
  startRestartBtn.classList.remove('bg-gray-500');
  startRestartBtn.classList.add('bg-teal-600', 'hover:bg-teal-700');
  startRestartBtn.innerHTML = `
    Play Again! <span class="font-normal text-sm ml-2">(${state.rounds} Rounds, Score: ${state.score})</span>
  `;
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  const rect = gameArea.getBoundingClientRect();
  state.gameAreaWidth = rect.width;
  state.gameAreaHeight = rect.height;

  startRestartBtn.addEventListener('click', startGame);
  updateDisplay();
});

window.addEventListener('resize', () => {
  const rect = gameArea.getBoundingClientRect();
  state.gameAreaWidth = rect.width;
  state.gameAreaHeight = rect.height;
});

