/**
 * Arquitectura de Juego Bot League
 * Implementa física de vectores simple, detección de colisiones circulares
 * y una máquina de estados finitos básica.
 */

// Referencias al DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const screens = {
    menu: document.getElementById('menu-screen'),
    hud: document.getElementById('hud'),
    message: document.getElementById('message-screen'),
    gameOver: document.getElementById('game-over-screen')
};
const elements = {
    scorePlayer: document.getElementById('score-player'),
    scoreEnemy: document.getElementById('score-enemy'),
    mainMsg: document.getElementById('main-message'),
    endTitle: document.getElementById('end-title')
};

// Configuración Global y Estados
const STATE = { MENU: 0, COUNTDOWN: 1, PLAYING: 2, GOAL: 3, END: 4 };
let currentState = STATE.MENU;
let gameMode = '3_GOALS'; // '3_GOALS' o 'GOLDEN'
let score = { player: 0, bot: 0 };

// Controladores
const keys = { w: false, a: false, s: false, d: false, space: false };

// Entidades del Juego
const goalWidth = 150;
const goalDepth = 20;

let player = { x: 200, y: 300, vx: 0, vy: 0, speed: 4, radius: 15, color: '#3498db' };
let bot = { x: 600, y: 300, vx: 0, vy: 0, speed: 2.5, radius: 15, color: '#e74c3c' }; // Bot es algo más lento
let ball = { x: 400, y: 300, vx: 0, vy: 0, radius: 10, color: '#ecf0f1', friction: 0.96 };

// Event Listeners (Teclado)
window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ') keys.space = true;
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ') keys.space = false;
});

// Botones UI
document.getElementById('btn-3goals').addEventListener('click', () => startGame('3_GOALS'));
document.getElementById('btn-golden').addEventListener('click', () => startGame('GOLDEN'));
document.getElementById('btn-restart').addEventListener('click', backToMenu);

// ================= FÍSICA Y LÓGICA ================= //

function resetPositions() {
    player.x = 200; player.y = 300; player.vx = 0; player.vy = 0;
    bot.x = 600; bot.y = 300; bot.vx = 0; bot.vy = 0;
    ball.x = 400; ball.y = 300; ball.vx = 0; ball.vy = 0;
}

function startGame(mode) {
    gameMode = mode;
    score = { player: 0, bot: 0 };
    updateHUD();
    screens.menu.classList.add('hidden');
    screens.gameOver.classList.add('hidden');
    screens.hud.classList.remove('hidden');
    resetPositions();
    startCountdown();
}

function startCountdown() {
    currentState = STATE.COUNTDOWN;
    screens.message.classList.remove('hidden');
    let count = 3;
    elements.mainMsg.innerText = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.mainMsg.innerText = count;
        } else if (count === 0) {
            elements.mainMsg.innerText = "¡YA!";
        } else {
            clearInterval(interval);
            screens.message.classList.add('hidden');
            currentState = STATE.PLAYING;
        }
    }, 1000);
}

function handleGoal(scorer) {
    currentState = STATE.GOAL;
    if (scorer === 'player') score.player++;
    if (scorer === 'bot') score.bot++;
    updateHUD();

    screens.message.classList.remove('hidden');
    elements.mainMsg.innerText = scorer === 'player' ? '¡GOOOL!' : '¡Gol Rival!';

    setTimeout(() => {
        if (checkWinCondition()) {
            endGame(scorer === 'player');
        } else {
            screens.message.classList.add('hidden');
            resetPositions();
            startCountdown();
        }
    }, 2000);
}

function checkWinCondition() {
    if (gameMode === 'GOLDEN' && (score.player > 0 || score.bot > 0)) return true;
    if (gameMode === '3_GOALS' && (score.player >= 3 || score.bot >= 3)) return true;
    return false;
}

function endGame(playerWon) {
    currentState = STATE.END;
    screens.message.classList.add('hidden');
    screens.hud.classList.add('hidden');
    screens.gameOver.classList.remove('hidden');
    elements.endTitle.innerText = playerWon ? '¡Victoria!' : 'Derrota';
    elements.endTitle.style.color = playerWon ? '#2ecc71' : '#e74c3c';
}

function backToMenu() {
    screens.gameOver.classList.add('hidden');
    screens.menu.classList.remove('hidden');
    currentState = STATE.MENU;
}

function updateHUD() {
    elements.scorePlayer.innerText = score.player;
    elements.scoreEnemy.innerText = score.bot;
}

// Detección de colisión circular (Teorema de Pitágoras)
function resolveCollision(entity1, entity2, isBall = false) {
    const dx = entity2.x - entity1.x;
    const dy = entity2.y - entity1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = entity1.radius + entity2.radius;

    if (distance < minDistance) {
        // Normalizamos el vector de colisión
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Separamos las entidades para evitar que se queden "pegadas"
        const overlap = minDistance - distance;
        
        if (isBall) {
            // Empuje a la pelota
            entity2.x += nx * overlap;
            entity2.y += ny * overlap;
            
            // Transferencia de inercia (simplificada)
            const speedTransfer = Math.sqrt(entity1.vx**2 + entity1.vy**2) * 0.5;
            entity2.vx += nx * speedTransfer + (nx * 2); // Rebote base
            entity2.vy += ny * speedTransfer + (ny * 2);
        } else {
            // Colisión entre personajes (pesos iguales)
            entity1.x -= nx * (overlap / 2);
            entity1.y -= ny * (overlap / 2);
            entity2.x += nx * (overlap / 2);
            entity2.y += ny * (overlap / 2);
        }
    }
}

