// ui.js - UI rendering functions

// Flag URLs from Wikimedia Commons
const FLAGS = {
    'GE': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Flag_of_the_German_Empire.svg/40px-Flag_of_the_German_Empire.svg.png',
    'UK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Flag_of_the_United_Kingdom.svg/40px-Flag_of_the_United_Kingdom.svg.png',
    'FR': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_France.svg/40px-Flag_of_France.svg.png',
    'AU': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Flag_of_Austria-Hungary_%281869-1918%29.svg/40px-Flag_of_Austria-Hungary_%281869-1918%29.svg.png',
    'RU': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Russia.svg/40px-Flag_of_Russia.svg.png',
    'OT': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Flag_of_the_Ottoman_Empire_%281844%E2%80%931922%29.svg/40px-Flag_of_the_Ottoman_Empire_%281844%E2%80%931922%29.svg.png'
};

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
        return `<div class="${cls}" onclick="selectNation('${n}')"><img class="flag-img" src="${FLAGS[n]}" alt="${n}">${n}</div>`;
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
                    <span class="state-nation"><img class="flag-img" src="${FLAGS[n]}" alt="${n}">${n}</span>
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
            <div class="phase-item"><span class="icon">*</span> Shuffle bot card piles</div>
            <div class="phase-item"><span class="icon">*</span> Bots take stability +1 if stability <= 2</div>`;
        const qual = NATIONS.filter(n => gameState.nations[n].isBot && gameState.nations[n].stability <= 2);
        if (qual.length) {
            html += `<div class="phase-item"><span class="icon">></span> <strong>Eligible:</strong> ${qual.join(', ')}</div>`;
        }
        document.getElementById('phaseBtn').textContent = 'Done -> Diplomacy';
    } else {
        html = `
            <div class="phase-item"><span class="icon">*</span> Bots don't participate in diplomacy</div>
            <div class="phase-item"><span class="icon">*</span> Add Home Card to each bot pile:</div>
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
        // Check for Metternich's Legacy (AU bot at game start)
        if (gameState.turn === 1 && gameState.nations.AU.isBot && !gameState.metternichDone) {
            showMetternichOverlay();
            return;
        }
        
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

// =====================================================
// METTERNICH'S LEGACY - Special roll system for AU bot
// =====================================================

let metternichState = {};

function showMetternichOverlay() {
    metternichState = {};
    const o = document.getElementById('phaseOverlay');
    document.getElementById('phaseTitle').textContent = "Metternich's Legacy";
    document.getElementById('phaseBtn').style.display = 'none';
    renderMetternichContent();
    o.classList.add('show');
}

function getMetternichZoneResult(roll) {
    if (roll <= 2) {
        return { zone: 'Germany', needsSecondRoll: true };
    } else if (roll <= 4) {
        return { zone: 'Italy', space: 'Naples', hasAlternative: true, altText: 'Naples already allied' };
    } else {
        return { zone: 'Balkans', space: 'Greece', hasAlternative: true, altText: 'Greece already allied' };
    }
}

function getMetternichGermanySpace(roll) {
    if (roll <= 2) return 'Hanover';
    if (roll <= 4) return 'Saxony';
    return 'Bavaria';
}

function getMetternichItalyAltSpace(roll) {
    if (roll <= 3) return 'Tuscany';
    return 'Rome';
}

