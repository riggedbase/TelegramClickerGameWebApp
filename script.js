document.addEventListener('DOMContentLoaded', (event) => {
    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const healthFillElement = document.getElementById('health-fill');
    const scoreValue = document.getElementById('score-value');
    const pointsValue = document.getElementById('points-value');
    const willValue = document.getElementById('will-value');
    const levelValue = document.getElementById('level-value');
    const attackButton = document.getElementById('attack-button');

    let score = 0;
    let points = 0;
    let will = 1000;
    let level = 1;
    let currentHealth = 100;
    let maxHealth = 100;

    function updateDisplay() {
        scoreValue.textContent = score;
        pointsValue.textContent = points;
        willValue.textContent = will;
        levelValue.textContent = level;
        currentHealthElement.textContent = currentHealth;
        maxHealthElement.textContent = maxHealth;
        healthFillElement.style.width = `${(currentHealth / maxHealth) * 100}%`;
    }

    attackButton.addEventListener('click', () => {
        if (will > 0) {
            currentHealth -= 10;
            if (currentHealth < 0) currentHealth = 0;
            score += 10;
            points += 10;
            will -= 1;
            updateDisplay();
        }
    });

    updateDisplay();
});