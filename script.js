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
    }

    function handleClick() {
        console.log("Click handled");
        if (will > 0) {
            let damage = damagePerClick;
            health -= damage;
            score += damage;
            points += damage;
            will -= 1;

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

    function replenishWill(event) {
        event.stopPropagation(); // Prevent the click from bubbling up to the game container
        console.log("Replenishing will");
        if (points >= 100) {
            points -= 100;
            will = 1000;
            updateDisplay();
            console.log("Will replenished to 1000");
        } else {
            console.log("Not enough points to replenish will");
        }
    }

    function increaseDamage(event) {
        event.stopPropagation(); // Prevent the click from bubbling up to the game container
        console.log("Increasing damage");
        if (points >= 200) {
            points -= 200;
            damagePerClick *= 2; // Double the damage
            updateDisplay();
            console.log("Damage increased. New damage per click:", damagePerClick);
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

    function showLeaderboard(event) {
        event.stopPropagation(); // Prevent the click from bubbling up to the game container
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

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (will < 1000) {
            will++;
            updateDisplay();
        }
    }, 1000);

    console.log("Game initialized");
});