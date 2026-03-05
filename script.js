let players = [];
let ballOwnerId = null;
let currentRound = 1;
let currentHalf = 1;

/* CONTROLE DE ALTERNÂNCIA */
let nextTeamTurn = 'A';

function roll1d20() {
    document.getElementById('p-init').value = Math.floor(Math.random() * 20) + 1;
}

function addPlayer() {
    const nameInput = document.getElementById('p-name');
    const teamInput = document.getElementById('p-team');
    const initInput = document.getElementById('p-init');

    if (nameInput.value) {
        players.push({
            id: Date.now(),
            name: nameInput.value,
            team: teamInput.value,
            init: parseInt(initInput.value) || 0,
            finished: false
        });

        nameInput.value = '';
        initInput.value = '';
        render();
    }
}

function toggleBall(id) {
    ballOwnerId = (ballOwnerId === id) ? null : id;
    render();
}

function sortAndInterleave() {
    let teamA = players.filter(p => p.team === 'A').sort((a, b) => b.init - a.init);
    let teamB = players.filter(p => p.team === 'B').sort((a, b) => b.init - a.init);

    let interleaved = [];
    let maxLength = Math.max(teamA.length, teamB.length);

    for (let i = 0; i < maxLength; i++) {
        if (teamA[i]) interleaved.push(teamA[i]);
        if (teamB[i]) interleaved.push(teamB[i]);
    }

    players = interleaved;
    players.forEach(p => p.finished = false);
    nextTeamTurn = 'A';
    render();
}

function nextTurn() {
    if (players.length === 0) return;

    let actor = null;

    // 🎯 Prioridade: dono da bola se for vez do time dele
    if (ballOwnerId) {
        const ballOwner = players.find(p => p.id === ballOwnerId && !p.finished);
        if (ballOwner && ballOwner.team === nextTeamTurn) {
            actor = ballOwner;
        }
    }

    // 🔁 Pega jogador do time correto
    if (!actor) {
        actor = players.find(p => !p.finished && p.team === nextTeamTurn);
    }

    // 🔄 Fallback se não houver do time esperado
    if (!actor) {
        actor = players.find(p => !p.finished);
    }

    if (actor) {
        actor.finished = true;
        // Alterna time obrigatoriamente
        nextTeamTurn = actor.team === 'A' ? 'B' : 'A';
    }

    const allFinished = players.every(p => p.finished);

    if (allFinished) {
        currentRound++;
        players.forEach(p => p.finished = false);
        nextTeamTurn = 'A';

        if (currentRound > 30) {
            if (currentHalf === 1) {
                alert("FIM DO PRIMEIRO TEMPO! Recupere o fôlego.");
                currentHalf = 2;
            } else {
                alert("FIM DE PAPO! Apito final no estádio.");
                currentHalf = 1;
            }
            currentRound = 1;
        }
    }

    render();
}

function removePlayer(id) {
    players = players.filter(p => p.id !== id);
    if (ballOwnerId === id) ballOwnerId = null;
    render();
}

function render() {
    const listContainer = document.getElementById('player-list');
    listContainer.innerHTML = '';

    document.getElementById('match-time').innerText = `${currentHalf}º TEMPO`;
    document.getElementById('round-count').innerText = currentRound;

    const finishedCount = players.filter(p => p.finished).length;
    document.getElementById('turn-stats').innerText =
        `Ações da rodada: ${finishedCount} / ${players.length}`;

    players.forEach((p) => {
        const li = document.createElement('div');
        li.className = `player-card team-${p.team} ${p.id === ballOwnerId ? 'has-ball' : ''} ${p.finished ? 'finished' : ''}`;
        li.setAttribute("draggable", true);
        li.setAttribute("data-id", p.id);

        li.innerHTML = `
            <div class="init-badge">${p.init}</div>
            <div class="info">
                <strong>${p.name}</strong>
                <span class="team-tag">
                    Time ${p.team === 'A' ? 'A (Azul)' : 'B (Rosa)'} • 
                    ${p.finished ? 'Ação Concluída' : 'Aguardando'}
                </span>
            </div>
            <div class="ball-toggle" onclick="toggleBall(${p.id})">⚽</div>
            <button class="remove-btn" onclick="removePlayer(${p.id})">✕</button>
        `;
        listContainer.appendChild(li);
    });
}

/* DRAG AND DROP */

let dragged = null;

document.addEventListener("dragstart", e => {
    if (e.target.classList.contains("player-card")) {
        dragged = e.target;
        e.target.classList.add("dragging");
    }
});

document.addEventListener("dragend", e => {
    if (e.target.classList.contains("player-card")) {
        e.target.classList.remove("dragging");
        updateOrder();
    }
});

document.addEventListener("dragover", e => {
    e.preventDefault();
    const container = document.getElementById("player-list");
    const afterElement = getAfterElement(container, e.clientY);
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;

    if (afterElement == null) {
        container.appendChild(dragging);
    } else {
        container.insertBefore(dragging, afterElement);
    }
});

function getAfterElement(container, y) {
    const elements = [...container.querySelectorAll(".player-card:not(.dragging)")];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function updateOrder() {
    const cards = document.querySelectorAll(".player-card");
    const newOrder = [];
    cards.forEach(card => {
        const id = parseInt(card.getAttribute("data-id"));
        const player = players.find(p => p.id === id);
        if (player) newOrder.push(player);
    });
    players = newOrder;
}