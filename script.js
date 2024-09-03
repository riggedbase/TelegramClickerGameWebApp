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
                let pointsToAdd = 10 * numClicks * damageMultiplier;
                will -= numClicks;
                updateWill();

                if (boostActive) {
                    pointsToAdd *= 2;
                    boostRemainingClicks -= numClicks;
                    if (boostRemainingClicks <= 0) {
                        boostActive = false;
                        updateBoostStatus();
                    }
                }

                currentHealth -= pointsToAdd;
                score += pointsToAdd; // Ensure score is updated
                points += pointsToAdd;
                updatePoints();

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
        handleAttack(1); // Ensure the attack button triggers the attack
    });

    boostButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (points >= 50 && !boostActive) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            updatePoints();
            updateBoostStatus();
            alert('Boost activated! You now earn double points for 10 clicks.');
        } else if (boostActive) {
            alert('Boost is already active!');
        } else {
            alert('Not enough points to activate boost!');
        }
    });

    replenishWillButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (points >= 100) {
            points -= 100;
            will = 1000;
            updatePoints();
            updateWill();
            alert('Will replenished!');
        } else {
            alert('Not enough points to replenish will!');
        }
    });

    increaseDamageButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (points >= 200) {
            points -= 200;
            damageMultiplier += 1;
            updatePoints();
            alert('Damage increased!');
        } else {
            alert('Not enough points to increase damage!');
        }
    });

    showLeaderboardButton.addEventListener('click', () => {
        leaderboard.style.display = 'block';
        nameChangeContainer.style.display = 'block';
        walletSection.style.display = 'none';
        updateLeaderboard();
    });

    walletButton.addEventListener('click', (event) => {
        event.stopPropagation();
        walletSection.style.display = 'block';
        leaderboard.style.display = 'none';
    });

    saveNameButton.addEventListener('click', () => {
        const newName = playerNameInput.value.trim();
        if (newName && newName !== playerName) {
            playerName = newName;
            if (playerKey) {
                database.ref('leaderboard/' + playerKey).update({ name: playerName });
            }
            alert('Name updated successfully!');
            playerNameInput.value = '';
            nameChangeContainer.style.display = 'none';
            updateLeaderboard();
        }
    });

    saveWalletButton.addEventListener('click', () => {
        const address = walletAddressInput.value.trim();
        if (address) {
            walletAddress = address;
            localStorage.setItem('walletAddress', walletAddress);
            alert('Wallet address saved successfully!');
            updateClaimAndBurnButtons();
        } else {
            alert('Please enter a valid wallet address.');
        }
    });

    burnRiggedButton.addEventListener('click', () => {
        // Logic to handle burning $RIGGED tokens
        points = 0;  // Reset points after burning tokens
        updatePoints();
        alert('You have burned your $RIGGED tokens!');
    });

    function updateClaimAndBurnButtons() {
        claimRiggedButton.disabled = walletAddress.length === 0;
        burnRiggedButton.disabled = false;
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
    updateClaimAndBurnButtons();

    setInterval(replenishWill, 2000);
});
