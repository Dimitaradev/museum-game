/* ============================================
   APP.JS - Main Application Controller

   Ties together all modules:
   - Data
   - Storage
   - Map
   - Game

   Handles UI interactions and screen transitions.
   ============================================ */

const App = (function() {
    // Current screen
    let currentScreen = 'home';

    // DOM references (cached on init)
    const dom = {};

    /**
     * Initialize the application
     */
    function init() {
        console.log('[App] Initializing Museum Stamp Hunt...');

        // Cache DOM references
        cacheDOMReferences();

        // Initialize modules
        Game.init({
            onStampCollected: handleStampCollected,
            onGameComplete: handleGameComplete,
            onProgressUpdate: updateHUD
        });

        // Setup event listeners
        setupEventListeners();

        // Render character selection on home screen
        renderCharacterOptions();

        // Check for saved game
        checkSavedGame();

        console.log('[App] Initialization complete');
    }

    /**
     * Cache DOM element references
     */
    function cacheDOMReferences() {
        // Screens
        dom.screenHome = document.getElementById('screen-home');
        dom.screenMap = document.getElementById('screen-map');

        // Home screen
        dom.characterOptions = document.getElementById('character-options');
        dom.btnStart = document.getElementById('btn-start');

        // HUD
        dom.hudAvatar = document.getElementById('hud-avatar');
        dom.hudName = document.getElementById('hud-name');
        dom.hudProgress = document.getElementById('hud-progress');
        dom.hudDots = document.getElementById('hud-dots');

        // Map screen
        dom.promptText = document.getElementById('prompt-text');
        dom.btnHintMap = document.getElementById('btn-hint-map');
        dom.btnInteract = document.getElementById('btn-interact');

        // Modals
        dom.modalRiddle = document.getElementById('modal-riddle');
        dom.modalStamps = document.getElementById('modal-stamps');
        dom.modalSuccess = document.getElementById('modal-success');
        dom.modalComplete = document.getElementById('modal-complete');
        dom.menuOverlay = document.getElementById('menu-overlay');

        // Riddle modal elements
        dom.riddleRoomName = document.getElementById('riddle-room-name');
        dom.modalGuideAvatar = document.getElementById('modal-guide-avatar');
        dom.modalGuideName = document.getElementById('modal-guide-name');
        dom.riddleText = document.getElementById('riddle-text');
        dom.artworkName = document.getElementById('artwork-name');
        dom.hintContent = document.getElementById('hint-content');
        dom.hintText = document.getElementById('hint-text');
        dom.answerInput = document.getElementById('answer-input');
        dom.feedback = document.getElementById('feedback');

        // Stamps modal
        dom.stampsGrid = document.getElementById('stamps-grid');
        dom.stampsCount = document.getElementById('stamps-count');
        dom.stampsTotal = document.getElementById('stamps-total');
        dom.progressCircle = document.getElementById('progress-circle');
        dom.stampsMessage = document.getElementById('stamps-message');

        // Success modal
        dom.stampCollected = document.getElementById('stamp-collected');
        dom.successMessage = document.getElementById('success-message');

        // Complete modal
        dom.finalStamps = document.getElementById('final-stamps');
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Home screen - Start button
        dom.btnStart?.addEventListener('click', startGame);

        // HUD buttons
        document.getElementById('btn-stamps')?.addEventListener('click', () => showModal('stamps'));
        document.getElementById('btn-menu')?.addEventListener('click', () => toggleMenu(true));

        // Map action buttons
        dom.btnInteract?.addEventListener('click', handleInteractClick);
        dom.btnHintMap?.addEventListener('click', showMapHint);

        // Riddle modal
        document.getElementById('btn-close-riddle')?.addEventListener('click', () => hideModal('riddle'));
        document.getElementById('btn-show-hint')?.addEventListener('click', showRiddleHint);
        document.getElementById('btn-check-answer')?.addEventListener('click', checkRiddleAnswer);
        dom.answerInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') checkRiddleAnswer();
        });

        // Stamps modal
        document.getElementById('btn-close-stamps')?.addEventListener('click', () => hideModal('stamps'));

        // Success modal
        document.getElementById('btn-continue')?.addEventListener('click', handleContinue);

        // Complete modal
        document.getElementById('btn-view-brochure')?.addEventListener('click', () => {
            hideModal('complete');
            showModal('stamps');
        });
        document.getElementById('btn-play-again')?.addEventListener('click', resetGame);

        // Menu
        document.getElementById('btn-close-menu')?.addEventListener('click', () => toggleMenu(false));
        document.getElementById('menu-home')?.addEventListener('click', goToHome);
        document.getElementById('menu-stamps')?.addEventListener('click', () => {
            toggleMenu(false);
            showModal('stamps');
        });
        document.getElementById('menu-reset')?.addEventListener('click', confirmReset);

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', () => {
                document.querySelectorAll('.modal.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            });
        });
    }

    /**
     * Render character selection options
     */
    function renderCharacterOptions() {
        if (!dom.characterOptions) return;

        const characters = window.GameData.CHARACTERS;
        dom.characterOptions.innerHTML = '';

        characters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.dataset.characterId = char.id;
            card.innerHTML = `
                <div class="avatar">${char.avatar}</div>
                <div class="name">${char.shortName}</div>
                <div class="desc">${char.description}</div>
            `;

            card.addEventListener('click', () => selectCharacter(char.id));
            dom.characterOptions.appendChild(card);
        });
    }

    /**
     * Handle character selection
     */
    function selectCharacter(characterId) {
        // Update UI
        document.querySelectorAll('.character-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.characterId === characterId);
        });

        // Enable start button
        dom.btnStart.disabled = false;
        dom.btnStart.dataset.characterId = characterId;
    }

    /**
     * Check for saved game and offer to resume
     */
    function checkSavedGame() {
        const saved = Storage.load();
        if (saved && saved.selectedCharacter && saved.completedStops?.length > 0) {
            // Auto-select the saved character
            selectCharacter(saved.selectedCharacter);

            // Could show a "Resume Game?" dialog here
            // For simplicity, we'll just let them continue
            console.log('[App] Found saved game');
        }
    }

    /**
     * Start or resume the game
     */
    function startGame() {
        const characterId = dom.btnStart.dataset.characterId;
        if (!characterId) return;

        // Try to resume or start new
        let state = Game.resume();
        if (!state || state.selectedCharacter !== characterId) {
            state = Game.startNew(characterId);
        }

        // Initialize map
        MuseumMap.init({
            onRoomEnter: handleRoomEnter
        });

        // Setup player on map
        const character = Game.getCharacter();
        MuseumMap.setPlayerAvatar(character.avatar);
        MuseumMap.setPlayerPosition(state.currentRoom);
        MuseumMap.setRoomStates(Game.getRoomStates());

        // Update HUD
        updateHUD();

        // Show map screen
        showScreen('map');

        // Show initial prompt
        updatePrompt();
    }

    /**
     * Handle when player enters a room
     */
    function handleRoomEnter(roomId, previousRoom) {
        console.log('[App] Entered room:', roomId);

        // Update game state
        Game.setCurrentRoom(roomId);

        // Update map visuals
        MuseumMap.setRoomStates(Game.getRoomStates());

        // Check if this room has an active riddle
        const canInteract = Game.canInteractWithRoom(roomId);
        dom.btnInteract.disabled = !canInteract;
        dom.btnHintMap.disabled = !canInteract;

        // Update prompt
        updatePrompt(roomId);

        // If entering a room with active riddle, show it automatically after a delay
        if (canInteract) {
            setTimeout(() => {
                openRiddle();
            }, 500);
        }
    }

    /**
     * Update the prompt text based on current state
     */
    function updatePrompt(roomId = null) {
        const room = roomId ? MuseumMap.getRoomInfo(roomId) : null;
        const status = roomId ? Game.getStopStatus(roomId) : null;

        let message = GameData.MESSAGES.tapToMove;

        if (status === 'active') {
            message = `❓ Тук има загадка! Докосни "Изследвай"`;
        } else if (status === 'completed') {
            message = '✅ Вече си разгадал тази загадка';
        } else if (status === 'locked') {
            message = '🔒 Първо реши предишните загадки';
        } else if (room) {
            message = `📍 ${room.label}`;
        }

        dom.promptText.textContent = message;
    }

    /**
     * Handle interact button click
     */
    function handleInteractClick() {
        const currentRoom = MuseumMap.getCurrentRoom();
        if (Game.canInteractWithRoom(currentRoom)) {
            openRiddle();
        }
    }

    /**
     * Open riddle modal for current stop
     */
    function openRiddle() {
        const stop = Game.getActiveStop();
        if (!stop) return;

        const character = Game.getCharacter();
        const room = MuseumMap.getRoomInfo(stop.roomId);

        // Populate modal
        dom.riddleRoomName.textContent = room?.label || stop.roomId;
        dom.modalGuideAvatar.textContent = character.avatar;
        dom.modalGuideName.textContent = `${character.name} казва:`;
        dom.riddleText.textContent = stop.riddle;
        dom.artworkName.textContent = stop.artworkName;
        dom.hintText.textContent = stop.hint;

        // Reset state
        dom.answerInput.value = '';
        dom.feedback.classList.remove('visible', 'success', 'error');
        dom.hintContent.classList.remove('visible');

        // Show hint if previously used
        if (Game.wasHintUsed()) {
            dom.hintContent.classList.add('visible');
        }

        showModal('riddle');

        // Focus input
        setTimeout(() => dom.answerInput?.focus(), 300);
    }

    /**
     * Show hint in riddle modal
     */
    function showRiddleHint() {
        const hint = Game.useHint();
        if (hint) {
            dom.hintContent.classList.add('visible');
        }
    }

    /**
     * Show hint from map button
     */
    function showMapHint() {
        const stop = Game.getActiveStop();
        if (stop) {
            // Show a quick hint in the prompt area
            dom.promptText.textContent = `💡 ${stop.hint}`;

            // Reset after a few seconds
            setTimeout(() => updatePrompt(MuseumMap.getCurrentRoom()), 5000);
        }
    }

    /**
     * Check the riddle answer
     */
    function checkRiddleAnswer() {
        const answer = dom.answerInput.value;
        if (!answer.trim()) {
            showFeedback('Моля, въведи отговор!', 'error');
            return;
        }

        const result = Game.checkAnswer(answer);

        if (result.success) {
            showFeedback(result.message, 'success');

            // Hide riddle modal after delay, show success
            setTimeout(() => {
                hideModal('riddle');
                showStampSuccess(result.stamp, result.isComplete);
            }, 1000);
        } else {
            showFeedback(result.message, 'error');
            dom.answerInput.value = '';
            dom.answerInput.focus();
        }
    }

    /**
     * Show feedback message in riddle modal
     */
    function showFeedback(message, type) {
        dom.feedback.textContent = message;
        dom.feedback.className = `feedback visible ${type}`;
    }

    /**
     * Show stamp collected success modal
     */
    function showStampSuccess(stamp, isComplete) {
        // Update success modal
        dom.stampCollected.querySelector('.stamp-icon').textContent = stamp.stampIcon;
        dom.successMessage.textContent = `Събра "${stamp.stampLabel}"!`;

        showModal('success');

        // Update map in background
        MuseumMap.setRoomStates(Game.getRoomStates());
        updateHUD();
    }

    /**
     * Handle continue after stamp success
     */
    function handleContinue() {
        hideModal('success');

        // Check if game is complete
        if (Game.isComplete()) {
            showGameComplete();
        } else {
            // Update prompt
            updatePrompt(MuseumMap.getCurrentRoom());

            // Highlight next stop room
            const nextStop = Game.getActiveStop();
            if (nextStop) {
                // Could animate camera to next room here
                dom.promptText.textContent = `➡️ Следваща спирка: ${nextStop.title}`;
            }
        }
    }

    /**
     * Handle stamp collected
     */
    function handleStampCollected(stamp) {
        console.log('[App] Stamp collected:', stamp.stampLabel);
        // Additional effects could go here (sound, vibration, etc.)
    }

    /**
     * Handle game completion
     */
    function handleGameComplete(state) {
        console.log('[App] Game complete!', state);
    }

    /**
     * Show game complete modal
     */
    function showGameComplete() {
        const stamps = Game.getStamps();

        // Populate final stamps display
        dom.finalStamps.innerHTML = stamps.map(s =>
            `<span class="stamp-icon">${s.stampIcon}</span>`
        ).join('');

        showModal('complete');
    }

    /**
     * Update HUD display
     */
    function updateHUD() {
        const character = Game.getCharacter();
        const progress = Game.getProgress();
        const route = Game.getRoute();

        if (character) {
            dom.hudAvatar.textContent = character.avatar;
            dom.hudName.textContent = character.shortName;
        }

        dom.hudProgress.textContent = `${progress.completed}/${progress.total}`;

        // Update progress dots
        dom.hudDots.innerHTML = '';
        route.forEach((stop, index) => {
            const dot = document.createElement('span');
            dot.className = 'progress-dot';

            const state = Game.getState();
            if (state.completedStops.includes(stop.id)) {
                dot.classList.add('completed');
            } else if (index === state.activeStopIndex) {
                dot.classList.add('active');
            }

            dom.hudDots.appendChild(dot);
        });
    }

    /**
     * Show stamps modal with current collection
     */
    function showModal(modalName) {
        const modal = document.getElementById(`modal-${modalName}`);
        if (!modal) return;

        // Update stamps grid if showing stamps modal
        if (modalName === 'stamps') {
            renderStampsGrid();
        }

        modal.classList.add('active');
    }

    /**
     * Hide a modal
     */
    function hideModal(modalName) {
        const modal = document.getElementById(`modal-${modalName}`);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    /**
     * Render stamps grid in brochure modal
     */
    function renderStampsGrid() {
        const stamps = Game.getStamps();
        const progress = Game.getProgress();

        // Update progress ring
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (progress.percentage / 100) * circumference;
        dom.progressCircle.style.strokeDashoffset = offset;

        // Update counts
        dom.stampsCount.textContent = progress.completed;
        dom.stampsTotal.textContent = progress.total;

        // Update message
        if (progress.isComplete) {
            dom.stampsMessage.textContent = '🎉 Събра всички печати!';
        } else {
            dom.stampsMessage.textContent = `Още ${progress.total - progress.completed} до пълна колекция`;
        }

        // Render grid
        dom.stampsGrid.innerHTML = '';
        stamps.forEach(stamp => {
            const slot = document.createElement('div');
            slot.className = `stamp-slot ${stamp.collected ? 'collected' : ''}`;
            slot.innerHTML = `
                <span class="stamp-icon">${stamp.stampIcon}</span>
                <span class="stamp-label">${stamp.stampLabel}</span>
            `;
            dom.stampsGrid.appendChild(slot);
        });
    }

    /**
     * Show screen (home or map)
     */
    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        const screen = document.getElementById(`screen-${screenName}`);
        if (screen) {
            screen.classList.add('active');
            currentScreen = screenName;
        }
    }

    /**
     * Toggle menu overlay
     */
    function toggleMenu(show) {
        dom.menuOverlay.classList.toggle('active', show);
    }

    /**
     * Go back to home screen
     */
    function goToHome() {
        toggleMenu(false);
        showScreen('home');
    }

    /**
     * Confirm and reset game
     */
    function confirmReset() {
        if (confirm('Сигурен ли си, че искаш да започнеш отначало? Всички печати ще бъдат изгубени.')) {
            resetGame();
        }
    }

    /**
     * Reset the game
     */
    function resetGame() {
        Game.reset();
        toggleMenu(false);
        hideModal('complete');

        // Re-render character options and go to home
        renderCharacterOptions();
        dom.btnStart.disabled = true;
        showScreen('home');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Public API (mainly for debugging)
    return {
        showScreen,
        showModal,
        hideModal,
        getGame: () => Game,
        getMap: () => MuseumMap
    };
})();

// Make available globally for debugging
window.App = App;

console.log('🏛️ Museum Stamp Hunt loaded!');
console.log('📝 Prototype for NBU Marketing Course');
