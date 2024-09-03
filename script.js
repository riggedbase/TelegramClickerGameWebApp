document.addEventListener('DOMContentLoaded', (event) => {
    // Firebase configuration
    const firebaseConfig = {
        // Your Firebase config here
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Game elements
    const characterImg = document.getElementById('character');
    const characterName = document.getElementById('character-name');
    const healthFill = document.getElementById('health-fill');
    const currentHealth = document.getElementById('current-health');
    const maxHealth = document.getElementById('max-health');
    const attackButton = document.getElementById('attack-button');
    const scoreElement = document.getElementById('score');
    const pointsElement = document.getElementById('points');
    const willElement = document.getElementById('will');
    const levelElement = document.getElementById('level');
    const boostButton = document.getElementById('boost-button');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');

    // Game variables
    let score = 400;
    let points = 400;
    let will = 960;
    let level = 1;
    let health = 100;
    let maxHealthValue = 100;
    let damagePerClick = 1;
    let boostActive = false;
    let boostRemainingClicks = 0;

    const characters = [
        { image: 'demon.png', baseHealth: 100, name: 'Demon' },
        { image: 'ogre.png', baseHealth: 200, name: 'Ogre' },
        { image: 'alien.png', baseHealth: 300, name: 'Alien' },
        { image: 'dragon.png', baseHealth: 400, name: 'Dragon' },
        { image: 'wizard.png', baseHealth: 500, name: 'Wizard' }
    ];
    let characterIndex = 0;

    function updateDisplay() {
        characterImg.src = characters[characterIndex].image;
        characterName.textContent = characters[characterIndex].name;
        currentHealth.textContent = health;
        maxHealth.textContent = maxHealthValue;
        healthFill.style.width = `${(health / maxHealthValue) * 100}%`;
        scoreElement.textContent = score;
        pointsElement.textContent = points;
        willElement.textContent = will;
        levelElement.textContent = level;
    }

    function handleAttack() {
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
            // Uncomment the next line when Firebase is set up
            // addOrUpdateScoreInLeaderboard(playerName, score);
        }
    }

    function nextCharacter() {
        characterIndex = (characterIndex + 1) % characters.length;
        if (characterIndex === 0) {
            level++;
        }
        maxHealthValue = characters[characterIndex].baseHealth * level;
        health = maxHealthValue;
    }

    function activateBoost() {
        if (points >= 50 && !boostActive) {
            points -= 50;
            boostActive = true;
            boostRemainingClicks = 10;
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

    function showLeaderboard() {
        console.log("Show leaderboard clicked");
        // Implement leaderboard functionality here
    }

    // Event listeners
    attackButton.addEventListener('click', handleAttack);
    boostButton.addEventListener('click', activateBoost);
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
});