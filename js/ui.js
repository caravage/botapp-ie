// ui.js - UI rendering functions

function renderNationBar() {
    const c = document.getElementById('nationBar');
    c.innerHTML = NATIONS.map(n => {
        const ns = gameState.nations[n];
        const cls = [
            'nation-tab',
            gameState.activeNation === n ? 'active' : '',
            !ns.isBot ? 'is-player' : '',
            gameState.actionsDoneThisRound.includes(n) && ns.isBot ? 'done' : ''
        ].filter(Boolean).join(' ');
        return `<div class="${cls}" onclick="selectNation('${n}')">${n}</div>`;
    }).join('');
}

function selectNation(n) {
    if (!gameState.nations[n].isBot || gameState.phase !== 2 || decision) return;
    gameState.activeNation = n;
    decision = null;
    saveGame();
    renderApp();
}

function renderStatePanel() {
    const c = document.getElementById('stateCards');
    c.innerHTML = NATIONS.map(n => {
        const ns = gameState.nations[n];
        const flags = [
            { k: 'hasRebels', l: 'Rebels' },
            { k: 'autoIndustry', l: 'Auto-Ind' },
            { k: 'industrializedThisTurn', l: 'Indust.' }
        ];
        if (n === 'GE') {
            flags.push({ k: 'germanyUnified', l: 'Unified' });
            flags.push({ k: 'bismarckRemoved', l: 'No Bism.' });
        }
        if (n === 'FR') flags.push({ k: 'frPacifying', l: 'Pacifying' });
        if (n === 'UK') flags.push({ k: 'ukIsPacifying', l: 'Pacifying' });
        
        return `
            <div class="state-card ${ns.isBot ? '' : 'is-player'}">
                <div class="state-header">
                    <span class="state-nation">${n}</span>
                    <span class="state-badge ${ns.isBot ? '' : 'player'}">${ns.isBot ? 'Bot' : 'Player'}</span>
                </div>
                <div class="state-stats">
                    <div class="state-stat"><span class="lbl">Stab</span><span class="val">${ns.stability}</span></div>
                    <div class="state-stat"><span class="lbl">Ind</span><span class="val">${ns.industry}</span></div>
                    <div class="state-stat"><span class="lbl">Cards</span><span class="val">${ns.cards}</span></div>
                </div>
                <div class="state-flags">
                    ${flags.map(f => `<span class="flag ${ns[f.k] ? 'on' : ''}" onclick="toggleFlag('${n}','${f.k}')">${f.l}</span>`).join('')}
                </div>
            </div>`;
    }).join('');
}

function toggleFlag(n, k) {
    gameState.nations[n][k] = !gameState.nations[n][k];
    saveGame();
    renderStatePanel();
}

function renderLog() {
    const c = document.getElementById('logEntries');
    if (!gameState.log || !gameState.log.length) {
        c.innerHTML = '<div class="empty-log">No actions yet</div>';
        return;
    }
    c.innerHTML = gameState.log.slice().reverse().map(e => `
        <div class="log-entry">
            <div class="log-meta">Turn ${e.turn} - Action ${e.actionNum}</div>
            <span class="log-nation">${e.nation}:</span> <span class="log-action">${e.action}</span>
        </div>
    `).join('');
}

function addLog(action) {
    if (!gameState.log) gameState.log = [];
    gameState.log.push({
        turn: gameState.turn,
        actionNum: gameState.actionCount + 1,
        nation: gameState.activeNation,
        action
    });
}

// HC Placement rules for Diplomacy Phase
function getHCPlacement(nation) {
    switch(nation) {
        case 'GE':
        case 'OT':
            return 'TOP of pile';
        case 'UK':
            return 'BOTTOM of pile';
        case 'FR':
        case 'AU':
        case 'RU':
            return 'Shuffled in';
        default:
            return 'Shuffled in';
    }
}

