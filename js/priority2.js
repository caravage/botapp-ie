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
    if (modified <= 1) {
        return {
            action: 'pacification',
            text: 'Pacification',
            description: 'Step 1: Place influence in Asia or Africa based on BDIT if able.\nStep 2: Build or move an EF to a space and then attempt to pacify (build instead of moving if able to do so and still pacify).',
            needsBDIT: true
        };
    } else if (modified === 2) {
        return {
            action: 'diplomacy',
            text: 'Diplomacy',
            description: 'Gain an alliance with a minor power if able (bots only need to spend 2 CP to ally with a minor power).\nThen place and remove (in that order) diplomacy on the main map based on BDIT.',
            needsBDIT: true
        };
    } else if (modified <= 4) {
        return {
            action: 'build',
            text: 'Build',
            description: 'Build armies (standing before reserves).\nThen roll another die for secondary build.',
            needsBDIT: false,
            needsSecondaryRoll: true
        };
    } else {
        return {
            action: 'event',
            text: 'Play for Event',
            description: 'Play card for its event unless:\n(1) it hurts the bot\n(2) hurts one of the bot\'s allies\n(3) helps one of the bot\'s enemies\n\n<em>Note: Bots will never play a 3 CP event that doesn\'t help them.</em>',
            needsBDIT: false
        };
    }
}

