/* ============================================
   STORAGE.JS - LocalStorage Handler

   Handles saving and loading game progress.
   All data persists even if the browser is closed.

   FUTURE INTEGRATION:
   - Replace with backend API calls
   - Add cloud sync for cross-device play
   - Implement user accounts
   ============================================ */

const Storage = (function() {
    const STORAGE_KEY = window.GameData?.GAME_CONFIG?.storageKey || 'museumStampHunt_v1';

    /**
     * Default game state structure
     */
    function getDefaultState() {
        return {
            // Selected character ID
            selectedCharacter: null,

            // Current position (room ID)
            currentRoom: 'entrance',

            // Active stop index (which riddle is current)
            activeStopIndex: 0,

            // Completed stops (array of stop IDs)
            completedStops: [],

            // Hints used (array of stop IDs where hint was shown)
            hintsUsed: [],

            // Total points earned
            points: 0,

            // Game started timestamp
            startedAt: null,

            // Game completed timestamp
            completedAt: null,

            // Last saved timestamp
            savedAt: null
        };
    }

    /**
     * Save game state to localStorage
     * @param {Object} state - The game state to save
     * @returns {boolean} - Success status
     */
    function save(state) {
        try {
            const dataToSave = {
                ...state,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
            console.log('[Storage] Game saved:', dataToSave);
            return true;
        } catch (error) {
            console.error('[Storage] Save failed:', error);
            return false;
        }
    }

    /**
     * Load game state from localStorage
     * @returns {Object|null} - Loaded state or null if none exists
     */
    function load() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                console.log('[Storage] Game loaded:', state);
                return state;
            }
            return null;
        } catch (error) {
            console.error('[Storage] Load failed:', error);
            return null;
        }
    }

    /**
     * Check if saved game exists
     * @returns {boolean}
     */
    function hasSavedGame() {
        try {
            return localStorage.getItem(STORAGE_KEY) !== null;
        } catch {
            return false;
        }
    }

    /**
     * Clear saved game data
     * @returns {boolean} - Success status
     */
    function clear() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            console.log('[Storage] Game data cleared');
            return true;
        } catch (error) {
            console.error('[Storage] Clear failed:', error);
            return false;
        }
    }

    /**
     * Get fresh default state
     * @returns {Object}
     */
    function getDefault() {
        return getDefaultState();
    }

    /**
     * Merge partial state update with existing state
     * @param {Object} updates - Partial state to merge
     * @returns {boolean} - Success status
     */
    function update(updates) {
        const current = load() || getDefaultState();
        const merged = { ...current, ...updates };
        return save(merged);
    }

    // Public API
    return {
        save,
        load,
        hasSavedGame,
        clear,
        getDefault,
        update
    };
})();

// Make available globally
window.Storage = Storage;
