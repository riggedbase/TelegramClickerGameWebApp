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

// Declare game elements globally so they can be accessed by all functions
let gameContainer, characterElement, characterNameElement, healthFill, currentHealthElement, maxHealthElement, 
    scoreElement, pointsElement, willElement, levelElement, replenishWillButton, increaseDamageButton, 
    showLeaderboardButton, showWalletButton, leaderboardElement, changeUsernameButton,
    walletScreen, walletPointsElement, riggedTokensElement, baseWalletAddressInput, 
    saveWalletAddressButton, claimRiggedButton, burnRiggedButton, closeWalletButton, walletAddressError;

// Declare character information globally
const characters = [
    { emoji: '😈', baseHealth: 100, name: 'Demon' },
    { emoji: '👹', baseHealth: 200, name: 'Ogre' },
    { emoji: '👽', baseHealth: 300, name: 'Alien' },
    { emoji: '🐉', baseHealth: 400, name: 'Dragon' },
    { emoji: '🧙', baseHealth: 500, name: 'Wizard' }
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

// Declare updateDisplay before calling it
function updateDisplay() {
    console.log("Updating display");
    characterElement.textContent = characters[characterIndex].emoji;
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

    // Update username display if there's an element for it
    const usernameElement = document.getElementById('username-display');
    if (usernameElement) {
        usernameElement.textContent = displayName || 'Anonymous';
    }
}

// Function to load progress from Firebase
function loadProgress() {
    console.log("Loading progress");
    return new Promise((resolve, reject) => {
        if (telegramUserId) {
            database.ref('users/' + telegramUserId).once('value').then((snapshot) => {
                const data = snapshot.val();
                if (data) {
                    displayName = data.displayName || generateRandomUsername();
                    score = data.score || 0;
                    points = data.points || 0;
                    will = data.will || 1000;
                    level = data.level || 1;
                    health = data.health || 100;
                    maxHealth = data.maxHealth || 100;
                    damagePerClick = data.damagePerClick || 1;
                    replenishWillCost = data.replenishWillCost || 100;
                    increaseDamageCost = data.increaseDamageCost || 200;
                    baseWalletAddress = data.baseWalletAddress || '';
                    riggedTokens = data.riggedTokens || 0;
                    pointsAtLastBurn = data.pointsAtLastBurn || 0;
                    characterIndex = data.characterIndex || 0;
                } else {
                    // If no data, initialize with default values
                    displayName = generateRandomUsername();
                    score = 0;
                    points = 0;
                    will = 1000;
                    level = 1;
                    health = 100;
                    maxHealth = 100;
                    damagePerClick = 1;
                    replenishWillCost = 100;
                    increaseDamageCost = 200;
                    baseWalletAddress = '';
                    riggedTokens = 0;
                    pointsAtLastBurn = 0;
                    characterIndex = 0;
                }
                console.log("Loaded progress:", { displayName, score, points, will, level, health, maxHealth });
                updateDisplay(); // Call updateDisplay after loading data
                resolve();
            }).catch(reject);
        } else {
            reject("No Telegram User ID available");
        }
    });
}

// Add event listeners for clicks and touches
function handleClick(event) {
    console.log("Click detected on:", event.target);
    // Prevent damage when clicking on buttons or other UI elements
    if (event.target.tagName === 'BUTTON' || event.target.closest('#leaderboard')) {
        console.log("Click on button or leaderboard, returning");
        return;
    }
    console.log("Handling attack");
    handleAttack(damagePerClick);
}

function handleTouch(event) {
    console.log("Touch detected");
    // Prevent damage when touching on buttons or the leaderboard
    if (event.target.tagName === 'BUTTON' || event.target.closest('#leaderboard')) {
        console.log("Touch on button or leaderboard, returning");
        return;
    }

    event.preventDefault(); // Prevent default behavior such as scrolling
    for (let i = 0; i < event.touches.length; i++) {
        handleAttack(damagePerClick);
    }
}

// Handle attacks
function handleAttack(damage) {
    console.log("Handling attack, damage:", damage);
    if (will > 0) {
        health -= damage;
        score += damage;
        points += damage;
        will -= 1;

        if (health <= 0) {
            nextCharacter();
        }

        updateDisplay();
        saveProgress();
    }
}

function nextCharacter() {
    console.log("Moving to next character");
    characterIndex = (characterIndex + 1) % characters.length;
    if (characterIndex === 0) {
        level++;
    }
    maxHealth = characters[characterIndex].baseHealth * level;
    health = maxHealth;
    saveProgress();
}

// Handle button clicks for game actions
function handleReplenishWill() {
    console.log("Replenishing will");
    if (points >= replenishWillCost) {
        points -= replenishWillCost;
        will = 1000;
        replenishWillCost = Math.floor(replenishWillCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

function handleIncreaseDamage() {
    console.log("Increasing damage");
    if (points >= increaseDamageCost) {
        points -= increaseDamageCost;
        damagePerClick++;
        increaseDamageCost = Math.floor(increaseDamageCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

// Function to calculate $RIGGED based on current points, ignoring pre-burn points
function calculateRigged() {
    const eligiblePoints = points - pointsAtLastBurn;
    const newRigged = Math.floor(eligiblePoints / 100);
    return newRigged;
}

function handleShowLeaderboard() {
    console.log("Showing leaderboard");
    leaderboardElement.style.display = 'block';  // Show the leaderboard
}

function handleShowWallet() {
    console.log("Showing wallet");
    riggedTokens = calculateRigged();  // Update Rigged based on current points
    updateWalletDisplay();
    walletScreen.style.display = 'block';  // Show the wallet screen
}

function handleChangeUsername() {
    const newUsername = prompt("Enter a new username:");
    if (newUsername && !isProfanity(newUsername)) {
        changeUsername(newUsername);
    } else {
        console.log("Invalid username or contains profanity.");
    }
}

function updateWalletDisplay() {
    walletPointsElement.textContent = points;
    riggedTokensElement.textContent = riggedTokens;
}

function handleCloseWallet() {
    console.log("Closing wallet");
    walletScreen.style.display = 'none';
}

// Burn Rigged tokens, but keep points intact
function handleBurnRigged() {
    console.log("Burning $RIGGED");
    riggedTokens = 0;
    pointsAtLastBurn = points;  // Record current points as burned
    updateWalletDisplay();
    saveProgress();
}

// Claim Rigged tokens and set points and Rigged to 0
function handleClaimRigged() {
    console.log("Claiming $RIGGED");
    points = 0;
    riggedTokens = 0;
    updateWalletDisplay();
    saveProgress();
}

// Wait for the DOM to fully load before assigning DOM elements
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM Content Loaded event fired");

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

    // Add event listeners for clicks and touches
    gameContainer.addEventListener('click', (event) => {
        console.log("Click on game container");
        handleClick(event);
    });
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Button click handlers
    replenishWillButton.addEventListener('click', handleReplenishWill);
    increaseDamageButton.addEventListener('click', handleIncreaseDamage);
    showLeaderboardButton.addEventListener('click', handleShowLeaderboard);
    showWalletButton.addEventListener('click', handleShowWallet);
    changeUsernameButton.addEventListener('click', handleChangeUsername);
    closeWalletButton.addEventListener('click', handleCloseWallet);
    claimRiggedButton.addEventListener('click', handleClaimRigged);
    burnRiggedButton.addEventListener('click', handleBurnRigged);

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
