// homeCards.js - Home Card decision logic

const HOME_CARD_LOGIC = {
    // General pre-check for all home cards
    // NOTE: This only affects whether to play for EVENT value, not the HC resolution itself
    _general: (dec, gs) => {
        const ns = gs.nations[gs.activeNation];
        if (!dec.q_general) {
            // Only ask if stability is 6
            if (ns.stability === 6) {
                return { 
                    type: 'question', 
                    text: 'Bot stability is at 6. Does this Home Card event give < 3 CPs value?', 
                    options: [{label: 'Yes (< 3 CP value)', value: 'yes'}, {label: 'No (≥ 3 CP value)', value: 'no'}], 
                    key: 'q_general' 
                };
            }
            // If stability not 6, skip this check
            dec.q_general = 'no';
        }
        // This check doesn't stop HC resolution, just notes if event shouldn't be played
        return null;
    },

    // GERMANY
    GE: {
        '_default': (dec, gs) => {
            const ns = gs.nations.GE;
            
            // Check if German General Staff should be played instead of Bismarck
            // Conditions: (1) last card and won't declare war, (2) Bismarck removed, (3) Germany unified
            if (!dec.q_gss_check) {
                if (ns.bismarckRemoved || ns.germanyUnified) {
                    // Auto-play German General Staff
                    return {
                        type: 'action',
                        text: `Play German General Staff (${ns.bismarckRemoved ? 'Bismarck removed' : 'Germany unified'}).`,
                        log: 'HC Action: Play German General Staff'
                    };
                }
                // Need to check Bismarck conditions
                dec.q_gss_check = 'done';
            }

            // Bismarck logic
            if (!dec.q_bismarck) {
                return { 
                    type: 'question', 
                    text: 'Does GE have armies equal to their peacetime manpower limit AND at least 1 reserve army?', 
                    options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}], 
                    key: 'q_bismarck' 
                };
            }
            
            if (dec.q_bismarck === 'yes') {
                return { 
                    type: 'action', 
                    text: 'Play Bismarck to DECLARE WAR. Use BDIT to choose target.', 
                    log: 'HC Action: Play Bismarck (Declare War)' 
                };
            }
            
            // Bismarck not played - check if this is last card
            if (!dec.q_last_card) {
                return {
                    type: 'question',
                    text: 'Is this GE\'s last card for this action round?',
                    options: [{label: 'Yes (last card)', value: 'yes'}, {label: 'No (more cards)', value: 'no'}],
                    key: 'q_last_card'
                };
            }
            
            if (dec.q_last_card === 'yes') {
                return {
                    type: 'action',
                    text: 'Last card and won\'t declare war. Play German General Staff instead.',
                    log: 'HC Action: Play German General Staff (last card)'
                };
            }
            
            return { 
                type: 'action', 
                text: 'GE does not declare war. Place Bismarck on TOP of GE\'s card pile. Then reveal and play the NEXT GE card.', 
                log: 'HC Action: Bismarck → top of pile, play next card' 
            };
        }
    },

    // UNITED KINGDOM
    UK: {
        '_default': (dec, gs) => {
            // UK ALWAYS plays Sun Never Sets
            // Balance of Power is a separate trigger (not played from hand)
            return { 
                type: 'action', 
                text: 'Always play Sun Never Sets.\n\n⚠️ REMINDER: Balance of Power is not played from hand. Instead, every time ANY war is declared, roll a die. On 1-2, play Balance of Power if it\'s still unplayed.', 
                log: 'HC Action: Play Sun Never Sets' 
            };
        }
    },

    // FRANCE
    FR: {
        '_default': (dec, gs) => {
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'FR HC Roll (1 = Aux Armes)');
            
            if (dec.roll1 === 1) {
                return { 
                    type: 'action', 
                    text: 'Roll = 1. Play Aux Armes, Citoyens!', 
                    log: 'HC Action: Play Aux Armes, Citoyens!', 
                    prefix: html 
                };
            }
            return { 
                type: 'action', 
                text: `Roll = ${dec.roll1}. Play The City of Light.`, 
                log: 'HC Action: Play The City of Light', 
                prefix: html 
            };
        }
    },

    // AUSTRIA-HUNGARY
    AU: {
        '_default': (dec, gs) => {
            // Turn 1: Always Habsburg Dynasty
            if (gs.turn === 1) {
                return { 
                    type: 'action', 
                    text: 'Turn 1: Play Habsburg Dynasty. Use the BDIT to choose a target.', 
                    log: 'HC Action: Play Habsburg Dynasty (Turn 1)' 
                };
            }
            
            // Later turns: Roll for which HC
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'AU HC Roll (1-2 = Habsburg)');
            
            if (dec.roll1 <= 2) {
                // Habsburg Dynasty - now roll for war of unification
                if (!dec.roll2) dec.roll2 = rollDie();
                let html2 = html + ' ' + diceHTML(dec.roll2, 'War Roll (1-2 = War)');
                
                if (dec.roll2 <= 2) {
                    return { 
                        type: 'action', 
                        text: 'Play Habsburg Dynasty to declare a WAR OF UNIFICATION targeting a neighboring space with a nationality that AU granted citizenship.', 
                        log: 'HC Action: Habsburg Dynasty (War of Unification)', 
                        prefix: html2
                    };
                }
                return { 
                    type: 'action', 
                    text: `War roll = ${dec.roll2}. Play Habsburg Dynasty (no war).`, 
                    log: 'HC Action: Habsburg Dynasty (No War)', 
                    prefix: html2
                };
            }
            
            return { 
                type: 'action', 
                text: `Roll = ${dec.roll1}. Play Kaiserreich.`, 
                log: 'HC Action: Play Kaiserreich', 
                prefix: html 
            };
        }
    },

    // RUSSIA
    RU: {
        '_default': (dec, gs) => {
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'RU HC Roll (1-3 = Russo-Turkish)');
            
            if (dec.roll1 <= 3) {
                // Check for OT truce
                if (!dec.q_truce) {
                    return { 
                        type: 'question', 
                        text: 'Roll 1-3: Would play Russo-Turkish Wars. Does RU have a truce with OT?', 
                        options: [{label: 'Yes (has truce)', value: 'yes'}, {label: 'No truce', value: 'no'}], 
                        key: 'q_truce', 
                        prefix: html 
                    };
                }
                if (dec.q_truce === 'yes') {
                    return { 
                        type: 'action', 
                        text: 'RU has truce with OT. Play God Save the Tsar instead.', 
                        log: 'HC Action: Play God Save the Tsar (OT truce)', 
                        prefix: html 
                    };
                }
                return { 
                    type: 'action', 
                    text: 'Play Russo-Turkish Wars.', 
                    log: 'HC Action: Play Russo-Turkish Wars', 
                    prefix: html 
                };
            }
            
            return { 
                type: 'action', 
                text: `Roll = ${dec.roll1}. Play God Save the Tsar.`, 
                log: 'HC Action: Play God Save the Tsar', 
                prefix: html 
            };
        }
    },

    // OTTOMAN EMPIRE
    OT: {
        '_default': (dec, gs) => {
            const ns = gs.nations.OT;
            
            // Industry < 3: ALWAYS play Modernization
            if (ns.industry < 3) {
                return { 
                    type: 'action', 
                    text: `Industry = ${ns.industry} (< 3): Always play Modernization.\n\n📝 Note: Other bots will not give OT a 3 CP card.`, 
                    log: 'HC Action: Play Modernization (Industry < 3)' 
                };
            }
            
            // Industry >= 3: Roll for Jihad
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'OT HC Roll (1-2 = Jihad)');
            
            if (dec.roll1 <= 2) {
                return { 
                    type: 'action', 
                    text: 'Industry ≥ 3 and roll = 1-2. Play Jihad.', 
                    log: 'HC Action: Play Jihad', 
                    prefix: html 
                };
            }
            return { 
                type: 'action', 
                text: `Industry ≥ 3 and roll = ${dec.roll1}. Play Modernization.`, 
                log: 'HC Action: Play Modernization', 
                prefix: html 
            };
        }
    }
};

function getHomeCardLogic(nation, cardName) {
    const nationLogic = HOME_CARD_LOGIC[nation];
    if (!nationLogic) return null;
    return nationLogic[cardName] || nationLogic['_default'] || null;
}
