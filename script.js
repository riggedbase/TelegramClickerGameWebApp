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
let credits = 0;
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
let touchStartY = 0;
let touchEndY = 0;
const scrollThreshold = 10; // Adjust this value as needed

// Declare character information globally with updated defeat messages
const characters = [
    { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fbiden01.png?alt=media', baseHealth: 100, name: 'Demon', defeatMessage: "You've banished the demon back to the underworld!" },
    { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fkamala01.png?alt=media', baseHealth: 200, name: 'Ogre', defeatMessage: "The ogre stumbles and falls. Victory is yours!" },
    { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fluke01.png?alt=media', baseHealth: 300, name: 'Alien', defeatMessage: "The alien retreats to its spacecraft. Earth is saved!" },
    { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fswift01.png?alt=media', baseHealth: 400, name: 'Dragon', defeatMessage: "The mighty dragon has been slain. You are the true hero!" },
    { imageUrl: 'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fobama01.png?alt=media', baseHealth: 500, name: 'Wizard', defeatMessage: "The wizard's magic fades. Your strength prevails!" }
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
    credits = 0;
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
            displayName, score, credits, will, level, health, maxHealth,
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
                    credits = data.credits || 0;
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
                console.log("Game state after loading:", { displayName, score, credits, will, level, health, maxHealth, damagePerClick, replenishWillCost, increaseDamageCost, characterIndex });
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
    const defeatContent = defeatMessage.querySelector('.defeat-content');

    if (!defeatMessage || !defeatContent) {
        console.error("Defeat message elements not found");
        return;
    }

    defeatContent.innerHTML = ''; // Clear existing content

    // Add the close button
    const closeButton = document.createElement('span');
    closeButton.textContent = '✖';
    closeButton.style.cursor = 'pointer';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    defeatContent.appendChild(closeButton);

    // Add the defeat message text
    const defeatText = document.createElement('p');
    defeatText.textContent = characters[characterIndex].defeatMessage;
    defeatContent.appendChild(defeatText);

    defeatMessage.classList.remove('hidden'); // Show defeat message

    // Remove the click event listener from the game container to avoid attacks
    gameContainer.removeEventListener('click', handleClick);

    // Close the defeat message and trigger character transition
    closeButton.addEventListener('click', function closeDefeatMessage(event) {
        event.stopPropagation(); // Prevent further propagation

        defeatMessage.classList.add('hidden'); // Hide defeat message
        nextCharacter();  // Load next character
        updateDisplay();  // Update UI with new character data

        // Re-add the click event listener for attacks
        setTimeout(() => {
            gameContainer.addEventListener('click', handleClick);
        }, 500);
    }, { once: true });

    console.log("Defeat message shown, waiting for user to click close button to continue");
}

// Updated nextCharacter function
function nextCharacter() {
    console.log("Loading next character");

    // Increment character index
    characterIndex = (characterIndex + 1) % characters.length;

    // Reset health, but persist replenishWillCost and increaseDamageCost
    maxHealth = characters[characterIndex].baseHealth * level;
    health = maxHealth;

    if (characterIndex === 0) {
        level++;  // Increment level when all characters have been cycled through
        console.log(`Level increased to: ${level}`);
    }

    // Ensure that replenishWillCost and increaseDamageCost are NOT reset here
    console.log("Replenish Will Cost:", replenishWillCost, "Increase Damage Cost:", increaseDamageCost);

    // Update the character image, name, and other details
    updateDisplay();
    saveProgress();  // Save the updated state

    console.log(`Next character loaded: ${characters[characterIndex].name}`);
}

// Function to update display
function updateDisplay() {
    // Update character image and health
    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const healthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const healthFill = document.getElementById('health-fill');

    if (characterElement) {
        characterElement.innerHTML = `<img src="${characters[characterIndex].imageUrl}" alt="${characters[characterIndex].name}">`;
    }

    if (characterNameElement) {
        characterNameElement.textContent = characters[characterIndex].name;
    }

    if (healthElement && maxHealthElement) {
        healthElement.textContent = health;
        maxHealthElement.textContent = maxHealth;
        healthFill.style.width = `${(health / maxHealth) * 100}%`;
    }

    // Ensure costs are not being reset
    const replenishWillCostElement = document.getElementById('replenish-will-cost');
    const increaseDamageCostElement = document.getElementById('increase-damage-cost');

    if (replenishWillCostElement) replenishWillCostElement.textContent = replenishWillCost;
    if (increaseDamageCostElement) increaseDamageCostElement.textContent = increaseDamageCost;

    console.log("Display updated");
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
    credits += damage;
    will -= 1;

    console.log(`Health after attack: ${health}`);
    console.log(`Score: ${score}, Credits: ${credits}, Will: ${will}`);

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
function handleTouchStart(event) {
    touchStartY = event.touches[0].clientY;
}

function handleTouchMove(event) {
    touchEndY = event.touches[0].clientY;
    const touchDiff = touchStartY - touchEndY;

    if (Math.abs(touchDiff) > scrollThreshold) {
        // If the touch difference is greater than the threshold, it's a scroll
        event.stopPropagation();
    } else {
        // If it's a small movement, prevent default to avoid unintended scrolls
        event.preventDefault();
    }
}

function handleTouchEnd(event) {
    const touchDiff = touchStartY - touchEndY;

    if (Math.abs(touchDiff) <= scrollThreshold) {
        // If the touch difference is small, it's a tap/click
        handleClick(event);
    }

    // Reset touch coordinates
    touchStartY = 0;
    touchEndY = 0;
}

function handleClick(event) {
    // Prevent clicks on buttons or messages from triggering attacks
    if (event.target.tagName !== 'BUTTON' && 
        !event.target.closest('#defeat-message') && 
        !event.target.closest('#leaderboard') && 
        !event.target.closest('#wallet-screen') &&
        !event.target.closest('.action-button')) {
        console.log("Handling click for attack");
        handleAttack(damagePerClick);
    }
}

// Function to handle Replenish Will
function handleReplenishWill() {
    console.log("Replenish Will button clicked");
    console.log("Replenishing will");
    if (credits >= replenishWillCost) {
        credits -= replenishWillCost;
        will = 1000;
        replenishWillCost = Math.floor(replenishWillCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

// Function to handle Increase Damage
function handleIncreaseDamage() {
    console.log("Increase Damage button clicked");
    if (credits >= increaseDamageCost) {
        credits -= increaseDamageCost;
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
    console.log("Wallet button clicked - function triggered");
    
    riggedTokens = calculateRigged();
    updateWalletDisplay();

    const walletScreen = document.getElementById('wallet-screen');
    const walletContent = document.getElementById('wallet-content');

    if (walletScreen && walletContent) {
        // Clear existing content
        walletContent.innerHTML = '';

        // Recreate wallet content
        walletContent.innerHTML = `
            <h2>Wallet</h2>
            <div>Current Credits: <span id="wallet-credits">${credits}</span></div>
            <div>$RIGGED Tokens: <span id="rigged-tokens">${riggedTokens}</span></div>
            <div>
                Base Wallet Address: 
                <input type="text" id="base-wallet-address" value="${baseWalletAddress}">
                <button id="save-wallet-address">Save Address</button>
                <div id="wallet-address-error"></div>
            </div>
            <button id="claim-rigged">Claim $RIGGED</button>
            <button id="burn-rigged">Burn $RIGGED</button>
            <button id="close-wallet">Close Wallet</button>
        `;

        walletScreen.classList.remove('hidden');
        walletScreen.style.display = 'flex';
        console.log("Wallet screen is now visible");

        // Re-attach event listeners
        document.getElementById('save-wallet-address').addEventListener('click', handleSaveWalletAddress);
        document.getElementById('claim-rigged').addEventListener('click', handleClaimRigged);
        document.getElementById('burn-rigged').addEventListener('click', handleBurnRigged);
        document.getElementById('close-wallet').addEventListener('click', handleCloseWallet);
    } else {
        console.error("Wallet screen or content element not found");
    }

    saveProgress();
}

// Function to change Username
function handleChangeUsername() {
    console.log("Change Username button clicked");
    showUsernameChangeModal();
}

// Function to show the custom username change modal
function showUsernameChangeModal() {
    // Check if modal already exists to prevent multiple modals
    if (document.getElementById('username-change-modal')) {
        console.log("Username change modal already open");
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'username-change-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Change Username</h2>
            <input type="text" id="new-username-input" placeholder="Enter new username">
            <div class="modal-buttons">
                <button id="confirm-username-change">Change</button>
                <button id="cancel-username-change">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const confirmButton = document.getElementById('confirm-username-change');
    const cancelButton = document.getElementById('cancel-username-change');
    const inputField = document.getElementById('new-username-input');

    if (confirmButton && cancelButton && inputField) {
        confirmButton.addEventListener('click', confirmUsernameChange);
        cancelButton.addEventListener('click', closeUsernameChangeModal);
        // Focus on the input field
        setTimeout(() => inputField.focus(), 100);
    } else {
        console.error("Could not find all necessary elements for the username change modal");
        closeUsernameChangeModal(); // Close the modal if there was an error
    }
}

// Function to close the username change modal
function closeUsernameChangeModal() {
    const modal = document.getElementById('username-change-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Function to confirm username change
function confirmUsernameChange() {
    const newUsername = document.getElementById('new-username-input').value.trim();
    if (newUsername && !isProfanity(newUsername)) {
        if (changeUsername(newUsername)) {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showAlert("Username successfully changed to: " + newUsername);
            } else {
                alert("Username successfully changed to: " + newUsername);
            }
            closeUsernameChangeModal();
            closeLeaderboard(); // Add this line to close the leaderboard
        }
    } else {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert("Invalid username. Please try again with a different name.");
        } else {
            alert("Invalid username. Please try again with a different name.");
        }
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
        credits = 0;  // Reset credits after claiming
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
        pointsAtLastBurn = credits;  // Update credits at last burn
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
    document.getElementById('wallet-credits').textContent = credits;
    document.getElementById('rigged-tokens').textContent = riggedTokens;
}

// Function to calculate Rigged tokens
function calculateRigged() {
    const eligibleCredits = credits - pointsAtLastBurn;
    const riggedTokensEarned = Math.floor(eligibleCredits / 100);
    
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
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    if (!leaderboard || !leaderboardContent) {
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
    leaderboardContent.innerHTML = '<h2>Leaderboard</h2>';

    // Populate leaderboard
    const leaderboardList = document.createElement('ul');
    leaderboardList.id = 'leaderboard-list';
    leaderboardData.forEach(player => {
        const listItem = document.createElement('li');
        listItem.textContent = `${player.username}: ${player.score} points`;
        leaderboardList.appendChild(listItem);
    });
    leaderboardContent.appendChild(leaderboardList);

    // Add change username button
    const changeUsernameButton = document.createElement('button');
    changeUsernameButton.textContent = 'Change Username';
    changeUsernameButton.id = 'change-username-button';
    changeUsernameButton.onclick = handleChangeUsername;
    leaderboardContent.appendChild(changeUsernameButton);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Leaderboard';
    closeButton.id = 'close-leaderboard-button';
    closeButton.onclick = closeLeaderboard;
    leaderboardContent.appendChild(closeButton);

    // Show the leaderboard
    leaderboard.classList.remove('hidden');
    leaderboard.style.display = 'flex';
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
    creditsElement = document.getElementById('credits');
    willElement = document.getElementById('will');
    levelElement = document.getElementById('level');
    replenishWillButton = document.getElementById('replenish-will-button');
    increaseDamageButton = document.getElementById('increase-damage-button');
    showLeaderboardButton = document.getElementById('show-leaderboard-button');
    showWalletButton = document.getElementById('show-wallet-button');
    leaderboardElement = document.getElementById('leaderboard');
    
    // Wallet elements
    walletScreen = document.getElementById('wallet-screen');
    walletCreditsElement = document.getElementById('wallet-credits');
    riggedTokensElement = document.getElementById('rigged-tokens');
    baseWalletAddressInput = document.getElementById('base-wallet-address');
    saveWalletAddressButton = document.getElementById('save-wallet-address');
    claimRiggedButton = document.getElementById('claim-rigged');
    burnRiggedButton = document.getElementById('burn-rigged');
    closeWalletButton = document.getElementById('close-wallet');
    walletAddressError = document.getElementById('wallet-address-error');

    // Close the wallet screen on game load
    if (walletScreen) walletScreen.classList.add('hidden');

    // Add event listeners for clicks and touches
    if (gameContainer) {
        gameContainer.addEventListener('click', handleClick);
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    } else {
        console.error("Game container not found");
    }

    // Button click handlers
    const buttonHandlers = {
        'replenish-will-button': handleReplenishWill,
        'increase-damage-button': handleIncreaseDamage,
        'show-leaderboard-button': handleShowLeaderboard,
        'show-wallet-button': handleShowWallet,
        'close-wallet': handleCloseWallet,
        'claim-rigged': handleClaimRigged,
        'burn-rigged': handleBurnRigged,
        'save-wallet-address': handleSaveWalletAddress
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