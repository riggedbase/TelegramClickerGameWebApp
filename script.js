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
    const showWalletButton = document.getElementById('show-wallet-button');
    const leaderboardElement = document.getElementById('leaderboard');

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
    }

    function replenishWill(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        if (points >= replenishWillCost) {
            points -= replenishWillCost;
            will = 1000;
            replenishWillCost *= 2;
            updateDisplay();
        }
    }

    function increaseDamage(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        if (points >= increaseDamageCost) {
            points -= increaseDamageCost;
            damagePerClick *= 2;
            increaseDamageCost *= 2;
            updateDisplay();
        }
    }

    function showLeaderboard(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
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
            leaderboardElement.innerHTML += `<p><strong>Your score: ${score}</strong></p>`;
        });
        leaderboardElement.style.display = 'block';
        
        // Add touch event listeners to allow scrolling within the leaderboard
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
    }

    function claimRigged() {
        if (baseWalletAddress) {
            points = 0;
            riggedTokens = 0;
            pointsAtLastBurn = 0;
            updateDisplay();
            showWallet();
        } else {
            alert("Please provide a Base network compatible wallet address - DO NOT PROVIDE YOUR PRIVATE KEY");
        }
    }

    function burnRigged() {
        riggedTokens = 0;
        pointsAtLastBurn = points;
        showWallet();
    }

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false }); // For mobile devices
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false }); // Prevent scrolling on the game container
    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    showWalletButton.addEventListener('click', showWallet);
    closeWalletButton.addEventListener('click', closeWallet);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);

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