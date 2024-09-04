console.log("Script loaded");

// Firebase configuration
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM fully loaded");

    // Game elements and variables remain unchanged

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

    function handleTouch(event) {
        event.preventDefault();
        handleDamage(event.touches.length);
    }

    // Existing game logic functions remain unchanged

    // Event listeners
    gameContainer.addEventListener('click', handleClick);
    gameContainer.addEventListener('touchstart', handleTouch, { passive: false });
    gameContainer.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    showWalletButton.addEventListener('click', showWallet);
    closeWalletButton.addEventListener('click', closeWallet);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);

    // Initialize game
    updateDisplay();

    // Will replenishment
    setInterval(() => {
        if (will < 1000) {
            will++;
            updateDisplay();
        }
    }, 2000);

    console.log("Game initialized");
});