function showPhaseOverlay() {
    const o = document.getElementById('phaseOverlay');
    const phase = PHASES[gameState.phase];
    document.getElementById('phaseTitle').textContent = phase + ' Phase';
    let html = '';
    
    if (phase === 'Prep') {
        html = `
            <div class="phase-item"><span class="icon">◆</span> Shuffle bot card piles</div>
            <div class="phase-item"><span class="icon">◆</span> Bots take stability +1 if stability <= 2</div>`;
        const qual = NATIONS.filter(n => gameState.nations[n].isBot && gameState.nations[n].stability <= 2);
        if (qual.length) {
            html += `<div class="phase-item"><span class="icon">-></span> <strong>Eligible:</strong> ${qual.join(', ')}</div>`;
        }
        document.getElementById('phaseBtn').textContent = 'Done -> Diplomacy';
    } else {
        html = `
            <div class="phase-item"><span class="icon">◆</span> Bots don't participate in diplomacy</div>
            <div class="phase-item"><span class="icon">◆</span> Add Home Card to each bot pile:</div>
            <div class="hc-list">
                ${NATIONS.filter(n => gameState.nations[n].isBot).map(n => 
                    `<div class="hc-row"><span class="hc-nation">${n}</span><span class="hc-pos">${getHCPlacement(n)}</span></div>`
                ).join('')}
            </div>`;
        document.getElementById('phaseBtn').textContent = 'Done -> Action';
    }
    
    document.getElementById('phaseContent').innerHTML = html;
    o.classList.add('show');
}

function advancePhase() {
    document.getElementById('phaseOverlay').classList.remove('show');
    gameState.phase++;
    gameState.activeNation = null;
    gameState.actionsDoneThisRound = [];
    gameState.actionCount = 0;
    
    if (gameState.phase === 2) {
        const first = NATIONS.find(n => gameState.nations[n].isBot);
        if (first) gameState.activeNation = first;
    }
    
    if (gameState.phase > 3) {
        if (gameState.turn < 7 && confirm('Advance to Turn ' + (gameState.turn + 1) + '?')) {
            gameState.turn++;
            gameState.phase = 0;
            NATIONS.forEach(n => {
                gameState.nations[n].industrializedThisTurn = false;
                gameState.nations[n].lastIndustrializeCP = 0;
            });
        } else {
            gameState.phase = 3;
        }
    }
    
    saveGame();
    renderApp();
}

function renderDecisionArea() {
    const c = document.getElementById('decisionContent');
    
    if (gameState.phase !== 2) {
        c.innerHTML = '<div class="empty-state"><div class="icon">...</div>Waiting for Action Phase</div>';
        return;
    }
    
    const allBots = NATIONS.filter(n => gameState.nations[n].isBot);
    
    if (!gameState.activeNation) {
        if (gameState.actionsDoneThisRound.length >= allBots.length && allBots.length > 0) {
            c.innerHTML = `
                <div class="empty-state">
                    <div class="icon">OK</div>All bots have acted.<br><br>
                    <button class="btn" onclick="startNextActionRound()">Start Next Action Round</button>
                </div>`;
        } else {
            c.innerHTML = '<div class="empty-state"><div class="icon">...</div>Select a bot nation</div>';
        }
        return;
    }
    
    if (decision) {
        renderDecisionTree(c);
    } else {
        c.innerHTML = `
            <div class="card-input-area">
                <div class="card-input-label">Reveal card for ${gameState.activeNation}</div>
                <div class="card-input-wrapper">
                    <input type="text" class="card-input" id="cardInput" placeholder="Type card name..." oninput="onCardInput(this)">
                    <div class="autocomplete-list" id="autoList"></div>
                </div>
            </div>`;
        document.getElementById('cardInput').focus();
    }
}

function onCardInput(input) {
    const q = input.value.toLowerCase().trim();
    const list = document.getElementById('autoList');
    
    if (q.length < 2) { 
        list.classList.remove('show'); 
        return; 
    }
    
    const matches = CARDS.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8);
    
    if (!matches.length) { 
        list.classList.remove('show'); 
        return; 
    }
    
    list.innerHTML = matches.map((c, i) => 
        `<div class="autocomplete-item" onclick="selectCard(${CARDS.indexOf(c)})">
            <span>${c.name}</span><span style="color:var(--text-muted)">${c.cp} CP</span>
        </div>`
    ).join('');
    list.classList.add('show');
}

function selectCard(idx) {
    document.getElementById('autoList').classList.remove('show');
    startDecision(CARDS[idx]);
}

function startNextActionRound() {
    gameState.actionsDoneThisRound = [];
    gameState.actionCount++;
    const firstBot = NATIONS.find(n => gameState.nations[n].isBot);
    gameState.activeNation = firstBot || null;
    saveGame();
    renderApp();
}

// Change turn function
function changeTurn(newTurn) {
    gameState.turn = parseInt(newTurn);
    saveGame();
    renderApp();
}

// Change WTT function
function changeWTT(newWTT) {
    gameState.wtt = parseInt(newWTT);
    saveGame();
    renderApp();
}
