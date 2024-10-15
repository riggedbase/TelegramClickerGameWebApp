console.log("Script starting to load");

// Retry Firebase connection function
function retryFirebaseConnection(attempts = 3) {
    let retries = 0;
    const interval = setInterval(() => {
        // If max attempts reached, stop retrying
        if (retries >= attempts) {
            clearInterval(interval);
            console.error("Firebase connection failed after multiple attempts.");
            alert("Failed to connect to Firebase. Please check your internet connection and try again.");
            return;
        }

        // Check Firebase database connectivity status
        if (firebase && firebase.database && firebase.database().ref('.info/connected')) {
            firebase.database().ref('.info/connected').on('value', (snap) => {
                if (snap.val() === true) {
                    clearInterval(interval);
                    console.log("Firebase connected successfully.");
                } else {
                    console.log("Firebase not connected yet, retrying...");
                }
            });
        } else {
            console.log("Retrying Firebase initialization...");
            initializeFirebase();  // Ensure initialization is retried
        }

        retries++;
    }, 3000);  // Retry every 3 seconds
}

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

let database;

// Initialize Firebase and ensure the database is properly initialized
function initializeFirebase() {
    try {
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        console.log("Firebase initialized successfully");

        // Test Firebase connection
        database.ref('.info/connected').on('value', function (snap) {
            if (snap.val() === true) {
                console.log("Connected to Firebase");
            } else {
                console.log("Not connected to Firebase, retrying connection...");
                retryFirebaseConnection();
            }
        });

        // Simplified authentication using Telegram User ID
        if (telegramUserId) {
            firebase.auth().signInAnonymously()
                .then(() => {
                    console.log("Signed in anonymously with Telegram ID:", telegramUserId);
                    loadOrInitializeUser(telegramUserId);
                })
                .catch((error) => {
                    console.error("Error during anonymous sign-in:", error);
                    alert("Failed to sign in. Please try again.");
                });
        } else {
            console.error("Telegram User ID not available, unable to sign in");
            alert("Telegram User ID not available. Please ensure you are running this within Telegram.");
        }

    } catch (error) {
        console.error("Error initializing Firebase:", error);
        alert("There was an error initializing the game. Please try refreshing the page.");
    }
}

// Ensure Firebase initialization happens before loading progress
document.addEventListener('DOMContentLoaded', function () {
    initializeFirebase();
});

function loadOrInitializeUser(firebaseUid) {
    console.log("Loading or initializing user for Firebase UID:", firebaseUid);

    const userRef = database.ref('users/' + firebaseUid);

    userRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        
        // Check if the telegramUserId is already mapped
        if (data && data.telegramUserId === telegramUserId) {
            console.log("Mapping found. Loading user data...");
            loadProgress(firebaseUid); // Load progress if mapping is correct
        } else {
            // Check if any user with the telegramUserId already exists
            database.ref('users').orderByChild('telegramUserId').equalTo(telegramUserId).once('value')
                .then((snapshot) => {
                    if (snapshot.exists()) {
                        // Get the existing Firebase UID for the Telegram ID
                        const existingUid = Object.keys(snapshot.val())[0];
                        console.log("Existing Telegram mapping found for UID:", existingUid);
                        loadProgress(existingUid); // Load the data for the existing UID
                    } else {
                        console.log("No existing mapping found. Mapping telegramUserId to Firebase UID.");
                        userRef.set({
                            telegramUserId: telegramUserId,
                            displayName: generateRandomUsername(),
                            score: 0,
                            credits: 0,
                            will: 1000,
                            level: 1,
                            health: 100,
                            maxHealth: 100,
                            damagePerClick: 1,
                            replenishWillCost: 100,
                            increaseDamageCost: 200,
                            baseWalletAddress: '',
                            riggedTokens: 0,
                            pointsAtLastBurn: 0,
                            characterIndex: 0,
                            totalClaimed: 0,
                            totalBurned: 0
                        }).then(() => {
                            console.log("User mapping and initialization complete");
                            loadProgress(firebaseUid);  // Now load the initialized progress
                        }).catch(error => {
                            console.error("Error initializing user:", error);
                        });
                    }
                }).catch(error => {
                    console.error("Error checking for existing Telegram ID:", error);
                });
        }
    }).catch(error => {
        console.error("Error loading user mapping:", error);
    });
}

function checkElementVisibility(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top >= 0 && rect.left >= 0 && 
                          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                          rect.right <= (window.innerWidth || document.documentElement.clientWidth);
        console.log(`${elementId} visibility:`, isVisible, 'Position:', rect);
    } else {
        console.log(`${elementId} not found in DOM`);
    }
}

let telegramUserId = null;
let displayName = null;
let isWalletValid = false; // Track wallet validation status
let lastViewportWidth = window.innerWidth;
let lastViewportHeight = window.innerHeight;
let lastWillUpdateTime = Date.now();
let lastWillReplenishTime = Date.now();
const WILL_REPLENISH_INTERVAL = 2000; // 2 seconds in milliseconds

console.log("Checking for Telegram WebApp...");
if (window.Telegram && window.Telegram.WebApp) {
    console.log("Telegram WebApp found in global scope");
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    
    // Log WebApp data
    console.log("WebApp initData:", window.Telegram.WebApp.initData);
    console.log("WebApp User:", window.Telegram.WebApp.initDataUnsafe.user);
    
    if (window.Telegram.WebApp.initDataUnsafe.user) {
        telegramUserId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
        console.log("Telegram user ID from WebApp:", telegramUserId);
    } else {
        console.error("User data not found in WebApp");
    }
} else {
    console.log("Telegram WebApp not found in global scope, checking URL parameters...");
    const urlParams = new URLSearchParams(window.location.hash.slice(1));
    const tgWebAppData = urlParams.get('tgWebAppData');
    if (tgWebAppData) {
        console.log("Telegram WebApp data found in URL");
        const tgWebAppUser = JSON.parse(decodeURIComponent(new URLSearchParams(tgWebAppData).get('user')));
        if (tgWebAppUser && tgWebAppUser.id) {
            telegramUserId = tgWebAppUser.id.toString();
            console.log("Telegram user ID extracted from URL:", telegramUserId);
        }
    } else {
        console.log("No Telegram WebApp data found, using web fallback");
        telegramUserId = 'web_' + Math.random().toString(36).substr(2, 9);
    }
}

// Declare game elements globally so they can be accessed by all functions
let gameContainer, characterElement, characterNameElement, healthFill, currentHealthElement, maxHealthElement, 
    scoreElement, pointsElement, willElement, levelElement, replenishWillButton, increaseDamageButton, 
    showLeaderboardButton, showWalletButton, leaderboardElement,
    walletScreen, walletPointsElement, riggedTokensElement, baseWalletAddressInput, 
    saveWalletAddressButton, claimRiggedButton, burnRiggedButton, closeWalletButton, walletAddressError;

// Game variables
let score = 0;
let credits = 0;
let will = 1000;
let level = 1;
let health = 100;
let maxHealth = 100;
let damagePerClick = 1;
let replenishWillCost = 100;
let increaseDamageCost = 200;
let characterIndex = 0;
let riggedTokens = 0;
let pointsAtLastBurn = 0;
let baseWalletAddress = '';  // Initialize baseWalletAddress
let touchStartY = 0;
let touchEndY = 0;
const scrollThreshold = 10; // Adjust this value as needed
let touchStartTime = 0;
const tapThreshold = 300; // milliseconds
const multiTapWindow = 500; // Window for registering multiple taps (in milliseconds)
let lastTapTime = 0;
let tapCount = 0;
let lastRenderedCharacterIndex = -1;
let lastRenderedHealth = -1;
let totalClaimed = 0;

