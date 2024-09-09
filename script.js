console.log("Script starting to load");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA7k-CcnTG4X2sEfDdbSS8OuQPbdL-mBvI",
    authDomain: "rigged-clicker-game-1.firebaseapp.com",
    projectId: "rigged-clicker-game-1",
    storageBucket: "rigged-clicker-game-1.appspot.com",
    messagingSenderId: "492830453182",
    appId: "1:492830453182:web:3050eafa48fea21e145def",
    measurementId: "G-NNKC4YWY5R",
    databaseURL: "https://rigged-clicker-game-1-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
console.log("Firebase initialized");
const database = firebase.database();

let telegramUserId = null;
let displayName = null;
let isWalletValid = false; // Track wallet validation status

// Declare game elements globally so they can be accessed by all functions
let gameContainer, characterElement, characterNameElement, healthFill, currentHealthElement, maxHealthElement, 
    scoreElement, pointsElement, willElement, levelElement, replenishWillButton, increaseDamageButton, 
    showLeaderboardButton, showWalletButton, leaderboardElement, changeUsernameButton,
    walletScreen, walletPointsElement, riggedTokensElement, baseWalletAddressInput, 
    saveWalletAddressButton, claimRiggedButton, burnRiggedButton, closeWalletButton, walletAddressError;

// Declare character information globally with updated defeat messages
const characters = [
    { emoji: '😈', baseHealth: 100, name: 'Demon', defeatMessage: "You've banished the demon back to the underworld!" },
    { emoji: '👹', baseHealth: 200, name: 'Ogre', defeatMessage: "The ogre stumbles and falls. Victory is yours!" },
    { emoji: '👽', baseHealth: 300, name: 'Alien', defeatMessage: "The alien retreats to its spacecraft. Earth is saved!" },
    { emoji: '🐉', baseHealth: 400, name: 'Dragon', defeatMessage: "The mighty dragon has been slain. You are the true hero!" },
    { emoji: '🧙', baseHealth: 500, name: 'Wizard', defeatMessage: "The wizard's magic fades. Your strength prevails!" }
];

// Function to authenticate Telegram user
function authenticateTelegramUser() {
    return new Promise((resolve) => {
        if (window.Telegram && window.Telegram.WebApp) {
            const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
            if (initDataUnsafe && initDataUnsafe.user) {
                telegramUserId = initDataUnsafe.user.id.toString();
                resolve(telegramUserId);
            } else {
                // If running in Telegram but can't get user data, generate a random ID
                telegramUserId = 'telegram_' + Math.random().toString(36).substr(2, 9);
                resolve(telegramUserId);
            }
        } else {
            // If not running in Telegram, generate a random ID
            telegramUserId = 'web_' + Math.random().toString(36).substr(2, 9);
            resolve(telegramUserId);
        }
    });
}

