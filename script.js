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

// Game variables
let score = 0;
let points = 0;
let will = 1000;
let level = 1;
let health = 100;
let maxHealth = 100;
let damagePerClick = 1;
let replenishWillCost = 100;
let increaseDamageCost = 200;
let characterIndex = 0;
let riggedTokens = 0;
let pointsAtLastBurn = 0;

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
                telegramUserId = 'telegram_' + Math.random().toString(36).substr(2, 9);
                resolve(telegramUserId);
            }
        } else {
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

    if (typeof health === 'undefined') health = 100;
    if (typeof maxHealth === 'undefined') maxHealth = 100;
    if (typeof damagePerClick === 'undefined') damagePerClick = 1;
    if (typeof replenishWillCost === 'undefined') replenishWillCost = 100;
    if (typeof increaseDamageCost === 'undefined') increaseDamageCost = 200;
    if (typeof baseWalletAddress === 'undefined') baseWalletAddress = '';
    if (typeof riggedTokens === 'undefined') riggedTokens = 0;
    if (typeof pointsAtLastBurn === 'undefined') pointsAtLastBurn = 0;

    if (telegramUserId) {
        const dataToSave = {
            displayName, score, points, will, level, health, maxHealth,
            damagePerClick, replenishWillCost, increaseDamageCost,
            baseWalletAddress, riggedTokens, pointsAtLastBurn, characterIndex
        };
        database.ref('users/' + telegramUserId).set(dataToSave);
    } else {
        console.log("No Telegram User ID available, progress not saved");
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
                    displayName = generateRandomUsername();
                }
                updateDisplay();
                resolve();
            }).catch(reject);
        } else {
            reject("No Telegram User ID available");
        }
    });
}

// Function to move to the next character
function nextCharacter() {
    console.log("Moving to next character");
    characterIndex = (characterIndex + 1) % characters.length;
    if (characterIndex === 0) level++;
    maxHealth = characters[characterIndex].baseHealth * level;
    health = maxHealth;
    saveProgress();
}