function renderMetternichContent() {
    let html = `
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Prince_Metternich_by_Lawrence.jpeg/960px-Prince_Metternich_by_Lawrence.jpeg" alt="Metternich" class="metternich-portrait">
        <div class="phase-item" style="margin-bottom: 1rem;">
            AU gains an alliance with two minor powers that do not contain an opponent's diplomatic marker.
        </div>`;
    
    // First Alliance
    if (!metternichState.alliance1Done) {
        html += renderMetternichAlliance(1);
    } else {
        html += `<div class="phase-item" style="opacity: 0.6; margin-bottom: 1rem;">
            <span class="icon">OK</span> <strong>${metternichState.alliance1Zone} - ${metternichState.alliance1Space}</strong>: First alliance
        </div>`;
        
        // Second Alliance
        if (!metternichState.alliance2Done) {
            html += renderMetternichAlliance(2);
        } else {
            html += `<div class="phase-item" style="opacity: 0.6; margin-bottom: 1rem;">
                <span class="icon">OK</span> <strong>${metternichState.alliance2Zone} - ${metternichState.alliance2Space}</strong>: Second alliance
            </div>`;
            
            // Check if both alliances are the same
            const sameAlliance = (metternichState.alliance1Zone === metternichState.alliance2Zone && 
                                  metternichState.alliance1Space === metternichState.alliance2Space);
            
            html += `<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn phase-btn" style="flex: 1;" onclick="finishMetternich()">Continue to Action Phase</button>
                ${sameAlliance ? `<button class="btn btn-secondary phase-btn" style="flex: 1;" onclick="rerollSecondAlliance()">Reroll 2nd Alliance</button>` : ''}
            </div>`;
        }
    }
    
    document.getElementById('phaseContent').innerHTML = html;
}

function renderMetternichAlliance(allianceNum) {
    const prefix = `a${allianceNum}_`;
    
    // Step 1: Roll for zone
    if (!metternichState[prefix + 'zoneRoll']) {
        return `
            <div class="question-box" style="margin: 1rem 0;">
                <div class="question-text">${allianceNum === 1 ? 'First' : 'Second'} Alliance - Roll Metternich die:</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollMetternichZone(${allianceNum})">Roll Die</button>
                </div>
            </div>`;
    }
    
    const zoneRoll = metternichState[prefix + 'zoneRoll'];
    const zoneResult = getMetternichZoneResult(zoneRoll);
    
    // Germany zone - needs second roll for space
    if (zoneResult.zone === 'Germany') {
        if (!metternichState[prefix + 'spaceRoll']) {
            return `
                <div style="margin: 0.5rem 0;">
                    ${diceHTML(zoneRoll, 'Zone Roll')}
                    <div class="step-item" style="margin-top: 0.5rem;">
                        <span class="step-icon">></span>
                        <span class="step-text"><strong>Germany zone</strong> - Roll for space:</span>
                    </div>
                </div>
                <div class="question-box">
                    <div class="question-text">1-2: Hanover, 3-4: Saxony, 5-6: Bavaria</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="rollMetternichSpace(${allianceNum}, 'Germany')">Roll Die</button>
                    </div>
                </div>`;
        }
        const spaceRoll = metternichState[prefix + 'spaceRoll'];
        const space = getMetternichGermanySpace(spaceRoll);
        
        // Auto-complete this alliance
        metternichState[`alliance${allianceNum}Zone`] = 'Germany';
        metternichState[`alliance${allianceNum}Space`] = space;
        metternichState[`alliance${allianceNum}Done`] = true;
        
        // Re-render to show result
        setTimeout(() => renderMetternichContent(), 0);
        return `<div style="margin: 0.5rem 0;">${diceHTML(zoneRoll, 'Zone')} ${diceHTML(spaceRoll, 'Space')}</div>`;
    }
    
    // Italy or Balkans - has default space with alternative option
    if (!metternichState[prefix + 'spaceConfirmed']) {
        // Check if alternative was triggered
        if (metternichState[prefix + 'altTriggered']) {
            if (zoneResult.zone === 'Italy') {
                // Roll for Tuscany/Rome
                if (!metternichState[prefix + 'altRoll']) {
                    return `
                        <div style="margin: 0.5rem 0;">
                            ${diceHTML(zoneRoll, 'Zone Roll')}
                            <div class="step-item" style="margin-top: 0.5rem;">
                                <span class="step-icon">></span>
                                <span class="step-text"><strong>Italy zone</strong> - Naples already allied, roll for alternative:</span>
                            </div>
                        </div>
                        <div class="question-box">
                            <div class="question-text">1-3: Tuscany, 4-6: Rome</div>
                            <div class="question-btns">
                                <button class="q-btn yes" onclick="rollMetternichAlt(${allianceNum}, 'Italy')">Roll Die</button>
                            </div>
                        </div>`;
                }
                const altRoll = metternichState[prefix + 'altRoll'];
                const space = getMetternichItalyAltSpace(altRoll);
                
                metternichState[`alliance${allianceNum}Zone`] = 'Italy';
                metternichState[`alliance${allianceNum}Space`] = space;
                metternichState[`alliance${allianceNum}Done`] = true;
                
                setTimeout(() => renderMetternichContent(), 0);
                return `<div style="margin: 0.5rem 0;">${diceHTML(zoneRoll, 'Zone')} ${diceHTML(altRoll, 'Alt')}</div>`;
            } else {
                // Balkans - Greece already allied, re-roll Metternich
                metternichState[prefix + 'zoneRoll'] = null;
                metternichState[prefix + 'altTriggered'] = false;
                setTimeout(() => renderMetternichContent(), 0);
                return '';
            }
        }
        
        return `
            <div style="margin: 0.5rem 0;">
                ${diceHTML(zoneRoll, 'Zone Roll')}
                <div class="step-item" style="margin-top: 0.5rem;">
                    <span class="step-icon">></span>
                    <span class="step-text"><strong>${zoneResult.zone} zone - ${zoneResult.space}</strong></span>
                </div>
            </div>
            <div class="question-box">
                <div class="question-btns">
                    <button class="q-btn yes" onclick="confirmMetternichSpace(${allianceNum}, '${zoneResult.zone}', '${zoneResult.space}')">Confirm ${zoneResult.space}</button>
                    <button class="q-btn" onclick="triggerMetternichAlt(${allianceNum})">${zoneResult.altText}</button>
                </div>
            </div>`;
    }
    
    return '';
}

