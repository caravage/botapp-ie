// state.js - Game state management

let currentGameSlot = null;
let gameState = null;
let decision = null;

function saveGame() {
    if (currentGameSlot && gameState) {
        localStorage.setItem(`ie_game${currentGameSlot}`, JSON.stringify(gameState));
    }
}

function loadGame(slot) {
    const d = localStorage.getItem(`ie_game${slot}`);
    return d ? JSON.parse(d) : null;
}

function deleteGame(slot) {
    localStorage.removeItem(`ie_game${slot}`);
}

function getGameSummary(slot) {
    const d = loadGame(slot);
    if (!d) return null;
    const bots = NATIONS.filter(n => d.nations[n].isBot).length;
    return `Turn ${d.turn}, ${bots} bot${bots !== 1 ? 's' : ''}`;
}

function createNewGameState(nations, turn, wtt) {
    return {
        turn: turn,
        phase: 0,
        wtt: wtt,
        nations: nations,
        activeNation: null,
        actionsDoneThisRound: [],
        actionCount: 0,
        log: []
    };
}

function createNationState(nation, isBot) {
    return {
        isBot: isBot,
        stability: 4,
        industry: nation === 'UK' ? 2 : (nation === 'OT' ? 0 : 1),
        cards: 5,
        germanyUnified: false,
        bismarckRemoved: false,
        frPacifying: false,
        ukIsPacifying: false,
        hasRebels: false,
        industrializedThisTurn: false,
        autoIndustry: false,
        lastIndustrializeCP: 0
    };
}
