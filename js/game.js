/* ============================================
   GAME.JS - Game Logic Handler

   Handles:
   - Game state management
   - Riddle checking
   - Stamp collection
   - Progress tracking

   FUTURE INTEGRATION:
   - Server-side answer validation
   - Leaderboards
   - Achievements system
   - QR code scanning
   ============================================ */

const Game = (function() {
    // Game state
    let state = null;
    let route = [];
    let selectedCharacter = null;

    // Callbacks
    let callbacks = {
        onStampCollected: null,
        onGameComplete: null,
        onProgressUpdate: null
    };

    /**
     * Initialize game module
     * @param {Object} options - Configuration and callbacks
     */
    function init(options = {}) {
        route = window.GameData.ROUTE;
        callbacks = { ...callbacks, ...options };

        console.log('[Game] Initialized with', route.length, 'stops');
    }

    /**
     * Start a new game
     * @param {string} characterId - Selected character ID
     */
    function startNew(characterId) {
        selectedCharacter = window.GameData.CHARACTERS.find(c => c.id === characterId);

        state = Storage.getDefault();
        state.selectedCharacter = characterId;
        state.startedAt = new Date().toISOString();
        state.currentRoom = 'entrance';
        state.activeStopIndex = 0;
        state.completedStops = [];
        state.hintsUsed = [];
        state.points = 0;

        Storage.save(state);

        console.log('[Game] New game started with character:', selectedCharacter?.name);

        return state;
    }

    /**
     * Resume existing game
     * @returns {Object|null} - Loaded state or null
     */
    function resume() {
        const saved = Storage.load();
        if (saved && saved.selectedCharacter) {
            state = saved;
            selectedCharacter = window.GameData.CHARACTERS.find(
                c => c.id === saved.selectedCharacter
            );
            console.log('[Game] Resumed game:', state);
            return state;
        }
        return null;
    }

    /**
     * Get current game state
     */
    function getState() {
        return state;
    }

    /**
     * Get selected character
     */
    function getCharacter() {
        return selectedCharacter;
    }

    /**
     * Get current active stop (riddle)
     */
    function getActiveStop() {
        if (!state || state.activeStopIndex >= route.length) {
            return null;
        }
        return route[state.activeStopIndex];
    }

    /**
     * Get stop by room ID
     */
    function getStopByRoom(roomId) {
        return route.find(stop => stop.roomId === roomId);
    }

    /**
     * Get stop status for a room
     * @param {string} roomId - Room ID
     * @returns {string} - 'completed', 'active', 'locked', or 'none'
     */
    function getStopStatus(roomId) {
        const stop = getStopByRoom(roomId);
        if (!stop) return 'none';

        if (state.completedStops.includes(stop.id)) {
            return 'completed';
        }

        const activeStop = getActiveStop();
        if (activeStop && activeStop.roomId === roomId) {
            return 'active';
        }

        return 'locked';
    }

    /**
     * Build room states map for the map module
     */
    function getRoomStates() {
        const states = {};

        route.forEach(stop => {
            states[stop.roomId] = {
                status: getStopStatus(stop.roomId),
                stop: stop
            };
        });

        return states;
    }

    /**
     * Check if player can interact with a room
     * @param {string} roomId - Room ID
     */
    function canInteractWithRoom(roomId) {
        const status = getStopStatus(roomId);
        return status === 'active';
    }

    /**
     * Check answer for current riddle
     * @param {string} answer - Player's answer
     * @returns {Object} - Result with success status and message
     */
    function checkAnswer(answer) {
        const activeStop = getActiveStop();
        if (!activeStop) {
            return { success: false, message: 'Няма активна загадка' };
        }

        // Normalize answer
        const normalizedAnswer = answer.trim().toLowerCase();
        const correctAnswer = activeStop.correctAnswer.toLowerCase();

        // Check main answer
        let isCorrect = normalizedAnswer === correctAnswer ||
                       normalizedAnswer.includes(correctAnswer) ||
                       correctAnswer.includes(normalizedAnswer);

        // Check alternative answers
        if (!isCorrect && activeStop.alternativeAnswers) {
            isCorrect = activeStop.alternativeAnswers.some(alt => {
                const normalizedAlt = alt.toLowerCase();
                return normalizedAnswer === normalizedAlt ||
                       normalizedAnswer.includes(normalizedAlt) ||
                       normalizedAlt.includes(normalizedAnswer);
            });
        }

        if (isCorrect) {
            return handleCorrectAnswer(activeStop);
        } else {
            return handleIncorrectAnswer();
        }
    }

    /**
     * Handle correct answer
     */
    function handleCorrectAnswer(stop) {
        // Mark stop as completed
        state.completedStops.push(stop.id);

        // Add points
        state.points += stop.points || 100;

        // Move to next stop
        state.activeStopIndex++;

        // Check if game is complete
        const isComplete = state.activeStopIndex >= route.length;
        if (isComplete) {
            state.completedAt = new Date().toISOString();
        }

        // Save progress
        Storage.save(state);

        // Get random success message
        const messages = window.GameData.MESSAGES.correct;
        const message = messages[Math.floor(Math.random() * messages.length)];

        // Trigger callbacks
        if (callbacks.onStampCollected) {
            callbacks.onStampCollected(stop);
        }

        if (callbacks.onProgressUpdate) {
            callbacks.onProgressUpdate(getProgress());
        }

        if (isComplete && callbacks.onGameComplete) {
            callbacks.onGameComplete(state);
        }

        return {
            success: true,
            message: message,
            stamp: stop,
            isComplete: isComplete
        };
    }

    /**
     * Handle incorrect answer
     */
    function handleIncorrectAnswer() {
        const messages = window.GameData.MESSAGES.incorrect;
        const message = messages[Math.floor(Math.random() * messages.length)];

        return {
            success: false,
            message: message
        };
    }

    /**
     * Use hint for current stop
     * @returns {string|null} - Hint text or null if no active stop
     */
    function useHint() {
        const activeStop = getActiveStop();
        if (!activeStop) return null;

        // Track hint usage
        if (!state.hintsUsed.includes(activeStop.id)) {
            state.hintsUsed.push(activeStop.id);
            Storage.save(state);
        }

        return activeStop.hint;
    }

    /**
     * Check if hint was used for current stop
     */
    function wasHintUsed() {
        const activeStop = getActiveStop();
        if (!activeStop) return false;
        return state.hintsUsed.includes(activeStop.id);
    }

    /**
     * Get game progress info
     */
    function getProgress() {
        return {
            completed: state.completedStops.length,
            total: route.length,
            percentage: Math.round((state.completedStops.length / route.length) * 100),
            points: state.points,
            isComplete: state.completedStops.length >= route.length
        };
    }

    /**
     * Get all stamps (for brochure display)
     */
    function getStamps() {
        return route.map(stop => ({
            ...stop,
            collected: state.completedStops.includes(stop.id)
        }));
    }

    /**
     * Update current room in state
     * @param {string} roomId - New room ID
     */
    function setCurrentRoom(roomId) {
        state.currentRoom = roomId;
        Storage.save(state);
    }

    /**
     * Reset game (clear progress)
     */
    function reset() {
        Storage.clear();
        state = null;
        selectedCharacter = null;
        console.log('[Game] Progress reset');
    }

    /**
     * Check if game has been completed
     */
    function isComplete() {
        return state && state.completedStops.length >= route.length;
    }

    /**
     * Get route info
     */
    function getRoute() {
        return route;
    }

    // Public API
    return {
        init,
        startNew,
        resume,
        getState,
        getCharacter,
        getActiveStop,
        getStopByRoom,
        getStopStatus,
        getRoomStates,
        canInteractWithRoom,
        checkAnswer,
        useHint,
        wasHintUsed,
        getProgress,
        getStamps,
        setCurrentRoom,
        reset,
        isComplete,
        getRoute
    };
})();

// Make available globally
window.Game = Game;
