document.addEventListener('DOMContentLoaded', (event) => {
    const attackButton = document.getElementById('attack-button');
    const scoreValue = document.getElementById('score-value');
    const characterElement = document.getElementById('character');

    let score = 0;
    let characterIndex = 0;

    const characters = [
        { emoji: '😈', health: 100, name: 'Demon' },
        { emoji: '👹', health: 200, name: 'Ogre' },
        { emoji: '👽', health: 300, name: 'Alien' }
    ];

    let currentHealth = characters[characterIndex].health;

    function updateCharacter() {
        characterElement.textContent = characters[characterIndex].emoji;
    }

    attackButton.addEventListener('click', () => {
        if (currentHealth > 0) {
            currentHealth -= 10;
            score += 10;
            scoreValue.textContent = score;
        } else {
            // Move to the next character
            characterIndex++;
            if (characterIndex < characters.length) {
                currentHealth = characters[characterIndex].health;
                updateCharacter();
            } else {
                alert('Congratulations! You have defeated all characters!');
            }
        }
    });

    // Initialize the first character
    updateCharacter();
});
