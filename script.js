console.log("Script loaded");

// Firebase configuration remains unchanged

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");

    // Game elements and variables remain unchanged

    // Add a new variable to track ongoing touches
    const ongoingTouches = new Set();

    function updateDisplay() {
        // Existing updateDisplay code remains unchanged
    }

    function handleDamage(amount = 1) {
        if (will > 0) {
            health -= damagePerClick * amount;
            score += damagePerClick * amount;
            points += damagePerClick * amount;
            will -= amount;

            if (health <= 0) {
                nextCharacter();
            }

            updateDisplay();
        }
    }

    function handleClick(event) {
        // Prevent damage when clicking on buttons
        if (event.target.tagName === 'BUTTON') return;
        handleDamage();
    }

    function handleTouchStart(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            ongoingTouches.add(touch.identifier);
        });
        handleDamage(event.changedTouches.length);
    }

    function handleTouchEnd(event) {
        event.preventDefault();
        Array.from(event.changedTouches).forEach(touch => {
            ongoingTouches.delete(touch.identifier);
        });
    }

    function handleTouchMove(event) {
        event.preventDefault();
    }

    // Existing game logic functions remain unchanged

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });

    // Existing button event listeners remain unchanged

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (will > 0 && will < 1000) {
            will++;
            updateDisplay();
        }
    }, 2000);

    console.log("Game initialized");
});