function rollMetternichZone(allianceNum) {
    metternichState[`a${allianceNum}_zoneRoll`] = rollDie();
    renderMetternichContent();
}

function rollMetternichSpace(allianceNum, zone) {
    metternichState[`a${allianceNum}_spaceRoll`] = rollDie();
    renderMetternichContent();
}

function rollMetternichAlt(allianceNum, zone) {
    metternichState[`a${allianceNum}_altRoll`] = rollDie();
    renderMetternichContent();
}

function triggerMetternichAlt(allianceNum) {
    metternichState[`a${allianceNum}_altTriggered`] = true;
    renderMetternichContent();
}

function confirmMetternichSpace(allianceNum, zone, space) {
    metternichState[`alliance${allianceNum}Zone`] = zone;
    metternichState[`alliance${allianceNum}Space`] = space;
    metternichState[`alliance${allianceNum}Done`] = true;
    renderMetternichContent();
}

function rerollSecondAlliance() {
    // Reset second alliance state
    metternichState.alliance2Done = false;
    metternichState.alliance2Zone = null;
    metternichState.alliance2Space = null;
    metternichState.a2_zoneRoll = null;
    metternichState.a2_spaceRoll = null;
    metternichState.a2_altRoll = null;
    metternichState.a2_altTriggered = false;
    metternichState.a2_spaceConfirmed = false;
    renderMetternichContent();
}

function finishMetternich() {
    gameState.metternichDone = true;
    metternichState = {};
    document.getElementById('phaseBtn').style.display = '';
    
    const first = NATIONS.find(n => gameState.nations[n].isBot);
    if (first) gameState.activeNation = first;
    
    document.getElementById('phaseOverlay').classList.remove('show');
    saveGame();
    renderApp();
}

// =====================================================
// DECISION AREA RENDERING
// =====================================================

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
