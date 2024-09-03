document.addEventListener('DOMContentLoaded', (event) => {
    // ... Firebase configuration and initialization ...

    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const healthFillElement = document.getElementById('health-fill');
    const levelValueElement = document.getElementById('level-value');
    // ... other element references ...

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

    const characters = [
        { emoji: '😈', baseHealth: 100, name: 'Demon' },
        { emoji: '👹', baseHealth: 200, name: 'Ogre' },
        { emoji: '👽', baseHealth: 300, name: 'Alien' },
        { emoji: '🐉', baseHealth: 400, name: 'Dragon' },
        { emoji: '🧙', baseHealth: 500, name: 'Wizard' }
    ];

    let currentHealth = characters[characterIndex].baseHealth * level;
    let maxHealth = currentHealth;

    function updateCharacter() {
        const character = characters[characterIndex];
        characterElement.textContent = character.emoji;
        characterNameElement.textContent = character.name;
        maxHealth = character.baseHealth * level;
        currentHealth = maxHealth;
        updateHealthDisplay();
    }

    function updateHealthDisplay() {
        currentHealthElement.textContent = currentHealth;
        maxHealthElement.textContent = maxHealth;
        const healthPercentage = (currentHealth / maxHealth) * 100;
        healthFillElement.style.width = `${healthPercentage}%`;
    }

    function handleAttack(numClicks) {
        if (will >= numClicks) {
            if (currentHealth > 0) {
                let damage = 10 * numClicks * damageMultiplier;
                will -= numClicks;
                updateWill();

                if (boostActive) {
                    damage *= 2;
                    boostRemainingClicks -= numClicks;
                    if (boostRemainingClicks <= 0) {
                        boostActive = false;
                        updateBoostStatus();
                    }
                }

                currentHealth -= damage;
                if (currentHealth < 0) currentHealth = 0;
                updateHealthDisplay();

                score += damage;
                points += damage;
                scoreValue.textContent = score;
                updatePoints();
                
                if (currentHealth <= 0) {
                    nextCharacter();
                }
            }
        } else {
            alert('Out of Will! Wait for it to replenish.');
        }
    }

    function nextCharacter() {
        characterIndex = (characterIndex + 1) % characters.length;
        if (characterIndex === 0) {
            level++;
            levelValueElement.textContent = level;
        }
        updateCharacter();
        addOrUpdateScoreInLeaderboard(playerName, score);
    }

    // ... rest of the functions ...

    updateCharacter();
    updateBoostStatus();
    updateWill();
    updatePoints();

    setInterval(replenishWill, 2000);
});