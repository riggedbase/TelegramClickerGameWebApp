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

    // Game state
    const gameState = {
        score: 0,
        points: 0,
        will: 1000,
        level: 1,
        health: 100,
        maxHealth: 100,
        damagePerClick: 1,
        playerName: "Player1",
        playerKey: null,
        replenishWillCost: 100,
        increaseDamageCost: 200,
        baseWalletAddress: '',
        riggedTokens: 0,
        pointsAtLastBurn: 0,
        characterIndex: 0
    };

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' },
        { emoji: '🐉', baseHealth: 400, name: 'Dragon' },
        { emoji: '🧙', baseHealth: 500, name: 'Wizard' }
    ];

    function updateDisplay() {
        characterElement.textContent = characters[gameState.characterIndex].emoji;
        characterNameElement.textContent = characters[gameState.characterIndex].name;
        currentHealthElement.textContent = gameState.health;
        maxHealthElement.textContent = gameState.maxHealth;
        healthFill.style.width = `${(gameState.health / gameState.maxHealth) * 100}%`;
        scoreElement.textContent = gameState.score;
        pointsElement.textContent = gameState.points;
        willElement.textContent = gameState.will;
        levelElement.textContent = gameState.level;
        replenishWillButton.textContent = `Replenish Will (${gameState.replenishWillCost} points)`;
        increaseDamageButton.textContent = `Increase Damage (${gameState.increaseDamageCost} points)`;
        updateWalletDisplay();
    }

    function updateWalletDisplay() {
        walletPointsElement.textContent = gameState.points;
        gameState.riggedTokens = Math.floor((gameState.points - gameState.pointsAtLastBurn) / 100);
        riggedTokensElement.textContent = gameState.riggedTokens;
        baseWalletAddressInput.value = gameState.baseWalletAddress;
    }

    function handleDamage(clickCount = 1) {
        if (gameState.will > 0) {
            let damage = gameState.damagePerClick * clickCount;
            gameState.health -= damage;
            gameState.score += damage;
            gameState.points += damage;
            gameState.will -= clickCount;

            if (gameState.health <= 0) {
                nextCharacter();
            }

            updateDisplay();
            addOrUpdateScoreInLeaderboard(gameState.playerName, gameState.score);
        }
    }

    function nextCharacter() {
        gameState.characterIndex = (gameState.characterIndex + 1) % characters.length;
        if (gameState.characterIndex === 0) {
            gameState.level++;
        }
        gameState.maxHealth = characters[gameState.characterIndex].baseHealth * gameState.level;
        gameState.health = gameState.maxHealth;
    }

    function replenishWill() {
        if (gameState.points >= gameState.replenishWillCost) {
            gameState.points -= gameState.replenishWillCost;
            gameState.will = 1000;
            gameState.replenishWillCost *= 2;
            updateDisplay();
        }
    }

    function increaseDamage() {
        if (gameState.points >= gameState.increaseDamageCost) {
            gameState.points -= gameState.increaseDamageCost;
            gameState.damagePerClick *= 2;
            gameState.increaseDamageCost *= 2;
            updateDisplay();
        }
    }

    function showLeaderboard() {
        leaderboardElement.innerHTML = '<h2>Leaderboard</h2>';
        database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            if (leaderboardData) {
                const sortedLeaderboard = Object.values(leaderboardData).sort((a, b) => b.score - a.score);
                sortedLeaderboard.forEach((entry) => {
                    leaderboardElement.innerHTML += `<p>${entry.name}: ${entry.score}</p>`;
                });
            } else {
                leaderboardElement.innerHTML += '<p>No scores yet</p>';
            }
            leaderboardElement.innerHTML += `<p><strong>Your score: ${gameState.score}</strong></p>`;
        });
    }

    function showWallet() {
        updateWalletDisplay();
        walletScreen.style.display = 'block';
    }

    function closeWallet() {
        walletScreen.style.display = 'none';
    }

    function saveWalletAddress() {
        const newAddress = baseWalletAddressInput.value;
        if (validateWalletAddress(newAddress)) {
            gameState.baseWalletAddress = newAddress;
            updateWalletDisplay();
            walletAddressError.textContent = 'Wallet address saved successfully!';
            walletAddressError.style.color = 'green';
        }
    }

    function validateWalletAddress(address) {
        if (address.length === 42 || address.endsWith('.eth')) {
            walletAddressError.textContent = '';
            return true;
        } else {
            walletAddressError.textContent = 'Address should be 42 characters long or an ENS name ending with .eth';
            walletAddressError.style.color = 'red';
            return false;
        }
    }

    function addOrUpdateScoreInLeaderboard(name, score) {
        if (gameState.playerKey) {
            database.ref('leaderboard/' + gameState.playerKey).update({ score: score });
        } else {
            const newEntryRef = database.ref('leaderboard').push();
            gameState.playerKey = newEntryRef.key;
            newEntryRef.set({ name: name, score: score });
        }
    }

    function claimRigged() {
        if (!gameState.baseWalletAddress) {
            alert("Please provide a Base network compatible wallet address - DO NOT PROVIDE YOUR PRIVATE KEY");
            return;
        }
        if (!validateWalletAddress(gameState.baseWalletAddress)) {
            return;
        }
        gameState.points = 0;
        gameState.riggedTokens = 0;
        gameState.pointsAtLastBurn = 0;
        updateDisplay();
    }

    function burnRigged() {
        gameState.riggedTokens = 0;
        gameState.pointsAtLastBurn = gameState.points;
        updateDisplay();
    }

    // Event listeners
    document.body.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON' && !walletScreen.contains(e.target)) {
            handleDamage();
        }
    });

    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    showWalletButton.addEventListener('click', showWallet);
    closeWalletButton.addEventListener('click', closeWallet);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);

    if (baseWalletAddressInput) {
        baseWalletAddressInput.addEventListener('input', (e) => {
            e.stopPropagation();
            const input = e.target;
            const cursorPosition = input.selectionStart;
            if (input.value.length > 42) {
                input.value = input.value.slice(0, 42);
                input.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
            }
        });
        baseWalletAddressInput.addEventListener('click', (e) => e.stopPropagation());
        baseWalletAddressInput.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (gameState.will < 1000) {
            gameState.will++;
            updateDisplay();
        }
    }, 2000);

    console.log("Game initialized");
});