// Function to generate a random username
function generateRandomUsername() {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Brave', 'Bright'];
    const nouns = ['Player', 'Gamer', 'Hero', 'Champion', 'Warrior', 'Master', 'Star'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${number}`;
}

// Simple profanity filter (expand this list as needed)
const profanityList = ['badword1', 'badword2', 'badword3'];

function isProfanity(word) {
    return profanityList.some(badWord => word.toLowerCase().includes(badWord));
}

// Function to change username
function changeUsername(newUsername) {
    console.log("Changing username to:", newUsername);
    if (!isProfanity(newUsername)) {
        displayName = newUsername;
        updateDisplay();
        saveProgress();
        return true;
    }
    return false;
}

// Function to save progress to Firebase
function saveProgress() {
    console.log("Saving progress");

    // Ensure all game variables are properly defined
    if (typeof health === 'undefined') {
        console.error("Health is undefined. Setting default value of 100.");
        health = 100;
    }
    if (typeof maxHealth === 'undefined') {
        console.error("Max Health is undefined. Setting default value of 100.");
        maxHealth = 100;
    }
    if (typeof damagePerClick === 'undefined') {
        console.error("Damage Per Click is undefined. Setting default value of 1.");
        damagePerClick = 1;
    }
    if (typeof replenishWillCost === 'undefined') {
        console.error("Replenish Will Cost is undefined. Setting default value of 100.");
        replenishWillCost = 100;
    }
    if (typeof increaseDamageCost === 'undefined') {
        console.error("Increase Damage Cost is undefined. Setting default value of 200.");
        increaseDamageCost = 200;
    }
    if (typeof baseWalletAddress === 'undefined') {
        console.error("Base Wallet Address is undefined. Setting default value of an empty string.");
        baseWalletAddress = ''; // Default to empty string
    }
    if (typeof riggedTokens === 'undefined') {
        console.error("Rigged Tokens is undefined. Setting default value of 0.");
        riggedTokens = 0;
    }
    if (typeof pointsAtLastBurn === 'undefined') {
        console.error("Points At Last Burn is undefined. Setting default value of 0.");
        pointsAtLastBurn = 0;  // Ensure pointsAtLastBurn is defined
    }

    if (telegramUserId) {
        const dataToSave = {
            displayName: displayName,
            score: score,
            points: points,
            will: will,
            level: level,
            health: health,
            maxHealth: maxHealth,
            damagePerClick: damagePerClick,
            replenishWillCost: replenishWillCost,
            increaseDamageCost: increaseDamageCost,
            baseWalletAddress: baseWalletAddress,
            riggedTokens: riggedTokens,
            pointsAtLastBurn: pointsAtLastBurn,
            characterIndex: characterIndex
        };
        console.log("Data being saved:", dataToSave);
        database.ref('users/' + telegramUserId).set(dataToSave);
    } else {
        console.log("No Telegram User ID available, progress not saved");
    }
}

// Function to handle attack and trigger animations
function handleAttack(damage) {
    console.log("Handling attack, damage:", damage);
    if (will > 0) {
        health -= damage;
        score += damage;
        points += damage;
        will -= 1;

        // Trigger pain animation
        const character = document.getElementById('character');
        const painOverlay = document.getElementById('pain-overlay');
        character.classList.add('pain');
        painOverlay.style.opacity = '0.5';

        setTimeout(() => {
            character.classList.remove('pain');
            painOverlay.style.opacity = '0';
        }, 500);

        if (health <= 0) {
            showDefeatMessage();
        } else {
            updateDisplay();
            saveProgress();
        }
    }
}

// Function to show defeat message and wait for next character
function showDefeatMessage() {
    const defeatMessage = document.getElementById('defeat-message');
    const defeatText = document.getElementById('defeat-text');
    defeatText.textContent = characters[characterIndex].defeatMessage;
    defeatMessage.classList.remove('hidden');

    // Wait for user to click before moving to next character
    document.addEventListener('click', nextCharacterAfterDefeat, { once: true });
}

function nextCharacterAfterDefeat() {
    const defeatMessage = document.getElementById('defeat-message');
    defeatMessage.classList.add('hidden');
    nextCharacter();
    updateDisplay();
    saveProgress();
}

// Function to update display and adjust character size based on level
function updateDisplay() {
    // Update character display
    const character = document.getElementById('character');
    character.textContent = characters[characterIndex].emoji;
    character.style.fontSize = `${100 + (characterIndex * 20)}px`; // Increase size for each character

    // Update other game elements
    characterNameElement.textContent = characters[characterIndex].name;
    currentHealthElement.textContent = health;
    maxHealthElement.textContent = maxHealth;
    healthFill.style.width = `${(health / maxHealth) * 100}%`;
    scoreElement.textContent = score;
    pointsElement.textContent = points;
    willElement.textContent = will;
    levelElement.textContent = level;
    replenishWillButton.textContent = `Replenish Will (${replenishWillCost} points)`;
    increaseDamageButton.textContent = `Increase Damage (${increaseDamageCost} points)`;
}

// Function to calculate $RIGGED based on current points, ignoring pre-burn points
function calculateRigged() {
    const eligiblePoints = points - pointsAtLastBurn;
    const newRigged = Math.floor(eligiblePoints / 100);
    return newRigged;
}

// Add event listeners for clicks and touches
document.addEventListener('DOMContentLoaded', (event) => {
    // Initialize game elements here
    gameContainer = document.getElementById('game-container');
    characterElement = document.getElementById('character');
    characterNameElement = document.getElementById('character-name');
    healthFill = document.getElementById('health-fill');
    currentHealthElement = document.getElementById('current-health');
    maxHealthElement = document.getElementById('max-health');
    scoreElement = document.getElementById('score');
    pointsElement = document.getElementById('points');
    willElement = document.getElementById('will');
    levelElement = document.getElementById('level');
    replenishWillButton = document.getElementById('replenish-will-button');
    increaseDamageButton = document.getElementById('increase-damage-button');
    showLeaderboardButton = document.getElementById('show-leaderboard-button');
    showWalletButton = document.getElementById('show-wallet-button');
    leaderboardElement = document.getElementById('leaderboard');
    changeUsernameButton = document.getElementById('change-username-button');

    // Wallet elements
    walletScreen = document.getElementById('wallet-screen');
    walletPointsElement = document.getElementById('wallet-points');
    riggedTokensElement = document.getElementById('rigged-tokens');
    baseWalletAddressInput = document.getElementById('base-wallet-address');
    saveWalletAddressButton = document.getElementById('save-wallet-address');
    claimRiggedButton = document.getElementById('claim-rigged');
    burnRiggedButton = document.getElementById('burn-rigged');
    closeWalletButton = document.getElementById('close-wallet');
    walletAddressError = document.getElementById('wallet-address-error');

    // Add click event listener for the entire game container
    gameContainer.addEventListener('click', (event) => {
        // Prevent clicks on UI elements from triggering attacks
        if (event.target.tagName !== 'BUTTON' && !event.target.closest('#defeat-message')) {
            handleAttack(damagePerClick);
        }
    });

    // Initialize game after DOM elements are loaded
    authenticateTelegramUser()
        .then(() => loadProgress())
        .then(() => {
            updateDisplay();
            setInterval(saveProgress, 30000);
            console.log("Game initialized");
        })
        .catch((error) => {
            console.error("Error initializing game:", error);
            telegramUserId = 'error_' + Math.random().toString(36).substr(2, 9);
            displayName = generateRandomUsername();
            updateDisplay();
            setInterval(saveProgress, 30000);
            console.log("Game initialized with new session due to error");
        });
});

console.log("Script loaded");
