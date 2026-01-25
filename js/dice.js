// dice.js - Dice rolling utilities and BDIT table

function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function diceHTML(val, label = '') {
    return `<div class="dice-box"><div class="dice">${val}</div>${label ? `<span class="dice-label">${label}</span>` : ''}</div>`;
}

// BDIT - Bot Diplomatic Interest Table
// Structure: BDIT[region][dieResult] = nation
const BDIT = {
    // Main Map
    'Germany': {
        1: 'GE', 2: 'GE', 3: 'GE', 4: 'GE', 5: 'AU', 6: 'AU'
    },
    'Italy': {
        1: 'FR', 2: 'FR', 3: 'FR', 4: 'AU', 5: 'AU', 6: 'AU'
    },
    'Low Countries': {
        1: 'GE', 2: 'GE', 3: 'UK', 4: 'FR', 5: 'FR', 6: 'FR'
    },
    'Balkans': {
        1: 'AU', 2: 'AU', 3: 'AU', 4: 'RU', 5: 'RU', 6: 'OT'
    },
    // Submaps
    'Africa': {
        1: 'GE', 2: 'GE', 3: 'UK', 4: 'FR', 5: 'OT', 6: 'OT'
    },
    'Great Game': {
        1: 'UK', 2: 'UK', 3: 'UK', 4: 'RU', 5: 'RU', 6: 'OT'
    },
    'Japan + Pacific': {
        1: 'GE', 2: 'GE', 3: 'UK', 4: 'FR', 5: 'FR', 6: 'FR'
    }
};

// Nation-specific region determination for Main Map
const BDIT_MAIN_MAP_RULES = {
    'GE': { type: 'roll', results: { 1: 'Germany', 2: 'Germany', 3: 'Germany', 4: 'Germany', 5: 'Low Countries', 6: 'Low Countries' } },
    'UK': { type: 'fixed', region: 'Low Countries' },
    'FR': { type: 'roll', results: { 1: 'Italy', 2: 'Italy', 3: 'Italy', 4: 'Low Countries', 5: 'Low Countries', 6: 'Low Countries' } },
    'AU': { type: 'roll', results: { 1: 'Germany', 2: 'Germany', 3: 'Italy', 4: 'Italy', 5: 'Balkans', 6: 'Balkans' } },
    'RU': { type: 'fixed', region: 'Balkans' },
    'OT': { type: 'fixed', region: 'Balkans', note: 'Unless diplomacy/ally with Egypt possible' }
};

// Nation-specific region determination for Submaps
const BDIT_SUBMAP_RULES = {
    'GE': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Africa', 5: 'Japan + Pacific', 6: 'Japan + Pacific' } },
    'UK': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Great Game', 5: 'Great Game', 6: 'Japan + Pacific' } },
    'FR': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Africa', 5: 'Japan + Pacific', 6: 'Japan + Pacific' } },
    'AU': { type: 'none' }, // AU doesn't use submaps
    'RU': { type: 'fixed', region: 'Great Game' },
    'OT': { type: 'roll', results: { 1: 'Africa', 2: 'Africa', 3: 'Africa', 4: 'Great Game', 5: 'Great Game', 6: 'Great Game' } }
};

// Get BDIT result for a region and die roll
function getBDITResult(region, dieRoll) {
    const regionData = BDIT[region];
    if (!regionData) return null;
    return regionData[dieRoll] || null;
}

