// main.js - Main entry point and initialization

function showScreen(id) {
    document.querySelectorAll('.screen, .app').forEach(el => el.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function renderGameSlots() {
    const c = document.getElementById('gameSlots');
    c.innerHTML = '';
    for (let i = 1; i <= 3; i++) {
        const sum = getGameSummary(i);
        c.innerHTML += `
            <div class="game-slot ${currentGameSlot === i ? 'active' : ''}" onclick="selectSlot(${i})">
                <h3>Game ${i}</h3>
                <p class="status ${sum ? 'has-data' : ''}">${sum || 'Empty'}</p>
            </div>`;
    }
}

function selectSlot(i) {
    currentGameSlot = i;
    renderGameSlots();
    const has = loadGame(i) !== null;
    document.getElementById('btnLoad').disabled = !has;
    document.getElementById('btnDelete').disabled = !has;
}

function loadSelectedGame() {
    gameState = loadGame(currentGameSlot);
    showScreen('mainApp');
    renderApp();
}

function deleteSelectedGame() {
    if (confirm('Delete this game?')) {
        deleteGame(currentGameSlot);
        renderGameSlots();
        document.getElementById('btnLoad').disabled = true;
        document.getElementById('btnDelete').disabled = true;
    }
}

function showSetup() {
    if (!currentGameSlot) { 
        currentGameSlot = 1; 
        renderGameSlots(); 
    }
    showScreen('setupScreen');
    renderSetupNations();
}

function renderSetupNations() {
    const c = document.getElementById('setupNations');
    c.innerHTML = NATIONS.map(n => `
        <div class="setup-nation">
            <h4>${n}</h4>
            <div class="setup-toggle">
                <button class="toggle-btn active" data-n="${n}" data-t="bot" onclick="toggleNation(this)">Bot</button>
                <button class="toggle-btn" data-n="${n}" data-t="player" onclick="toggleNation(this)">Player</button>
            </div>
        </div>
    `).join('');
}

function toggleNation(btn) {
    btn.parentElement.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function startGame() {
    const nations = {};
    NATIONS.forEach(n => {
        const btn = document.querySelector(`.toggle-btn.active[data-n="${n}"]`);
        nations[n] = createNationState(n, btn.dataset.t === 'bot');
    });
    
    gameState = createNewGameState(
        nations,
        parseInt(document.getElementById('setupTurn').value),
        parseInt(document.getElementById('setupWTT').value)
    );
    
    saveGame();
    showScreen('mainApp');
    renderApp();
}

function renderApp() {
    const app = document.getElementById('mainApp');
    app.setAttribute('data-phase', PHASES[gameState.phase].toLowerCase());
    app.classList.toggle('deciding', !!decision);
    
    // Turn value - clickable to change
    document.getElementById('turnVal').innerHTML = `
        <select onchange="changeTurn(this.value)" style="background: transparent; border: none; color: var(--gold); font-family: 'Cinzel', serif; cursor: pointer;">
            ${[1,2,3,4,5,6,7].map(t => `<option value="${t}" ${gameState.turn === t ? 'selected' : ''} style="background: var(--bg-dark);">T${t}</option>`).join('')}
        </select>`;
    
    // WTT value - clickable to change
    document.getElementById('wttVal').innerHTML = `
        <select onchange="changeWTT(this.value)" style="background: transparent; border: none; color: var(--gold); font-family: 'Cinzel', serif; cursor: pointer;">
            ${[0,1,2,3,4,5,6,7,8,9,10].map(w => `<option value="${w}" ${gameState.wtt === w ? 'selected' : ''} style="background: var(--bg-dark);">${w}</option>`).join('')}
        </select>`;
    
    document.getElementById('phaseBadge').textContent = PHASES[gameState.phase] + ' Phase';
    
    renderNationBar();
    renderStatePanel();
    renderLog();
    renderDecisionArea();
    
    if (gameState.phase <= 1) {
        showPhaseOverlay();
    } else {
        document.getElementById('phaseOverlay').classList.remove('show');
    }
}

function exitGame() {
    saveGame();
    decision = null;
    showScreen('selectorScreen');
    renderGameSlots();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadCardData();
    renderGameSlots();
    showScreen('selectorScreen');
});
