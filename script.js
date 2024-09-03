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

    const scoreValue = document.getElementById('score-value');
    const pointsValue = document.getElementById('points-value');
    const characterElement = document.getElementById('character');
    const boostButton = document.getElementById('boost-button');
    const boostActiveStatus = document.getElementById('boost-active-status');
    const willValue = document.getElementById('will-value');
    const gameContainer = document.getElementById('game-container');
    const attackButton = document.getElementById('attack-button');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const walletButton = document.getElementById('wallet-button');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    const playerNameInput = document.getElementById('player-name-input');
    const saveNameButton = document.getElementById('save-name-button');
    const nameChangeContainer = document.getElementById('name-change-container');
    const walletSection = document.getElementById('wallet-section');
    const walletPointsValue = document.getElementById('wallet-points-value');
    const riggedTokensValue = document.getElementById('rigged-tokens-value');
    const claimRiggedButton = document.getElementById('claim-rigged-button');
    const burnRiggedButton = document.getElementById('burn-rigged-button');
    const walletAddressInput = document.getElementById('wallet-address-input');
    const saveWalletButton = document.getElementById('save-wallet-button');
    const clearLeaderboardButton = document.getElementById('clear-leaderboard-button');

    let score = 0;
    let points = 0;
    let characterIndex = 0;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let will = 1000;
    let level = 1;
    let touchInProgress = false;
    let damageMultiplier = 1;
    let playerName = "Player1";
    let playerKey = null;
    let walletAddress = localStorage.getItem('walletAddress') || '';

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' }
    ];

    let currentHealth = characters[characterIndex].baseHealth * level;

    function updateCharacter() {
        characterElement.textContent = characters[characterIndex].emoji;
        currentHealth = characters[characterIndex].baseHealth * level;
    }

    function updateBoostStatus() {
        boostActiveStatus.textContent = boostActive ? 'Yes' : 'No';
        boostActiveStatus.style.color = boostActive ? 'green' : 'red';
    }

    function updateWill() {
        willValue.textContent = will;
    }

    function updatePoints() {
        pointsValue.textContent = points;
        walletPointsValue.textContent = points;
        riggedTokensValue.textContent = (points / 100).toFixed(2);
        updateClaimAndBurnButtons();
    }

    function updateScore() {
        scoreValue.textContent = score;
    }

    function replenishWill() {
        if (will < 1000) {
            will++;
            updateWill();
        }
    }

    function nextLevel() {
        level++;
        if (level > 30) {
            alert('Congratulations! You have completed all 30 levels!');
            level = 30;
        } else {
            characterIndex = (characterIndex + 1) % characters.length;
            updateCharacter();
        }
    }

    function handleAttack(numClicks) {
        if (will >= numClicks) {
            if (currentHealth > 0) {
                let damage = 10 * numClicks * damageMultiplier;
                will -= numClicks;
                updateWill();

                if (boostActive) {
                    damage *= 2;
                    boostRemainingClicks -= numClicks;
                    if (boostRemainingClicks <= 0) {
                        boostActive = false;
                        updateBoostStatus();
                    }
                }

                currentHealth -= damage;
                score += damage;  // Update score correctly
                points += damage;
                updatePoints();
                updateScore();

                if (currentHealth <= 0) {
                    addOrUpdateScoreInLeaderboard(playerName, score); // Update leaderboard when character is defeated
                    nextLevel();
                }
            }
        } else {
            alert('Not enough will to attack!');
        }
    }

    gameContainer.addEventListener('touchstart', (event) => {
        if (!touchInProgress) {
            touchInProgress = true;
            handleAttack(event.touches.length);
        }
    });

    gameContainer.addEventListener('touchend', () => {
        touchInProgress = false;
    });

    gameContainer.addEventListener('click', (event) => {
        if (event.target === gameContainer || event.target === characterElement) {
            handleAttack(1);
        }
    });

    attackButton.addEventListener('click', (event) => {
        event.stopPropagation();
        handleAttack(1);
    });

    boostButton.addEventListener('click', () => {
        if (points >= 50) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            updatePoints();
            updateBoostStatus();
        } else {
            alert('Not enough points to buy a boost!');
        }
    });

    replenishWillButton.addEventListener('click', () => {
        if (points >= 100) {
            points -= 100;
            will = Math.min(will + 50, 1000);
            updateWill();
            updatePoints();
        } else {
            alert('Not enough points to replenish will!');
        }
    });

    increaseDamageButton.addEventListener('click', () => {
        if (points >= 200) {
            points -= 200;
            damageMultiplier++;
            updatePoints();
        } else {
            alert('Not enough points to increase damage!');
        }
    });

    walletButton.addEventListener('click', (event) => {
        event.stopPropagation();
        walletSection.style.display = walletSection.style.display === 'none' ? 'block' : 'none';
    });

    showLeaderboardButton.addEventListener('click', (event) => {
        event.stopPropagation();
        leaderboard.style.display = leaderboard.style.display === 'none' ? 'block' : 'none';
        nameChangeContainer.style.display = 'block';
    });

    saveNameButton.addEventListener('click', () => {
        playerName = playerNameInput.value;
        localStorage.setItem('playerName', playerName);
        alert('Name updated successfully!');
        addOrUpdateScoreInLeaderboard(playerName, score); // Update leaderboard after name change
    });

    saveWalletButton.addEventListener('click', () => {
        walletAddress = walletAddressInput.value;
        localStorage.setItem('walletAddress', walletAddress);
        updateClaimAndBurnButtons();
        alert('Wallet address saved successfully!');
    });

    claimRiggedButton.addEventListener('click', () => {
        if (walletAddress && points > 0) {
            points = 0;  // Reset points after claiming tokens
            updatePoints();
            alert('Your $RIGGED tokens have been claimed and sent to your wallet!');
            claimRiggedButton.disabled = true; // Disable button after claiming
        } else {
            alert('Please enter a wallet address and earn points to claim tokens.');
        }
    });

    clearLeaderboardButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear the leaderboard? This action cannot be undone.')) {
            database.ref('leaderboard').remove();
            updateLeaderboard();
        }
    });

    burnRiggedButton.addEventListener('click', () => {
        if (points > 0) {
            points = 0;
            updatePoints();
            alert('$RIGGED tokens burned!');
        } else {
            alert('No points to burn!');
        }
    });

    function updateClaimAndBurnButtons() {
        burnRiggedButton.disabled = points <= 0; // Burn button enabled when points > 0
        claimRiggedButton.disabled = walletAddress === '' || points <= 0;
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

    updateCharacter();
    updateBoostStatus();
    updateWill();
    updatePoints();
    updateScore();
    updateClaimAndBurnButtons();
    setInterval(replenishWill, 2000);
});
