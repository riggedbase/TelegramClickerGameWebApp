console.log("Script loaded");

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");

    const gameContainer = document.getElementById('game-container');
    const characterElement = document.getElementById('character');
    const scoreElement = document.getElementById('score');
    
    let score = 0;

    function handleClick() {
        console.log("Click handled");
        score += 1;
        scoreElement.textContent = score;
    }

    if (gameContainer) {
        gameContainer.addEventListener('click', handleClick);
    } else {
        console.log("Game container not found");
    }

    console.log("Game initialized");
});