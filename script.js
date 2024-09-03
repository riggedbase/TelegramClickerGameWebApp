document.addEventListener('DOMContentLoaded', (event) => {
    const scoreValue = document.getElementById('score-value');
    const characterElement = document.getElementById('character');
    const boostButton = document.getElementById('boost-button');
    const boostActiveStatus = document.getElementById('boost-active-status');
    const willValue = document.getElementById('will-value');
    const gameContainer = document.getElementById('game-container');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');

    let score = 0;
    let characterIndex = 0;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let will = 1000;
    let level = 1;
    let touchInProgress = false; // Track touch status to avoid double taps
    let damageMultiplier = 1; // Variable to increase damage with boosters

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' }
    ];

    let currentHealth = characters[characterIndex].baseHealth * level;

    function updateCharacter() {
        characterElement.textContent = characters[characterIndex].emoji;
        currentHealth = characters[characterIndex].baseHealth * level; // Increase health by level
    }

    function updateBoostStatus() {
        boostActiveStatus.textContent = boostActive ? 'Yes' : 'No';
        boostActiveStatus.style.color = boostActive ? 'green' : 'red';
    }

    function updateWill() {
        willValue.textContent = will;
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
            level = 30; // Cap the level at 30
        } else {
            characterIndex = (characterIndex + 1) % characters.length; // Loop through characters
            updateCharacter();
        }
    }

    function handleAttack(numClicks) {
        if (will >= numClicks) { // Check if the player has enough Will for all clicks
            if (currentHealth > 0) {
                let pointsToAdd = 10 * numClicks * damageMultiplier; // Apply damage multiplier
                will -= numClicks; // Reduce Will by the number of clicks
                updateWill();

                if (boostActive) {
                    pointsToAdd *= 2;  // Double the points if boost is active
                    boostRemainingClicks -= numClicks; // Reduce boost clicks
                    if (boostRemainingClicks <= 0) {
                        boostActive = false;
                        updateBoostStatus();
                    }
                }

                currentHealth -= pointsToAdd;
                score += pointsToAdd;
                scoreValue.textContent = score;
            } else {
                nextLevel();
            }
        } else {
            alert('Out of Will! Wait for it to replenish.');
        }
    }

    // Detect if the device is mobile
    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobileDevice) {
        // Disable the click event on mobile devices
        gameContainer.removeEventListener('click', handleAttack);
    }

    gameContainer.addEventListener('touchstart', (event) => {
        if (!touchInProgress) { // Check if a touch is already in progress
            touchInProgress = true; // Set flag to indicate touch is in progress
            const numTouches = event.changedTouches.length; // Correctly counts number of new touches
            handleAttack(numTouches);
        }
    });

    gameContainer.addEventListener('touchend', (event) => {
        touchInProgress = false; // Reset the flag when touch ends
    });

    gameContainer.addEventListener('touchcancel', (event) => {
        touchInProgress = false; // Reset the flag if touch is cancelled
    });

    gameContainer.addEventListener('touchmove', (event) => {
        touchInProgress = false; // Reset the flag if touch moves
    });

    // For mouse click support (e.g., on desktop)
    if (!isMobileDevice) {
        gameContainer.addEventListener('click', () => {
            handleAttack(1); // Single click counts as one attack
        });
    }

    // Update all button click handlers to prevent event propagation
    boostButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating
        if (!boostActive) {
            boostActive = true;
            boostRemainingClicks = 10; // Boost lasts for 10 clicks
            updateBoostStatus();
            alert('Boost activated! Earn double points for the next 10 clicks!');
        }
    });

    replenishWillButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating
        if (score >= 100) {
            score -= 100;
            will = 1000;
            updateWill();
            scoreValue.textContent = score;
            alert('Will replenished to 1000!');
        } else {
            alert('Not enough points to replenish Will!');
        }
    });

    increaseDamageButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating
        if (score >= 200) {
            score -= 200;
            damageMultiplier = 2; // Increase damage by 2x
            scoreValue.textContent = score;
            alert('Damage increased by 2x for the next level!');
        } else {
            alert('Not enough points to increase damage!');
        }
    });

    // Show leaderboard when button is clicked
    showLeaderboardButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the click from propagating
        leaderboard.style.display = 'block'; // Show leaderboard
        updateLeaderboard(); // Fetch and display leaderboard data
    });

    // Initialize Firebase with your configuration
    const firebaseConfig = {
        apiKey: "AIzaSyA7k-CcnTG4X2sEfDdbSS8OuQPbdL-mBvI",
        authDomain: "rigged-clicker-game-1.firebaseapp.com",
        projectId: "rigged-clicker-game-1",
        storageBucket: "rigged-clicker-game-1.appspot.com",
        messagingSenderId: "492830453182",
        appId: "1:492830453182:web:3050eafa48fea21e145def",
        measurementId: "G-NNKC4YWY5R"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Function to update leaderboard
    function updateLeaderboard() {
        const leaderboardRef = database.ref('leaderboard');
        leaderboardRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            console.log('Fetched leaderboard data:', leaderboardData); // Log fetched data

            if (leaderboardData) {
                const sortedLeaderboard = [];
                for (const id in leaderboardData) {
                    sortedLeaderboard.push(leaderboardData[id]);
                }
                sortedLeaderboard.sort((a, b) => b.score - a.score);
                leaderboardList.innerHTML = ''; // Clear the leaderboard list
                sortedLeaderboard.forEach((entry) => {
                    const listItem = document.createElement('li');
                    listItem.textContent = `${entry.name}: ${entry.score}`;
                    leaderboardList.appendChild(listItem);
                });
            } else {
                leaderboardList.innerHTML = '<li>No scores available</li>'; // Display a message if no data
            }
        }, (error) => {
            console.error('Error fetching leaderboard data:', error);
        });
    }

    // Function to add player score to leaderboard
    function addScoreToLeaderboard(playerName, playerScore) {
        const leaderboardRef = database.ref('leaderboard');
        const newEntryRef = leaderboardRef.push();
        newEntryRef.set({
            name: playerName,
            score: playerScore
        }).then(() => {
            console.log(`Score added to Firebase for ${playerName}: ${playerScore}`);
        }).catch((error) => {
            console.error('Error adding score to Firebase:', error);
        });
    }

    // Example: Add Score and Update Leaderboard
    function finishLevel() {
        const playerName = "Player1"; // Placeholder for player name or ID
        addScoreToLeaderboard(playerName, score); // Add score when level is finished
        score = 0; // Reset score for new level (if desired)
        updateLeaderboard(); // Update leaderboard immediately
    }

    // Example function to call when player completes a level
    function nextLevel() {
        level++;
        if (level > 30) {
            alert('Congratulations! You have completed all 30 levels!');
            level = 30; // Cap the level at 30
        } else {
            characterIndex = (characterIndex + 1) % characters.length; // Loop through characters
            updateCharacter();
            finishLevel(); // Call finishLevel to update leaderboard
        }
    }

    // Initialize the game state
    updateCharacter();
    updateBoostStatus();
    updateWill();

    // Set up Will replenishment every two seconds (2000 milliseconds)
    setInterval(replenishWill, 2000);
});
