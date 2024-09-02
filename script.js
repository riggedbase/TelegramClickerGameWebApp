document.addEventListener('DOMContentLoaded', (event) => {
    const attackButton = document.getElementById('attack-button');
    const scoreValue = document.getElementById('score-value');
    let score = 0;

    attackButton.addEventListener('click', () => {
        score += 10;
        scoreValue.textContent = score;
    });
});
