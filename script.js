document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");

    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyA7k-CcnTG4X2sEfDdbSS8OuQPbdL-mBvI",
        authDomain: "rigged-clicker-game-1.firebaseapp.com",
        projectId: "rigged-clicker-game-1",
        storageBucket: "rigged-clicker-game-1.appspot.com",
        messagingSenderId: "492830453182",
        appId: "1:492830453182:web:3050eafa48fea21e145def",
        measurementId: "G-NNKC4YWY5R",
        databaseURL: "https://rigged-clicker-game-1-default-rtdb.firebaseio.com"
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    // Game state variables
    let score = 0;
    let points = 0;
    let will = 1000;
    let level = 1;
    let maxHealth = 100;
    let currentHealth = maxHealth;
    let damage = 10;
    let riggedTokens = 0;
    let baseWalletAddress = "";
    let username = generateRandomUsername();
    let telegramID = "web_" + Math.random().toString(36).substr(2, 9);

    // Telegram Integration
    if (window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        telegramID = "telegram_" + window.Telegram.WebApp.initDataUnsafe.user.id;
        username = window.Telegram.WebApp.initDataUnsafe.user.username;
    }

    // UI Elements
    const characterElement = document.getElementById('character');
    const healthFillElement = document.getElementById('health-fill');
    const currentHealthElement = document.getElementById('current-health');
    const maxHealthElement = document.getElementById('max-health');
    const scoreElement = document.getElementById('score');
    const pointsElement = document.getElementById('points');
    const willElement = document.getElementById('will');
    const levelElement = document.getElementById('level');
    const walletPointsElement = document.getElementById('wallet-points');
    const riggedTokensElement = document.getElementById('rigged-tokens');
    const baseWalletAddressElement = document.getElementById('base-wallet-address');
    const leaderboardElement = document.getElementById('leaderboard');

    const replenishWillButton = document.getElementById('replenish-will-button');
    const increaseDamageButton = document.getElementById('increase-damage-button');
    const showLeaderboardButton = document.getElementById('show-leaderboard-button');
    const showWalletButton = document.getElementById('show-wallet-button');
    const claimRiggedButton = document.getElementById('claim-rigged');
    const burnRiggedButton = document.getElementById('burn-rigged');
    const saveWalletAddressButton = document.getElementById('save-wallet-address');
    const closeWalletButton = document.getElementById('close-wallet');
    const changeUsernameButton = document.getElementById('change-username-button');

    // Functions
    function updateDisplay() {
        scoreElement.textContent = score;
        pointsElement.textContent = points;
        willElement.textContent = will;
        levelElement.textContent = level;
        currentHealthElement.textContent = currentHealth;
        maxHealthElement.textContent = maxHealth;
        walletPointsElement.textContent = points;
        riggedTokensElement.textContent = riggedTokens;
        healthFillElement.style.width = `${(currentHealth / maxHealth) * 100}%`;
    }

    function handleAttack() {
        if (will <= 0) return;
        will--;
        currentHealth -= damage;
        score += damage;
        points += damage;

        if (currentHealth <= 0) {
            nextCharacter();
        }

        updateDisplay();
    }

    function nextCharacter() {
        level++;
        maxHealth += 50;
        currentHealth = maxHealth;
        updateDisplay();
    }

    function increaseDamage() {
        if (points >= 200) {
            points -= 200;
            damage += 10;
            updateDisplay();
        }
    }

    function replenishWill() {
        if (points >= 100) {
            points -= 100;
            will += 50;
            updateDisplay();
        }
    }

    function claimRigged() {
        alert(`Claiming ${points} $RIGGED tokens.`);
        riggedTokens += points;
        points = 0;
        updateDisplay();
    }

    function burnRigged() {
        alert(`Burning ${riggedTokens} $RIGGED tokens.`);
        riggedTokens = 0;
        updateDisplay();
    }

    function saveWalletAddress() {
        baseWalletAddress = baseWalletAddressElement.value;
        alert(`Wallet address saved: ${baseWalletAddress}`);
    }

    function changeUsername() {
        username = document.getElementById('username-input').value;
        alert(`Username changed to: ${username}`);
    }

    function clearLeaderboard() {
        leaderboardElement.innerHTML = ''; // Clears the leaderboard display
        database.ref('leaderboard').remove();
    }

    function generateRandomUsername() {
        return 'Player' + Math.floor(Math.random() * 10000);
    }

    // Firebase operations
    function saveProgress() {
        const userData = {
            username: username,
            score: score,
            points: points,
            level: level,
            riggedTokens: riggedTokens,
            baseWalletAddress: baseWalletAddress
        };
        database.ref('users/' + telegramID).set(userData);
    }

    function loadProgress() {
        database.ref('users/' + telegramID).once('value').then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                score = data.score || 0;
                points = data.points || 0;
                level = data.level || 1;
                riggedTokens = data.riggedTokens || 0;
                baseWalletAddress = data.baseWalletAddress || "";
                username = data.username || generateRandomUsername();
                updateDisplay();
            }
        }).catch((error) => {
            console.error("Error loading progress:", error);
        });
    }

    function updateLeaderboard() {
        database.ref('leaderboard').orderByChild('score').limitToLast(10).once('value').then((snapshot) => {
            leaderboardElement.innerHTML = '';
            snapshot.forEach((childSnapshot) => {
                const entry = childSnapshot.val();
                const entryElement = document.createElement('div');
                entryElement.textContent = `${entry.username}: ${entry.score}`;
                leaderboardElement.appendChild(entryElement);
            });
        });
    }

    // Event listeners
    characterElement.addEventListener('click', handleAttack);
    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', updateLeaderboard);
    showWalletButton.addEventListener('click', () => document.getElementById('wallet-screen').style.display = 'block');
    closeWalletButton.addEventListener('click', () => document.getElementById('wallet-screen').style.display = 'none');
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    changeUsernameButton.addEventListener('click', changeUsername);
    document.getElementById('clear-leaderboard-button').addEventListener('click', clearLeaderboard);

    // Initialize game
    loadProgress();
    updateDisplay();
});
