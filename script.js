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

    // ... (previous code remains the same)

    // Wallet input handling
    let walletInputBuffer = '';

    function handleWalletInput(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const input = e.data || e.inputType;
        if (input === 'deleteContentBackward') {
            walletInputBuffer = walletInputBuffer.slice(0, -1);
        } else if (input && walletInputBuffer.length < 42) {
            walletInputBuffer += input;
        }
        
        baseWalletAddressInput.value = walletInputBuffer;
    }

    function saveWalletAddress(event) {
        event.preventDefault();
        event.stopPropagation();
        const newAddress = walletInputBuffer;
        if (validateWalletAddress(newAddress)) {
            baseWalletAddress = newAddress;
            console.log("Base wallet address saved:", baseWalletAddress);
            updateWalletDisplay();
            walletAddressError.textContent = 'Wallet address saved successfully!';
            walletAddressError.style.color = 'green';
        }
    }

    function validateWalletAddress(address) {
        if (address.length === 42 || address.endsWith('.eth')) {
            walletAddressError.textContent = '';
            return true;
        } else {
            walletAddressError.textContent = 'Address should be 42 characters long or an ENS name ending with .eth';
            walletAddressError.style.color = 'red';
            return false;
        }
    }

    // ... (rest of the functions remain the same)

    // Event listeners
    document.body.addEventListener('click', handleClick);
    document.body.addEventListener('touchstart', handleTouch, { passive: false });
    document.body.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    replenishWillButton.addEventListener('click', replenishWill);
    increaseDamageButton.addEventListener('click', increaseDamage);
    showLeaderboardButton.addEventListener('click', showLeaderboard);
    showWalletButton.addEventListener('click', showWallet);
    closeWalletButton.addEventListener('click', closeWallet);
    saveWalletAddressButton.addEventListener('click', saveWalletAddress);
    claimRiggedButton.addEventListener('click', claimRigged);
    burnRiggedButton.addEventListener('click', burnRigged);

    // Prevent event propagation for wallet screen elements
    if (walletScreen) {
        walletScreen.addEventListener('click', (e) => e.stopPropagation());
        walletScreen.addEventListener('touchstart', (e) => e.stopPropagation());
    }

    // Handle wallet input separately
    if (baseWalletAddressInput) {
        baseWalletAddressInput.addEventListener('input', handleWalletInput);
        baseWalletAddressInput.addEventListener('keydown', (e) => e.stopPropagation());
        baseWalletAddressInput.addEventListener('click', (e) => e.stopPropagation());
        baseWalletAddressInput.addEventListener('touchstart', (e) => e.stopPropagation());
    }

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