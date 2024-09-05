document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded');

    const characterElement = document.getElementById('character');
    const characterNameElement = document.getElementById('character-name');
    const healthBarElement = document.getElementById('health-bar');
    const healthFillElement = document.getElementById('health-fill');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const scoreElement = document.getElementById('score');
    const pointsElement = document.getElementById('points');
    const willElement = document.getElementById('will');
    const levelElement = document.getElementById('level');
    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const showWalletButton = document.getElementById('show-wallet-button');
    const changeUsernameButton = document.getElementById('change-username-button');
    const leaderboardElement = document.getElementById('leaderboard');
    const walletScreen = document.getElementById('wallet-screen');
    const walletContent = document.getElementById('wallet-content');
    const walletPointsElement = document.getElementById('wallet-points');
    const riggedTokensElement = document.getElementById('rigged-tokens');
    const saveWalletAddressButton = document.getElementById('save-wallet-address');
    const claimRiggedButton = document.getElementById('claim-rigged');
    const burnRiggedButton = document.getElementById('burn-rigged');
    const closeWalletButton = document.getElementById('close-wallet');
    const baseWalletAddressInput = document.getElementById('base-wallet-address');
    const walletAddressErrorElement = document.getElementById('wallet-address-error');

    let score = 0;
    let points = 0;
    let will = 1000;
    let damage = 10;
    let currentHealth = 100;
    let maxHealth = 100;
    let level = 1;
    let character = '😈';

    function updateDisplay() {
        currentHealthElement.textContent = currentHealth;
        maxHealthElement.textContent = maxHealth;
        scoreElement.textContent = score;
        pointsElement.textContent = points;
        willElement.textContent = will;
        levelElement.textContent = level;
        characterElement.textContent = character;
        walletPointsElement.textContent = points;
        riggedTokensElement.textContent = Math.floor(points / 10); // Example conversion rate
    }

    function saveProgress() {
        // Placeholder for Firebase saving logic
        console.log('Progress saved');
    }

    function loadProgress() {
        // Placeholder for Firebase loading logic
        console.log('Progress loaded');
    }

    function handleAttack() {
        if (will > 0) {
            currentHealth -= damage;
            will -= 1;
            if (currentHealth <= 0) {
                score += maxHealth;
                points += maxHealth;
                nextCharacter();
            }
            updateDisplay();
            saveProgress();
        } else {
            alert('Not enough Will!');
        }
    }

    function nextCharacter() {
        level += 1;
        maxHealth += 100; // Example health increment
        currentHealth = maxHealth;
        character = getNextCharacter();
        updateDisplay();
    }

    function getNextCharacter() {
        // Logic to get the next character emoji and name
        return '👹'; // Example
    }

    function replenishWill() {
        if (points >= 100) {
            points -= 100;
            will += 100;
            updateDisplay();
            saveProgress();
        } else {
            alert('Not enough points to replenish Will.');
        }
    }

    function increaseDamage() {
        if (points >= 200) {
            points -= 200;
            damage += 5;
            updateDisplay();
            saveProgress();
        } else {
            alert('Not enough points to increase damage.');
        }
    }

    function showLeaderboard() {
        // Logic to display leaderboard
        leaderboardElement.innerHTML = 'Displaying leaderboard...';
    }

    function showWallet() {
        walletScreen.style.display = 'block';
    }

    function hideWallet() {
        walletScreen.style.display = 'none';
    }

    function changeUsername() {
        const newUsername = prompt('Enter new username:');
        if (newUsername) {
            // Logic to change username in Firebase
            console.log(`Username changed to ${newUsername}`);
        }
    }

    characterElement.addEventListener('click', (event) => {
        if (!event.target.closest('button')) {
            handleAttack();
        }
    });

    replenishWillButton.addEventListener('click', (event) => {
        event.stopPropagation();
        replenishWill();
    });
    
    increaseDamageButton.addEventListener('click', (event) => {
        event.stopPropagation();
        increaseDamage();
    });
    
    showLeaderboardButton.addEventListener('click', (event) => {
        event.stopPropagation();
        showLeaderboard();
    });
    
    showWalletButton.addEventListener('click', (event) => {
        event.stopPropagation();
        showWallet();
    });

    closeWalletButton.addEventListener('click', (event) => {
        event.stopPropagation();
        hideWallet();
    });
    
    changeUsernameButton.addEventListener('click', (event) => {
        event.stopPropagation();
        changeUsername();
    });

    saveWalletAddressButton.addEventListener('click', (event) => {
        event.stopPropagation();
        const walletAddress = baseWalletAddressInput.value;
        if (walletAddress) {
            console.log(`Wallet address saved: ${walletAddress}`);
        } else {
            walletAddressErrorElement.textContent = 'Please enter a valid address.';
        }
    });

    claimRiggedButton.addEventListener('click', (event) => {
        event.stopPropagation();
        console.log('Claiming $RIGGED');
    });

    burnRiggedButton.addEventListener('click', (event) => {
        event.stopPropagation();
        points = 0;
        updateDisplay();
        console.log('$RIGGED burned');
    });

    updateDisplay();
    loadProgress();
});
