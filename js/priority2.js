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
    
    return { modified, modLabel };
}

function getP2ActionText(modified) {
    if (modified == 1) {
        return {
            action: 'pacification',
            text: 'Pacification',
            description: 'Step 1: Place influence in Asia/Africa via BDIT. Step 2: Build/move EF to pacify.',
            needsBDIT: true
        };
    } else if (modified == 2) {
        return {
            action: 'diplomacy',
            text: 'Diplomacy',
            description: 'Gain an alliance with a minor for 2CP, then place/remove diplomacy via BDIT.',
            needsBDIT: true
        };
    } else if (modified <= 4) {
        return {
            action: 'build',
            text: 'Build',
            description: 'Build armies, THEN roll a die: 1-3 naval, 4-5 fort, 6 EC. Note: UK treats this as a 1 if at max armies.',
            needsBDIT: false
        };
    } else {
        return {
            action: 'event',
            text: 'Play for Event',
            description: 'Unless it hurts the bot, its allies, or helps its enemies. Note: Bots never play a 3CP event that doesn\'t help them.',
            needsBDIT: false
        };
    }
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
        const actionInfo = getP2ActionText(res.modified);
        
        html += `${diceHTML(decision.p2Roll, res.modLabel)}
            <div class="step-item action">
                <span class="step-icon">→</span>
                <span class="step-text"><strong>Result ${res.modified}: ${actionInfo.text}</strong><br>${actionInfo.description}</span>
            </div>`;
        
        // If action needs BDIT, show the BDIT interface
        if (actionInfo.needsBDIT) {
            const bdit = renderBDITRoll(decision, 'p2_', actionInfo.text);
            
            if (bdit.type !== 'bdit_result') {
                // Still selecting region or rolling
                html += bdit.html;
            } else {
                // BDIT complete, show result and completion options
                html += bdit.html;
                
                const fullActionText = `${actionInfo.text}: ${bdit.region} → ${bdit.nation}`;
                html += `
                    <div class="question-box" style="margin-top:1rem;">
                        <div class="question-text">Any CP remaining after action?</div>
                        <div class="question-btns">
                            <button class="q-btn yes" onclick="goToExcess('${fullActionText.replace(/'/g, "\\'")}')">Yes → Excess CP</button>
                            <button class="q-btn no" onclick="confirmAction('P2: ${fullActionText.replace(/'/g, "\\'")}')">No → Done</button>
                        </div>
                    </div>`;
            }
        } else {
            // No BDIT needed, show completion question directly
            html += `
                <div class="question-box" style="margin-top:1rem;">
                    <div class="question-text">Any CP remaining after action?</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="goToExcess('${actionInfo.text}')">Yes → Excess CP</button>
                        <button class="q-btn no" onclick="confirmAction('P2: ${actionInfo.text}')">No → Done</button>
                    </div>
                </div>`;
        }
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
