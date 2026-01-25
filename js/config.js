// config.js - Constants and configuration

const NATIONS = ['GE', 'UK', 'FR', 'AU', 'RU', 'OT'];
const PHASES = ['Prep', 'Diplomacy', 'Action', 'End'];

// Cards will be loaded from external JSON
let CARDS = [];

async function loadCardData() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/caravage/cards.json/refs/heads/main/cards.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        CARDS = await response.json();
        console.log('Card data loaded successfully.');
    } catch (error) {
        console.error('Failed to load card data:', error);
        alert('Could not load card data. Please check your internet connection and try again.');
    }
}
