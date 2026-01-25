// dice.js - Dice rolling utilities

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