// Declare character information globally with updated defeat messages
const characters = [
    { 
        name: 'Sleepy Joe',
        images: [
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fbiden01.png?alt=media',  // Base image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FBiden%2Fbiden02.png?alt=media',  // Mid-movement image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FBiden%2Fbiden03.png?alt=media'   // Final progression image
        ],
        baseHealth: 100,
        defeatMessage: "Sleepy Joe has fainted after a single slap!"
    },
    { 
        name: 'Skamala',
        images: [
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fkamala01.png?alt=media',  // Base image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FKamala%2Fkamala02.png?alt=media',  // Mid-movement image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FKamala%2Fkamala03.png?alt=media'   // Final progression image
        ],
        baseHealth: 200,
        defeatMessage: "Skamala has finally stopped cackling. It retreats back to its handlers!"
    },
    { 
        name: 'Vaderson',
        images: [
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fluke01.png?alt=media',  // Base image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FMark%2Fluke02.png?alt=media',  // Mid-movement image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FMark%2Fluke03.png?alt=media'   // Final progression image
        ],
        baseHealth: 300,
        defeatMessage: "The force wasn't so strong with this one afterall!"
    },
    { 
        name: 'Saylor Twift',
        images: [
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fswift01.png?alt=media',  // Base image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FTaylor%2Fswift02.png?alt=media',  // Mid-movement image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FTaylor%2Fswift03.png?alt=media'   // Final progression image
        ],
        baseHealth: 400,
        defeatMessage: "You have offended every Twifty on the planet. How can you live with yourself!"
    },
    { 
        name: 'Big Mike Bootycall',
        images: [
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Base%20Images%2Fobama01.png?alt=media',  // Base image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FObama%2Fobama02.png?alt=media',  // Mid-movement image
            'https://firebasestorage.googleapis.com/v0/b/rigged-clicker-game-1.appspot.com/o/Character%20Animations%2FObama%2Fobama03.png?alt=media'   // Final progression image
        ],
        baseHealth: 500,
        defeatMessage: "He probably should have had his wife here to take those slaps like a man!"
    }
];

function closeWalletScreen() {
    const walletScreen = document.getElementById('wallet-screen');
    if (walletScreen) {
        walletScreen.style.display = 'none';
    }
}

// Updated authenticateTelegramUser function
function authenticateTelegramUser() {
    return new Promise((resolve, reject) => {
        console.log("Authenticating Telegram user...");
        if (telegramUserId) {
            console.log("Using existing Telegram user ID:", telegramUserId);
            resolve(telegramUserId);
        } else if (window.Telegram && window.Telegram.WebApp) {
            const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
            console.log("initDataUnsafe:", JSON.stringify(initDataUnsafe));
            if (initDataUnsafe && initDataUnsafe.user) {
                telegramUserId = initDataUnsafe.user.id.toString();
                console.log("Authenticated Telegram user ID:", telegramUserId);
                resolve(telegramUserId);
            } else {
                console.error("Unable to retrieve Telegram user ID from WebApp");
                reject("No Telegram user data available");
            }
        } else {
            console.error("Telegram WebApp not available");
            reject("Telegram WebApp not available");
        }
    });
}

