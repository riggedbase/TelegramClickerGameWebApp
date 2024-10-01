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

let database;

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Error initializing Firebase:", error);
    alert("There was an error initializing the game. Please try refreshing the page.");
}

let telegramUserId = null;
let displayName = null;
let isWalletValid = false; // Track wallet validation status

console.log("Checking for Telegram WebApp...");
if (window.Telegram && window.Telegram.WebApp) {
    console.log("Telegram WebApp found in global scope");
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
} else {
    console.log("Telegram WebApp not found in global scope, checking URL parameters...");
    const urlParams = new URLSearchParams(window.location.hash.slice(1));
    const tgWebAppData = urlParams.get('tgWebAppData');
    if (tgWebAppData) {
        console.log("Telegram WebApp data found in URL");
        const tgWebAppUser = JSON.parse(decodeURIComponent(new URLSearchParams(tgWebAppData).get('user')));
        if (tgWebAppUser && tgWebAppUser.id) {
            telegramUserId = tgWebAppUser.id.toString();
            console.log("Telegram user ID extracted from URL:", telegramUserId);
        }
    } else {
        console.log("No Telegram WebApp data found, using web fallback");
        telegramUserId = 'web_' + Math.random().toString(36).substr(2, 9);
    }
}

// Declare game elements globally so they can be accessed by all functions
let gameContainer, characterElement, characterNameElement, healthFill, currentHealthElement, maxHealthElement, 
    scoreElement, pointsElement, willElement, levelElement, replenishWillButton, increaseDamageButton, 
    showLeaderboardButton, showWalletButton, leaderboardElement,
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
let baseWalletAddress = '';  // Initialize baseWalletAddress

// Declare character information globally with updated defeat messages
const characters = [
    { emoji: '😈', baseHealth: 100, name: 'Demon', defeatMessage: "You've banished the demon back to the underworld!" },
    { emoji: '👹', baseHealth: 200, name: 'Ogre', defeatMessage: "The ogre stumbles and falls. Victory is yours!" },
    { emoji: '👽', baseHealth: 300, name: 'Alien', defeatMessage: "The alien retreats to its spacecraft. Earth is saved!" },
    { emoji: '🐉', baseHealth: 400, name: 'Dragon', defeatMessage: "The mighty dragon has been slain. You are the true hero!" },
    { emoji: '🧙', baseHealth: 500, name: 'Wizard', defeatMessage: "The wizard's magic fades. Your strength prevails!" }
];

function closeWalletScreen() {
    const walletScreen = document.getElementById('wallet-screen');
    if (walletScreen) {
        walletScreen.style.display = 'none';
    }
}

