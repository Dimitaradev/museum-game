/* ============================================
   APP.JS - Simple Linear Flow Controller

   Flow: Welcome → Navigate → Riddle → Stamp → (repeat) → Complete
   ============================================ */

(function() {
    // State
    let currentStop = 0;
    let progress = [];

    // DOM Elements
    const screens = {
        welcome: document.getElementById('screen-welcome'),
        navigate: document.getElementById('screen-navigate'),
        riddle: document.getElementById('screen-riddle'),
        stamp: document.getElementById('screen-stamp'),
        complete: document.getElementById('screen-complete')
    };

    const elements = {
        // Progress
        progressFill: document.getElementById('progress-fill'),
        progressText: document.getElementById('progress-text'),
        progressFillRiddle: document.getElementById('progress-fill-riddle'),
        progressTextRiddle: document.getElementById('progress-text-riddle'),

        // Navigation
        directionText: document.getElementById('direction-text'),
        destinationName: document.getElementById('destination-name'),

        // Riddle
        riddleNumber: document.getElementById('riddle-number'),
        riddleText: document.getElementById('riddle-text'),
        artworkName: document.getElementById('artwork-name'),
        artworkImage: document.getElementById('artwork-image'),
        answerInput: document.getElementById('answer-input'),
        feedback: document.getElementById('feedback'),

        // Stamp
        stampIcon: document.getElementById('stamp-icon'),
        physicalLocation: document.getElementById('physical-location'),

        // Complete
        finalStamps: document.getElementById('final-stamps')
    };

    const buttons = {
        start: document.getElementById('btn-start'),
        arrived: document.getElementById('btn-arrived'),
        hint: document.getElementById('btn-hint'),
        check: document.getElementById('btn-check'),
        continue: document.getElementById('btn-continue'),
        restart: document.getElementById('btn-restart')
    };

    const nav = {
        bar: document.getElementById('nav-bar'),
        home: document.getElementById('nav-home'),
        map: document.getElementById('nav-map'),
        passport: document.getElementById('nav-passport'),
        stampCount: document.getElementById('stamp-count')
    };

    const passport = {
        modal: document.getElementById('passport-modal'),
        close: document.getElementById('passport-close'),
        stamps: document.getElementById('passport-stamps'),
        progressFill: document.getElementById('passport-progress-fill'),
        progressText: document.getElementById('passport-progress-text')
    };

    /**
     * Initialize the app
     */
    function init() {
        loadProgress();
        setupEventListeners();

        // Initialize UI
        updateStampCount();
        updateNavBar('welcome');

        // Check if game was in progress
        if (progress.length > 0 && currentStop < GameData.ROUTE.length) {
            // Resume from where left off
            showScreen('navigate');
            updateNavigateScreen();
        }

        console.log('[App] Initialized');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        buttons.start.addEventListener('click', startGame);
        buttons.arrived.addEventListener('click', showRiddle);
        buttons.hint.addEventListener('click', showHint);
        buttons.check.addEventListener('click', checkAnswer);
        buttons.continue.addEventListener('click', continueGame);
        buttons.restart.addEventListener('click', restartGame);

        // Allow Enter key to submit answer
        elements.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                checkAnswer();
            }
        });

        // Navigation bar
        nav.home.addEventListener('click', goToHome);
        nav.map.addEventListener('click', goToMap);
        nav.passport.addEventListener('click', openPassport);
        passport.close.addEventListener('click', closePassport);
        passport.modal.addEventListener('click', (e) => {
            if (e.target === passport.modal) {
                closePassport();
            }
        });
    }

    /**
     * Show a specific screen
     */
    function showScreen(screenName) {
        Object.values(screens).forEach(screen => {
            screen.classList.remove('active');
        });

        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }

        // Update navigation bar
        updateNavBar(screenName);
    }

    /**
     * Start the game
     */
    function startGame() {
        currentStop = 0;
        progress = [];
        saveProgress();

        showScreen('navigate');
        updateNavigateScreen();
    }

    // Character positions matching room centers (percentages)
    const characterPositions = [
        { left: '50%', top: '88%' },    // Start: at entrance
        { left: '11%', top: '62%' },    // After stop 1: at room 19
        { left: '11%', top: '42%' },    // After stop 2: at room 21
        { left: '89%', top: '42%' },    // After stop 3: at room 22
        { left: '89%', top: '18%' },    // After stop 4: at room 24
        { left: '50%', top: '10%' }     // After stop 5: at room 25 (finish)
    ];

    /**
     * Update the navigation screen with current stop info
     */
    function updateNavigateScreen() {
        const stop = GameData.ROUTE[currentStop];
        if (!stop) return;

        elements.directionText.textContent = stop.direction;
        elements.destinationName.textContent = stop.room;

        updateMapRooms();
        moveCharacter(true);
    }

    /**
     * Update room states on the map
     */
    function updateMapRooms() {
        const rooms = document.querySelectorAll('.map-room[data-room]');

        rooms.forEach(room => {
            const roomData = room.dataset.room;
            room.classList.remove('completed', 'current', 'locked');

            if (roomData === 'entrance') {
                room.classList.add('completed');
            } else {
                const roomIndex = parseInt(roomData);
                if (roomIndex <= currentStop) {
                    room.classList.add('completed');
                } else if (roomIndex === currentStop + 1) {
                    room.classList.add('current');
                } else {
                    room.classList.add('locked');
                }
            }
        });
    }

    /**
     * Move character to current position with smooth animation
     */
    function moveCharacter(animate = false) {
        const marker = document.getElementById('character-marker');
        if (!marker) return;

        const pos = characterPositions[currentStop] || characterPositions[0];

        // Set position directly - CSS transition handles smooth movement
        marker.style.left = pos.left;
        marker.style.top = pos.top;
    }

    /**
     * Show the riddle screen
     */
    function showRiddle() {
        const stop = GameData.ROUTE[currentStop];
        if (!stop) return;

        elements.riddleNumber.textContent = stop.id;
        elements.riddleText.textContent = stop.riddle;
        elements.artworkName.textContent = stop.artworkName;
        elements.answerInput.value = '';
        elements.feedback.className = 'feedback';
        elements.feedback.textContent = '';

        // Set artwork image
        if (stop.artworkImage && elements.artworkImage) {
            elements.artworkImage.src = stop.artworkImage;
            elements.artworkImage.alt = stop.artworkName;
        }

        showScreen('riddle');

        // Focus on input after a short delay
        setTimeout(() => {
            elements.answerInput.focus();
        }, 300);
    }

    /**
     * Show hint for current riddle
     */
    function showHint() {
        const stop = GameData.ROUTE[currentStop];
        if (!stop) return;

        elements.feedback.textContent = stop.hint;
        elements.feedback.className = 'feedback visible';
    }

    /**
     * Check the answer
     */
    function checkAnswer() {
        const stop = GameData.ROUTE[currentStop];
        if (!stop) return;

        const answer = elements.answerInput.value.trim().toLowerCase();
        if (!answer) {
            showFeedback('Моля, въведи отговор.', false);
            return;
        }

        const correct = stop.correctAnswer.toLowerCase();
        const alternatives = stop.alternativeAnswers || [];

        // Check if answer matches
        let isCorrect = answer === correct ||
                       answer.includes(correct) ||
                       correct.includes(answer);

        if (!isCorrect) {
            isCorrect = alternatives.some(alt => {
                const altLower = alt.toLowerCase();
                return answer === altLower ||
                       answer.includes(altLower) ||
                       altLower.includes(answer);
            });
        }

        if (isCorrect) {
            handleCorrectAnswer(stop);
        } else {
            handleIncorrectAnswer();
        }
    }

    /**
     * Handle correct answer
     */
    function handleCorrectAnswer(stop) {
        // Add to progress
        progress.push(stop.id);
        saveProgress();

        // Update stamp count in nav
        updateStampCount();

        // Show stamp screen
        elements.stampIcon.textContent = stop.stampIcon;
        elements.physicalLocation.textContent = stop.physicalStamp;

        showScreen('stamp');

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }

    /**
     * Handle incorrect answer
     */
    function handleIncorrectAnswer() {
        const messages = GameData.MESSAGES.incorrect;
        const message = messages[Math.floor(Math.random() * messages.length)];
        showFeedback(message, false);

        // Shake the input
        elements.answerInput.classList.add('shake');
        setTimeout(() => {
            elements.answerInput.classList.remove('shake');
        }, 500);

        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    }

    /**
     * Show feedback message
     */
    function showFeedback(message, isSuccess) {
        elements.feedback.textContent = message;
        elements.feedback.className = `feedback visible ${isSuccess ? 'success' : 'error'}`;
    }

    /**
     * Continue to next stop or complete screen
     */
    function continueGame() {
        currentStop++;
        saveProgress();

        if (currentStop >= GameData.ROUTE.length) {
            showCompleteScreen();
        } else {
            showScreen('navigate');
            updateNavigateScreen();
        }
    }

    /**
     * Show the completion screen
     */
    function showCompleteScreen() {
        // Show all collected stamps
        elements.finalStamps.innerHTML = GameData.ROUTE.map(stop =>
            `<span class="stamp-icon">${stop.stampIcon}</span>`
        ).join('');

        showScreen('complete');

        // Celebration haptic
        if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100, 100, 200]);
        }
    }

    /**
     * Restart the game
     */
    function restartGame() {
        currentStop = 0;
        progress = [];
        clearProgress();
        updateStampCount();
        showScreen('welcome');
    }

    /**
     * Save progress to localStorage
     */
    function saveProgress() {
        const data = {
            currentStop: currentStop,
            progress: progress
        };
        localStorage.setItem(GameData.STORAGE_KEY, JSON.stringify(data));
    }

    /**
     * Load progress from localStorage
     */
    function loadProgress() {
        try {
            const saved = localStorage.getItem(GameData.STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                currentStop = data.currentStop || 0;
                progress = data.progress || [];
            }
        } catch (e) {
            console.warn('[App] Could not load progress:', e);
        }
    }

    /**
     * Clear progress from localStorage
     */
    function clearProgress() {
        localStorage.removeItem(GameData.STORAGE_KEY);
    }

    /**
     * Navigation: Go to home/welcome screen
     */
    function goToHome() {
        if (confirm('Искаш ли да започнеш отначало? Прогресът ще бъде изгубен.')) {
            restartGame();
        }
    }

    /**
     * Navigation: Go to map/navigate screen
     */
    function goToMap() {
        if (currentStop > 0 || progress.length > 0) {
            showScreen('navigate');
            updateNavigateScreen();
        } else {
            // No progress yet, start the game
            startGame();
        }
    }

    /**
     * Open passport modal
     */
    function openPassport() {
        updatePassportDisplay();
        passport.modal.classList.add('active');
    }

    /**
     * Close passport modal
     */
    function closePassport() {
        passport.modal.classList.remove('active');
    }

    /**
     * Update passport display with collected stamps
     */
    function updatePassportDisplay() {
        // Build stamps HTML
        const stampsHtml = GameData.ROUTE.map((stop, index) => {
            const isCollected = progress.includes(stop.id);
            return `
                <div class="passport-stamp ${isCollected ? 'collected' : 'locked'}">
                    <span class="stamp-emoji">${stop.stampIcon}</span>
                    <span class="stamp-room">${stop.room}</span>
                </div>
            `;
        }).join('');

        passport.stamps.innerHTML = stampsHtml;

        // Update progress
        const total = GameData.ROUTE.length;
        const collected = progress.length;
        passport.progressFill.style.width = `${(collected / total) * 100}%`;
        passport.progressText.textContent = `${collected} / ${total} печата`;
    }

    /**
     * Update stamp count badge in nav
     */
    function updateStampCount() {
        nav.stampCount.textContent = progress.length;
        if (progress.length === 0) {
            nav.stampCount.classList.add('empty');
        } else {
            nav.stampCount.classList.remove('empty');
        }
    }

    /**
     * Update navigation bar visibility based on current screen
     */
    function updateNavBar(screenName) {
        // Hide nav on welcome screen
        if (screenName === 'welcome') {
            nav.bar.classList.add('hidden');
        } else {
            nav.bar.classList.remove('hidden');
        }
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
