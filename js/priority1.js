// priority1.js - Priority 1 decision logic

// Map Home Card names to their nations
const HOME_CARD_NATIONS = {
    'Otto von Bismarck': 'GE',
    'German General Staff': 'GE',
    'Sun Never Sets': 'UK',
    'Balance of Power': 'UK',
    'The City of Light': 'FR',
    'Aux Armes, Citoyens!': 'FR',
    'Habsburg Dynasty': 'AU',
    'Kaiserreich': 'AU',
    'Russo-Turkish Wars': 'RU',
    'God Save the Tsar': 'RU',
    'Modernization': 'OT',
    'Jihad': 'OT'
};

function isHomeCardForNation(card, nation) {
    // Check if card is a Home Card type
    if (card.type !== 'Home') return false;
    // Check if this Home Card belongs to the active nation
    const cardNation = HOME_CARD_NATIONS[card.name];
    return cardNation === nation;
}

function getPriority1Checks(nation, card, gs) {
    const ns = gs.nations[nation];
    const checks = [];
    
    // 1. Play Home Card
    const isHomeCard = isHomeCardForNation(card, nation);
    checks.push({
        label: 'Play Home Card',
        text: isHomeCard 
            ? `Resolve ${nation}'s Home Card: ${card.name}` 
            : `Not a ${nation} Home Card`,
        action: `goToPhase('homecard_resolve')`,
        possible: isHomeCard
    });

    // 2. Attack Rebels
    checks.push({ 
        label: 'Attack Rebels', 
        text: 'Attack/build/move units to attack rebels.', 
        log: 'P1 Action: Attack Rebels',
        possible: ns.hasRebels
    });

    // 3. Event (Bot Box)
    checks.push({
        label: 'Event (Bot Box)',
        text: 'Play the card for its event (if it has a Bot Box instruction).',
        log: `P1 Action: Play Event '${card.name}'`,
        possible: true
    });

    // 4. Industrialize
    // - WITHOUT auto-industry marker: can industrialize with ANY CP card
    // - WITH auto-industry marker: can ONLY industrialize with 1-2 CP cards
    let canIndustrialize;
    let industrializeText;
    
    if (ns.industrializedThisTurn) {
        canIndustrialize = false;
        industrializeText = 'Industrialize (Already industrialized this turn)';
    } else if (ns.autoIndustry) {
        // Has auto-industry: only 1-2 CP cards allowed
        canIndustrialize = card.cp <= 2;
        if (canIndustrialize) {
            industrializeText = `With auto-industry marker, industrialize with ${card.cp} CP card.`;
        } else {
            industrializeText = `With auto-industry marker, can only industrialize with 1-2 CP cards (this card is ${card.cp} CP).`;
        }
    } else {
        // No auto-industry: can use any card
        canIndustrialize = true;
        industrializeText = `Industrialize with ${card.cp} CP card (no auto-industry restriction).`;
    }
    
    checks.push({ 
        label: 'Industrialize', 
        text: industrializeText,
        log: `P1 Action: Industrialize with ${card.cp} CP card`,
        possible: canIndustrialize
    });

    // 5. GE Special
    if (nation === 'GE') {
        checks.push({ 
            label: 'GE Special', 
            text: 'Build armies if able.', 
            log: 'P1 Action: GE Build Armies', 
            possible: true 
        });
    }
    
    // 6. UK Special
    if (nation === 'UK') {
        checks.push({ 
            label: 'UK Special', 
            text: 'Build dreadnoughts if able.', 
            log: 'P1 Action: UK Build Dreadnoughts', 
            possible: true 
        });
    }
    
    return checks;
}

function renderP1() {
    const checks = getPriority1Checks(gameState.activeNation, decision.card, gameState);
    let html = `
    <div class="priority-section">
        <div class="priority-header active">
            <span class="status-dot"></span>Priority 1 Actions
        </div>
        <div class="priority-content">
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:1rem;">
                Select the highest priority action that is not greyed out. A Priority 1 action ends the turn.
            </p>`;
    
    checks.forEach(c => {
        let clickHandler = c.possible ? (c.action ? c.action : `confirmAction('${c.log.replace(/'/g, "\\'")}')`) : '';
        html += `
            <div class="step-item action selectable ${!c.possible ? 'impossible' : ''}" onclick="${clickHandler}">
                <span class="step-icon">></span>
                <span class="step-text"><strong>${c.label}:</strong> ${c.text}</span>
            </div>`;
    });
    
    html += `
            <div class="question-box" style="margin-top:2rem; border-top: 1px solid var(--border); padding-top: 1.5rem;">
                <div class="question-text">If no Priority 1 actions apply:</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="goToPhase('priority2')">Go to Priority 2</button>
                </div>
            </div>
        </div>
    </div>`;
    
    return html;
}
