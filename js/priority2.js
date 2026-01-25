// priority2.js - Priority 2 decision logic

function getPriority2Result(roll, nation, gs, dec) {
    const ns = gs.nations[nation];
    let mod = 0;
    let modText = [];
    
    // Modifiers
    if (nation === 'AU' || (nation === 'GE' && !ns.germanyUnified)) { 
        mod += 1; 
        modText.push('+1'); 
    }
    if (nation === 'UK' && !ns.ukIsPacifying) { 
        mod -= 1; 
        modText.push('UK not pacifying -1'); 
    }
    if (nation === 'FR' && !ns.frPacifying) { 
        mod -= 1; 
        modText.push('FR not pacifying -1'); 
    }

    const modified = Math.max(1, Math.min(6, roll + mod));
    const modLabel = modText.length > 0 ? `(${modText.join(', ')}) = ${modified}` : '';
    let actionText = '';
    
    if (modified == 1) {
        actionText = 'Pacification (Step 1: Place influence in Asia/Africa via BDIT. Step 2: Build/move EF to pacify).';
    } else if (modified == 2) {
        actionText = 'Diplomacy (Gain an alliance with a minor for 2CP, then place/remove diplomacy via BDIT).';
    } else if (modified <= 4) {
        actionText = `Build (Build armies, THEN roll a die: 1-3 naval, 4-5 fort, 6 EC). Note: UK treats this as a 1 if at max armies.`;
    } else { // 5-6
        actionText = 'Play for Event (Unless it hurts the bot, its allies, or helps its enemies). Note: Bots never play a 3CP event that doesn\'t help them.';
    }
    
    return { modified, modLabel, actionText };
}

function getBMPITResult(d1, d2) {
    const targets = ['GE', 'UK', 'FR', 'AU', 'RU', 'OT'];
    const target = targets[d1 - 1];
    const influence = d2 <= 2 ? 'TA' : (d2 <= 4 ? 'Neu' : 'TE');
    const doubles = d1 === d2;
    return { target, influence, doubles };
}

function renderP2() {
    let html = `
    <div class="priority-section">
        <div class="priority-header done">
            <span class="status-dot"></span>Priority 1
        </div>
        <div class="priority-content dimmed">Complete</div>
    </div>
    <div class="priority-section">
        <div class="priority-header active">
            <span class="status-dot"></span>Priority 2
        </div>
        <div class="priority-content">
            <div class="step-item">
                <span class="step-icon">◆</span>
                <span class="step-text"><strong>Automatic Action:</strong> Unless playing for event, automatically spend 1 CP to attempt to pacify a space if able.</span>
            </div>`;
    
    if (!decision.p2Roll) {
        html += `
            <button class="btn" style="width:100%; margin: 1rem 0;" onclick="rollForP2()">
                Roll for Main Priority 2 Action
            </button>`;
    } else {
        const res = getPriority2Result(decision.p2Roll, gameState.activeNation, gameState, decision);
        html += `
            ${diceHTML(decision.p2Roll, res.modLabel)}
            <div class="step-item action">
                <span class="step-icon">→</span>
                <span class="step-text"><strong>Result ${res.modified}:</strong> ${res.actionText}</span>
            </div>
            <div class="question-box" style="margin-top:1rem;">
                <div class="question-text">Any CP remaining after action?</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="goToExcess('${res.actionText.replace(/'/g, "\\'")}')">Yes → Excess CP</button>
                    <button class="q-btn no" onclick="confirmAction('P2: ${res.actionText.replace(/'/g, "\\'")}')">No → Done</button>
                </div>
            </div>`;
    }
    
    html += `
        </div>
    </div>`;
    
    return html;
}

function renderExcess() {
    if (!decision.bmpit) decision.bmpit = [rollDie(), rollDie()];
    const [d1, d2] = decision.bmpit;
    const res = getBMPITResult(d1, d2);
    const finalLog = `P2: ${decision.p2Log}; Excess: BMPIT ${res.target}→${res.influence}`;
    
    let html = `
    <div class="priority-section">
        <div class="priority-header done">
            <span class="status-dot"></span>Priority 1 & 2
        </div>
        <div class="priority-content dimmed">Complete</div>
    </div>
    <div class="priority-section">
        <div class="priority-header active">
            <span class="status-dot"></span>Excess CP
        </div>
        <div class="priority-content">
            <div class="step-item action">
                <span class="step-icon">→</span>
                <span class="step-text">Spend ALL remaining CP on the Major Power Influence Table (BMPIT).</span>
            </div>
            <div style="margin:0.75rem 0">
                ${diceHTML(d1, 'Target')} ${diceHTML(d2, 'Influence')}
            </div>
            <div class="step-item action">
                <span class="step-icon">→</span>
                <span class="step-text">BMPIT Result: <strong>${res.target}</strong> → <strong>${res.influence}</strong></span>
            </div>
            ${res.doubles ? '<div class="step-item"><span class="step-icon">!</span><span class="step-text">Doubles rolled: Bot will influence Italy if able.</span></div>' : ''}
            <div class="action-box">
                <h4>Action</h4>
                <div class="action-text">P2 + Excess CP: ${res.target} → ${res.influence}</div>
                <button class="confirm-btn" onclick="confirmAction('${finalLog.replace(/'/g, "\\'")}')">Confirm</button>
            </div>
        </div>
    </div>`;
    
    return html;
}
