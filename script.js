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
    const leaderboardElement = document.getElementById('leaderboard');

    // Wallet elements
    const showWalletButton = document.getElementById('show-wallet-button');
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
    let playerName = "Player1";
    let playerKey = null;
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
        updateWalletDisplay();
    }

    function updateWalletDisplay() {
        walletPointsElement.textContent = points;
        riggedTokens = Math.floor((points - pointsAtLastBurn) / 100);
        riggedTokensElement.textContent = riggedTokens;
        baseWalletAddressInput.value = baseWalletAddress;
    }

    function handleDamage(clickCount = 1) {
        if (will > 0) {
            let damage = damagePerClick * clickCount;
            health -= damage;
            score += damage;
            points += damage;
            will -= clickCount;

            if (health <= 0) {
                nextCharacter();
            }

            updateDisplay();
            addOrUpdateScoreInLeaderboard(playerName, score);
        }
    }

    function handleClick(event) {
        // Check if the click is on a button or within the wallet screen
        if (event.target.tagName === 'BUTTON' || (walletScreen && walletScreen.contains(event.target))) {
            return;
        }
        console.log("Click handled");
        handleDamage();
    }

    function handleTouch(event) {
        // Check if the touch is on a button or within the wallet screen
        if (event.target.tagName === 'BUTTON' || (walletScreen && walletScreen.contains(event.target))) {
            return;
        }
        console.log("Touch handled", event.touches.length);
        event.preventDefault();
        handleDamage(event.touches.length);
    }

    // ... (rest of the functions remain the same)

    // Event listeners
    document.body.addEventListener('click', handleClick);
    document.body.addEventListener('touchstart', handleTouch, { passive: false });

    replenishWillButton.addEventListener('click', (e) => { e.stopPropagation(); replenishWill(); });
    increaseDamageButton.addEventListener('click', (e) => { e.stopPropagation(); increaseDamage(); });
    showLeaderboardButton.addEventListener('click', (e) => { e.stopPropagation(); showLeaderboard(); });
    showWalletButton.addEventListener('click', (e) => { e.stopPropagation(); showWallet(); });
    closeWalletButton.addEventListener('click', (e) => { e.stopPropagation(); closeWallet(); });
    saveWalletAddressButton.addEventListener('click', (e) => { e.stopPropagation(); saveWalletAddress(); });
    claimRiggedButton.addEventListener('click', (e) => { e.stopPropagation(); claimRigged(); });
    burnRiggedButton.addEventListener('click', (e) => { e.stopPropagation(); burnRigged(); });

    // Prevent event propagation for wallet screen elements
    if (walletScreen) {
        walletScreen.addEventListener('click', (e) => e.stopPropagation());
        walletScreen.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // Handle wallet input
    if (baseWalletAddressInput) {
        baseWalletAddressInput.addEventListener('input', (e) => {
            e.stopPropagation();
            if (e.target.value.length > 42) {
                e.target.value = e.target.value.slice(0, 42);
            }
        });
        baseWalletAddressInput.addEventListener('click', (e) => e.stopPropagation());
        baseWalletAddressInput.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (will < 1000) {
            will++;
            updateDisplay();
        }
    }, 2000);

    console.log("Game initialized");
});