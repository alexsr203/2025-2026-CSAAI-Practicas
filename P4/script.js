// --- DATOS Y CONFIGURACIÓN ---
// Uso de emojis para representar las palabras
const DICTIONARY = {
    'casa_cama':  [{ word: 'CASA', icon: '🏠' }, { word: 'CAMA', icon: '🛏️' }],
    'pato_gato':  [{ word: 'PATO', icon: '🦆' }, { word: 'GATO', icon: '🐈' }],
    'queso_beso': [{ word: 'QUESO', icon: '🧀' }, { word: 'BESO', icon: '💋' }],
    'luna_cuna':  [{ word: 'LUNA', icon: '🌙' }, { word: 'CUNA', icon: '🍼' }]
};

const LEVELS = {
    1: { speed: 1200, pattern: [0,0,0,0,1,1,1,1] }, // Agrupados, lento
    2: { speed: 900,  pattern: [0,0,1,1,0,0,1,1] }, // Pares, velocidad media
    3: { speed: 650,  pattern: [0,1,0,1,0,1,0,1] }, // Alternos, rápido
    4: { speed: 450,  pattern: [1,0,0,1,1,0,0,1] }, // Mezclados, muy rápido
    5: { speed: 300,  pattern: [0,1,1,0,1,0,0,1] }  // Caótico, velocidad extrema
};

// --- ESTADO DEL JUEGO ---
const state = {
    isPlaying: false,
    currentLevel: 1,
    currentStep: 0,
    timeElapsed: 0,
    musicEnabled: false,
    gameInterval: null,
    timerInterval: null
};

// --- REFERENCIAS AL DOM ---
const DOM = {
    btnStart: document.getElementById('btn-start'),
    btnStop: document.getElementById('btn-stop'),
    btnMusic: document.getElementById('btn-music'),
    selSequence: document.getElementById('sequence-select'),
    selLevel: document.getElementById('level-select'),
    dispLevel: document.getElementById('display-level'),
    dispTime: document.getElementById('display-time'),
    dispStatus: document.getElementById('display-status'),
    dispWord: document.getElementById('active-word-display'),
    grid: document.getElementById('grid-container'),
    audio: document.getElementById('bg-music')
};

// --- INICIALIZACIÓN ---
function init() {
    setupEventListeners();
    renderGrid(); // Render inicial en vacío/estado base
}

function setupEventListeners() {
    DOM.btnStart.addEventListener('click', startGame);
    DOM.btnStop.addEventListener('click', stopGame);
    DOM.btnMusic.addEventListener('click', toggleMusic);
    DOM.selSequence.addEventListener('change', renderGrid);
}

// --- LÓGICA PRINCIPAL DEL JUEGO ---

function startGame() {
    if (state.isPlaying) return;

    // Bloquear controles y actualizar estado
    state.isPlaying = true;
    state.currentLevel = parseInt(DOM.selLevel.value, 10);
    state.timeElapsed = 0;
    
    toggleControls(true);
    DOM.dispStatus.textContent = "¡Jugando!";
    DOM.dispTime.textContent = "0.0s";
    
    if (state.musicEnabled) DOM.audio.play().catch(e => console.log("Audio bloqueado por navegador", e));

    startTimer();
    runLevel();
}

function stopGame() {
    state.isPlaying = false;
    clearInterval(state.gameInterval);
    clearInterval(state.timerInterval);
    
    toggleControls(false);
    DOM.dispStatus.textContent = "Detenido";
    DOM.dispWord.textContent = "Juego Pausado";
    DOM.audio.pause();
    
    clearActiveCards();
}

function runLevel() {
    if (!state.isPlaying) return;
    if (state.currentLevel > 5) {
        endGame();
        return;
    }

    state.currentStep = 0;
    DOM.dispLevel.textContent = `${state.currentLevel}/5`;
    DOM.dispStatus.textContent = `Preparando Nivel ${state.currentLevel}...`;
    DOM.dispWord.textContent = "¡Atento!";
    
    renderGrid(); // Renderiza el patrón correspondiente al nivel actual

    // Pausa breve antes de arrancar la ronda
    setTimeout(() => {
        if (!state.isPlaying) return;
        DOM.dispStatus.textContent = "Secuencia activa";
        const levelData = LEVELS[state.currentLevel];
        
        state.gameInterval = setInterval(tickSequence, levelData.speed);
    }, 1500);
}

function tickSequence() {
    clearActiveCards();

    // Si ya recorrimos las 8 imágenes, terminamos el nivel
    if (state.currentStep >= 8) {
        clearInterval(state.gameInterval);
        state.currentLevel++;
        runLevel(); // Lanza el siguiente nivel
        return;
    }

    // Iluminar la tarjeta actual
    const cards = document.querySelectorAll('.card');
    const currentCard = cards[state.currentStep];
    currentCard.classList.add('active');

    // Actualizar la palabra central grande
    const words = DICTIONARY[DOM.selSequence.value];
    const patternType = LEVELS[state.currentLevel].pattern[state.currentStep];
    DOM.dispWord.textContent = words[patternType].word;

    state.currentStep++;
}

function endGame() {
    stopGame();
    DOM.dispStatus.textContent = "¡Completado!";
    DOM.dispWord.textContent = `¡Victoria en ${state.timeElapsed.toFixed(1)}s!`;
}

// --- RENDERIZADO Y UTILIDADES ---

function renderGrid() {
    DOM.grid.innerHTML = '';
    const words = DICTIONARY[DOM.selSequence.value];
    const levelData = LEVELS[state.currentLevel] || LEVELS[1]; // Por si no hay nivel activo
    
    // Generamos las 8 tarjetas basadas en el patrón del nivel
    levelData.pattern.forEach((typeIndex) => {
        const item = words[typeIndex];
        const card = document.createElement('div');
        card.className = `card type-${typeIndex}`;
        
        card.innerHTML = `
            <div class="icon">${item.icon}</div>
            <div class="word">${item.word}</div>
        `;
        DOM.grid.appendChild(card);
    });
}

function clearActiveCards() {
    document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
}

function startTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(() => {
        state.timeElapsed += 0.1;
        DOM.dispTime.textContent = `${state.timeElapsed.toFixed(1)}s`;
    }, 100);
}

function toggleControls(isDisabled) {
    DOM.selSequence.disabled = isDisabled;
    DOM.selLevel.disabled = isDisabled;
    DOM.btnStart.disabled = isDisabled;
    DOM.btnStop.disabled = !isDisabled;
}

function toggleMusic() {
    state.musicEnabled = !state.musicEnabled;
    DOM.btnMusic.textContent = state.musicEnabled ? "🎵 Música: ON" : "🎵 Música: OFF";
    
    if (state.isPlaying) {
        if (state.musicEnabled) DOM.audio.play();
        else DOM.audio.pause();
    }
}

// Arrancar
init();