// Function to generate a random username
function generateRandomUsername() {
    const adjectives = ['Happy', 'Lucky', 'Sunny', 'Clever', 'Swift', 'Brave', 'Bright'];
    const nouns = ['Player', 'Gamer', 'Hero', 'Champion', 'Warrior', 'Master', 'Star'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${noun}${number}`;
}

function initializeDefaultValues() {
    displayName = generateRandomUsername();
    score = 0;
    credits = 0;
    will = 1000;
    level = 1;
    health = 100;
    maxHealth = 100;
    damagePerClick = 1;
    replenishWillCost = 100;
    increaseDamageCost = 200;
    baseWalletAddress = '';
    riggedTokens = 0;
    pointsAtLastBurn = 0;
    characterIndex = 0;
}

function initializeGlobalTokenStats() {
    const globalStatsRef = database.ref('globalTokenStats');
    globalStatsRef.once('value', (snapshot) => {
        if (!snapshot.exists()) {
            globalStatsRef.set({
                totalClaimed: 0,
                totalBurned: 0
            }).catch(error => console.error("Error initializing global stats:", error));
        }
    }).catch(error => console.error("Error checking global stats:", error));
}

// Simple profanity filter (expand this list as needed)
const profanityList = ['badword1', 'badword2', 'badword3'];

function isProfanity(word) {
    return profanityList.some(badWord => word.toLowerCase().includes(badWord));
}

// Function to change username
function changeUsername(newUsername) {
    console.log("Changing username to:", newUsername);
    if (!isProfanity(newUsername)) {
        displayName = newUsername;
        updateDisplay();
        saveProgress();
        return true;
    }
    return false;
}

// Updated saveProgress function to ensure incremental updates and prevent overwriting
function saveProgress() {
    console.log("Attempting to save progress...");
    return new Promise((resolve, reject) => {
        if (!database || !telegramUserId) {
            console.error("Unable to save progress: Database or User ID not available");
            alert("Unable to save progress. Please try refreshing the page.");
            reject(new Error("Database or User ID not available"));
            return;
        }
        const dataToSave = {
            displayName, 
            score, 
            credits, 
            will, 
            level, 
            health, 
            maxHealth,
            damagePerClick, 
            replenishWillCost, 
            increaseDamageCost,
            baseWalletAddress, 
            riggedTokens, 
            pointsAtLastBurn, 
            characterIndex,
            totalClaimed, 
            totalBurned,
            lastWillUpdateTime
        };
        console.log("Data to save:", JSON.stringify(dataToSave, null, 2));
        
        // Function to track changes and only save what's changed
        function trackChanges(newData, oldData) {
            const changes = {};
            Object.keys(newData).forEach((key) => {
                if (JSON.stringify(newData[key]) !== JSON.stringify(oldData[key])) {
                    changes[key] = newData[key];
                }
            });
            return changes;
        }
        
        // Fetch current data from Firebase to track changes
        database.ref('users/' + telegramUserId).once('value').then((snapshot) => {
            const currentData = snapshot.val() || {};
            const changes = trackChanges(dataToSave, currentData);
            if (Object.keys(changes).length > 0) {
                console.log("Data to update:", JSON.stringify(changes, null, 2));
                // Ensure critical fields are always included and within valid ranges
                changes.riggedTokens = Math.max(0, dataToSave.riggedTokens || 0);
                changes.pointsAtLastBurn = Math.max(0, dataToSave.pointsAtLastBurn || 0);
                changes.totalClaimed = Math.min(10000000, Math.max(0, dataToSave.totalClaimed || 0));
                changes.credits = Math.max(0, dataToSave.credits || 0);
                
                return database.ref('users/' + telegramUserId).update(changes);
            } else {
                console.log("No changes detected. Updating critical fields.");
                return database.ref('users/' + telegramUserId).update({
                    riggedTokens: Math.max(0, dataToSave.riggedTokens || 0),
                    pointsAtLastBurn: Math.max(0, dataToSave.pointsAtLastBurn || 0),
                    totalClaimed: Math.min(10000000, Math.max(0, dataToSave.totalClaimed || 0)),
                    credits: Math.max(0, dataToSave.credits || 0)
                });
            }
        }).then(() => {
            console.log("Progress updated successfully");
            resolve();
        }).catch((error) => {
            console.error("Error saving progress:", error);
            if (error.code === "PERMISSION_DENIED") {
                console.log("Permission denied. Current data:", JSON.stringify(dataToSave, null, 2));
                alert("Unable to save progress due to permission issues. Your local progress will continue, but it may not be saved to the server.");
            } else {
                alert("There was an error saving your progress. Please try again later.");
            }
            reject(error);
        });
    });
}

function loadProgress() {
    console.log("Loading progress for user:", telegramUserId);
    return new Promise((resolve, reject) => {
        if (!database) {
            console.error("Firebase database not initialized");
            reject("Firebase database not initialized");
            return;
        }
        if (!telegramUserId) {
            console.error("No Telegram User ID available");
            initializeDefaultValues();
            reject("No Telegram User ID available");
            return;
        }
        const userRef = database.ref('users/' + telegramUserId);
        userRef.once('value')
            .then((snapshot) => {
                const userData = snapshot.val();
                if (userData) {
                    console.log("User data found. Loading progress...");
                    // Load user data into game variables
                    displayName = userData.displayName || generateRandomUsername();
                    score = userData.score || 0;
                    credits = userData.credits || 0;
                    will = userData.will || 1000;
                    level = userData.level || 1;
                    characterIndex = userData.characterIndex || 0;
                    maxHealth = characters[characterIndex].baseHealth * level;
                    health = userData.health || maxHealth;
                    damagePerClick = userData.damagePerClick || 1;
                    replenishWillCost = userData.replenishWillCost || 100;
                    increaseDamageCost = userData.increaseDamageCost || 200;
                    baseWalletAddress = userData.baseWalletAddress || '';
                    riggedTokens = userData.riggedTokens || 0;
                    pointsAtLastBurn = userData.pointsAtLastBurn || 0;
                    totalClaimed = userData.totalClaimed || 0;
                    totalBurned = userData.totalBurned || 0;
                    lastWillUpdateTime = userData.lastWillUpdateTime || Date.now();
                    isWalletValid = !!userData.baseWalletAddress;
                    console.log("User progress loaded successfully");
                    console.log("Loaded totalClaimed:", totalClaimed);
                    replenishWillOnLoad();
                    updateDisplay();
                    // Check for negative health and trigger defeat message if necessary
                    if (health <= 0) {
                        console.log("Negative or zero health detected, triggering defeat message");
                        setTimeout(() => showDefeatMessage(), 500); // Slight delay to ensure UI is updated
                    }
                    resolve(userData);
                } else {
                    console.log("No existing user data found. Initializing new user.");
                    initializeNewUser(telegramUserId)
                        .then(() => {
                            console.log("New user initialized");
                            resolve();
                        })
                        .catch((error) => {
                            console.error("Error initializing new user:", error);
                            reject(error);
                        });
                }
            })
            .catch((error) => {
                console.error("Error loading user data:", error);
                reject(error);
            });
    });
}

function loadOrInitializeUser(userId) {
    console.log("Loading or initializing user for ID:", userId);

    const userRef = database.ref('users/' + userId);

    userRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            console.log("Existing user data found. Loading...");
            loadProgress(data);
        } else {
            console.log("No existing user data found. Initializing new user.");
            initializeNewUser(userId);
        }
    }).catch(error => {
        console.error("Error loading user data:", error);
        initializeDefaultValues();
        updateDisplay();
    });
}

function initializeNewUser(userId) {
    console.log("Initializing new user with ID:", userId);
    const newUserData = {
        displayName: generateRandomUsername(),
        score: 0,
        credits: 0,
        will: 1000,
        level: 1,
        health: 100,
        maxHealth: 100,
        damagePerClick: 1,
        replenishWillCost: 100,
        increaseDamageCost: 200,
        baseWalletAddress: '',
        riggedTokens: 0,
        pointsAtLastBurn: 0,
        characterIndex: 0,
        totalClaimed: 0,
        totalBurned: 0,
        lastWillUpdateTime: Date.now()
    };
    return database.ref('users/' + userId).set(newUserData)
        .then(() => {
            console.log("New user data successfully written to database for ID:", userId);
            // Assign newUserData to global variables
            Object.keys(newUserData).forEach(key => {
                window[key] = newUserData[key];
                console.log(`Set global variable ${key} to:`, newUserData[key]);
            });
            updateDisplay();
            return newUserData; // Return the new user data for potential further use
        })
        .catch(error => {
            console.error("Error initializing new user:", error);
            initializeDefaultValues();
            updateDisplay();
            throw error; // Rethrow the error for the caller to handle if needed
        });
}

function handleViewportChange() {
    const currentWidth = window.innerWidth;
    const currentHeight = window.innerHeight;
    
    if (currentWidth !== lastViewportWidth || currentHeight !== lastViewportHeight) {
        console.log("Viewport size changed. Updating display...");
        updateDisplay();
        lastViewportWidth = currentWidth;
        lastViewportHeight = currentHeight;
    }
}

// Function to auto-replenish Will every 2 seconds
function autoReplenishWill() {
    const currentTime = Date.now();
    if (currentTime - lastWillReplenishTime >= WILL_REPLENISH_INTERVAL && will < 1000) {
        will = Math.min(1000, will + 1);
        lastWillReplenishTime = currentTime;
        
        console.log(`Will replenished by 1. Current will: ${will}`);
        updateDisplay();
        // We don't need to save progress here as it's done periodically elsewhere
    }
}

function replenishWillOnLoad() {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - lastWillUpdateTime) / 1000);
    
    if (elapsedSeconds > 0 && will < 1000) {
        const willToAdd = Math.min(elapsedSeconds / 2, 1000 - will); // Divide by 2 to maintain the 2-second interval
        will = Math.min(1000, will + willToAdd);
        lastWillUpdateTime = currentTime;
        lastWillReplenishTime = currentTime; // Reset the replenish timer
        
        console.log(`Will replenished by ${willToAdd} on game load. Current will: ${will}`);
        updateDisplay();
        saveProgress();  // Save the updated will value
    }
}

// Updated showDefeatMessage function
function showDefeatMessage() {
    const defeatMessage = document.getElementById('defeat-message');
    const defeatContent = defeatMessage.querySelector('.defeat-content');
    if (!defeatMessage || !defeatContent) {
        console.error("Defeat message elements not found");
        return;
    }
    defeatContent.innerHTML = ''; // Clear existing content
    // Add the close button
    const closeButton = document.createElement('span');
    closeButton.textContent = '✖';
    closeButton.style.cursor = 'pointer';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    defeatContent.appendChild(closeButton);
    // Add the defeat message text from the characters array
    const defeatText = document.createElement('p');
    defeatText.textContent = characters[characterIndex].defeatMessage;
    defeatContent.appendChild(defeatText);
    defeatMessage.classList.remove('hidden'); // Show defeat message
    // Remove the click event listener from the game container to avoid attacks
    gameContainer.removeEventListener('click', handleClick);
    // Close the defeat message and trigger character transition
    closeButton.addEventListener('click', function closeDefeatMessage(event) {
        event.stopPropagation(); // Prevent further propagation
        defeatMessage.classList.add('hidden'); // Hide defeat message
        nextCharacter();  // Load next character
        updateDisplay();  // Update UI with new character data
        // Re-add the click event listener for attacks
        setTimeout(() => {
            gameContainer.addEventListener('click', handleClick);
        }, 500);
    }, { once: true });
    console.log("Defeat message shown, waiting for user to click close button to continue");
}

// Updated nextCharacter function
function nextCharacter() {
    console.log("Loading next character");
    // Increment character index and cycle through characters
    characterIndex = (characterIndex + 1) % characters.length;
    // Reset health for the new character, but do not reset other stats
    maxHealth = characters[characterIndex].baseHealth * level;
    health = maxHealth;
    if (characterIndex === 0) {
        level++;  // Increase level when cycling through all characters
        console.log(`Level increased to: ${level}`);
    }
    // Set the base image immediately on character load
    const characterElement = document.getElementById('character');
    if (characterElement) {
        const baseImage = characters[characterIndex].images[0];  // Get base image
        characterElement.innerHTML = `<img src="${baseImage}" alt="${characters[characterIndex].name}" class="character-image">`;
    }
    // Update the display with the new character and save progress
    updateDisplay();
    saveProgress();
    // Ensure event listeners for clicks/touches remain active after character change
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.addEventListener('click', handleClick);
        gameContainer.addEventListener('touchend', handleTouchEnd);
        console.log("Event listeners reattached after character change.");
    } else {
        console.error("Game container not found, unable to reattach event listeners.");
    }
    console.log(`Next character loaded: ${characters[characterIndex].name} with health: ${health}/${maxHealth}`);
}

// Function to update display
function updateDisplay() {
    console.log("Updating display...");
    const elements = {
        character: document.getElementById('character'),
        characterName: document.getElementById('character-name'),
        health: document.getElementById('current-health'),
        maxHealth: document.getElementById('max-health'),
        healthFill: document.getElementById('health-fill'),
        score: document.getElementById('score'),
        credits: document.getElementById('credits'),
        will: document.getElementById('will'),
        level: document.getElementById('level'),
        replenishWillCost: document.getElementById('replenish-will-cost'),
        increaseDamageCost: document.getElementById('increase-damage-cost')
    };

    Object.entries(elements).forEach(([key, element]) => {
        if (!element) console.warn(`${key} element is missing from the DOM`);
    });

    if (elements.character && lastRenderedCharacterIndex !== characterIndex) {
        const baseImage = characters[characterIndex].images[0];
        elements.character.innerHTML = `<img src="${baseImage}" alt="${characters[characterIndex].name}" class="character-image">`;
        console.log("Character image updated:", baseImage);
        lastRenderedCharacterIndex = characterIndex;
    }

    if (elements.characterName) {
        elements.characterName.textContent = characters[characterIndex].name;
    }

    if (elements.health && elements.maxHealth && elements.healthFill && lastRenderedHealth !== health) {
        elements.health.textContent = Math.floor(health);
        elements.maxHealth.textContent = Math.floor(maxHealth);
        elements.healthFill.style.width = `${(health / maxHealth) * 100}%`;
        console.log("Health updated:", Math.floor(health), "/", Math.floor(maxHealth));
        lastRenderedHealth = health;
    }

    const updates = [
        { element: elements.score, value: Math.floor(score) },
        { element: elements.credits, value: Math.floor(credits) },
        { element: elements.will, value: Math.floor(will) },
        { element: elements.level, value: Math.floor(level) },
        { element: elements.replenishWillCost, value: Math.floor(replenishWillCost) },
        { element: elements.increaseDamageCost, value: Math.floor(increaseDamageCost) }
    ];

    updates.forEach(({ element, value }) => {
        if (element && element.textContent !== value.toString()) {
            element.textContent = value;
            console.log(`${element.id} updated:`, value);
        }
    });

    console.log("Display update complete");
}

function animateCharacterDamage() {
    const characterElement = document.getElementById('character');
    const characterImages = characters[characterIndex].images;

    // Show the base image initially
    characterElement.innerHTML = `<img src="${characterImages[0]}" alt="${characters[characterIndex].name}" class="character-image">`;

    // After 50ms (half of 100ms), show the mid-movement image
    setTimeout(() => {
        characterElement.innerHTML = `<img src="${characterImages[1]}" alt="${characters[characterIndex].name}" class="character-image">`;
    }, 50);  // Mid-movement image after 50ms

    // After another 100ms (half of 200ms), show the final progression image
    setTimeout(() => {
        characterElement.innerHTML = `<img src="${characterImages[2]}" alt="${characters[characterIndex].name}" class="character-image">`;
    }, 150);  // Final image after 150ms

    // After 250ms (half of 500ms), return to the base image
    setTimeout(() => {
        characterElement.innerHTML = `<img src="${characterImages[0]}" alt="${characters[characterIndex].name}" class="character-image">`;
    }, 250);  // Back to base image after 250ms
}

// Updated handleAttack function
function handleAttack(damage) {
    if (health <= 0 || will <= 0) {
        console.log("Attack aborted: health or will is 0");
        return;
    }
    console.log(`Attacking character: ${characters[characterIndex].name}`);
    console.log(`Current health: ${health}, Damage: ${damage}, Will: ${will}`);
    
    health = Math.max(0, health - damage);
    score = Math.floor(score + damage);
    credits = Math.floor(credits + damage);
    will = Math.max(0, will - 1);
    riggedTokens = calculateRigged();  // Recalculate RIGGED tokens after attack

    console.log(`New health: ${health}, New score: ${score}, New credits: ${credits}, New will: ${will}, New RIGGED tokens: ${riggedTokens}`);

    animateCharacterDamage();

    if (health <= 0) {
        console.log("Character defeated, transitioning to next character");
        showDefeatMessage();
    } else {
        updateDisplay();
    }

    saveProgress().catch(error => {
        console.error("Failed to save progress after attack:", error);
    });
}

// Function to handle touch events
// Handle touch start to detect initial touch position
function handleTouchStart(event) {
    touchStartTime = Date.now();
    touchStartY = [];
    const touches = event.touches;
    
    for (let i = 0; i < touches.length; i++) {
        touchStartY[i] = touches[i].clientY;
    }
    
    if (!event.target.closest('#actions')) {
        event.preventDefault();
    }
}

// Handle touch move to determine if it's a scroll or tap
function handleTouchMove(event) {
    if (event.target.closest('#actions')) {
        return;
    }

    const touches = event.touches;
    let isScrolling = false;

    for (let i = 0; i < touches.length; i++) {
        const touchDiff = Math.abs(touchStartY[i] - touches[i].clientY);
        if (touchDiff > scrollThreshold) {
            isScrolling = true;
            break;
        }
    }

    if (isScrolling) {
        event.stopPropagation();
    } else {
        event.preventDefault();
    }
}

// Handle touch end to register the tap and trigger the attack
function handleTouchEnd(event) {
    if (event.target.closest('#actions')) {
        return;
    }

    event.preventDefault();
    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (touchDuration <= tapThreshold) {
        const touches = event.changedTouches;
        let validTaps = 0;

        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const touchDiff = Math.abs(touchStartY[i] - touch.clientY);
            
            if (touchDiff <= scrollThreshold) {
                const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
                
                if (targetElement && targetElement.closest('#game-container') &&
                    !targetElement.closest('#defeat-message') && 
                    !targetElement.closest('#leaderboard') && 
                    !targetElement.closest('#wallet-screen') &&
                    !targetElement.closest('.action-button') &&
                    !targetElement.closest('#actions')) {
                    
                    validTaps++;
                }
            }
        }

        if (validTaps > 0) {
            const currentTime = Date.now();
            if (currentTime - lastTapTime <= multiTapWindow) {
                tapCount += validTaps;
            } else {
                tapCount = validTaps;
            }
            lastTapTime = currentTime;

            console.log(`Registered ${tapCount} valid tap(s) in rapid succession`);
            handleAttack(damagePerClick * tapCount);

            // Reset tap count after a short delay
            setTimeout(() => {
                tapCount = 0;
            }, multiTapWindow);
        }
    }

    touchStartY = [];
}

function handleClick(event) {
    console.log("Click event triggered");
    console.log("Target:", event.target);
    console.log("Current target:", event.currentTarget);
    
    if (event.target.closest('#game-container') &&
        !event.target.closest('#defeat-message') && 
        !event.target.closest('#leaderboard') && 
        !event.target.closest('#wallet-screen') &&
        !event.target.closest('.action-button') &&
        !event.target.closest('#actions')) {

        console.log("Handling click for attack");
        console.log("Damage per click:", damagePerClick);
        console.log("Current health:", health);
        handleAttack(damagePerClick);
        console.log("New health after attack:", health);

        event.preventDefault();
        event.stopPropagation();
    } else {
        console.log("Click was on an excluded element or outside game container");
        console.log("Closest game container:", event.target.closest('#game-container'));
        console.log("Closest excluded elements:", {
            defeatMessage: event.target.closest('#defeat-message'),
            leaderboard: event.target.closest('#leaderboard'),
            walletScreen: event.target.closest('#wallet-screen'),
            actionButton: event.target.closest('.action-button'),
            actions: event.target.closest('#actions')
        });
    }
}

// Function to handle Replenish Will
function handleReplenishWill() {
    console.log("Replenish Will button clicked");
    console.log("Replenishing will");
    if (credits >= replenishWillCost) {
        credits -= replenishWillCost;
        pointsAtLastBurn = Math.min(pointsAtLastBurn, credits);
        will = 1000;
        replenishWillCost = Math.floor(replenishWillCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

// Function to handle Increase Damage
function handleIncreaseDamage() {
    console.log("Increase Damage button clicked");
    if (credits >= increaseDamageCost) {
        credits -= increaseDamageCost;
        pointsAtLastBurn = Math.min(pointsAtLastBurn, credits);
        damagePerClick += 1;
        console.log(`Damage per click increased to: ${damagePerClick}`);  // Log the increase
        increaseDamageCost = Math.floor(increaseDamageCost * 1.5);
        updateDisplay();
        saveProgress();
    }
}

function initializeWalletState() {
    console.log("Initializing wallet state");
    walletScreen.style.display = 'none';
    updateWalletDisplay();
}

// Function to handle Show Wallet
function handleShowWallet() {
    console.log("Wallet button clicked - function triggered");
    
    riggedTokens = calculateRigged();
    console.log(`Calculated RIGGED tokens: ${riggedTokens}`);
    
    const walletScreen = document.getElementById('wallet-screen');
    const walletContent = document.getElementById('wallet-content');
    if (walletScreen && walletContent) {
        // Clear existing content
        walletContent.innerHTML = '';
        // Recreate wallet content with new structure
        walletContent.innerHTML = `
            <h2>Wallet</h2>
            <div>Current Credits: <span id="wallet-credits">${credits}</span></div>
            <div>Claimable $RIGGED: <span id="claimable-rigged">${riggedTokens}</span></div>
            <div>$RIGGED claimed for Season 1 airdrop: <span id="claimed-rigged">${totalClaimed}</span></div>
            <div>
                Base Wallet Address: 
                <input type="text" id="base-wallet-address" value="${baseWalletAddress}">
                <button id="save-wallet-address">Save Address</button>
                <div id="wallet-address-error"></div>
            </div>
            <button id="claim-rigged">Claim $RIGGED</button>
            <button id="burn-rigged">Burn $RIGGED</button>
            <button id="close-wallet">Close Wallet</button>
        `;
        walletScreen.classList.remove('hidden');
        walletScreen.style.display = 'flex';
        console.log("Wallet screen is now visible");
        // Re-attach event listeners
        document.getElementById('save-wallet-address').addEventListener('click', handleSaveWalletAddress);
        document.getElementById('claim-rigged').addEventListener('click', handleClaimRigged);
        document.getElementById('burn-rigged').addEventListener('click', handleBurnRigged);
        document.getElementById('close-wallet').addEventListener('click', handleCloseWallet);
        
        // Update these lines
        baseWalletAddressInput = document.getElementById('base-wallet-address');
        walletAddressError = document.getElementById('wallet-address-error');

        // Update wallet display after creating the content
        updateWalletDisplay();
    } else {
        console.error("Wallet screen or content element not found");
    }
    saveProgress();
}

// Function to change Username
function handleChangeUsername() {
    console.log("Change Username button clicked");
    showUsernameChangeModal();
}

// Function to show the custom username change modal
function showUsernameChangeModal() {
    // Check if modal already exists to prevent multiple modals
    if (document.getElementById('username-change-modal')) {
        console.log("Username change modal already open");
        return;
    }

    const modal = document.createElement('div');
    modal.id = 'username-change-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Change Username</h2>
            <input type="text" id="new-username-input" placeholder="Enter new username">
            <div class="modal-buttons">
                <button id="confirm-username-change">Change</button>
                <button id="cancel-username-change">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const confirmButton = document.getElementById('confirm-username-change');
    const cancelButton = document.getElementById('cancel-username-change');
    const inputField = document.getElementById('new-username-input');

    if (confirmButton && cancelButton && inputField) {
        confirmButton.addEventListener('click', confirmUsernameChange);
        cancelButton.addEventListener('click', closeUsernameChangeModal);
        // Focus on the input field
        setTimeout(() => inputField.focus(), 100);
    } else {
        console.error("Could not find all necessary elements for the username change modal");
        closeUsernameChangeModal(); // Close the modal if there was an error
    }
}

// Function to close the username change modal
function closeUsernameChangeModal() {
    const modal = document.getElementById('username-change-modal');
    if (modal) {
        document.body.removeChild(modal);
    }
}

// Function to confirm username change
function confirmUsernameChange() {
    const newUsername = document.getElementById('new-username-input').value.trim();
    if (newUsername && !isProfanity(newUsername)) {
        if (changeUsername(newUsername)) {
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.showAlert("Username successfully changed to: " + newUsername);
            } else {
                alert("Username successfully changed to: " + newUsername);
            }
            closeUsernameChangeModal();
            closeLeaderboard(); // Add this line to close the leaderboard
        }
    } else {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.showAlert("Invalid username. Please try again with a different name.");
        } else {
            alert("Invalid username. Please try again with a different name.");
        }
    }
}

// Function to close Wallet
function handleCloseWallet() {
    console.log("Close Wallet button clicked");
    console.log("Closing wallet");
    closeWalletScreen();
    saveProgress(); // Save the wallet state
}

// Updated handleClaimRigged function
function handleClaimRigged() {
    console.log("handleClaimRigged function called");
    if (!baseWalletAddress || !isWalletValid) {
        walletAddressError.textContent = "Please provide a valid wallet address before claiming $RIGGED.";
        walletAddressError.style.color = "red";
        return;
    }
    
    const claimableAmount = calculateRigged();
    console.log("Claimable amount:", claimableAmount);
    
    if (claimableAmount <= 0) {
        showPopup("You don't have any $RIGGED tokens to claim at the moment.");
        return;
    }

    const userRef = database.ref('users/' + telegramUserId);
    const globalStatsRef = database.ref('globalTokenStats');
    
    userRef.transaction((userData) => {
        if (userData === null) return userData;
        
        const currentTotalClaimed = userData.totalClaimed || 0;
        const maxClaimableAmount = Math.min(claimableAmount, 10000000 - currentTotalClaimed);
        console.log("Max claimable amount:", maxClaimableAmount);

        if (maxClaimableAmount <= 0) {
            console.log("User has reached their personal limit");
            return userData;
        }
        
        userData.totalClaimed = currentTotalClaimed + maxClaimableAmount;
        userData.credits = Math.floor(Math.max(0, userData.credits - maxClaimableAmount / 100000)); // Ensure credits are integers
        userData.pointsAtLastBurn = userData.credits;
        userData.riggedTokens = claimableAmount - maxClaimableAmount; // Keep unclaimed tokens
        
        console.log("Updated user data:", userData);
        return userData;
    }, (error, committed, userSnapshot) => {
        if (error) {
            console.error('User claim transaction failed:', error);
            showPopup("There was an error claiming your $RIGGED tokens. Please try again later.");
        } else if (!committed) {
            console.log('User claim transaction not committed');
            const userData = userSnapshot.val();
            if (userData && userData.totalClaimed >= 10000000) {
                showPopup("Congratulations, you have slapped so much liberal visage that you have claimed the maximum possible number of tokens for Season 1 of the game. Feel free to keep playing and keep your eyes peeled for announcements on our socials regarding the Season 2 commencement date.");
            } else {
                showPopup("Unable to claim $RIGGED tokens. Please try again later.");
            }
        } else {
            // If user transaction is successful, update global stats
            globalStatsRef.transaction((globalStats) => {
                if (globalStats === null) return { totalClaimed: 0, totalBurned: 0 };
                
                const claimedAmount = userSnapshot.val().totalClaimed - (totalClaimed || 0);
                const newGlobalTotal = (globalStats.totalClaimed || 0) + claimedAmount;
                console.log("New global total:", newGlobalTotal);
                
                if (newGlobalTotal > 100000000) {
                    console.log("Global limit has been reached");
                    return globalStats;
                }
                
                globalStats.totalClaimed = newGlobalTotal;
                return globalStats;
            }, (error, committed, globalSnapshot) => {
                if (error) {
                    console.error('Global stats claim transaction failed:', error);
                    showPopup("There was an error updating global stats. Your tokens may not have been claimed.");
                } else if (!committed) {
                    console.log('Global stats claim transaction not committed');
                    
                    const userData = userSnapshot.val();
                    const globalStats = globalSnapshot.val();
                    
                    if (userData && userData.totalClaimed >= 10000000) {
                        showPopup("Congratulations, you have slapped so much liberal visage that you have claimed the maximum possible number of tokens for Season 1 of the game. Feel free to keep playing and keep your eyes peeled for announcements on our socials regarding the Season 2 commencement date.");
                    } else if (globalStats && globalStats.totalClaimed >= 100000000) {
                        showPopup("Thanks for slapping some liberal visage with us! All available RIGGED tokens have been claimed for Season 1. Feel free to keep playing and keep your eyes peeled for announcements on our socials regarding the Season 2 commencement dates.");
                    } else {
                        showPopup("Unable to claim $RIGGED tokens. Please try again later.");
                    }
                } else {
                    console.log('Claim transaction successful');
                    const claimedAmount = userSnapshot.val().totalClaimed - totalClaimed;
                    riggedTokens = userSnapshot.val().riggedTokens;
                    credits = Math.floor(userSnapshot.val().credits); // Ensure credits are integers
                    pointsAtLastBurn = credits;
                    totalClaimed = userSnapshot.val().totalClaimed;
                    updateWalletDisplay();
                    saveProgress().then(() => {
                        console.log('Progress saved after claiming RIGGED tokens');
                        if (claimedAmount > 0) {
                            // Update the wallet display with the claim success message
                            const walletContent = document.getElementById('wallet-content');
                            if (walletContent) {
                                const claimMessageElement = document.createElement('div');
                                claimMessageElement.textContent = `Successfully claimed ${claimedAmount} $RIGGED tokens!`;
                                claimMessageElement.style.color = 'green';
                                walletContent.insertBefore(claimMessageElement, walletContent.firstChild);
                                // Remove the message after 3 seconds
                                setTimeout(() => {
                                    if (walletContent.contains(claimMessageElement)) {
                                        walletContent.removeChild(claimMessageElement);
                                    }
                                }, 3000);
                            }
                        } else {
                            showPopup("Congratulations, you have slapped so much liberal visage that you have claimed the maximum possible number of tokens for Season 1 of the game. Feel free to keep playing and keep your eyes peeled for announcements on our socials regarding the Season 2 commencement date.");
                        }
                    }).catch((error) => {
                        console.error('Error saving progress after claiming RIGGED tokens:', error);
                        showPopup("There was an error saving your progress. Your tokens may have been claimed but not saved.");
                    });
                }
            });
        }
    });
}

// Updated handleBurnRigged function
function handleBurnRigged() {
    if (!baseWalletAddress || !isWalletValid) {
        showPopup("Please provide a valid wallet address before burning $RIGGED.");
        return;
    }
    
    if (riggedTokens <= 0) {
        showPopup("You don't have any $RIGGED tokens to burn.");
        return;
    }

    const burnAmount = riggedTokens;
    
    const userRef = database.ref('users/' + telegramUserId);
    const globalStatsRef = database.ref('globalTokenStats');
    
    // First, update user data
    userRef.transaction((userData) => {
        if (userData === null) return userData;
        
        const newUserTotal = (userData.totalBurned || 0) + burnAmount;
        
        if (newUserTotal > 10000000) {
            return;
        }
        
        userData.totalBurned = newUserTotal;
        userData.riggedTokens = 0;
        userData.pointsAtLastBurn = userData.credits;
        
        return userData;
    }, (error, committed, userSnapshot) => {
        if (error) {
            console.error('User burn transaction failed:', error);
            showPopup("There was an error burning your $RIGGED tokens. Please try again later.");
        } else if (!committed) {
            console.log('User burn transaction not committed');
            showPopup("Unable to burn $RIGGED tokens. Please try again later.");
        } else {
            // If user transaction is successful, update global stats
            globalStatsRef.transaction((globalStats) => {
                if (globalStats === null) return globalStats;
                
                const newGlobalTotal = (globalStats.totalBurned || 0) + burnAmount;
                
                if (newGlobalTotal > 100000000) {
                    return;
                }
                
                globalStats.totalBurned = newGlobalTotal;
                return globalStats;
            }, (error, committed, globalSnapshot) => {
                if (error) {
                    console.error('Global stats burn transaction failed:', error);
                    showPopup("There was an error updating global stats. Please try again later.");
                } else if (!committed) {
                    console.log('Global stats burn transaction not committed');
                    
                    const userData = userSnapshot.val();
                    const globalStats = globalSnapshot.val();
                    
                    if (userData && userData.totalBurned >= 10000000) {
                        showPopup("You have reached the maximum burn limit for Season 1. Keep an eye out for Season 2 announcements!");
                    } else if (globalStats && globalStats.totalBurned >= 100000000) {
                        showPopup("All available $RIGGED tokens for Season 1 have been burned. Stay tuned for Season 2 announcements!");
                    } else {
                        showPopup("Unable to burn $RIGGED tokens. Please try again later.");
                    }
                } else {
                    console.log('Burn transaction successful');
                    riggedTokens = 0;
                    pointsAtLastBurn = credits;
                    updateWalletDisplay();
                    saveProgress().then(() => {
                        console.log('Progress saved after burning RIGGED tokens');
                        // Update the wallet display with the burn success message
                        const walletContent = document.getElementById('wallet-content');
                        if (walletContent) {
                            const burnMessageElement = document.createElement('div');
                            burnMessageElement.textContent = `Successfully burned ${burnAmount} $RIGGED tokens!`;
                            burnMessageElement.style.color = 'green';
                            walletContent.insertBefore(burnMessageElement, walletContent.firstChild);
                            // Remove the message after 3 seconds
                            setTimeout(() => {
                                if (walletContent.contains(burnMessageElement)) {
                                    walletContent.removeChild(burnMessageElement);
                                }
                            }, 3000);
                        }
                    }).catch((error) => {
                        console.error('Error saving progress after burning RIGGED tokens:', error);
                        showPopup("There was an error saving your progress. Please try again later.");
                    });
                }
            });
        }
    });
}

function showPopup(message) {
    const existingPopup = document.getElementById('custom-popup');
    if (existingPopup) {
        document.body.removeChild(existingPopup);
    }
    const popup = document.createElement('div');
    popup.id = 'custom-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <span class="close-popup">✖</span>
            <p class="popup-message">${message}</p>
        </div>
    `;
    document.body.appendChild(popup);
    // Style the popup
    const style = document.createElement('style');
    style.textContent = `
        #custom-popup {
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .popup-content {
            background-color: #fefefe;
            padding: 20px;
            border-radius: 5px;
            max-width: 80%;
            max-height: 80%;
            overflow-y: auto;
            position: relative;
        }
        .popup-message {
            color: #55DD33;
        }
        .close-popup {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
            position: absolute;
            right: 10px;
            top: 5px;
        }
        .close-popup:hover {
            color: #000;
        }
    `;
    document.head.appendChild(style);
    // Add close functionality
    const closeButton = popup.querySelector('.close-popup');
    closeButton.onclick = function() {
        document.body.removeChild(popup);
    };
}

// Function to validate wallet address (added back)
function validateWalletAddress(address) {
    return (address.length === 42 && address.startsWith('0x')) || address.endsWith('.base.eth');
}

// Function to save wallet address (newly added)
function handleSaveWalletAddress() {
    console.log("Save wallet address button clicked");
    const walletAddress = baseWalletAddressInput.value.trim();
    if (validateWalletAddress(walletAddress)) {
        baseWalletAddress = walletAddress;
        database.ref('users/' + telegramUserId + '/baseWalletAddress').set(walletAddress)
            .then(() => {
                console.log("Wallet address saved successfully");
                walletAddressError.textContent = "Wallet address saved successfully!";
                walletAddressError.style.color = "green";
                isWalletValid = true;
                saveProgress();
            })
            .catch((error) => {
                console.error("Error saving wallet address:", error);
                walletAddressError.textContent = "Error saving wallet address: " + error.message;
                walletAddressError.style.color = "red";
                isWalletValid = false;
            });
    } else {
        console.log("Invalid wallet address");
        walletAddressError.textContent = "Invalid wallet address. Must be a 42-character hexadecimal address starting with '0x' or a Base ENS name ending with '.base.eth'.";
        walletAddressError.style.color = "red";
        isWalletValid = false;
    }
}

// Function to update wallet display
function updateWalletDisplay() {
    console.log("Updating wallet display");
    const walletCredits = document.getElementById('wallet-credits');
    const claimableRigged = document.getElementById('claimable-rigged');
    const claimedRigged = document.getElementById('claimed-rigged');

    if (walletCredits) {
        walletCredits.textContent = Math.floor(credits);
        console.log("Updated wallet credits display:", Math.floor(credits));
    } else {
        console.warn("wallet-credits element not found");
    }

    if (claimableRigged) {
        claimableRigged.textContent = Math.floor(riggedTokens);
        console.log("Updated claimable RIGGED display:", Math.floor(riggedTokens));
    } else {
        console.warn("claimable-rigged element not found");
    }

    if (claimedRigged) {
        claimedRigged.textContent = Math.floor(totalClaimed);
        console.log("Updated claimed RIGGED display:", Math.floor(totalClaimed));
    } else {
        console.warn("claimed-rigged element not found");
    }

    console.log("Wallet display update complete");
}

// Function to calculate Rigged tokens
function calculateRigged() {
    let eligibleCredits = Math.floor(credits - pointsAtLastBurn);
    
    // If eligibleCredits is negative, it means credits were spent
    // In this case, we should reset pointsAtLastBurn to the current credits
    if (eligibleCredits < 0) {
        pointsAtLastBurn = Math.floor(credits);
        eligibleCredits = 0;
    }

    // TEMPORARY CALCULATION: 100 credits = 10 million RIGGED
    const riggedTokensEarned = Math.floor(eligibleCredits / 100) * 10000000;
    
    console.log(`Calculating RIGGED tokens (TEMPORARY TEST VERSION): Credits: ${credits}, Points at last burn: ${pointsAtLastBurn}, Eligible credits: ${eligibleCredits}, Earned tokens: ${riggedTokensEarned}`);
    
    return riggedTokensEarned;
}

// Show Leaderboard
function handleShowLeaderboard() {
    console.log("Show Leaderboard button clicked");
    const leaderboard = document.getElementById('leaderboard');
    const leaderboardContent = document.getElementById('leaderboard-content');
    
    if (!leaderboard || !leaderboardContent) {
        console.error("Leaderboard elements not found");
        return;
    }

    console.log("Fetching leaderboard data");
    // Clear existing leaderboard entries
    leaderboardContent.innerHTML = '<h2>Leaderboard</h2>';
    // Add loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.textContent = 'Loading leaderboard...';
    leaderboardContent.appendChild(loadingIndicator);
    // Show the leaderboard
    leaderboard.classList.remove('hidden');
    leaderboard.style.display = 'flex';

    // Fetch top 10 players
    const topPlayersRef = database.ref('users').orderByChild('score').limitToLast(10);
    topPlayersRef.once('value', (snapshot) => {
        const topPlayers = [];
        snapshot.forEach((childSnapshot) => {
            topPlayers.push({
                username: childSnapshot.val().displayName || 'Unknown',  // Handle missing usernames
                score: childSnapshot.val().score || 0                     // Handle missing scores
            });
        });
        topPlayers.reverse(); // Reverse to get descending order

        // Fetch current user's rank
        database.ref('users').orderByChild('score').startAfter(score).once('value', (rankSnapshot) => {
            const userRank = rankSnapshot.numChildren() + 1;
            // Remove loading indicator
            leaderboardContent.removeChild(loadingIndicator);
            // Create leaderboard list
            const leaderboardList = document.createElement('ol');
            leaderboardList.id = 'leaderboard-list';
            // Populate leaderboard
            topPlayers.forEach((player) => {
                const listItem = document.createElement('li');
                listItem.textContent = `${player.username}: ${player.score} points`;
                leaderboardList.appendChild(listItem);
            });
            leaderboardContent.appendChild(leaderboardList);

            // Add current user's display name, rank and score
            const userDisplayNameElement = document.createElement('div');
            userDisplayNameElement.textContent = `Your Display Name: ${displayName}`;
            leaderboardContent.appendChild(userDisplayNameElement);

            const userRankElement = document.createElement('div');
            userRankElement.textContent = `Your Rank: ${userRank}`;
            leaderboardContent.appendChild(userRankElement);

            const userScoreElement = document.createElement('div');
            userScoreElement.textContent = `Your Score: ${score}`;
            leaderboardContent.appendChild(userScoreElement);

            // Add change username button
            const changeUsernameButton = document.createElement('button');
            changeUsernameButton.textContent = 'Change Username';
            changeUsernameButton.id = 'change-username-button';
            changeUsernameButton.onclick = handleChangeUsername;
            leaderboardContent.appendChild(changeUsernameButton);

            // Add close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close Leaderboard';
            closeButton.id = 'close-leaderboard-button';
            closeButton.onclick = closeLeaderboard;
            leaderboardContent.appendChild(closeButton);
        }).catch(error => {
            console.error("Error fetching user rank:", error);
            leaderboardContent.textContent = "Error loading user rank. Please try again later.";
        });
    }).catch(error => {
        console.error("Error fetching leaderboard data:", error);
        leaderboardContent.textContent = "Error loading leaderboard. Please try again later.";
    });
}

// Define the closeLeaderboard function to prevent the error
function closeLeaderboard() {
    const leaderboard = document.getElementById('leaderboard');
    if (leaderboard) {
        leaderboard.classList.add('hidden'); // Hide the leaderboard
    } else {
        console.error("Leaderboard element not found");
    }
}

// Initialize game after DOM elements are loaded
document.addEventListener('DOMContentLoaded', (event) => {
    console.log("DOM Content Loaded event fired");

    // Initialize game elements here
    gameContainer = document.getElementById('game-container');
    characterElement = document.getElementById('character');
    characterNameElement = document.getElementById('character-name');
    healthFill = document.getElementById('health-fill');
    currentHealthElement = document.getElementById('current-health');
    maxHealthElement = document.getElementById('max-health');
    scoreElement = document.getElementById('score');
    creditsElement = document.getElementById('credits');
    willElement = document.getElementById('will');
    levelElement = document.getElementById('level');
    replenishWillButton = document.getElementById('replenish-will-button');
    increaseDamageButton = document.getElementById('increase-damage-button');
    showLeaderboardButton = document.getElementById('show-leaderboard-button');
    showWalletButton = document.getElementById('show-wallet-button');
    leaderboardElement = document.getElementById('leaderboard');
    
    // Wallet elements
    walletScreen = document.getElementById('wallet-screen');
    walletCreditsElement = document.getElementById('wallet-credits');
    riggedTokensElement = document.getElementById('rigged-tokens');
    baseWalletAddressInput = document.getElementById('base-wallet-address');
    saveWalletAddressButton = document.getElementById('save-wallet-address');
    claimRiggedButton = document.getElementById('claim-rigged');
    burnRiggedButton = document.getElementById('burn-rigged');
    closeWalletButton = document.getElementById('close-wallet');
    walletAddressError = document.getElementById('wallet-address-error');

    // Close the wallet screen on game load
    if (walletScreen) walletScreen.classList.add('hidden');

    // Set the base image for the first character on game load
    if (characterElement && characters.length > 0) {
        const baseImage = characters[0].images[0];  // Load the base image for the first character
        characterElement.innerHTML = `<img src="${baseImage}" alt="${characters[0].name}">`;
    }

    // Initialize event listeners
    initializeEventListeners();

    // Button click handlers
    const buttonHandlers = {
        'replenish-will-button': handleReplenishWill,
        'increase-damage-button': handleIncreaseDamage,
        'show-leaderboard-button': handleShowLeaderboard,
        'show-wallet-button': handleShowWallet,
        'close-wallet': handleCloseWallet,
        'claim-rigged': handleClaimRigged,
        'burn-rigged': handleBurnRigged,
        'save-wallet-address': handleSaveWalletAddress
    };

    // Initialize button event listeners
    Object.entries(buttonHandlers).forEach(([id, handler]) => {
        const button = document.getElementById(id);
        if (button) {
            const eventHandler = (event) => {
                event.preventDefault();
                event.stopPropagation();
                handler(event);
                console.log(`Button activated: ${id}`);
            };
            button.addEventListener('click', eventHandler);
            button.addEventListener('touchend', eventHandler);
            console.log(`Event listeners added for button: ${id}`);
        } else {
            console.error(`Button with id '${id}' not found`);
        }
    });

    // Add event listener for change username button
    const changeUsernameButton = document.getElementById('change-username-button');
    if (changeUsernameButton) {
        changeUsernameButton.addEventListener('click', handleChangeUsername);
        console.log('Event listener added for change-username-button');
    } else {
        console.error("Button with id 'change-username-button' not found");
    }

    if (window.Telegram && window.Telegram.WebApp) {
        console.log("Initializing Telegram WebApp...");
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();

        window.Telegram.WebApp.onEvent('viewportChanged', handleViewportChange);
    }

    // Will auto-replenish every second
    setInterval(autoReplenishWill, 100); // Check more frequently, but only replenish every 2 seconds

    // Add viewport change handling
    window.addEventListener('resize', handleViewportChange);

    // Initialize game after DOM elements are loaded
    authenticateTelegramUser()
    .then(() => {
        initializeGlobalTokenStats(); // Initialize global token stats
        return loadProgress();
    })
    .then(() => {
        updateDisplay();
        setInterval(saveProgress, 5000);
        console.log("Game initialized");

        // Log the game container visibility
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            console.log("Game container visibility:", window.getComputedStyle(gameContainer).display);
        } else {
            console.log("Game container not found");
        }
    })
    .catch((error) => {
        console.error("Error initializing game:", error);
        alert("Error initializing game. Please ensure you're running this in Telegram.");
    });
});

function initializeEventListeners() {
    if (gameContainer) {
        gameContainer.addEventListener('click', handleClick);
        gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        console.log("Highly sensitive touch and click event listeners initialized");
    } else {
        console.error("Game container not found, unable to initialize event listeners");
    }
}

console.log("Script loaded");