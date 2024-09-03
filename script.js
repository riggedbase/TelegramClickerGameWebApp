document.addEventListener('DOMContentLoaded', (event) => {
    const attackButton = document.getElementById('attack-button');
    const scoreValue = document.getElementById('score-value');
    const characterElement = document.getElementById('character');
    const boostButton = document.getElementById('boost-button');
    const boostActiveStatus = document.getElementById('boost-active-status');

    let score = 0;
    let characterIndex = 0;
    let boostActive = false;
    let boostRemainingClicks = 0;

    const characters = [
        { emoji: '😈', health: 100, name: 'Demon' },
        { emoji: '👹', health: 200, name: 'Ogre' },
        { emoji: '👽', health: 300, name: 'Alien' }
    ];

    let currentHealth = characters[characterIndex].health;

    function updateCharacter() {
        characterElement.textContent = characters[characterIndex].emoji;
    }

    function updateBoostStatus() {
        boostActiveStatus.textContent = boostActive ? 'Yes' : 'No';
        boostActiveStatus.style.color = boostActive ? 'green' : 'red';
    }

    attackButton.addEventListener('click', () => {
        if (currentHealth > 0) {
            let pointsToAdd = 10;

            if (boostActive) {
                pointsToAdd *= 2;  // Double the points if boost is active
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
            characterIndex++;
            if (characterIndex < characters.length) {
                currentHealth = characters[characterIndex].health;
                updateCharacter();
            } else {
                alert('Congratulations! You have defeated all characters!');
                updateLeaderboard(); // Assuming you have the leaderboard function implemented
            }
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
});