// Main BDIT Roll function
function renderBDITRoll(dec, prefix = '', context = '') {
    const nation = gameState.activeNation;
    const keyMapChoice = prefix + 'bdit_map';
    const keyRegionRoll = prefix + 'bdit_region_roll';
    const keyNationRoll = prefix + 'bdit_nation_roll';
    
    // Step 1: Choose map type
    if (!dec[keyMapChoice]) {
        let options = `
            <button class="q-btn" onclick="selectBDITMap('${prefix}', 'main')">Main Map</button>`;
        
        // AU doesn't use submaps
        if (nation !== 'AU') {
            options += `
                <button class="q-btn" onclick="selectBDITMap('${prefix}', 'submap')">Submaps</button>`;
        }
        
        options += `
            <button class="q-btn" onclick="selectBDITMap('${prefix}', 'random')">Random</button>`;
        
        return {
            type: 'bdit_map_select',
            html: `<div class="question-box">
                <div class="question-text">BDIT${context ? ' for ' + context : ''}: Select map type</div>
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                    ${options}
                </div>
            </div>`
        };
    }
    
    const mapChoice = dec[keyMapChoice];
    const rules = mapChoice === 'main' ? BDIT_MAIN_MAP_RULES[nation] : BDIT_SUBMAP_RULES[nation];
    
    // Handle random choice
    if (mapChoice === 'random') {
        if (!dec[prefix + 'bdit_random_roll']) {
            return {
                type: 'bdit_random',
                html: `<div class="question-box">
                    <div class="question-text">Roll to determine Main Map or Submap:</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="rollBDITRandom('${prefix}')">Roll Die</button>
                    </div>
                </div>`
            };
        }
        const randomRoll = dec[prefix + 'bdit_random_roll'];
        dec[keyMapChoice] = randomRoll <= 3 ? 'main' : 'submap';
        // Re-run with determined map
        return renderBDITRoll(dec, prefix, context);
    }
    
    // Step 2: Determine region based on nation rules
    let region;
    let regionRollHtml = '';
    
    if (rules.type === 'fixed') {
        region = rules.region;
        if (rules.note) {
            regionRollHtml = `<div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted); margin: 0.5rem 0;">${rules.note}</div>`;
        }
    } else if (rules.type === 'roll') {
        if (!dec[keyRegionRoll]) {
            return {
                type: 'bdit_region_roll',
                html: `<div class="question-box">
                    <div class="question-text">${nation} on ${mapChoice === 'main' ? 'Main Map' : 'Submaps'}: Roll for region</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="rollBDITRegion('${prefix}')">Roll Die</button>
                    </div>
                </div>`
            };
        }
        const regionRoll = dec[keyRegionRoll];
        region = rules.results[regionRoll];
        regionRollHtml = `${diceHTML(regionRoll, 'Region Roll')}
            <div class="step-item" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">Region: <strong>${region}</strong></span>
            </div>`;
    } else if (rules.type === 'none') {
        return {
            type: 'bdit_error',
            html: `<div class="step-item"><span class="step-icon">!</span><span class="step-text">${nation} cannot use Submaps. Please select Main Map.</span></div>`
        };
    }
    
    // Step 3: Roll for nation within region
    if (!dec[keyNationRoll]) {
        return {
            type: 'bdit_nation_roll',
            html: `<div style="margin: 0.5rem 0;">${regionRollHtml}</div>
            <div class="question-box">
                <div class="question-text">Roll for nation in ${region}:</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollBDITNation('${prefix}')">Roll Die</button>
                </div>
            </div>`
        };
    }
    
    // Step 4: Show final result
    const nationRoll = dec[keyNationRoll];
    const resultNation = getBDITResult(region, nationRoll);
    
    let note = '';
    if (region === 'Balkans' && resultNation === 'OT') {
        note = '<div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted); margin-top: 0.5rem;">Note: OT will always diplomacy/ally Egypt if able</div>';
    }
    
    return {
        type: 'bdit_result',
        map: mapChoice,
        region: region,
        regionRoll: dec[keyRegionRoll],
        nationRoll: nationRoll,
        nation: resultNation,
        html: `<div style="margin: 1rem 0;">
            ${regionRollHtml}
            ${diceHTML(nationRoll, 'Nation Roll')}
            <div class="step-item action" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">BDIT Result: <strong>${region}</strong> -> <strong>${resultNation}</strong></span>
            </div>
            ${note}
        </div>`
    };
}

// BDIT for Main Map only (used by AU Turn 1, Metternich's Legacy)
function renderBDITRollMainMapOnly(dec, prefix = '', context = '') {
    const nation = gameState.activeNation || 'AU'; // Default to AU for Metternich
    const rules = BDIT_MAIN_MAP_RULES[nation];
    const keyRegionRoll = prefix + 'bdit_region_roll';
    const keyNationRoll = prefix + 'bdit_nation_roll';
    
    // Step 1: Determine region
    let region;
    let regionRollHtml = '';
    
    if (rules.type === 'fixed') {
        region = rules.region;
    } else if (rules.type === 'roll') {
        if (!dec[keyRegionRoll]) {
            return {
                type: 'bdit_region_roll',
                html: `<div class="question-box">
                    <div class="question-text">${context ? context + ': ' : ''}${nation} Main Map - Roll for region</div>
                    <div class="question-btns">
                        <button class="q-btn yes" onclick="rollBDITRegion('${prefix}')">Roll Die</button>
                    </div>
                </div>`
            };
        }
        const regionRoll = dec[keyRegionRoll];
        region = rules.results[regionRoll];
        regionRollHtml = `${diceHTML(regionRoll, 'Region Roll')}
            <div class="step-item" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">Region: <strong>${region}</strong></span>
            </div>`;
    }
    
    // Step 2: Roll for nation
    if (!dec[keyNationRoll]) {
        return {
            type: 'bdit_nation_roll',
            html: `<div style="margin: 0.5rem 0;">${regionRollHtml}</div>
            <div class="question-box">
                <div class="question-text">Roll for nation in ${region}:</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollBDITNation('${prefix}')">Roll Die</button>
                </div>
            </div>`
        };
    }
    
    const nationRoll = dec[keyNationRoll];
    const resultNation = getBDITResult(region, nationRoll);
    
    return {
        type: 'bdit_result',
        map: 'main',
        region: region,
        regionRoll: dec[keyRegionRoll],
        nationRoll: nationRoll,
        nation: resultNation,
        html: `<div style="margin: 1rem 0;">
            ${regionRollHtml}
            ${diceHTML(nationRoll, 'Nation Roll')}
            <div class="step-item action" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">BDIT Result: <strong>${region}</strong> -> <strong>${resultNation}</strong></span>
            </div>
        </div>`
    };
}

// Global functions for BDIT interaction
function selectBDITMap(prefix, mapType) {
    decision[prefix + 'bdit_map'] = mapType;
    renderApp();
}

function rollBDITRandom(prefix) {
    decision[prefix + 'bdit_random_roll'] = rollDie();
    renderApp();
}

function rollBDITRegion(prefix) {
    decision[prefix + 'bdit_region_roll'] = rollDie();
    renderApp();
}

function rollBDITNation(prefix) {
    decision[prefix + 'bdit_nation_roll'] = rollDie();
    renderApp();
}
