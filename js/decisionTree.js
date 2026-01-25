// decisionTree.js - Decision tree rendering and flow control

function startDecision(card) {
    decision = { card, phase: 'priority1' };
    document.getElementById('mainApp').classList.add('deciding');
    renderApp();
}

function renderDecisionTree(container) {
    const { card } = decision;
    let html = `
    <div class="decision-actions">
        <button class="btn btn-small btn-secondary" onclick="cancelDecision()">↩ Cancel & Choose New Card</button>
        <button class="btn btn-small btn-secondary" onclick="confirmAction('Passed turn')">⏭ Pass Turn</button>
    </div>
    <div class="decision-tree">
        <div class="tree-card">
            <span class="tree-card-name">${card.name}</span>
            <span class="tree-card-cp">${card.cp} CP</span>
        </div>`;
    
    if (decision.phase === 'priority1') {
        html += renderP1();
    } else if (decision.phase === 'homecard_resolve') {
        html += renderHomeCard();
    } else if (decision.phase === 'priority2') {
        html += renderP2();
    } else if (decision.phase === 'excess') {
        html += renderExcess();
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function renderHomeCard() {
    // First check: general pre-check (stability 6 condition)
    if (!decision.q_general) {
        let generalCheckResult = HOME_CARD_LOGIC._general(decision, gameState);
        if (generalCheckResult && generalCheckResult.type === 'question') {
            return `
            <div class="priority-section">
                <div class="priority-header active">
                    <span class="status-dot"></span>Home Card Pre-Check
                </div>
                <div class="priority-content">
                    <div class="question-box">
                        <div class="question-text">${generalCheckResult.text}</div>
                        <div class="question-btns">
                            ${generalCheckResult.options.map(o => 
                                `<button class="q-btn" onclick="answerQ('${generalCheckResult.key}','${o.value}')">${o.label}</button>`
                            ).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        }
    }
    
    // If general check was answered 'yes', don't play for event
    if (decision.q_general === 'yes') {
        return `
        <div class="priority-section">
            <div class="priority-header active">
                <span class="status-dot"></span>Home Card Action
            </div>
            <div class="priority-content">
                <div class="action-box">
                    <h4>Action</h4>
                    <div class="action-text">Do not play for event. Bot will use CPs instead.</div>
                    <button class="confirm-btn" onclick="goToPhase('priority2')">Continue to Priority 2</button>
                </div>
            </div>
        </div>`;
    }

    // General check passed, proceed to nation-specific logic
    const logic = getHomeCardLogic(gameState.activeNation, decision.card.name);
    if (!logic) {
        return `
        <div class="priority-section">
            <div class="priority-header active">
                <span class="status-dot"></span>Home Card Action
            </div>
            <div class="priority-content">
                <div class="action-box" style="background: var(--red);">
                    <h4>Error</h4>
                    <div class="action-text">Could not find Home Card logic for ${gameState.activeNation} - ${decision.card.name}. Please consult the rules.</div>
                    <button class="confirm-btn" onclick="goToPhase('priority2')">Continue to Priority 2</button>
                </div>
            </div>
        </div>`;
    }
    
    const result = logic(decision, gameState);
    let html = `
    <div class="priority-section">
        <div class="priority-header active">
            <span class="status-dot"></span>Home Card Action
        </div>
        <div class="priority-content">`;
    
    if (result.prefix) html += result.prefix;
    
    if (result.type === 'question') {
        html += `
            <div class="question-box">
                <div class="question-text">${result.text}</div>
                <div class="question-btns">
                    ${result.options.map(o => 
                        `<button class="q-btn ${o.cls || ''}" onclick="answerQ('${result.key}','${o.value}')">${o.label}</button>`
                    ).join('')}
                </div>
            </div>`;
    } else if (result.type === 'action') {
        html += `
            <div class="action-box">
                <h4>Action</h4>
                <div class="action-text">${result.text}</div>
                <button class="confirm-btn" onclick="confirmAction('${result.log.replace(/'/g, "\\'")}')">Confirm</button>
            </div>`;
    } else if (result.type === 'custom') {
        // Custom HTML content (used for BDIT rolls, etc.)
        html += result.html;
    }
    
    return html + '</div></div>';
}

// Decision flow helpers
function cancelDecision() {
    decision = null;
    document.getElementById('mainApp').classList.remove('deciding');
    renderApp();
}

function answerQ(key, val) {
    decision[key] = val;
    renderApp();
}

function goToPhase(phaseName) {
    decision.phase = phaseName;
    renderApp();
}

function goToExcess(p2ActionText) {
    decision.p2Log = p2ActionText;
    decision.phase = 'excess';
    renderApp();
}

function rollForP2() {
    decision.p2Roll = rollDie();
    renderApp();
}

function confirmAction(log) {
    addLog(log);
    
    gameState.nations[gameState.activeNation].cards--;
    
    // Track industrialization
    if (log.startsWith('P1 Action: Industrialize')) {
        const nationState = gameState.nations[gameState.activeNation];
        nationState.industrializedThisTurn = true;
        nationState.lastIndustrializeCP = decision.card.cp;
    }

    if (!gameState.actionsDoneThisRound.includes(gameState.activeNation)) {
        gameState.actionsDoneThisRound.push(gameState.activeNation);
    }

    // Find next bot nation
    const activeNationIndex = NATIONS.indexOf(gameState.activeNation);
    let nextNation = null;
    for (let i = 1; i <= NATIONS.length; i++) {
        const nextIndex = (activeNationIndex + i) % NATIONS.length;
        const potentialNation = NATIONS[nextIndex];
        if (gameState.nations[potentialNation].isBot && !gameState.actionsDoneThisRound.includes(potentialNation)) {
            nextNation = potentialNation;
            break;
        }
    }
    
    gameState.activeNation = nextNation;
    decision = null;
    document.getElementById('mainApp').classList.remove('deciding');
    
    saveGame();
    renderApp();
}
