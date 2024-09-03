document.addEventListener('DOMContentLoaded', (event) => {
    const attackButton = document.getElementById('attack-button');
    const scoreValue = document.getElementById('score-value');
    const characterElement = document.getElementById('character');
    const boostButton = document.getElementById('boost-button');
    const boostActiveStatus = document.getElementById('boost-active-status');
    const willValue = document.getElementById('will-value');
    const gameContainer = document.getElementById('game-container');

    let score = 0;
    let characterIndex = 0;
    let boostActive = false;
    let boostRemainingClicks = 0;
    let will = 1000;
    let level = 1;

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' }
    ];

    let currentHealth = characters[characterIndex].baseHealth;

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

    // Allow clicking anywhere on the screen to attack
    gameContainer.addEventListener('click', () => {
        if (will > 0) { // Check if the player has enough Will
            if (currentHealth > 0) {
                let pointsToAdd = 10;
                will--; // Reduce Will by 1 for each click
                updateWill();

                if (boostActive) {
                    pointsToAdd *= 2; // Double the points if boost is active
                    boostRemainingClicks--;
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
    });

    boostButton.addEventListener('click', () => {
        if (!boostActive) {
            boostActive = true;
            boostRemainingClicks = 10; // Boost lasts for 10 clicks
            updateBoostStatus();
            alert('Boost activated! Earn double points for the next 10 clicks!');
        }
    });

    // Initialize the game state
    updateCharacter();
    updateBoostStatus();
    updateWill();

    // Set up Will replenishment every second
    setInterval(replenishWill, 1000);
});
