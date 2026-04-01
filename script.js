let players = [], ballOwnerId = null, currentRound = 1, currentHalf = 1, lastTeam = null, history = [];
let timerInterval, seconds = 0, timerRunning = false;

// --- DADO E INICIALIZAÇÃO ---
function roll1d20() { 
    document.getElementById('p-init').value = Math.floor(Math.random() * 20) + 1; 
}

function addPlayer() {
    const n = document.getElementById('p-name'), 
          t = document.getElementById('p-team'), 
          i = document.getElementById('p-init');
    if (n.value) {
        players.push({ id: Date.now(), name: n.value, team: t.value, init: parseInt(i.value) || 0, finished: false });
        n.value = ''; 
        i.value = ''; 
        render();
    }
}

// --- CONTROLE DO TEMPO ---
function toggleTimer() {
    timerRunning = !timerRunning;
    const btn = document.getElementById('btn-timer');
    if (timerRunning) {
        btn.innerText = "PAUSAR JOGO"; 
        btn.style.background = "#ff4d4d"; 
        btn.style.color = "white";
        timerInterval = setInterval(() => { seconds++; updateTimer(); }, 1000);
    } else {
        btn.innerText = "RETOMAR JOGO"; 
        btn.style.background = "#38b000"; 
        clearInterval(timerInterval);
    }
}

function updateTimer() {
    const m = Math.floor(seconds/60).toString().padStart(2,'0'), 
          s = (seconds%60).toString().padStart(2,'0');
    document.getElementById('timer').innerText = `${m}:${s}`;
}

// --- LÓGICA DO TURNO ---
function sortList() { 
    save(); 
    players.sort((a, b) => b.init - a.init); 
    players.forEach(p => p.finished = false); 
    lastTeam = null; 
    render(); 
}

function nextTurn() {
    if (players.length === 0) return;
    save();
    let allowedTeam = lastTeam === 'A' ? 'B' : (lastTeam === 'B' ? 'A' : null);
    
    let actor = players.find(p => !p.finished && p.id === ballOwnerId && (allowedTeam === null || p.team === allowedTeam));
    if (!actor) actor = players.find(p => !p.finished && (allowedTeam === null || p.team === allowedTeam));
    if (!actor) actor = players.find(p => !p.finished);
    
    if (actor) { 
        actor.finished = true; 
        lastTeam = actor.team; 
    }

    if (players.every(p => p.finished)) {
        currentRound++; 
        players.forEach(p => p.finished = false); 
        lastTeam = null;
        if (currentRound > 10) {
            if (currentHalf === 1) { 
                alert("Intervalo! Role 1d5 para descanso."); 
                currentHalf = 2; 
                currentRound = 1; 
                seconds = 0; 
            } else { 
                alert("Fim de Jogo!"); 
                currentRound = 10; 
            }
        }
    }
    render();
}

// --- HISTÓRICO E RENDERIZAÇÃO ---
function save() { 
    history.push(JSON.stringify({ 
        players: JSON.parse(JSON.stringify(players)), 
        lastTeam, 
        currentRound, 
        ballOwnerId 
    })); 
    if (history.length > 20) history.shift(); 
}

function undo() { 
    if (history.length > 0) { 
        const s = JSON.parse(history.pop()); 
        players = s.players; 
        lastTeam = s.lastTeam; 
        currentRound = s.currentRound; 
        ballOwnerId = s.ballOwnerId; 
        render(); 
    } 
}

function render() {
    const list = document.getElementById('player-list'); 
    list.innerHTML = '';
    document.getElementById('round-num').innerText = currentRound;
    document.getElementById('half-disp').innerText = `${currentHalf}º TEMPO`;
    
    const alertBox = document.getElementById('turn-alert');
    if (lastTeam === null) { 
        alertBox.innerText = "QUALQUER UM PODE COMEÇAR"; 
        alertBox.style.background = "#555"; 
    } else {
        const next = lastTeam === 'A' ? 'TIME B' : 'TIME A';
        alertBox.innerText = `VEZ DO: ${next}`;
        alertBox.style.background = lastTeam === 'A' ? 'var(--team-b-color)' : 'var(--team-a-color)';
    }

    players.forEach(p => {
        const card = document.createElement('div');
        card.className = `player-card team-${p.team} ${p.finished ? 'finished' : ''} ${p.id === ballOwnerId ? 'has-ball' : ''}`;
        card.innerHTML = `
            <div style="font-weight:bold; min-width:30px">${p.init}</div>
            <div style="flex-grow:1">${p.name}</div>
            <div style="cursor:pointer; font-size:1.5em" onclick="toggleBall(${p.id})">⚽</div>
        `;
        list.appendChild(card);
    });
}

// Função auxiliar para alternar a posse de bola
function toggleBall(id) {
    save();
    ballOwnerId = (ballOwnerId === id ? null : id);
    render();
}

// Inicializa a tela
render();