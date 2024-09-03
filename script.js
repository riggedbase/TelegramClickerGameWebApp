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
    let characterHealth = 100;  // Initial character health
    let level = 1;  // Start at level 1

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
        updateRiggedTokens(); // Call this function to update Rigged tokens
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
            updateCharacter();  // Check if the character needs to change
            addOrUpdateScoreInLeaderboard(playerName, score);  // Update the leaderboard after score update
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
        claimRiggedButton.disabled = points <= 0 || !walletAddress;
    }

    // Function to calculate and update Rigged tokens
    function updateRiggedTokens() {
        const conversionRate = 0.1; // Example conversion rate: 10 points = 1 Rigged token
        const riggedTokens = Math.floor(points * conversionRate); // Calculate Rigged tokens
        document.getElementById('rigged-token-value').textContent = riggedTokens; // Update display
    }

    function updateCharacter() {
        if (points >= characterHealth) {
            level++;  // Go to the next level
            characterHealth += 100 * level;  // Increase health for the next character
            score = 0;  // Reset score for the new character
            points = 0; // Reset points for the new character
            updateScore();
            updatePoints();
            alert(`Character defeated! Moving to level ${level}. New character health: ${characterHealth}`);
        }
    }

    // Event listeners
    attackButton.addEventListener('click', () => handleAttack(1));
    boostButton.addEventListener('click', () => {
        if (points >= 50) { // Example cost of 50 points
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            updatePoints();
            updateBoostStatus();
        } else {
            alert('Not enough points for boost!');
        }
    });

    clearLeaderboardButton.addEventListener('click', () => {
        database.ref('leaderboard').remove().then(() => {
            console.log('Leaderboard cleared');
            updateLeaderboard();
        }).catch((error) => {
            console.error('Error clearing leaderboard:', error);
        });
    });

    showLeaderboardButton.addEventListener('click', () => {
        updateLeaderboard();
        leaderboard.style.display = 'block';
        nameChangeContainer.style.display = 'block';
    });

    saveNameButton.addEventListener('click', () => {
        const newName = playerNameInput.value;
        if (newName) {
            playerName = newName;
            localStorage.setItem('playerName', playerName);
            addOrUpdateScoreInLeaderboard(playerName, score);
        }
    });

    saveWalletButton.addEventListener('click', () => {
        const newWalletAddress = walletAddressInput.value;
        if (newWalletAddress) {
            walletAddress = newWalletAddress;
            localStorage.setItem('walletAddress', walletAddress);
            updateClaimAndBurnButtons();
        }
    });

    burnRiggedButton.addEventListener('click', () => {
        points = 0;
        updatePoints();
        updateClaimAndBurnButtons();
    });

    claimRiggedButton.addEventListener('click', () => {
        alert('Claiming Rigged tokens...');
        // Integrate your claiming API here
    });

    walletButton.addEventListener('click', () => {
        walletSection.style.display = 'block';
    });

    // Initialize game state
    updateScore();
    updatePoints();
    updateWill();
    updateBoostStatus();
    updateClaimAndBurnButtons();
    updateLeaderboard();
});
