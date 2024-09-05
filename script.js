console.log("Script loaded");

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
const database = firebase.database();

// Game state variables
let telegramUserId = null;
let displayName = null;
let score = 0;
let points = 0;
let will = 1000; // Player's initial energy
let riggedTokens = 0;
let health = 100; // Initial character health
let maxHealth = 100; // Set according to your game logic
let boostActive = false; // Boost state
let boostMultiplier = 2; // Boost effect multiplier
let boostClicks = 0; // Number of clicks left in boost
let boostCost = 100; // Cost of boost in points
let characters = ["😈", "👾", "👻", "💀", "🤖"]; // Array of characters
let currentCharacter = characters[0];

// Function to authenticate Telegram user
function authenticateTelegramUser() {
    return new Promise((resolve, reject) => {
        if (window.Telegram && window.Telegram.WebApp) {
            const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
            if (initDataUnsafe && initDataUnsafe.user) {
                telegramUserId = initDataUnsafe.user.id.toString();
                resolve(telegramUserId);
            } else {
                // Fallback for testing outside Telegram
                telegramUserId = 'web_' + Math.random().toString(36).substring(2, 15);
                resolve(telegramUserId);
            }
        } else {
            // Fallback for testing outside Telegram
            telegramUserId = 'web_' + Math.random().toString(36).substring(2, 15);
            resolve(telegramUserId);
        }
    });
}

// Function to generate a random username
function generateRandomUsername() {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Brave', 'Bright'];
    const nouns = ['Player', 'Gamer', 'Hero', 'Champion', 'Warrior', 'Master', 'Star'];
    return adjectives[Math.floor(Math.random() * adjectives.length)] + nouns[Math.floor(Math.random() * nouns.length)] + Math.floor(Math.random() * 1000);
}

// Update display with current game state
function updateDisplay() {
    document.getElementById("score-value").textContent = score;
    document.getElementById("points-value").textContent = points;
    document.getElementById("will-value").textContent = will;
    document.getElementById("character").textContent = currentCharacter;
    document.getElementById("rigged-tokens-value").textContent = riggedTokens;
    if (displayName) {
        document.getElementById("username").value = displayName;
    }
}

// Save game progress to Firebase
function saveProgress() {
    if (!telegramUserId) return;
    database.ref('users/' + telegramUserId).set({
        score: score,
        points: points,
        will: will,
        riggedTokens: riggedTokens,
        displayName: displayName,
        health: health, // Save health
    });
}

// Load game progress from Firebase
function loadProgress() {
    if (!telegramUserId) return;
    database.ref('users/' + telegramUserId).once('value').then((snapshot) => {
        const data = snapshot.val();
        if (data) {
            score = data.score || 0;
            points = data.points || 0;
            will = data.will || 1000;
            riggedTokens = data.riggedTokens || 0;
            displayName = data.displayName || generateRandomUsername();
            health = data.health || maxHealth; // Load health or default to maxHealth
        } else {
            displayName = generateRandomUsername();
        }
        updateDisplay();
    });
}

// Function to handle clicking on the game screen
function handleClick() {
    if (will > 0) {
        will--;
        let damage = boostActive ? 20 : 10; // Double damage if boost is active
        health -= damage;
        score += damage; // Increase score by damage dealt
        points += damage; // Increase points by damage dealt
        boostClicks = Math.max(boostClicks - 1, 0); // Decrease boost clicks if boost is active
        if (boostClicks === 0) {
            boostActive = false; // Deactivate boost if clicks are exhausted
        }
        if (health <= 0) {
            nextCharacter();
        }
        updateDisplay();
        saveProgress();
    }
}

// Move to the next character when one is defeated
function nextCharacter() {
    let nextIndex = (characters.indexOf(currentCharacter) + 1) % characters.length;
    currentCharacter = characters[nextIndex];
    health = maxHealth + score * 0.1; // Increase difficulty by adding to health
    updateDisplay();
}

// Handle purchasing a boost
function purchaseBoost() {
    if (points >= boostCost) {
        points -= boostCost;
        boostActive = true;
        boostClicks = 10; // Set number of clicks for boost
        updateDisplay();
        saveProgress();
    }
}

// Initialize game and load user data
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded");
    authenticateTelegramUser().then((userId) => {
        telegramUserId = userId;
        loadProgress();
    }).catch((error) => {
        console.error("Error initializing game:", error);
    });

    document.getElementById("attack-button").addEventListener("click", handleClick);
    document.getElementById("boost-button").addEventListener("click", purchaseBoost);
});

// Leaderboard functions
function updateLeaderboard() {
    database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value').then((snapshot) => {
        let leaderboardData = [];
        snapshot.forEach((childSnapshot) => {
            leaderboardData.unshift(childSnapshot.val());
        });
        displayLeaderboard(leaderboardData);
    });
}

function displayLeaderboard(data) {
    const leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "<h2>Leaderboard</h2>";
    data.forEach((entry) => {
        const entryElement = document.createElement("div");
        entryElement.textContent = `${entry.displayName}: ${entry.score}`;
        if (entry.telegramUserId === telegramUserId) {
            entryElement.style.fontWeight = 'bold';
        }
        leaderboard.appendChild(entryElement);
    });
}

function changeUsername() {
    let newUsername = document.getElementById("username").value;
    if (newUsername.trim().length > 0) {
        displayName = newUsername;
        saveProgress();
        updateLeaderboard();
    }
}

// Event listeners for wallet functionality
document.getElementById("save-wallet-button").addEventListener("click", saveWalletAddress);
document.getElementById("claim-rigged-button").addEventListener("click", claimRigged);
document.getElementById("burn-rigged-button").addEventListener("click", burnRigged);

// Example wallet functionality (for future API integration)
function saveWalletAddress() {
    console.log("Wallet address saved.");
}

function claimRigged() {
    console.log("Claiming $RIGGED tokens...");
}

function burnRigged() {
    console.log("Burning $RIGGED tokens...");
}

// Final game initialization message
console.log("Game initialized");
