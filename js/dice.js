// dice.js - Dice rolling utilities and BDIT table

function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function diceHTML(val, label = '') {
    return `<div class="dice-box"><div class="dice">${val}</div>${label ? `<span class="dice-label">${label}</span>` : ''}</div>`;
}

// =====================================================
// BDIT - Bot Diplomatic Interest Table
// Returns a ZONE (not a specific space/nation)
// Zones: Germany, Italy, Low Countries, Balkans, Africa, Great Game, Pacific
// =====================================================

// Nation-specific zone determination for Main Map
const BDIT_MAIN_MAP_RULES = {
    'GE': { type: 'roll', results: { 1: 'Germany', 2: 'Germany', 3: 'Germany', 4: 'Germany', 5: 'Low Countries', 6: 'Low Countries' } },
    'UK': { type: 'fixed', zone: 'Low Countries' },
    'FR': { type: 'roll', results: { 1: 'Italy', 2: 'Italy', 3: 'Italy', 4: 'Low Countries', 5: 'Low Countries', 6: 'Low Countries' } },
    'AU': { type: 'roll', results: { 1: 'Germany', 2: 'Germany', 3: 'Italy', 4: 'Italy', 5: 'Balkans', 6: 'Balkans' } },
    'RU': { type: 'fixed', zone: 'Balkans' },
    'OT': { type: 'fixed', zone: 'Balkans', note: 'Unless diplomacy/ally with Egypt possible' }
};

// Nation-specific zone determination for Submaps
const BDIT_SUBMAP_RULES = {
    'GE': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Africa', 5: 'Pacific', 6: 'Pacific' } },
    'UK': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Great Game', 5: 'Great Game', 6: 'Pacific' } },
    'FR': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Africa', 5: 'Pacific', 6: 'Pacific' } },
    'AU': { type: 'none' }, // AU doesn't use submaps
    'RU': { type: 'fixed', zone: 'Great Game' },
    'OT': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Great Game', 5: 'Great Game', 6: 'Great Game' } }
};

// Main BDIT Roll function
function renderBDITRoll(dec, prefix = '', context = '') {
    const nation = gameState.activeNation;
    const keyMapChoice = prefix + 'bdit_map';
    const keyZoneRoll = prefix + 'bdit_zone_roll';
    
    // Step 1: Choose map type (Main Map or Submaps)
    if (!dec[keyMapChoice]) {
        let options = `<button class="q-btn" onclick="selectBDITMap('${prefix}', 'main')">Main Map</button>`;
        
        // AU doesn't use submaps
        if (nation !== 'AU') {
            options += `<button class="q-btn" onclick="selectBDITMap('${prefix}', 'submap')">Submaps</button>`;
        }
        
        return {
            type: 'bdit_map_select',
            html: `<div class="question-box">
                <div class="question-text">BDIT${context ? ' for ' + context : ''}: Select map</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    ${options}
                </div>
            </div>`
        };
    }
    
    const mapChoice = dec[keyMapChoice];
    const rules = mapChoice === 'main' ? BDIT_MAIN_MAP_RULES[nation] : BDIT_SUBMAP_RULES[nation];
    
    // Handle AU trying to use submaps
    if (rules.type === 'none') {
        return {
            type: 'bdit_error',
            html: `<div class="step-item"><span class="step-icon">!</span><span class="step-text">${nation} cannot use Submaps.</span></div>
                   <div class="question-box">
                       <div class="question-btns">
                           <button class="q-btn" onclick="resetBDITMap('${prefix}')">Choose again</button>
                       </div>
                   </div>`
        };
    }
    
    // Step 2: Determine zone based on nation rules
    let zone;
    let zoneRollHtml = '';
    
    if (rules.type === 'fixed') {
        zone = rules.zone;
        if (rules.note) {
            zoneRollHtml = `<div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted); margin: 0.5rem 0;">${rules.note}</div>`;
        }
    } else if (rules.type === 'roll') {
        if (!dec[keyZoneRoll]) {
            return {
                type: 'bdit_zone_roll',
                html: `<div class="question-box">
                    <div class="question-text">${nation} on ${mapChoice === 'main' ? 'Main Map' : 'Submaps'}: Roll for zone</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="rollBDITZone('${prefix}')">Roll Die</button>
                    </div>
                </div>`
            };
        }
        const zoneRoll = dec[keyZoneRoll];
        zone = rules.results[zoneRoll];
        zoneRollHtml = `${diceHTML(zoneRoll, 'Zone Roll')}`;
    }
    
    // Result
    return {
        type: 'bdit_result',
        map: mapChoice,
        zone: zone,
        zoneRoll: dec[keyZoneRoll],
        html: `<div style="margin: 1rem 0;">
            ${zoneRollHtml}
            <div class="step-item action" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">BDIT Result: <strong>${zone}</strong></span>
            </div>
        </div>`
    };
}

// Global functions for BDIT interaction
function selectBDITMap(prefix, mapType) {
    decision[prefix + 'bdit_map'] = mapType;
    renderApp();
}

function resetBDITMap(prefix) {
    decision[prefix + 'bdit_map'] = null;
    renderApp();
}

function rollBDITZone(prefix) {
    decision[prefix + 'bdit_zone_roll'] = rollDie();
    renderApp();
}
