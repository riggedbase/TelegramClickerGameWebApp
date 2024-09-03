document.addEventListener('DOMContentLoaded', (event) => {
    const firebaseConfig = {
        apiKey: "AIzaSyA7k-CcnTG4X2sEfDdbSS8OuQPbdL-mBvI",
        authDomain: "rigged-clicker-game-1.firebaseapp.com",
        databaseURL: "https://rigged-clicker-game-1-default-rtdb.firebaseio.com",
        projectId: "rigged-clicker-game-1",
        storageBucket: "rigged-clicker-game-1.appspot.com",
        messagingSenderId: "492830453182",
        appId: "1:492830453182:web:3050eafa48fea21e145def",
        measurementId: "G-NNKC4YWY5R"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Game variables
    let score = 0;
    let points = 0;
    let will = 1000;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let damageMultiplier = 1;
    let playerKey = null;
    let playerName = localStorage.getItem('playerName') || "Player 1";
    let walletAddress = localStorage.getItem('walletAddress') || "";

    // DOM elements
    const gameContainer = document.getElementById('game-container');
    const characterElement = document.getElementById('character');
    const attackButton = document.getElementById('attack-button');
    const boostButton = document.getElementById('boost-button');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const walletButton = document.getElementById('wallet-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const saveNameButton = document.getElementById('save-name-button');
    const saveWalletButton = document.getElementById('save-wallet-button');
    const claimRiggedButton = document.getElementById('claim-rigged-button');
    const clearLeaderboardButton = document.getElementById('clear-leaderboard-button');
    const burnRiggedButton = document.getElementById('burn-rigged-button');
    const walletSection = document.getElementById('wallet-section');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    const nameChangeContainer = document.getElementById('name-change-container');
    const playerNameInput = document.getElementById('player-name-input');
    const walletAddressInput = document.getElementById('wallet-address-input');

    // Initialize scores and points
    function updateScore() {
        document.getElementById('score-value').textContent = score;
    }

    function updatePoints() {
        document.getElementById('points-value').textContent = points;
        document.getElementById('wallet-points-value').textContent = points;
    }

    function updateWill() {
        document.getElementById('will-value').textContent = will;
    }

    function updateBoostStatus() {
        document.getElementById('boost-active-status').textContent = boostActive ? 'Yes' : 'No';
    }

    function handleAttack(multiplier) {
        if (will > 0) {
            const damage = 10 * multiplier * damageMultiplier;
            score += damage;
            points += damage;
            will--;
            if (boostActive) {
                boostRemainingClicks--;
                if (boostRemainingClicks <= 0) {
                    boostActive = false;
                }
                updateBoostStatus();
            }
            updateScore();
            updatePoints();
            updateWill();
            addOrUpdateScoreInLeaderboard(playerName, score);
        } else {
            alert('You have run out of Will! Wait for it to replenish.');
        }
    }

    function replenishWill() {
        if (will < 1000) {
            will++;
            updateWill();
        }
    }

    function addOrUpdateScoreInLeaderboard(name, score) {
        if (playerKey) {
            database.ref('leaderboard/' + playerKey).update({ name: name, score: score });
        } else {
            const newEntryRef = database.ref('leaderboard').push();
            playerKey = newEntryRef.key;
            newEntryRef.set({ name: name, score: score });
        }
    }

    function updateLeaderboard() {
        const leaderboardRef = database.ref('leaderboard');
        leaderboardRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            if (leaderboardData) {
                const sortedLeaderboard = [];
                for (const id in leaderboardData) {
                    sortedLeaderboard.push(leaderboardData[id]);
                }
                sortedLeaderboard.sort((a, b) => b.score - a.score);
                leaderboardList.innerHTML = '';
                sortedLeaderboard.forEach((entry) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${entry.name}: ${entry.score}`;
                    leaderboardList.appendChild(listItem);
                });
            } else {
                leaderboardList.innerHTML = '<li>No scores available</li>';
            }
        }, (error) => {
            console.error('Error fetching leaderboard data:', error);
        });
    }

    function updateClaimAndBurnButtons() {
        burnRiggedButton.disabled = points <= 0; 
        claimRiggedButton.disabled = walletAddress === '' || points <= 0;
    }

    // Event Listeners
    gameContainer.addEventListener('click', (event) => {
        if (event.target === gameContainer || event.target === characterElement) {
            handleAttack(1);
        }
    });

    attackButton.addEventListener('click', (event) => {
        handleAttack(1);
        event.stopPropagation();
    });

    boostButton.addEventListener('click', (event) => {
        if (points >= 50 && !boostActive) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            updatePoints();
            updateBoostStatus();
        } else {
            alert('Not enough points or boost already active.');
        }
        event.stopPropagation();
    });

    replenishWillButton.addEventListener('click', (event) => {
        if (points >= 100) {
            points -= 100;
            will = 1000;
            updatePoints();
            updateWill();
        } else {
            alert('Not enough points.');
        }
        event.stopPropagation();
    });

    increaseDamageButton.addEventListener('click', (event) => {
        if (points >= 200) {
            points -= 200;
            damageMultiplier *= 2;
            updatePoints();
        } else {
            alert('Not enough points.');
        }
        event.stopPropagation();
    });

    walletButton.addEventListener('click', (event) => {
        walletSection.style.display = walletSection.style.display === 'none' ? 'block' : 'none';
        updateClaimAndBurnButtons();
        event.stopPropagation();
    });

    saveNameButton.addEventListener('click', () => {
        playerName = playerNameInput.value || playerName;
        localStorage.setItem('playerName', playerName);
        if (playerKey) {
            database.ref('leaderboard/' + playerKey).update({ name: playerName });
        }
        updateLeaderboard();
    });

    saveWalletButton.addEventListener('click', () => {
        walletAddress = walletAddressInput.value;
        localStorage.setItem('walletAddress', walletAddress);
        updateClaimAndBurnButtons();
    });

    claimRiggedButton.addEventListener('click', () => {
        alert(`Claiming $RIGGED to address ${walletAddress}.`);
        points = 0;
        updatePoints();
        updateClaimAndBurnButtons();
    });

    clearLeaderboardButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the leaderboard?')) {
            database.ref('leaderboard').remove();
            updateLeaderboard();
        }
    });

    burnRiggedButton.addEventListener('click', () => {
        alert('Burning $RIGGED!');
        points = 0;
        updatePoints();
        updateClaimAndBurnButtons();
    });

    showLeaderboardButton.addEventListener('click', (event) => {
        leaderboard.style.display = leaderboard.style.display === 'none' ? 'block' : 'none';
        updateLeaderboard();
        event.stopPropagation();
    });

    // Initialize values
    updateScore();
    updatePoints();
    updateWill();
    updateBoostStatus();
    updateClaimAndBurnButtons();
    updateLeaderboard();

    // Replenish will over time
    setInterval(replenishWill, 2000);
});
