document.addEventListener('DOMContentLoaded', (event) => {
    // Firebase configuration
    const firebaseConfig = {
        // Your Firebase config here
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Game elements
    const gameArea = document.getElementById('game-area');
    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const healthFillElement = document.getElementById('health-fill');
    const scoreValue = document.getElementById('score-value');
    const pointsValue = document.getElementById('points-value');
    const willValue = document.getElementById('will-value');
    const levelValue = document.getElementById('level-value');
    const boostButton = document.getElementById('boost-button');
    const boostActiveStatus = document.getElementById('boost-active-status');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardList = document.getElementById('leaderboard-list');
    const playerNameInput = document.getElementById('player-name-input');
    const saveNameButton = document.getElementById('save-name-button');

    // Game variables
    let score = 0;
    let points = 0;
    let will = 1000;
    let level = 1;
    let currentHealth = 100;
    let maxHealth = 100;
    let damagePerClick = 1;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let playerName = "Player1";
    let playerKey = null;

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' },
        { emoji: '🐉', baseHealth: 400, name: 'Dragon' },
        { emoji: '🧙', baseHealth: 500, name: 'Wizard' }
    ];
    let characterIndex = 0;

    function updateDisplay() {
        scoreValue.textContent = score;
        pointsValue.textContent = points;
        willValue.textContent = will;
        levelValue.textContent = level;
        currentHealthElement.textContent = currentHealth;
        maxHealthElement.textContent = maxHealth;
        healthFillElement.style.width = `${(currentHealth / maxHealth) * 100}%`;
        characterElement.textContent = characters[characterIndex].emoji;
        characterNameElement.textContent = characters[characterIndex].name;
    }

    function handleClick() {
        if (will > 0) {
            let damage = damagePerClick * (boostActive ? 2 : 1);
            currentHealth -= damage;
            if (currentHealth < 0) currentHealth = 0;
            score += damage;
            points += damage;
            will -= 1;

            if (boostActive) {
                boostRemainingClicks--;
                if (boostRemainingClicks <= 0) {
                    boostActive = false;
                    boostActiveStatus.textContent = 'No';
                }
            }

            if (currentHealth <= 0) {
                nextCharacter();
            }

            updateDisplay();
            addOrUpdateScoreInLeaderboard(playerName, score);
        }
    }

    function nextCharacter() {
        characterIndex = (characterIndex + 1) % characters.length;
        if (characterIndex === 0) {
            level++;
        }
        maxHealth = characters[characterIndex].baseHealth * level;
        currentHealth = maxHealth;
    }

    function activateBoost() {
        if (points >= 50 && !boostActive) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            boostActiveStatus.textContent = 'Yes';
            updateDisplay();
        }
    }

    function replenishWill() {
        if (points >= 100) {
            points -= 100;
            will = 1000;
            updateDisplay();
        }
    }

    function increaseDamage() {
        if (points >= 200) {
            points -= 200;
            damagePerClick++;
            updateDisplay();
        }
    }

    function toggleLeaderboard() {
        leaderboard.style.display = leaderboard.style.display === 'none' ? 'block' : 'none';
        updateLeaderboard();
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
        database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value', (snapshot) => {
            const leaderboardData = snapshot.val();
            leaderboardList.innerHTML = '';
            Object.values(leaderboardData).sort((a, b) => b.score - a.score).forEach((entry) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${entry.name}: ${entry.score}`;
                leaderboardList.appendChild(listItem);
            });
        });
    }

    function saveName() {
        const newName = playerNameInput.value.trim();
        if (newName && newName !== playerName) {
            playerName = newName;
            addOrUpdateScoreInLeaderboard(playerName, score);
            playerNameInput.value = '';
            updateLeaderboard();
        }
    }

    // Event listeners
    gameArea.addEventListener('click', handleClick);
    boostButton.addEventListener('click', activateBoost);
    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', toggleLeaderboard);
    saveNameButton.addEventListener('click', saveName);

    // Initialize game
    updateDisplay();
    setInterval(() => {
        if (will < 1000) {
            will++;
            updateDisplay();
        }
    }, 1000);
});