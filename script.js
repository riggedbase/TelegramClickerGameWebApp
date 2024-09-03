document.addEventListener('DOMContentLoaded', (event) => {
    // ... (previous code remains the same)

    let score = 0;
    let points = 0;
    // ... (other variables)

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
                
                // Update leaderboard score in real-time
                addOrUpdateScoreInLeaderboard(playerName, score);
                
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
        // Remove this line as we're now updating the score in real-time
        // addOrUpdateScoreInLeaderboard(playerName, score);
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

    saveNameButton.addEventListener('click', () => {
        const newName = playerNameInput.value.trim();
        if (newName && newName !== playerName) {
            playerName = newName;
            if (playerKey) {
                database.ref('leaderboard/' + playerKey).update({ name: playerName, score: score });
            } else {
                addOrUpdateScoreInLeaderboard(playerName, score);
            }
            alert('Name updated successfully!');
            playerNameInput.value = '';
            nameChangeContainer.style.display = 'none';
            updateLeaderboard();
        }
    });

    // ... (rest of the code remains the same)
});