function updatePhysics() {
    if (currentState !== STATE.PLAYING) return;

    // 1. Movimiento del Jugador
    player.vx = 0; player.vy = 0;
    if (keys.w) player.vy = -player.speed;
    if (keys.s) player.vy = player.speed;
    if (keys.a) player.vx = -player.speed;
    if (keys.d) player.vx = player.speed;

    // Normalizar vector diagonal para que no se mueva más rápido en diagonal
    if (player.vx !== 0 && player.vy !== 0) {
        player.vx *= Math.SQRT1_2;
        player.vy *= Math.SQRT1_2;
    }

    player.x += player.vx;
    player.y += player.vy;

    // 2. IA del Bot (Comportamiento de persecución básico)
    const dxBotBall = ball.x - bot.x;
    const dyBotBall = ball.y - bot.y;
    const distBotBall = Math.sqrt(dxBotBall**2 + dyBotBall**2);
    
    if (distBotBall > 0) {
        bot.vx = (dxBotBall / distBotBall) * bot.speed;
        bot.vy = (dyBotBall / distBotBall) * bot.speed;
    }
    bot.x += bot.vx;
    bot.y += bot.vy;

    // 3. Chute del Jugador (Si pulsa Espacio cerca de la pelota)
    if (keys.space) {
        const dx = ball.x - player.x;
        const dy = ball.y - player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < player.radius + ball.radius + 15) { // Rango de chute
            ball.vx += (dx / dist) * 10;
            ball.vy += (dy / dist) * 10;
            keys.space = false; // Evitar "ametralladora" de chutes
        }
    }

    // 4. Física de la Pelota
    ball.vx *= ball.friction;
    ball.vy *= ball.friction;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // 5. Colisiones entre entidades
    resolveCollision(player, bot);
    resolveCollision(player, ball, true);
    resolveCollision(bot, ball, true);

    // 6. Límites del campo (Paredes)
    const constrainEntity = (ent) => {
        if (ent.y < ent.radius) { ent.y = ent.radius; ent.vy *= -0.8; }
        if (ent.y > canvas.height - ent.radius) { ent.y = canvas.height - ent.radius; ent.vy *= -0.8; }
        
        // Límites laterales (excluyendo zona de portería)
        const inGoalY = ent.y > (canvas.height/2 - goalWidth/2) && ent.y < (canvas.height/2 + goalWidth/2);
        
        if (!inGoalY) {
            if (ent.x < ent.radius) { ent.x = ent.radius; ent.vx *= -0.8; }
            if (ent.x > canvas.width - ent.radius) { ent.x = canvas.width - ent.radius; ent.vx *= -0.8; }
        }
    };

    constrainEntity(player);
    constrainEntity(bot);
    constrainEntity(ball);

    // 7. Detección de Goles
    if (ball.x < 0) {
        handleGoal('bot');
    } else if (ball.x > canvas.width) {
        handleGoal('player');
    }
}

// ================= RENDERIZADO ================= //

// ================== CÓDIGO CORREGIDO ==================

function drawField() {
    ctx.fillStyle = '#2e7d32'; // Un verde más similar al de tu imagen
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#cccccc'; // Líneas en gris claro/blanco
    ctx.lineWidth = 3;

    // 1. Bordes del campo
    ctx.beginPath();
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.stroke(); // Cerramos el trazo del borde

    // 2. Línea central (Restaurada)
    ctx.beginPath(); // Aislamos el trazo
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke(); // Dibujamos solo esta línea

    // 3. Círculo central
    ctx.beginPath(); // Volvemos a aislar
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke(); // Dibujamos solo el círculo

    // 4. Porterías
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    
    // Portería Izquierda
    ctx.fillRect(0, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
    ctx.strokeRect(0, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);

    // Portería Derecha
    ctx.fillRect(canvas.width - goalDepth, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
    ctx.strokeRect(canvas.width - goalDepth, canvas.height / 2 - goalWidth / 2, goalDepth, goalWidth);
}

function drawEntity(entity) {
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fillStyle = entity.color;
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawField();
    
    // Solo dibujamos las entidades si no estamos en el menú principal
    if (currentState !== STATE.MENU) {
        drawEntity(player);
        drawEntity(bot);
        
        // Dibujo específico de la pelota
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
        
        // Indicador de orientación del jugador (hacia dónde se movió por última vez)
        if (player.vx !== 0 || player.vy !== 0) {
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            const angle = Math.atan2(player.vy, player.vx);
            ctx.lineTo(player.x + Math.cos(angle) * (player.radius + 10), player.y + Math.sin(angle) * (player.radius + 10));
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

function gameLoop() {
    updatePhysics();
    render();
    requestAnimationFrame(gameLoop); // Bucle infinito sincronizado con el monitor
}

// Iniciar el renderizado
gameLoop();