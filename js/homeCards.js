// homeCards.js - Home Card decision logic

const HOME_CARD_LOGIC = {
    // General pre-check for all home cards
    _general: (dec, gs) => {
        if (!dec.q_general) {
            return { 
                type: 'question', 
                text: 'Is bot stability at 6 AND does the event give a player < 3 CPs value?', 
                options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}], 
                key: 'q_general' 
            };
        }
        if (dec.q_general === 'yes') {
            return { 
                type: 'action', 
                text: 'Do not play for event. Bot will use CPs instead.', 
                log: 'HC Condition: Not played for event (Stab 6)' 
            };
        }
        return null; // Condition doesn't apply, proceed to nation-specific logic
    },

    // GERMANY
    GE: {
        '_default': (dec, gs) => {
            const cardName = dec.card.name;
            
            if (cardName === 'Otto von Bismarck') {
                if (!dec.q1) {
                    return { 
                        type: 'question', 
                        text: 'Does GE have armies equal to peacetime limit AND at least 1 reserve army?', 
                        options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}], 
                        key: 'q1' 
                    };
                }
                if (dec.q1 === 'yes') {
                    return { 
                        type: 'action', 
                        text: 'Play Bismarck to DECLARE WAR.', 
                        log: 'HC Action: Play Bismarck for War' 
                    };
                }
                return { 
                    type: 'action', 
                    text: 'GE does not declare war. Place this HC on top of the card pile and play the next GE card.', 
                    log: 'HC Action: Bismarck not played, play next card' 
                };
            }
            
            if (cardName === 'German General Staff') {
                if (!dec.q1) {
                    return { 
                        type: 'question', 
                        text: 'Is this GE\'s last card and they won\'t declare war, OR is Bismarck removed, OR is Germany unified?', 
                        options: [{label: 'Yes (any of these)', value: 'yes'}, {label: 'No (none of these)', value: 'no'}], 
                        key: 'q1' 
                    };
                }
                if (dec.q1 === 'yes') {
                    return { 
                        type: 'action', 
                        text: 'Play German General Staff.', 
                        log: 'HC Action: Play German General Staff' 
                    };
                }
                return { 
                    type: 'action', 
                    text: 'Conditions not met. Play next card.', 
                    log: 'HC Action: GGS not played' 
                };
            }
            
            return { 
                type: 'action', 
                text: `Unknown GE Home Card: ${cardName}. Please consult rules.`, 
                log: `HC Action: Unknown GE Home Card` 
            };
        }
    },

    // UNITED KINGDOM
    UK: {
        '_default': (dec, gs) => {
            const cardName = dec.card.name;
            
            if (cardName === 'Sun Never Sets') {
                return { 
                    type: 'action', 
                    text: 'Always play Sun Never Sets.', 
                    log: 'HC Action: Play Sun Never Sets' 
                };
            }
            
            if (cardName === 'Balance of Power') {
                return { 
                    type: 'action', 
                    text: 'This card is not played from hand. Its effect is triggered whenever a war is declared (roll 1-2 to play). Bot will use card for CPs.', 
                    log: 'HC Action: BoP used for CPs' 
                };
            }
            
            return { 
                type: 'action', 
                text: `Unknown UK Home Card: ${cardName}. Please consult rules.`, 
                log: `HC Action: Unknown UK Home Card` 
            };
        }
    },

    // FRANCE
    FR: {
        '_default': (dec, gs) => {
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'FR HC Roll');
            
            if (dec.roll1 === 1) {
                return { 
                    type: 'action', 
                    text: 'Play Aux Armes, Citoyens!', 
                    log: 'HC Action: Play Aux Armes, Citoyens!', 
                    prefix: html 
                };
            }
            return { 
                type: 'action', 
                text: 'Play The City of Light', 
                log: 'HC Action: Play The City of Light', 
                prefix: html 
            };
        }
    },

    // AUSTRIA-HUNGARY
    AU: {
        '_default': (dec, gs) => {
            if (gs.turn === 1) {
                return { 
                    type: 'action', 
                    text: 'Turn 1: Play Habsburg Dynasty. Use the BDIT to choose a target.', 
                    log: 'HC Action: Play Habsburg Dynasty (T1)' 
                };
            }
            
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'AU HC Roll (1-2 Habsburg, 3-6 Kaiserreich)');
            
            if (dec.roll1 <= 2) {
                if (!dec.q2) {
                    return { 
                        type: 'question', 
                        text: 'Playing Habsburg Dynasty. Roll another die. On 1-2, AU declares a war of unification. Result?', 
                        options: [{label:'1-2 (Declare War)', value:'war'}, {label:'3-6 (No War)', value:'nowar'}], 
                        key:'q2', 
                        prefix: html 
                    };
                }
                if (dec.q2 === 'war') {
                    return { 
                        type: 'action', 
                        text: 'Play Habsburg Dynasty to declare a war of unification targeting a neighboring space with a granted citizenship nationality.', 
                        log: 'HC Action: Habsburg Dynasty (War of Unification)', 
                        prefix: html
                    };
                }
                return { 
                    type: 'action', 
                    text: 'Play Habsburg Dynasty for event/CPs (no war).', 
                    log: 'HC Action: Habsburg Dynasty (No War)', 
                    prefix: html
                };
            }
            return { 
                type: 'action', 
                text: 'Play Kaiserreich.', 
                log: 'HC Action: Play Kaiserreich', 
                prefix: html 
            };
        }
    },

    // RUSSIA
    RU: {
        '_default': (dec, gs) => {
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'RU HC Roll (1-3 Russo-Turkish)');
            
            if (dec.roll1 <= 3) {
                if (!dec.q1) {
                    return { 
                        type: 'question', 
                        text: 'Does RU have a truce with OT?', 
                        options: [{label: 'Yes', value: 'yes'}, {label: 'No', value: 'no'}], 
                        key: 'q1', 
                        prefix: html 
                    };
                }
                if (dec.q1 === 'yes') {
                    return { 
                        type: 'action', 
                        text: 'Truce with OT. Play God Save the Tsar instead.', 
                        log: 'HC Action: Play God Save the Tsar (truce)', 
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
                text: 'Play God Save the Tsar.', 
                log: 'HC Action: Play God Save the Tsar', 
                prefix: html 
            };
        }
    },

    // OTTOMAN EMPIRE
    OT: {
        '_default': (dec, gs) => {
            if (gs.nations.OT.industry < 3) {
                return { 
                    type: 'action', 
                    text: 'Industry < 3: Always play Modernization. (Note: Other bots will not give OT a 3 CP card for this event).', 
                    log: 'HC Action: Play Modernization' 
                };
            }
            
            if (!dec.roll1) dec.roll1 = rollDie();
            let html = diceHTML(dec.roll1, 'OT HC Roll (1-2 Jihad)');
            
            if (dec.roll1 <= 2) {
                return { 
                    type: 'action', 
                    text: 'Play Jihad.', 
                    log: 'HC Action: Play Jihad', 
                    prefix: html 
                };
            }
            return { 
                type: 'action', 
                text: 'Roll > 2. Play Modernization.', 
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
