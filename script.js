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
    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const healthFill = document.getElementById('health-fill');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const scoreElement = document.getElementById('score');
    const pointsElement = document.getElementById('points');
    const willElement = document.getElementById('will');
    const levelElement = document.getElementById('level');
    const boostButton = document.getElementById('boost-button');
    const boostActiveElement = document.getElementById('boost-active');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');

    // Log which elements were not found
    console.log("Elements not found:", {
        characterElement: !characterElement,
        characterNameElement: !characterNameElement,
        healthFill: !healthFill,
        currentHealthElement: !currentHealthElement,
        maxHealthElement: !maxHealthElement,
        scoreElement: !scoreElement,
        pointsElement: !pointsElement,
        willElement: !willElement,
        levelElement: !levelElement,
        boostButton: !boostButton,
        boostActiveElement: !boostActiveElement,
        replenishWillButton: !replenishWillButton,
        increaseDamageButton: !increaseDamageButton,
        showLeaderboardButton: !showLeaderboardButton
    });

    // Game variables
    let score = 0;
    let points = 0;
    let will = 1000;
    let level = 1;
    let health = 100;
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
        console.log("Updating display");
        if (characterElement) characterElement.textContent = characters[characterIndex].emoji;
        if (characterNameElement) characterNameElement.textContent = characters[characterIndex].name;
        if (currentHealthElement) currentHealthElement.textContent = health;
        if (maxHealthElement) maxHealthElement.textContent = maxHealth;
        if (healthFill) healthFill.style.width = `${(health / maxHealth) * 100}%`;
        if (scoreElement) scoreElement.textContent = score;
        if (pointsElement) pointsElement.textContent = points;
        if (willElement) willElement.textContent = will;
        if (levelElement) levelElement.textContent = level;
        if (boostActiveElement) boostActiveElement.textContent = boostActive ? 'Yes' : 'No';
    }

    function handleClick() {
        console.log("Click handled");
        if (will > 0) {
            let damage = damagePerClick * (boostActive ? 2 : 1);
            health -= damage;
            score += damage;
            points += damage;
            will -= 1;

            if (boostActive) {
                boostRemainingClicks--;
                if (boostRemainingClicks <= 0) {
                    boostActive = false;
                }
            }

            if (health <= 0) {
                nextCharacter();
            }

            updateDisplay();
            addOrUpdateScoreInLeaderboard(playerName, score);
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

    function activateBoost() {
        console.log("Activating boost");
        if (points >= 50 && !boostActive) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
            updateDisplay();
        }
    }

    function replenishWill() {
        console.log("Replenishing will");
        if (points >= 100) {
            points -= 100;
            will = 1000;
            updateDisplay();
        }
    }

    function increaseDamage() {
        console.log("Increasing damage");
        if (points >= 200) {
            points -= 200;
            damagePerClick++;
            updateDisplay();
        }
    }

    function addOrUpdateScoreInLeaderboard(name, score) {
        console.log("Updating leaderboard");
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
        const leaderboardElement = document.getElementById('leaderboard');
        if (leaderboardElement) {
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
            });
        } else {
            console.log("Leaderboard element not found");
        }
    }

    // Event listeners
    if (document.getElementById('game-container')) {
        document.getElementById('game-container').addEventListener('click', handleClick);
    } else {
        console.log("Game container not found");
    }
    if (boostButton) boostButton.addEventListener('click', (e) => {
        e.stopPropagation();
        activateBoost();
    });
    if (replenishWillButton) replenishWillButton.addEventListener('click', (e) => {
        e.stopPropagation();
        replenishWill();
    });
    if (increaseDamageButton) increaseDamageButton.addEventListener('click', (e) => {
        e.stopPropagation();
        increaseDamage();
    });
    if (showLeaderboardButton) showLeaderboardButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showLeaderboard();
    });

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (will < 1000) {
            will++;
            updateDisplay();
        }
    }, 1000);
});