// Function to handle attack
function handleAttack(damage) {
    console.log("Handling attack, damage:", damage);
    if (will > 0) {
        health -= damage;
        score += damage;
        points += damage;
        will -= 1;

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

// Function to show defeat message
function showDefeatMessage() {
    const defeatMessage = document.getElementById('defeat-message');
    const defeatText = document.getElementById('defeat-text');
    defeatText.textContent = characters[characterIndex].defeatMessage;
    defeatMessage.classList.remove('hidden');

    document.addEventListener('click', nextCharacterAfterDefeat, { once: true });
}

function nextCharacterAfterDefeat() {
    const defeatMessage = document.getElementById('defeat-message');
    defeatMessage.classList.add('hidden');
    nextCharacter();
    updateDisplay();
    saveProgress();
}

// Function to update display
function updateDisplay() {
    const character = document.getElementById('character');
    character.textContent = characters[characterIndex].emoji;
    character.style.fontSize = `${100 + (characterIndex * 20)}px`;

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

// Updated handleShowLeaderboard function
function handleShowLeaderboard() {
    console.log("Showing leaderboard");

    // Populate leaderboard with sample data for now (replace with actual data as needed)
    const leaderboardData = [
        { username: 'Player1', score: 100 },
        { username: 'Player2', score: 90 },
        { username: 'Player3', score: 80 },
        { username: displayName + ' (You)', score: score }
    ];

    // Clear any previous leaderboard content
    leaderboardElement.innerHTML = '<h2>Leaderboard</h2>';

    // Create a list of players and their scores
    const leaderboardList = document.createElement('ul');
    leaderboardData.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.username}: ${player.score} points`;
        leaderboardList.appendChild(listItem);
    });

    leaderboardElement.appendChild(leaderboardList);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Leaderboard';
    closeButton.addEventListener('click', closeLeaderboard);
    leaderboardElement.appendChild(closeButton);

    // Make leaderboard visible
    leaderboardElement.style.display = 'block';

    // Add event listener to close leaderboard when clicking outside
    document.addEventListener('click', handleOutsideClick);
}

// New closeLeaderboard and handleOutsideClick functions
function closeLeaderboard() {
    console.log("Closing leaderboard");
    leaderboardElement.style.display = 'none';
    // Remove the event listener when the leaderboard is closed
    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
    if (!leaderboardElement.contains(event.target) && event.target.id !== 'show-leaderboard-button') {
        closeLeaderboard();
    }
}

// Event listeners for game actions
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

function handleShowWallet() {
    console.log("Showing wallet");
    riggedTokens = calculateRigged();
    updateWalletDisplay();
    walletScreen.style.display = 'block';
}

function handleChangeUsername() {
    const newUsername = prompt("Enter a new username:");
    if (newUsername && !isProfanity(newUsername)) {
        changeUsername(newUsername);
    } else {
        console.log("Invalid username or contains profanity.");
    }
}

function handleCloseWallet() {
    console.log("Closing wallet");
    walletScreen.style.display = 'none';
}

function handleClaimRigged() {
    if (!isWalletValid) {
        walletAddressError.textContent = "Please provide a valid wallet address before claiming $RIGGED.";
        walletAddressError.style.color = "red";
        return;
    }
    console.log("Claiming $RIGGED");
    points = 0;
    riggedTokens = 0;
    updateWalletDisplay();
    saveProgress();
}

function handleBurnRigged() {
    console.log("Burning $RIGGED");
    riggedTokens = 0;
    pointsAtLastBurn = points;
    updateWalletDisplay();
    saveProgress();
}

function handleSaveWalletAddress() {
    const walletAddress = baseWalletAddressInput.value.trim();
    if (validateWalletAddress(walletAddress)) {
        baseWalletAddress = walletAddress;
        isWalletValid = true;
        walletAddressError.textContent = "Wallet address saved successfully!";
        walletAddressError.style.color = "green";
        saveProgress();
    } else {
        isWalletValid = false;
        walletAddressError.textContent = "Invalid wallet address. Must be 42 characters or a Base ENS (.base).";
        walletAddressError.style.color = "red";
    }
}

function updateWalletDisplay() {
    walletPointsElement.textContent = points;
    riggedTokensElement.textContent = riggedTokens;
}

function validateWalletAddress(address) {
    return (address.length === 42 || address.endsWith('.base'));
}

// Function to calculate $RIGGED based on current points
function calculateRigged() {
    const eligiblePoints = points - pointsAtLastBurn;
    return Math.floor(eligiblePoints / 100);
}

// Initialize game after DOM elements are loaded
document.addEventListener('DOMContentLoaded', (event) => {
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
    walletScreen = document.getElementById('wallet-screen');
    walletPointsElement = document.getElementById('wallet-points');
    riggedTokensElement = document.getElementById('rigged-tokens');
    baseWalletAddressInput = document.getElementById('base-wallet-address');
    saveWalletAddressButton = document.getElementById('save-wallet-address');
    claimRiggedButton = document.getElementById('claim-rigged');
    burnRiggedButton = document.getElementById('burn-rigged');
    closeWalletButton = document.getElementById('close-wallet');
    walletAddressError = document.getElementById('wallet-address-error');

    // Ensure wallet is hidden initially
    walletScreen.style.display = 'none';

    gameContainer.addEventListener('click', (event) => {
        if (event.target.tagName !== 'BUTTON' && !event.target.closest('#defeat-message')) {
            handleAttack(damagePerClick);
        }
    });

    replenishWillButton.addEventListener('click', handleReplenishWill);
    increaseDamageButton.addEventListener('click', handleIncreaseDamage);
    showLeaderboardButton.addEventListener('click', handleShowLeaderboard); // Updated event listener
    showWalletButton.addEventListener('click', handleShowWallet);
    changeUsernameButton.addEventListener('click', handleChangeUsername);
    closeWalletButton.addEventListener('click', handleCloseWallet);
    claimRiggedButton.addEventListener('click', handleClaimRigged);
    burnRiggedButton.addEventListener('click', handleBurnRigged);
    saveWalletAddressButton.addEventListener('click', handleSaveWalletAddress);

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