function getSecondaryBuildResult(roll) {
    if (roll <= 3) {
        return 'Naval unit';
    } else if (roll <= 5) {
        return 'Fort';
    } else {
        return 'EC (Economic Center)';
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
                <span class="step-icon">*</span>
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
                <span class="step-icon">></span>
                <span class="step-text"><strong>Result ${res.modified}: ${actionInfo.text}</strong><br><span style="white-space: pre-line;">${actionInfo.description}</span></span>
            </div>`;
        
        // Handle Build action with secondary roll
        if (actionInfo.needsSecondaryRoll) {
            // Check if UK at max armies - treat as result 1
            const ns = gameState.nations[gameState.activeNation];
            if (gameState.activeNation === 'UK' && !decision.q_uk_max_armies) {
                html += `
                    <div class="question-box">
                        <div class="question-text">Is UK at maximum armies?</div>
                        <div class="question-btns">
                            <button class="q-btn" onclick="answerQ('q_uk_max_armies', 'yes')">Yes (treat as result 1)</button>
                            <button class="q-btn" onclick="answerQ('q_uk_max_armies', 'no')">No</button>
                        </div>
                    </div>`;
            } else if (decision.q_uk_max_armies === 'yes') {
                // UK at max armies - show pacification instead
                const pacAction = getP2ActionText(1);
                html += `
                    <div class="step-item" style="margin-top: 0.5rem;">
                        <span class="step-icon">!</span>
                        <span class="step-text">UK at max armies - treating as result 1 (Pacification)</span>
                    </div>`;
                
                const bdit = renderBDITRoll(decision, 'p2_', 'Pacification');
                if (bdit.type !== 'bdit_result') {
                    html += bdit.html;
                } else {
                    html += bdit.html;
                    const fullActionText = `Pacification (UK max armies): ${bdit.region} -> ${bdit.nation}`;
                    html += renderExcessCPQuestion(fullActionText);
                }
            } else {
                // Normal build - roll secondary die
                if (!decision.p2SecondaryRoll) {
                    html += `
                        <div class="question-box">
                            <div class="question-text">Roll for secondary build (1-3: Naval, 4-5: Fort, 6: EC):</div>
                            <div class="question-btns">
                                <button class="q-btn yes" onclick="rollP2Secondary()">Roll Die</button>
                            </div>
                        </div>`;
                } else {
                    const secondaryResult = getSecondaryBuildResult(decision.p2SecondaryRoll);
                    html += `
                        <div style="margin: 0.5rem 0;">
                            ${diceHTML(decision.p2SecondaryRoll, 'Secondary Build')}
                            <div class="step-item action" style="margin-top: 0.5rem;">
                                <span class="step-icon">></span>
                                <span class="step-text">Then build: <strong>${secondaryResult}</strong></span>
                            </div>
                        </div>`;
                    
                    const fullActionText = `Build: Armies + ${secondaryResult}`;
                    html += renderExcessCPQuestion(fullActionText);
                }
            }
        }
        // Handle BDIT actions (Pacification, Diplomacy)
        else if (actionInfo.needsBDIT) {
            const bdit = renderBDITRoll(decision, 'p2_', actionInfo.text);
            
            if (bdit.type !== 'bdit_result') {
                html += bdit.html;
            } else {
                html += bdit.html;
                const fullActionText = `${actionInfo.text}: ${bdit.region} -> ${bdit.nation}`;
                html += renderExcessCPQuestion(fullActionText);
            }
        } else {
            // No BDIT needed (Event)
            html += renderExcessCPQuestion(actionInfo.text);
        }
    }
    
    html += `
        </div>
    </div>`;
    
    return html;
}

function renderExcessCPQuestion(actionText) {
    return `
        <div class="question-box" style="margin-top:1rem;">
            <div class="question-text">Any CP remaining after action?</div>
            <div class="question-btns">
                <button class="q-btn yes" onclick="goToExcess('${actionText.replace(/'/g, "\\'")}')">CP Still Remaining</button>
                <button class="q-btn no" onclick="confirmAction('P2: ${actionText.replace(/'/g, "\\'")}')">No More CP</button>
            </div>
        </div>`;
}

function renderExcess() {
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
        <div class="priority-content">`;
    
    // Step 1: Build Army first
    if (!decision.excess_army_done) {
        html += `
            <div class="step-item action">
                <span class="step-icon">1</span>
                <span class="step-text"><strong>First:</strong> Build army if able.</span>
            </div>
            <div class="question-box">
                <div class="question-text">Did the bot build an army?</div>
                <div class="question-btns">
                    <button class="q-btn" onclick="excessArmyDone(true)">CP Still Remaining</button>
                    <button class="q-btn" onclick="excessArmyDone(false)">No More CP</button>
                </div>
            </div>`;
    } else if (decision.excess_army_done === 'more_cp') {
        // Step 2: BMPIT with remaining CP
        if (!decision.bmpit) decision.bmpit = [rollDie(), rollDie()];
        const [d1, d2] = decision.bmpit;
        const res = getBMPITResult(d1, d2);
        const finalLog = `P2: ${decision.p2Log}; Excess: Army + BMPIT ${res.target}->${res.influence}`;
        
        html += `
            <div class="step-item" style="opacity: 0.5;">
                <span class="step-icon">OK</span>
                <span class="step-text">Army built</span>
            </div>
            <div class="step-item action">
                <span class="step-icon">2</span>
                <span class="step-text"><strong>Then:</strong> Spend remaining CP on BMPIT (Major Power Influence Table).</span>
            </div>
            <div style="margin:0.75rem 0">
                ${diceHTML(d1, 'Target')} ${diceHTML(d2, 'Influence')}
            </div>
            <div class="step-item action">
                <span class="step-icon">></span>
                <span class="step-text">BMPIT Result: <strong>${res.target}</strong> -> <strong>${res.influence}</strong></span>
            </div>
            ${res.doubles ? '<div class="step-item"><span class="step-icon">!</span><span class="step-text">Doubles rolled: Bot will influence Italy if able.</span></div>' : ''}
            <div class="action-box">
                <h4>Action</h4>
                <div class="action-text">Excess CP: Army + BMPIT ${res.target} -> ${res.influence}</div>
                <button class="confirm-btn" onclick="confirmAction('${finalLog.replace(/'/g, "\\'")}')">Confirm</button>
            </div>`;
    } else {
        // No more CP after army (or couldn't build)
        const finalLog = `P2: ${decision.p2Log}; Excess: Army build`;
        html += `
            <div class="step-item" style="opacity: 0.5;">
                <span class="step-icon">OK</span>
                <span class="step-text">Army build attempted</span>
            </div>
            <div class="action-box">
                <h4>Action</h4>
                <div class="action-text">Excess CP spent on army build.</div>
                <button class="confirm-btn" onclick="confirmAction('${finalLog.replace(/'/g, "\\'")}')">Confirm</button>
            </div>`;
    }
    
    html += `
        </div>
    </div>`;
    
    return html;
}

// Helper for excess CP flow
function excessArmyDone(hasMoreCP) {
    decision.excess_army_done = hasMoreCP ? 'more_cp' : 'done';
    renderApp();
}

// Roll secondary die for Build action
function rollP2Secondary() {
    decision.p2SecondaryRoll = rollDie();
    renderApp();
}
