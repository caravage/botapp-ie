// homeCards.js - Home Card decision logic

const HOME_CARD_LOGIC = {
    // General pre-check for all home cards
    _general: (dec, gs) => {
        const ns = gs.nations[gs.activeNation];
        if (!dec.q_general) {
            if (ns.stability === 6) {
                return { 
                    type: 'question', 
                    text: 'Bot stability is at 6. Does this Home Card event give < 3 CPs value?', 
                    options: [{label: 'Yes (< 3 CP value)', value: 'yes'}, {label: 'No (>= 3 CP value)', value: 'no'}], 
                    key: 'q_general' 
                };
            }
            dec.q_general = 'no';
        }
        return null;
    },

    // GERMANY
    GE: {
        '_default': (dec, gs) => {
            const ns = gs.nations.GE;
            
            // Check if German General Staff should be played instead (Bismarck removed or Germany unified)
            if (ns.bismarckRemoved || ns.germanyUnified) {
                return {
                    type: 'action',
                    text: `Play German General Staff (${ns.bismarckRemoved ? 'Bismarck removed' : 'Germany unified'}).`,
                    log: 'HC Action: Play German General Staff'
                };
            }

            // Bismarck logic - check manpower condition
            if (!dec.q_manpower) {
                return { 
                    type: 'question', 
                    text: 'Does GE have armies equal to their peacetime manpower limit AND at least 1 reserve army?', 
                    options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}], 
                    key: 'q_manpower' 
                };
            }
            
            if (dec.q_manpower === 'no') {
                // Cannot declare war - draw next card
                return { 
                    type: 'action', 
                    text: 'GE does not meet manpower requirements. Place Bismarck on TOP of GE\'s card pile and draw the NEXT card.', 
                    log: 'HC Action: Bismarck -> top of pile, draw next card' 
                };
            }
            
            // Manpower OK - check if last card
            if (!dec.q_last_card) {
                return {
                    type: 'question',
                    text: 'Is this GE\'s last card for this action round?',
                    options: [{label: 'Yes (last card)', value: 'yes'}, {label: 'No (more cards)', value: 'no'}],
                    key: 'q_last_card'
                };
            }
            
            if (dec.q_last_card === 'yes') {
                // Last card - play German General Staff instead
                return {
                    type: 'action',
                    text: 'Last card - play German General Staff instead of declaring war.',
                    log: 'HC Action: Play German General Staff (last card)'
                };
            }
            
            // Not last card - WAR OF UNIFICATION
            return { 
                type: 'action', 
                text: `Play Bismarck to declare WAR OF UNIFICATION.\n\nTarget Priority:\n- Minor powers first, then player-controlled spaces\n- Attack minor powers WITHOUT player allies first\n- Always attack TWO minor powers without allies if able`, 
                log: 'HC Action: Play Bismarck (War of Unification)' 
            };
        }
    },

    // UNITED KINGDOM
    UK: {
        '_default': (dec, gs) => {
            return { 
                type: 'action', 
                text: 'Always play Sun Never Sets.\n\n<em>Note: Balance of Power is not played from hand. Instead, every time ANY war is declared, roll a die. On 1-2, play Balance of Power if it\'s still unplayed.</em>', 
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
            // Turn 1: Always Habsburg Dynasty with BDIT roll on Main Map
            if (gs.turn === 1) {
                // Roll BDIT on Main Map
                const bdit = renderBDITRollMainMapOnly(dec, 'au_t1_', 'Habsburg Dynasty Target');
                if (bdit.type !== 'bdit_result') {
                    return { 
                        type: 'custom', 
                        html: `<div class="step-item action"><span class="step-icon">></span><span class="step-text">Turn 1: Play Habsburg Dynasty. Roll BDIT on Main Map for target.</span></div>${bdit.html}`
                    };
                }
                return { 
                    type: 'action', 
                    text: `Turn 1: Play Habsburg Dynasty.\n\nBDIT Target: ${bdit.region} -> ${bdit.nation}`, 
                    log: `HC Action: Play Habsburg Dynasty (T1 - ${bdit.region} -> ${bdit.nation})`,
                    prefix: bdit.html
                };
            }
            
            // Later turns: Roll for which HC (1-2 = Habsburg, 3-6 = Kaiserreich)
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'AU HC Roll (1-2 = Habsburg)');
            
            if (dec.roll1 <= 2) {
                return { 
                    type: 'action', 
                    text: `Roll = ${dec.roll1}. Play Habsburg Dynasty.`, 
                    log: 'HC Action: Play Habsburg Dynasty', 
                    prefix: html
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
            
            if (ns.industry < 3) {
                return { 
                    type: 'action', 
                    text: `Industry = ${ns.industry} (< 3): Always play Modernization.\n\n<em>Note: Other bots will not give OT a 3 CP card.</em>`, 
                    log: 'HC Action: Play Modernization (Industry < 3)' 
                };
            }
            
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'OT HC Roll (1-2 = Jihad)');
            
            if (dec.roll1 <= 2) {
                return { 
                    type: 'action', 
                    text: 'Industry >= 3 and roll = 1-2. Play Jihad.', 
                    log: 'HC Action: Play Jihad', 
                    prefix: html 
                };
            }
            return { 
                type: 'action', 
                text: `Industry >= 3 and roll = ${dec.roll1}. Play Modernization.`, 
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
