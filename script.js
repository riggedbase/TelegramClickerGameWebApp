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
        riggedTokensElement.textContent = Math.floor(points / 100);
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
        // Only process clicks directly on the game container or character, not on any child elements
        if (event.target === gameContainer || event.target === characterElement) {
            console.log("Click handled");
            handleDamage();
        }
    }

    function handleTouch(event) {
        // Only process touches directly on the game container or character, not on any child elements
        if (event.target === gameContainer || event.target === characterElement) {
            console.log("Touch handled", event.touches.length);
            event.preventDefault(); // Prevent default touch behavior
            handleDamage(event.touches.length);
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
    }

    function replenishWill() {
        console.log("Replenishing will");
        if (points >= replenishWillCost) {
            points -= replenishWillCost;
            will = 1000;
            replenishWillCost *= 2; // Double the cost for next time
            updateDisplay();
            console.log("Will replenished to 1000. New cost:", replenishWillCost);
        } else {
            console.log("Not enough points to replenish will");
        }
    }

    function increaseDamage() {
        console.log("Increasing damage");
        if (points >= increaseDamageCost) {
            points -= increaseDamageCost;
            damagePerClick *= 2; // Double the damage
            increaseDamageCost *= 2; // Double the cost for next time
            updateDisplay();
            console.log("Damage increased. New damage per click:", damagePerClick, "New cost:", increaseDamageCost);
        } else {
            console.log("Not enough points to increase damage");
        }
    }

    function addOrUpdateScoreInLeaderboard(name, score) {
        if (playerKey) {
            database.ref('leaderboard/' + playerKey).update({ score: score });
        } else {
            const newEntryRef = database.ref('leaderboard').push();
            playerKey = newEntryRef.key;
            newEntryRef.set({ name: name, score: score });
        }
    }

    function showLeaderboard() {
        console.log("Showing leaderboard");
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
    }

    function showWallet() {
        updateWalletDisplay();
        walletScreen.style.display = 'block';
    }

    function closeWallet() {
        walletScreen.style.display = 'none';
    }

    function saveWalletAddress(event) {
        event.preventDefault(); // Prevent form submission
        event.stopPropagation(); // Prevent click from bubbling to game container
        baseWalletAddress = baseWalletAddressInput.value;
        console.log("Base wallet address saved:", baseWalletAddress);
        updateWalletDisplay();
        // Here you would typically save this to persistent storage
    }

    function claimRigged(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        if (!baseWalletAddress) {
            alert("Please provide a Base network compatible wallet address - DO NOT PROVIDE YOUR PRIVATE KEY");
            return;
        }
        // Here you would typically call the API to claim RIGGED tokens
        console.log("Claiming RIGGED tokens");
        points = 0;
        updateDisplay();
    }

    function burnRigged(event) {
        event.stopPropagation(); // Prevent click from bubbling to game container
        // Here you would typically call the API to burn RIGGED tokens
        console.log("Burning RIGGED tokens");
        riggedTokensElement.textContent = "0";
        updateDisplay();
    }

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    replenishWillButton.addEventListener('click', (e) => {
        e.stopPropagation();
        replenishWill();
    });
    increaseDamageButton.addEventListener('click', (e) => {
        e.stopPropagation();
        increaseDamage();
    });
    showLeaderboardButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showLeaderboard();
    });
    showWalletButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showWallet();
    });
    closeWalletButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWallet();
    });
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);

    // Prevent clicks on wallet elements from causing damage
    walletScreen.addEventListener('click', (e) => e.stopPropagation());
    baseWalletAddressInput.addEventListener('click', (e) => e.stopPropagation());

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