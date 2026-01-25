// dice.js - Dice rolling utilities and BDIT table

function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

function diceHTML(val, label = '') {
    return `<div class="dice-box"><div class="dice">${val}</div>${label ? `<span class="dice-label">${label}</span>` : ''}</div>`;
}

function getHCPosition(nation, gs) {
    const roll = rollDie();
    const positions = ['Top', '2nd', '3rd', '4th', '5th', 'Bottom'];
    return `Position ${roll} (${positions[roll - 1]})`;
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

// Main Map regions for die roll mapping (1-4)
const BDIT_MAIN_MAP_REGIONS = ['Germany', 'Italy', 'Low Countries', 'Balkans'];

// All regions
const BDIT_REGIONS_MAIN = [
    { id: 'Germany', name: 'Germany' },
    { id: 'Italy', name: 'Italy' },
    { id: 'Low Countries', name: 'Low Countries' },
    { id: 'Balkans', name: 'Balkans' }
];

const BDIT_REGIONS_SUB = [
    { id: 'Africa', name: 'Africa' },
    { id: 'Great Game', name: 'Great Game' },
    { id: 'Japan + Pacific', name: 'Japan + Pacific' }
];

const BDIT_REGIONS = [...BDIT_REGIONS_MAIN, ...BDIT_REGIONS_SUB];

// Get BDIT result for a region and die roll
function getBDITResult(region, dieRoll) {
    const regionData = BDIT[region];
    if (!regionData) return null;
    return regionData[dieRoll] || null;
}

// Render BDIT roll interface - select region then roll
function renderBDITRoll(dec, prefix = '', context = '') {
    return renderBDITRollWithRegions(dec, prefix, context, BDIT_REGIONS);
}

// Render BDIT roll on MAIN MAP - rolls dice to determine region, then rolls for nation
function renderBDITRollMainMap(dec, prefix = '', context = '') {
    const keyRegionRoll = prefix + 'bdit_region_roll';
    const keyNationRoll = prefix + 'bdit_nation_roll';
    
    // Step 1: Roll for region (1-4 maps to the 4 main map regions)
    if (!dec[keyRegionRoll]) {
        return {
            type: 'bdit_roll_region',
            html: `<div class="question-box">
                <div class="question-text">BDIT Main Map: Roll die to determine region${context ? ' for ' + context : ''}</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollBDITMainMapRegion('${prefix}')">Roll Die</button>
                </div>
            </div>`
        };
    }
    
    // Determine region from roll (1-2: Germany, 3: Italy, 4: Low Countries, 5-6: Balkans)
    const regionRoll = dec[keyRegionRoll];
    let region;
    if (regionRoll <= 2) region = 'Germany';
    else if (regionRoll === 3) region = 'Italy';
    else if (regionRoll === 4) region = 'Low Countries';
    else region = 'Balkans';
    
    // Step 2: Roll for nation within that region
    if (!dec[keyNationRoll]) {
        return {
            type: 'bdit_roll_nation',
            html: `<div style="margin: 0.5rem 0;">
                ${diceHTML(regionRoll, 'Region Roll')}
                <div class="step-item" style="margin-top: 0.5rem;">
                    <span class="step-icon">></span>
                    <span class="step-text">Region: <strong>${region}</strong></span>
                </div>
            </div>
            <div class="question-box">
                <div class="question-text">Now roll for nation in ${region}:</div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollBDITMainMapNation('${prefix}')">Roll Die</button>
                </div>
            </div>`
        };
    }
    
    // Step 3: Show final result
    const nationRoll = dec[keyNationRoll];
    const nation = getBDITResult(region, nationRoll);
    
    let note = '';
    if (region === 'Balkans' && nation === 'OT') {
        note = '<div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted); margin-top: 0.5rem;">Note: OT will always diplomacy/ally Egypt if able</div>';
    }
    
    return {
        type: 'bdit_result',
        region: region,
        regionRoll: regionRoll,
        nationRoll: nationRoll,
        nation: nation,
        html: `<div style="margin: 1rem 0;">
            ${diceHTML(regionRoll, 'Region')} ${diceHTML(nationRoll, 'Nation')}
            <div class="step-item action" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">BDIT: <strong>${region}</strong> -> <strong>${nation}</strong></span>
            </div>
            ${note}
        </div>`
    };
}

// Generic BDIT roll with region selection
function renderBDITRollWithRegions(dec, prefix, context, regions) {
    const keyRegion = prefix + 'bdit_region';
    const keyRoll = prefix + 'bdit_roll';
    
    // Step 1: Select region
    if (!dec[keyRegion]) {
        let html = `<div class="question-box">
            <div class="question-text">BDIT: Select target region${context ? ' for ' + context : ''}:</div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.25rem;">Main Map:</div>`;
        
        BDIT_REGIONS_MAIN.forEach(r => {
            html += `<button class="q-btn" onclick="selectBDITRegion('${prefix}', '${r.id}')">${r.name}</button>`;
        });
        
        html += `<div style="font-size: 0.8rem; color: var(--text-muted); margin: 0.5rem 0 0.25rem;">Submaps:</div>`;
        
        BDIT_REGIONS_SUB.forEach(r => {
            html += `<button class="q-btn" onclick="selectBDITRegion('${prefix}', '${r.id}')">${r.name}</button>`;
        });
        
        html += `</div></div>`;
        
        return {
            type: 'bdit_select',
            html: html
        };
    }
    
    // Step 2: Roll die for that region
    if (!dec[keyRoll]) {
        return {
            type: 'bdit_roll',
            html: `<div class="question-box">
                <div class="question-text">BDIT Region: <strong>${dec[keyRegion]}</strong></div>
                <div class="question-btns">
                    <button class="q-btn yes" onclick="rollBDITDie('${prefix}')">Roll Die</button>
                </div>
            </div>`
        };
    }
    
    // Step 3: Show result
    const region = dec[keyRegion];
    const roll = dec[keyRoll];
    const nation = getBDITResult(region, roll);
    
    let note = '';
    if (region === 'Balkans' && nation === 'OT') {
        note = '<div style="font-size: 0.85rem; font-style: italic; color: var(--text-muted); margin-top: 0.5rem;">Note: OT will always diplomacy/ally Egypt if able</div>';
    }
    
    return {
        type: 'bdit_result',
        region: region,
        roll: roll,
        nation: nation,
        html: `<div style="margin: 1rem 0;">
            ${diceHTML(roll, 'BDIT Roll')}
            <div class="step-item action" style="margin-top: 0.5rem;">
                <span class="step-icon">></span>
                <span class="step-text">BDIT: <strong>${region}</strong> -> <strong>${nation}</strong></span>
            </div>
            ${note}
        </div>`
    };
}

// Global functions for BDIT interaction
function selectBDITRegion(prefix, region) {
    decision[prefix + 'bdit_region'] = region;
    renderApp();
}

function rollBDITDie(prefix) {
    decision[prefix + 'bdit_roll'] = rollDie();
    renderApp();
}

function rollBDITMainMapRegion(prefix) {
    decision[prefix + 'bdit_region_roll'] = rollDie();
    renderApp();
}

function rollBDITMainMapNation(prefix) {
    decision[prefix + 'bdit_nation_roll'] = rollDie();
    renderApp();
}
