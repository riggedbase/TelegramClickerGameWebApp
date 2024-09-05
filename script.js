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

let telegramUserId = null;
let displayName = null;

// Declare all game variables with initial values
let score = 0;
let points = 0;
let will = 1000;
let level = 1;
let health = 100;
let maxHealth = 100;
let damagePerClick = 1;
let replenishWillCost = 100;
let increaseDamageCost = 200;
let baseWalletAddress = '';
let riggedTokens = 0;
let pointsAtLastBurn = 0;

const characters = [
    { emoji: '😈', baseHealth: 100, name: 'Demon' },
    { emoji: '👹', baseHealth: 200, name: 'Ogre' },
    { emoji: '👽', baseHealth: 300, name: 'Alien' },
    { emoji: '🐉', baseHealth: 400, name: 'Dragon' },
    { emoji: '🧙', baseHealth: 500, name: 'Wizard' }
];
let characterIndex = 0;

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

function changeUsername(newUsername) {
    if (!isProfanity(newUsername)) {
        displayName = newUsername;
        saveProgress();
        return true;
    }
    return false;
}

// Function to save progress to Firebase
function saveProgress() {
    if (telegramUserId) {
        database.ref('users/' + telegramUserId).set({
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
        });
    }
}

// Function to load progress from Firebase
function loadProgress() {
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
                    updateDisplay();
                    resolve();
                } else {
                    displayName = generateRandomUsername();
                    resolve();
                }
            }).catch(reject);
        } else {
            reject("No Telegram User ID available");
        }
    });
}

// Define updateDisplay function
function updateDisplay() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('points').textContent = `Points: ${points}`;
    document.getElementById('will').textContent = `Will: ${will}`;
    document.getElementById('rigged-tokens').textContent = `Rigged Tokens: ${riggedTokens}`;
    document.getElementById('character').textContent = characters[characterIndex].emoji;
}

// Event listeners and other functions remain unchanged...

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");
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
