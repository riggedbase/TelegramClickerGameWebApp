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

// Function to authenticate Telegram ID
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

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");

    // Game elements
    const gameContainer = document.getElementById('game-container');
    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const healthFill = document.getElementById('health-fill');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const scoreElement = document.getElementById('score');
    const pointsElement = document.getElementById('points');
    const willElement = document.getElementById('will');
    const levelElement = document.getElementById('level');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const showWalletButton = document.getElementById('show-wallet-button');
    const leaderboardElement = document.getElementById('leaderboard');
    const changeUsernameButton = document.getElementById('change-username-button');

    // Wallet elements
    const walletScreen = document.getElementById('wallet-screen');
    const walletPointsElement = document.getElementById('wallet-points');
    const riggedTokensElement = document.getElementById('rigged-tokens');
    const baseWalletAddressInput = document.getElementById('base-wallet-address');
    const saveWalletAddressButton = document.getElementById('save-wallet-address');
    const claimRiggedButton = document.getElementById('claim-rigged');
    const burnRiggedButton = document.getElementById('burn-rigged');
    const closeWalletButton = document.getElementById('close-wallet');
    const walletAddressError = document.getElementById('wallet-address-error');

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

    function updateDisplay() {
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
    }

    function handleAttack(damage) {
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

    function handleClick(event) {
        // Prevent damage when clicking on buttons
        if (event.target.tagName === 'BUTTON') return;

        handleAttack(damagePerClick);
    }

    function handleTouch(event) {
        // Prevent damage when touching on buttons or the leaderboard
        if (event.target.tagName === 'BUTTON' || event.target.closest('#leaderboard')) return;

        event.preventDefault(); // Prevent default behavior such as scrolling
        for (let i = 0; i < event.touches.length; i++) {
            handleAttack(damagePerClick);
        }
    }

    function handleLeaderboardTouch(event) {
        // Allow default touch behavior (scrolling) within the leaderboard
        event.stopPropagation();
    }

    function nextCharacter() {
        characterIndex = (characterIndex + 1) % characters.length;
        if (characterIndex === 0) {
            level++;
        }
        maxHealth = characters[characterIndex].baseHealth * level;
        health = maxHealth;
        saveProgress();
    }

    function replenishWill(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        if (points >= replenishWillCost) {
            points -= replenishWillCost;
            will = 1000;
            replenishWillCost *= 2;
            updateDisplay();
            saveProgress();
        }
    }

    function increaseDamage(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        if (points >= increaseDamageCost) {
            points -= increaseDamageCost;
            damagePerClick *= 2;
            increaseDamageCost *= 2;
            updateDisplay();
            saveProgress();
        }
    }

    function showLeaderboard(event) {
        event.stopPropagation();
        leaderboardElement.innerHTML = '<h2>Leaderboard</h2>';
        database.ref('users').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            if (leaderboardData) {
                const sortedLeaderboard = Object.entries(leaderboardData)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.score - a.score);
                sortedLeaderboard.forEach((entry) => {
                    const isCurrentUser = entry.id === telegramUserId;
                    const displayNameText = isCurrentUser ? `${entry.displayName || 'You'} (You)` : (entry.displayName || 'Anonymous');
                    leaderboardElement.innerHTML += `<p>${displayNameText}: ${entry.score}</p>`;
                });
            } else {
                leaderboardElement.innerHTML += '<p>No scores yet</p>';
            }
            // Always show current user's score
            leaderboardElement.innerHTML += `<p><strong>Your score: ${score}</strong></p>`;
        });
        leaderboardElement.style.display = 'block';

        leaderboardElement.addEventListener('touchstart', handleLeaderboardTouch, { passive: false });
        leaderboardElement.addEventListener('touchmove', handleLeaderboardTouch, { passive: false });
    }

    function showWallet() {
        walletPointsElement.textContent = points;
        riggedTokens = Math.floor((points - pointsAtLastBurn) / 100);
        riggedTokensElement.textContent = riggedTokens;
        baseWalletAddressInput.value = baseWalletAddress;
        walletScreen.style.display = 'block';
    }

    function closeWallet() {
        walletScreen.style.display = 'none';
    }

    function saveWalletAddress() {
        baseWalletAddress = baseWalletAddressInput.value;
        if (baseWalletAddress.length === 42 || baseWalletAddress.endsWith('.eth')) {
            walletAddressError.textContent = 'Wallet address saved successfully!';
            walletAddressError.style.color = 'green';
        } else {
            walletAddressError.textContent = 'Address should be 42 characters long or an ENS name ending with .eth';
            walletAddressError.style.color = 'red';
        }
        saveProgress();
    }

    function claimRigged() {
        if (baseWalletAddress) {
            points = 0;
            riggedTokens = 0;
            pointsAtLastBurn = 0;
            updateDisplay();
            showWallet();
            saveProgress();
        } else {
            alert("Please provide a Base network compatible wallet address - DO NOT PROVIDE YOUR PRIVATE KEY");
        }
    }

    function burnRigged() {
        riggedTokens = 0;
        pointsAtLastBurn = points;
        showWallet();
        saveProgress();
    }

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    showWalletButton.addEventListener('click', showWallet);
    closeWalletButton.addEventListener('click', closeWallet);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);
    changeUsernameButton.addEventListener('click', () => {
        const newUsername = prompt("Enter new username:");
        if (newUsername && changeUsername(newUsername)) {
            alert("Username changed successfully!");
        } else {
            alert("Invalid username. Please try again.");
        }
    });

    // Initialize game
    authenticateTelegramUser()
        .then(() => loadProgress())
        .then(() => {
            updateDisplay();
            // Add periodic saving (every 30 seconds)
            setInterval(saveProgress, 30000);
            console.log("Game initialized");
        })
        .catch((error) => {
            console.error("Error initializing game:", error);
            // Instead of showing an alert, we'll just log the error and continue
            // with a new user session
            telegramUserId = 'error_' + Math.random().toString(36).substr(2, 9);
            displayName = generateRandomUsername();
            updateDisplay();
            setInterval(saveProgress, 30000);
            console.log("Game initialized with new session due to error");
        });
});
