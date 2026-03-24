// --- VARIABLES DE ESTADO ---
let claveSecreta = [];
let intentosRestantes = 7;
let aciertos = 0;
let juegoActivo = false;
let timerInterval = null;
let tiempoCentisegundos = 0;

// --- ELEMENTOS DEL DOM ---
const displayCrono = document.getElementById('cronometro');
const displayIntentos = document.getElementById('intentos');
const mensajeConsola = document.getElementById('mensaje-consola');
const slotsClave = [
    document.getElementById('d0'),
    document.getElementById('d1'),
    document.getElementById('d2'),
    document.getElementById('d3')
];
const botonesNumericos = document.querySelectorAll('.btn-num');

// --- FUNCIONES DEL CRONÓMETRO ---
function actualizarCrono() {
    tiempoCentisegundos++;
    
    let totalSegundos = Math.floor(tiempoCentisegundos / 100);
    let centis = tiempoCentisegundos % 100;
    let mins = Math.floor(totalSegundos / 60);
    let segs = totalSegundos % 60;

    // Formato 0:00:00 (Minutos:Segundos:Centésimas)
    displayCrono.innerText = `${mins}:${segs.toString().padStart(2, '0')}:${centis.toString().padStart(2, '0')}`;
}

function start() {
    if (!timerInterval) {
        timerInterval = setInterval(actualizarCrono, 10);
        juegoActivo = true;
        mensajeConsola.innerText = "Juego en marcha...";
    }
}

function stop() {
    clearInterval(timerInterval);
    timerInterval = null;
    juegoActivo = false;
}

// --- LÓGICA DEL JUEGO ---

function generarClaveUnica() {
    let opciones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    let resultado = [];
    for (let i = 0; i < 4; i++) {
        let indiceAleatorio = Math.floor(Math.random() * opciones.length);
        resultado.push(opciones[indiceAleatorio]);
        opciones.splice(indiceAleatorio, 1); // Elimina para no repetir
    }
    return resultado;
}

function reset() {
    stop();
    // Reiniciar valores
    claveSecreta = generarClaveUnica();
    intentosRestantes = 7;
    aciertos = 0;
    tiempoCentisegundos = 0;
    
    // Reiniciar UI
    displayCrono.innerText = "0:00:00";
    displayIntentos.innerText = intentosRestantes;
    mensajeConsola.innerText = "Nueva partida preparada. Pulsa Start o un número.";
    
    slotsClave.forEach(slot => {
        slot.innerText = "*";
        slot.classList.remove('acierto');
    });

    botonesNumericos.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('usado');
    });
}

function presionarCifra(num, botonElemento) {
    // Si el juego no ha empezado, arranca el crono automáticamente
    if (!timerInterval) {
        start();
    }

    // 1. Consumir intento y marcar botón
    intentosRestantes--;
    displayIntentos.innerText = intentosRestantes;
    botonElemento.disabled = true;
    botonElemento.classList.add('usado');

    // 2. Comprobar acierto
    let haAcertadoAlgo = false;
    claveSecreta.forEach((digito, index) => {
        if (digito === num) {
            slotsClave[index].innerText = num;
            slotsClave[index].classList.add('acierto');
            aciertos++;
            haAcertadoAlgo = true;
        }
    });

    if (haAcertadoAlgo) {
        mensajeConsola.innerText = `Has acertado el número ${num}. ¡Sigue así!`;
    } else {
        mensajeConsola.innerText = `El número ${num} no está en la clave.`;
    }

    // 3. Verificar condiciones de fin
    verificarFinDeJuego();
}

function verificarFinDeJuego() {
    // VICTORIA
    if (aciertos === 4) {
        stop();
        bloquearBotones();
        mensajeConsola.innerHTML = `
            <strong>¡VICTORIA!</strong><br>
            Tiempo empleado: ${displayCrono.innerText}<br>
            Intentos consumidos: ${7 - intentosRestantes}<br>
            Intentos restantes: ${intentosRestantes}
        `;
    } 
    // DERROTA
    else if (intentosRestantes === 0) {
        stop();
        bloquearBotones();
        // Mostrar la clave correcta al perder
        claveSecreta.forEach((digito, index) => {
            slotsClave[index].innerText = digito;
        });
        mensajeConsola.innerHTML = `
            <span style="color: #ff4500;">¡BOOM! HAS PERDIDO.</span><br>
            La clave era: ${claveSecreta.join('')}.<br>
            Pulsa Reset para jugar otra vez.
        `;
    }
}

function bloquearBotones() {
    botonesNumericos.forEach(btn => btn.disabled = true);
}

// --- ASIGNACIÓN DE EVENTOS ---

botonesNumericos.forEach(btn => {
    btn.onclick = function() {
        presionarCifra(parseInt(this.innerText), this);
    };
});

document.getElementById('btn-start').onclick = start;
document.getElementById('btn-stop').onclick = stop;
document.getElementById('btn-reset').onclick = reset;

// Inicialización al cargar la página
window.onload = reset;