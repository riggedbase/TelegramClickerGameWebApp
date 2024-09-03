document.addEventListener('DOMContentLoaded', (event) => {
    // Firebase configuration object
    const firebaseConfig = {
        apiKey: "AIzaSyA7k-CcnTG4X2sEfDdbSS8OuQPbdL-mBvI",
        authDomain: "rigged-clicker-game-1.firebaseapp.com",
        databaseURL: "https://rigged-clicker-game-1.firebaseio.com",
        projectId: "rigged-clicker-game-1",
        storageBucket: "rigged-clicker-game-1.appspot.com",
        messagingSenderId: "492830453182",
        appId: "1:492830453182:web:3050eafa48fea21e145def",
        measurementId: "G-NNKC4YWY5R"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Reference to the Firebase Realtime Database
    const database = firebase.database();  // Make sure this is after firebase.initializeApp

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
    const playerNameInput = document.getElementById('player-name-input');
    const saveNameButton = document.getElementById('save-name-button');
    const nameChangeContainer = document.getElementById('name-change-container');

    let score = 0;
    let characterIndex = 0;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let will = 1000;
    let level = 1;
    let touchInProgress = false;
    let damageMultiplier = 1;
    let playerName = "Player1"; // Default player name

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
                score += pointsToAdd;
                scoreValue.textContent = score;
            } else {
                nextLevel();
            }
        } else {
            alert('Out of Will! Wait for it to replenish.');
        }
    }

    const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobileDevice) {
        gameContainer.removeEventListener('click', handleAttack);
    }

    gameContainer.addEventListener('touchstart', (event) => {
        if (!touchInProgress) { 
            touchInProgress = true; 
            const numTouches = event.changedTouches.length; 
            handleAttack(numTouches);
        }
    });

    gameContainer.addEventListener('touchend', (event) => {
        touchInProgress = false;
    });

    gameContainer.addEventListener('touchcancel', (event) => {
        touchInProgress = false;
    });

    gameContainer.addEventListener('touchmove', (event) => {
        touchInProgress = false;
    });

    if (!isMobileDevice) {
        gameContainer.addEventListener('click', () => {
            handleAttack(1); 
        });
    }

    boostButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        if (!boostActive) {
            boostActive = true;
            boostRemainingClicks = 10; 
            updateBoostStatus();
            alert('Boost activated! Earn double points for the next 10 clicks!');
        }
    });

    replenishWillButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
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
        event.stopPropagation(); 
        if (score >= 200) {
            score -= 200;
            damageMultiplier += 1;
            scoreValue.textContent = score;
            alert('Damage increased!');
        } else {
            alert('Not enough points to increase damage!');
        }
    });

    showLeaderboardButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        leaderboard.style.display = 'block';
        nameChangeContainer.style.display = 'block'; // Show the name change input and button
        updateLeaderboard();
    });

    saveNameButton.addEventListener('click', (event) => {
        event.stopPropagation(); 
        const newName = playerNameInput.value.trim();
        if (newName) {
            playerName = newName;
            alert(`Player name updated to: ${playerName}`);
        } else {
            alert('Please enter a valid name.');
        }
    });

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

    function updateLeaderboard() {
        const leaderboardRef = database.ref('leaderboard');
        leaderboardRef.orderByChild('score').limitToLast(10).on('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            console.log('Fetched leaderboard data:', leaderboardData); 

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

    setInterval(replenishWill, 2000);
});