// Updated authenticateTelegramUser function
function authenticateTelegramUser() {
    return new Promise((resolve) => {
        console.log("Authenticating Telegram user...");
        if (telegramUserId) {
            console.log("Using existing Telegram user ID:", telegramUserId);
            resolve(telegramUserId);
        } else if (window.Telegram && window.Telegram.WebApp) {
            const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
            console.log("initDataUnsafe:", JSON.stringify(initDataUnsafe));
            if (initDataUnsafe && initDataUnsafe.user) {
                telegramUserId = initDataUnsafe.user.id.toString();
                console.log("Authenticated Telegram user ID:", telegramUserId);
                resolve(telegramUserId);
            } else {
                console.log("Unable to retrieve Telegram user ID, using fallback");
                telegramUserId = 'telegram_' + Math.random().toString(36).substr(2, 9);
                resolve(telegramUserId);
            }
        } else {
            console.log("Telegram WebApp not available, using web fallback");
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

function initializeDefaultValues() {
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

// Updated saveProgress function
function saveProgress() {
    console.log("Attempting to save progress...");
    console.log("Current telegramUserId:", telegramUserId);

    if (!database) {
        console.error("Firebase database not initialized");
        alert("Unable to save progress. Please try refreshing the page.");
        return;
    }

    if (telegramUserId) {
        const dataToSave = {
            displayName, score, points, will, level, health, maxHealth,
            damagePerClick, replenishWillCost, increaseDamageCost,
            baseWalletAddress, riggedTokens, pointsAtLastBurn, characterIndex
        };
        console.log("Data being saved:", dataToSave);
        database.ref('users/' + telegramUserId).set(dataToSave)
            .then(() => console.log("Progress saved successfully"))
            .catch((error) => {
                console.error("Error saving progress:", error);
                alert("There was an error saving your progress. Please try again later.");
            });
    } else {
        console.error("No Telegram User ID available, progress not saved");
        alert("Unable to save progress. Please make sure you're logged in.");
    }
}

// Updated loadProgress function
function loadProgress() {
    console.log("Loading progress for user:", telegramUserId);
    return new Promise((resolve, reject) => {
        if (!database) {
            console.error("Firebase database not initialized");
            reject("Firebase database not initialized");
            return;
        }
        
        if (telegramUserId) {
            database.ref('users/' + telegramUserId).once('value').then((snapshot) => {
                const data = snapshot.val();
                console.log("Loaded data from Firebase:", data);
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
                    console.log("Progress loaded successfully");
                } else {
                    console.log("No existing data found, initializing with default values");
                    initializeDefaultValues();
                }
                console.log("Game state after loading:", { displayName, score, points, will, level, health, maxHealth, damagePerClick, replenishWillCost, increaseDamageCost, characterIndex });
                resolve();
            }).catch((error) => {
                console.error("Error loading progress:", error);
                initializeDefaultValues();
                reject(error);
            });
        } else {
            console.error("No Telegram User ID available");
            initializeDefaultValues();
            reject("No Telegram User ID available");
        }
    });
}

// Function to auto-replenish Will every 2 seconds
function autoReplenishWill() {
    if (will < 1000) {  // Assuming the maximum Will is 1000
        will += 1;
        updateDisplay();  // Update the display to show the new Will value
    }
}

// Updated showDefeatMessage function
function showDefeatMessage() {
    const defeatMessage = document.getElementById('defeat-message');
    const defeatText = document.getElementById('defeat-text');

    defeatText.textContent = characters[characterIndex].defeatMessage;
    defeatMessage.classList.remove('hidden');

    // Remove the click event listener from the game container
    gameContainer.removeEventListener('click', handleClick);
    
    // Add a one-time click event listener to the defeat message
    defeatMessage.addEventListener('click', function closeDefeatMessage() {
        defeatMessage.classList.add('hidden');
        nextCharacter();
        updateDisplay();
        // Remove this event listener
        defeatMessage.removeEventListener('click', closeDefeatMessage);
        // Re-add the click event listener to the game container after a short delay
        setTimeout(() => {
            gameContainer.addEventListener('click', handleClick);
        }, 500);
    }, { once: true });

    console.log("Defeat message shown, waiting for user to click to continue");
}

function nextCharacterAfterDefeat() {
    nextCharacter();
    updateDisplay();
    saveProgress();
}

// Updated nextCharacter function
function nextCharacter() {
    console.log("Loading next character");
    console.log(`Current character index: ${characterIndex}`);
    console.log(`Current character: ${characters[characterIndex].name}`);
    console.log(`Current damage per click before transition: ${damagePerClick}`);
    
    characterIndex = (characterIndex + 1) % characters.length;

    console.log(`New character index: ${characterIndex}`);
    console.log(`New character: ${characters[characterIndex].name}`);

    if (characterIndex === 0) {
        level++;
        console.log(`Level increased to: ${level}`);
    }

    maxHealth = characters[characterIndex].baseHealth * level;
    health = maxHealth;

    console.log(`Next character loaded. Max Health: ${maxHealth}, Current Health: ${health}`);
    console.log(`Current damage per click after transition: ${damagePerClick}`);

    updateDisplay();
    saveProgress();
}

// Function to update display
function updateDisplay() {
    const character = document.getElementById('character');
    if (character) {
        character.textContent = characters[characterIndex].emoji;
        character.style.fontSize = `${60 + (characterIndex * 10)}px`;
    } else {
        console.error("Character element not found");
    }

    const characterName = document.getElementById('character-name');
    if (characterName) {
        characterName.textContent = characters[characterIndex].name;
    } else {
        console.error("Character name element not found");
    }

    document.getElementById('character-name').textContent = characters[characterIndex].name;
    document.getElementById('current-health').textContent = health;
    document.getElementById('max-health').textContent = maxHealth;
    document.getElementById('health-fill').style.width = `${(health / maxHealth) * 100}%`;
    document.getElementById('score').textContent = score;
    document.getElementById('points').textContent = points;
    document.getElementById('will').textContent = will;
    document.getElementById('level').textContent = level;
    document.getElementById('replenish-will-button').textContent = `Replenish Will (${replenishWillCost} points)`;
    document.getElementById('increase-damage-button').textContent = `Increase Damage (${increaseDamageCost} points)`;

    // Update wallet display if wallet screen is open
    if (!document.getElementById('wallet-screen').classList.contains('hidden')) {
        document.getElementById('wallet-points').textContent = points;
        document.getElementById('rigged-tokens').textContent = riggedTokens;
    }

    console.log("Display updated");
}

function handleClick(event) {
    // Prevent clicks on buttons or messages from triggering attacks
    if (event.target.tagName !== 'BUTTON' && 
        !event.target.closest('#defeat-message') && 
        !event.target.closest('#leaderboard') && 
        !event.target.closest('#wallet-screen')) {
        console.log("Handling click for attack");
        handleAttack(damagePerClick);
    }
}

// Updated handleAttack function
function handleAttack(damage) {
    if (health <= 0 || will <= 0) return;

    console.log(`Attacking character: ${characters[characterIndex].name}`);
    console.log(`Dealing ${damage} damage. Expected damage per click: ${damagePerClick}`);
    console.log(`Current health before attack: ${health}`);
    
    if (damage !== damagePerClick) {
        console.warn(`Damage mismatch! Expected ${damagePerClick}, but dealing ${damage}`);
    }

    health -= damage;
    score += damage;
    points += damage;
    will -= 1;

    console.log(`Health after attack: ${health}`);
    console.log(`Score: ${score}, Points: ${points}, Will: ${will}`);

    const character = document.getElementById('character');
    const painOverlay = document.getElementById('pain-overlay');
    character.classList.add('pain');
    painOverlay.style.opacity = '0.5';

    setTimeout(() => {
        character.classList.remove('pain');
        painOverlay.style.opacity = '0';
    }, 500);

    if (health <= 0) {
        console.log("Character defeated, transitioning to next character");
        showDefeatMessage();
    } else {
        updateDisplay();
    }

    console.log(`Attack dealt: ${damage}, Current damage per click after attack: ${damagePerClick}`);
}

// Function to handle touch events
function handleTouch(event) {
    // Ignore touch events on buttons and UI elements
    if (event.target.tagName === 'BUTTON' || event.target.closest('.ui-element')) {
        return;  // Don't trigger attacks if touch is on a button or UI element
    }

    // Prevent multiple attacks if the character is already defeated
    if (health <= 0) {
        return;
    }

    event.preventDefault();  // Prevent default touch behavior (like scrolling)

    // Process attack for each touch
    for (let i = 0; i < event.touches.length; i++) {
        handleAttack(damagePerClick);  // Trigger attack for each active touch point
    }
}

// Function to handle Replenish Will
function handleReplenishWill() {
    console.log("Replenish Will button clicked");
    console.log("Replenishing will");
    if (points >= replenishWillCost) {
        points -= replenishWillCost;
        will = 1000;
        replenishWillCost = Math.floor(replenishWillCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

// Function to handle Increase Damage
function handleIncreaseDamage() {
    console.log("Increase Damage button clicked");
    if (points >= increaseDamageCost) {
        points -= increaseDamageCost;
        damagePerClick += 1;
        console.log(`Damage per click increased to: ${damagePerClick}`);  // Log the increase
        increaseDamageCost = Math.floor(increaseDamageCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

function initializeWalletState() {
    console.log("Initializing wallet state");
    walletScreen.style.display = 'none';
    updateWalletDisplay();
}

// Function to handle Show Wallet
function handleShowWallet() {
    console.log("Wallet button clicked - function triggered");  // Confirm the function is triggered
    
    riggedTokens = calculateRigged();  // Assuming this calculates the rigged tokens
    updateWalletDisplay();  // Updates the wallet display

    const walletScreen = document.getElementById('wallet-screen');
    console.log(walletScreen);  // Log the element to confirm it's found

    if (walletScreen) {
        walletScreen.classList.remove('hidden');  // Remove the 'hidden' class
        walletScreen.style.display = 'block';  // Force display for testing purposes
        console.log("Wallet screen is now visible");
    } else {
        console.error("Wallet screen element not found");
    }

    saveProgress();  // Save the wallet state
}

// Function to change Username
function handleChangeUsername() {
    console.log("Change Username button clicked");
    const newUsername = prompt("Enter a new username:");
    if (newUsername && !isProfanity(newUsername)) {
        if (changeUsername(newUsername)) {
            // Show a confirmation message
            alert("Username successfully changed to: " + newUsername);
            // Close the leaderboard after successful username change
            closeLeaderboard();
        }
    } else {
        console.log("Invalid username or contains profanity.");
        alert("Invalid username. Please try again with a different name.");
    }
}

// Function to close Wallet
function handleCloseWallet() {
    console.log("Close Wallet button clicked");
    console.log("Closing wallet");
    closeWalletScreen();
    saveProgress(); // Save the wallet state
}

// Updated handleClaimRigged function
function handleClaimRigged() {
    if (!isWalletValid) {
        walletAddressError.textContent = "Please provide a valid wallet address before claiming $RIGGED.";
        walletAddressError.style.color = "red";
        return;
    }
    
    // Ensure that riggedTokens is zero or greater
    if (riggedTokens < 0) {
        riggedTokens = 0;
    }
    
    console.log("Claiming $RIGGED");
    try {
        const claimedAmount = riggedTokens;
        points = 0;  // Reset points after claiming
        riggedTokens = 0;  // Reset $RIGGED tokens after claiming
        updateWalletDisplay();
        saveProgress();
        alert(`Successfully claimed ${claimedAmount} $RIGGED tokens!`);
    } catch (error) {
        console.error("Error claiming $RIGGED:", error);
        alert("There was an error claiming your $RIGGED tokens. Please try again later.");
    }
}

// Updated handleBurnRigged function
function handleBurnRigged() {
    console.log("Burning $RIGGED");
    
    // Ensure that riggedTokens is zero or greater
    if (riggedTokens < 0) {
        riggedTokens = 0;
    }
    
    try {
        const burnedAmount = riggedTokens;
        riggedTokens = 0;  // Reset $RIGGED tokens after burning
        pointsAtLastBurn = points;  // Update points at last burn
        updateWalletDisplay();
        saveProgress();
        alert(`Successfully burned ${burnedAmount} $RIGGED tokens!`);
    } catch (error) {
        console.error("Error burning $RIGGED:", error);
        alert("There was an error burning your $RIGGED tokens. Please try again later.");
    }
}

// Function to validate wallet address (added back)
function validateWalletAddress(address) {
    return (address.length === 42 && address.startsWith('0x')) || address.endsWith('.base.eth');
}

// Function to save wallet address (newly added)
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
        walletAddressError.textContent = "Invalid wallet address. Must be a 42-character hexadecimal address starting with '0x' or a Base ENS name ending with '.base.eth'.";
        walletAddressError.style.color = "red";
    }
}

// Function to update wallet display
function updateWalletDisplay() {
    document.getElementById('wallet-points').textContent = points;
    document.getElementById('rigged-tokens').textContent = riggedTokens;
}

// Function to calculate Rigged tokens
function calculateRigged() {
    const eligiblePoints = points - pointsAtLastBurn;
    const riggedTokensEarned = Math.floor(eligiblePoints / 100);
    
    // Ensure that $RIGGED tokens can't be negative
    if (riggedTokensEarned < 0) {
        return 0;
    }
    
    return riggedTokensEarned;
}

// Function to show leaderboard
function handleShowLeaderboard() {
    console.log("Show Leaderboard button clicked");
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    
    if (!leaderboard || !leaderboardList) {
        console.error("Leaderboard elements not found");
        return;
    }

    console.log("Showing leaderboard");

    // Sample leaderboard data - replace with actual data fetching logic
    const leaderboardData = [
        { username: 'Player1', score: 100 },
        { username: 'Player2', score: 90 },
        { username: 'Player3', score: 80 },
        { username: displayName + ' (You)', score: score }
    ];

    // Clear existing leaderboard entries
    leaderboardList.innerHTML = '';

    // Populate leaderboard
    leaderboardData.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.username}: ${player.score} points`;
        leaderboardList.appendChild(listItem);
    });

    // Show the leaderboard
    leaderboard.classList.remove('hidden');

    // Add event listener to close button
    const closeButton = document.getElementById('close-leaderboard-button');
    if (closeButton) {
        closeButton.onclick = () => {
            leaderboard.classList.add('hidden');
        };
    }

    // Add event listener to change username button
    const changeUsernameButton = document.getElementById('change-username-button');
    if (changeUsernameButton) {
        changeUsernameButton.onclick = handleChangeUsername;
    }
}

// Function to close leaderboard when clicking outside
function handleOutsideClick(event) {
    if (!leaderboardElement.contains(event.target) && event.target.id !== 'show-leaderboard-button') {
        closeLeaderboard();
    }
}

// Define the closeLeaderboard function to prevent the error
function closeLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
        leaderboard.classList.add('hidden'); // Hide the leaderboard
    } else {
        console.error("Leaderboard element not found");
    }
}

// Initialize game after DOM elements are loaded
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

    // Close the wallet screen on game load
    closeWalletScreen();

    // Add event listeners for clicks and touches
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    // Button click handlers
    const buttonHandlers = {
        'replenish-will-button': handleReplenishWill,
        'increase-damage-button': handleIncreaseDamage,
        'show-leaderboard-button': handleShowLeaderboard,
        'show-wallet-button': handleShowWallet,
        'close-wallet': handleCloseWallet,
        'claim-rigged': handleClaimRigged,
        'burn-rigged': handleBurnRigged,
        'save-wallet-address': handleSaveWalletAddress,
        'close-leaderboard-button': closeLeaderboard
    };

    Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', (event) => {
                event.stopPropagation();
                handler(event);
                console.log(`Button clicked: ${id}`);
            });
            console.log(`Event listener added for button: ${id}`);
        } else {
            console.error(`Button with id '${id}' not found`);
        }
    });

    if (closeWalletButton) {
        closeWalletButton.addEventListener('click', handleCloseWallet);
        console.log('Event listener added for close-wallet');
    } else {
        console.error("Button with id 'close-wallet' not found");
    }

    // Add event listener for change username button
    const changeUsernameButton = document.getElementById('change-username-button');
    if (changeUsernameButton) {
        changeUsernameButton.addEventListener('click', handleChangeUsername);
        console.log('Event listener added for change-username-button');
    } else {
        console.error("Button with id 'change-username-button' not found");
    }

    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Initializing Telegram WebApp...");
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // Will auto-replenish by 1 every 2 seconds
    setInterval(autoReplenishWill, 2000);

    // Initialize game after DOM elements are loaded
    authenticateTelegramUser()
    .then(() => loadProgress())
    .then(() => {
        updateDisplay();
        setInterval(saveProgress, 5000);
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