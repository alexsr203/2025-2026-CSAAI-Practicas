const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
const sonidoMusicaFondo = new Audio('musica_espacial.mp3');
sonidoMusicaFondo.loop = true;
sonidoMusicaFondo.volume = 0.4;
const sonidoExplosion = new Audio('explosion.mp3');
sonidoExplosion.volume = 0.6;

// Configuración del juego
let puntuacion = 0;
let vidas = 3;
let energia = 100;
const COSTE_DISPARO = 25;
const RECARGA_ENERGIA = 0.4;
let juegoTerminado = false;

// Estado de teclas
const teclas = {};
document.addEventListener('keydown', (e) => teclas[e.code] = true);
document.addEventListener('keyup', (e) => teclas[e.code] = false);

// --- CLASES ---

class Jugador {
    constructor() {
        this.ancho = 50;
        this.alto = 30;
        this.x = canvas.width / 2 - this.ancho / 2;
        this.y = canvas.height - 40;
        this.velocidad = 5;
    }

    dibujar() {
        const imgNave = new Image();
        imgNave.src = 'nave1.png';
        ctx.drawImage(imgNave, this.x, this.y, this.ancho, this.alto);
    }

    actualizar() {
        if (teclas['ArrowLeft'] && this.x > 0) this.x -= this.velocidad;
        if (teclas['ArrowRight'] && this.x < canvas.width - this.ancho) this.x += this.velocidad;
        
        // Disparo con energía
        if (teclas['Space'] && energia >= COSTE_DISPARO) {
            disparosJugador.push(new Proyectil(this.x + this.ancho / 2, this.y, -7, '#fff'));
            energia -= COSTE_DISPARO;
            teclas['Space'] = false; // Evita ráfaga infinita
            // Aquí iría: sonidoLaser.play();
        }
        
        // Recarga automática
        if (energia < 100) energia = Math.min(100, energia + RECARGA_ENERGIA);
        document.getElementById('energy-fill').style.width = energia + '%';
    }
}

class Alien {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.ancho = 40;
        this.alto = 30;
        this.vivo = true;
    }

    dibujar() {
        const imgNave = new Image();
        imgNave.src = 'alien1.png';
        ctx.drawImage(imgNave, this.x, this.y, this.ancho, this.alto);
    }
}

class Proyectil {
    constructor(x, y, velY, color) {
        this.x = x;
        this.y = y;
        this.radio = 3;
        this.velY = velY;
        this.color = color;
    }
    dibujar() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
        ctx.fill();
    }
    actualizar() { this.y += this.velY; }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.frames = 15;
    }
    dibujar() {
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20 * (this.frames/15), 0, Math.PI*2);
        ctx.fill();
        this.frames--;
    }
}

// --- INSTANCIAS Y VARIABLES DE CONTROL ---
const jugador = new Jugador();
const disparosJugador = [];
const disparosEnemigos = [];
const explosiones = [];
let aliens = [];
let direccionAliens = 1;
let velocidadAliens = 0.5;

function inicializarAliens() {
    for (let fila = 0; fila < 3; fila++) {
        for (let col = 0; col < 8; col++) {
            aliens.push(new Alien(col * 60 + 50, fila * 50 + 50));
        }
    }
}

// --- BUCLE PRINCIPAL ---
function gameLoop() {
    if (juegoTerminado) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    jugador.actualizar();
    jugador.dibujar();

    // Actualizar disparos jugador
    disparosJugador.forEach((d, i) => {
        d.actualizar();
        d.dibujar();
        if (d.y < 0) disparosJugador.splice(i, 1);
    });

    // Actualizar disparos enemigos
    disparosEnemigos.forEach((d, i) => {
        d.actualizar();
        d.dibujar();
        // Colisión con jugador
        if (d.x > jugador.x && d.x < jugador.x + jugador.ancho &&
            d.y > jugador.y && d.y < jugador.y + jugador.alto) {
            disparosEnemigos.splice(i, 1);
            vidas--;
            document.getElementById('vidas').innerText = vidas;
            if (vidas <= 0) finalizarJuego(false);
        }
        if (d.y > canvas.height) disparosEnemigos.splice(i, 1);
    });

    // Mover y dibujar Aliens
    let cambiarDireccion = false;
    // Aumento de velocidad progresivo:
    let factorVelocidad = 1 + (24 - aliens.length) * 0.15;

    aliens.forEach(a => {
        a.x += direccionAliens * velocidadAliens * factorVelocidad;
        a.dibujar();
        if (a.x > canvas.width - a.ancho || a.x < 0) cambiarDireccion = true;
        
        // Si el alien toca al jugador
        if (a.y + a.alto > jugador.y) finalizarJuego(false);

        // Disparo enemigo aleatorio (aprox 1 vez por segundo)
        if (Math.random() < 0.005) {
            disparosEnemigos.push(new Proyectil(a.x + a.ancho/2, a.y + a.alto, 4, 'red'));
        }
    });

    if (cambiarDireccion) {
        direccionAliens *= -1;
        aliens.forEach(a => a.y += 10);
    }

    // Colisiones proyectil-alien
    disparosJugador.forEach((d, di) => {
        aliens.forEach((a, ai) => {
            if (d.x > a.x && d.x < a.x + a.ancho && d.y > a.y && d.y < a.y + a.alto) {
                sonidoExplosion.currentTime = 0; 
                sonidoExplosion.play();
                explosiones.push(new Explosion(a.x + a.ancho/2, a.y + a.alto/2));
                aliens.splice(ai, 1);
                disparosJugador.splice(di, 1);
                puntuacion += 10;
                document.getElementById('puntuacion').innerText = puntuacion;
                // Aquí iría: sonidoExplosion.play();
                if (aliens.length === 0) finalizarJuego(true);
            }
        });
    });

    // Explosiones
    explosiones.forEach((e, i) => {
        e.dibujar();
        if (e.frames <= 0) explosiones.splice(i, 1);
    });

    requestAnimationFrame(gameLoop);
}

function finalizarJuego(victoria) {
    juegoTerminado = true;
    const msg = document.getElementById('mensaje-final');
    msg.classList.remove('hidden');
    msg.innerHTML = victoria ? "VICTORIA EN CENTAURI" : "GAME OVER - TIERRA ANIQUILADA";
    msg.style.color = victoria ? "#00ff00" : "#ff0000";
}

// Iniciar
inicializarAliens();
gameLoop();