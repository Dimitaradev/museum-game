/* ============================================
   MAP.JS - Interactive Museum Map
   Gallery-style with photo frames
   ============================================ */

const MuseumMap = (function() {
    // DOM references
    let mapContainer = null;
    let mapWrapper = null;
    let playerMarker = null;
    let playerSprite = null;

    // State
    let currentRoom = 'entrance';
    let layout = null;
    let onRoomEnter = null;
    let roomStates = {};
    let isMoving = false;
    let frameElements = {};

    // Player positions (percentage from left)
    const playerPositions = {
        'entrance': 50,
        'room-19': 25,
        'room-20': 75,
        'room-21': 25,
        'room-22': 75,
        'room-23': 25,
        'room-24': 75,
        'room-25': 50
    };

    /**
     * Initialize the map module
     */
    function init(options = {}) {
        mapContainer = document.getElementById('map-container');
        mapWrapper = document.getElementById('map-wrapper');

        layout = window.GameData.MUSEUM_LAYOUT;
        onRoomEnter = options.onRoomEnter || (() => {});

        renderGalleryView();
        setupTouchInteractions();

        console.log('[Map] Initialized with gallery photo view');
    }

    /**
     * Render the gallery view with photo frames
     */
    function renderGalleryView() {
        if (!mapWrapper) return;

        // Clear existing content
        mapWrapper.innerHTML = '';

        // Create the gallery scene
        const scene = document.createElement('div');
        scene.className = 'gallery-scene';
        scene.id = 'gallery-scene';

        // Create wall background
        const wall = document.createElement('div');
        wall.className = 'gallery-wall';
        scene.appendChild(wall);

        // Create floor
        const floor = document.createElement('div');
        floor.className = 'gallery-floor';
        scene.appendChild(floor);

        // Create room frames container
        const framesContainer = document.createElement('div');
        framesContainer.className = 'room-frames';

        // Arrange frames in rows (like a gallery wall)
        // Row 1: Room 25 (main gallery - center, larger)
        const row1 = document.createElement('div');
        row1.className = 'frame-row center';
        row1.appendChild(createRoomFrame('room-25', true));
        framesContainer.appendChild(row1);

        // Row 2: Rooms 23 & 24
        const row2 = document.createElement('div');
        row2.className = 'frame-row';
        row2.appendChild(createRoomFrame('room-23'));
        row2.appendChild(createRoomFrame('room-24'));
        framesContainer.appendChild(row2);

        // Row 3: Rooms 21 & 22
        const row3 = document.createElement('div');
        row3.className = 'frame-row';
        row3.appendChild(createRoomFrame('room-21'));
        row3.appendChild(createRoomFrame('room-22'));
        framesContainer.appendChild(row3);

        // Row 4: Rooms 19 & 20
        const row4 = document.createElement('div');
        row4.className = 'frame-row';
        row4.appendChild(createRoomFrame('room-19'));
        row4.appendChild(createRoomFrame('room-20'));
        framesContainer.appendChild(row4);

        scene.appendChild(framesContainer);

        // Create entrance marker
        const entrance = createEntranceMarker();
        scene.appendChild(entrance);
        frameElements['entrance'] = entrance;

        // Create player character
        const player = createPlayerMarker();
        scene.appendChild(player);
        playerMarker = player;
        playerSprite = player.querySelector('.player-sprite');

        mapWrapper.appendChild(scene);

        // Set initial player position
        updatePlayerPosition('entrance', false);
    }

    /**
     * Create a room frame element with photo placeholder
     */
    function createRoomFrame(roomId, isCenter = false) {
        const room = layout.rooms.find(r => r.id === roomId);
        if (!room) return document.createElement('div');

        const frameEl = document.createElement('div');
        frameEl.className = `room-frame${isCenter ? ' center-frame' : ''}`;
        frameEl.dataset.roomId = room.id;

        // Get placeholder icon based on theme
        const placeholderIcons = {
            'room-19': '🌾',  // Възраждане - wheat/harvest
            'room-20': '🏞️',  // Пейзажи - landscape
            'room-21': '👤',  // Портрети - portrait
            'room-22': '🏠',  // Народен бит - folk life
            'room-23': '🎨',  // Модернизъм - art
            'room-24': '📚',  // Литература - books
            'room-25': '🖼️'   // Главна галерия - gallery
        };

        frameEl.innerHTML = `
            <div class="frame-border">
                <div class="frame-inner">
                    <div class="room-photo placeholder">
                        <span class="photo-placeholder-icon">${placeholderIcons[roomId] || '🖼️'}</span>
                    </div>
                    <div class="room-theme">${room.theme || ''}</div>
                </div>
            </div>
            <div class="room-number">${room.displayNumber}</div>
            <div class="room-indicator">
                <span class="indicator-icon">🔒</span>
            </div>
            <div class="room-label">${room.label}</div>
        `;

        frameElements[room.id] = frameEl;
        return frameEl;
    }

    /**
     * Create entrance marker element
     */
    function createEntranceMarker() {
        const entranceEl = document.createElement('div');
        entranceEl.className = 'entrance-marker';
        entranceEl.dataset.roomId = 'entrance';
        entranceEl.innerHTML = `
            <div class="entrance-badge">
                <span>📍</span>
                <span>ВХОД</span>
            </div>
        `;
        return entranceEl;
    }

    /**
     * Create player marker element
     */
    function createPlayerMarker() {
        const playerEl = document.createElement('div');
        playerEl.className = 'player-marker';
        playerEl.id = 'player-marker';
        playerEl.innerHTML = `
            <div class="player-shadow"></div>
            <div class="player-body">
                <div class="player-sprite" id="player-sprite">👩‍🎨</div>
            </div>
            <div class="player-name-tag" id="player-name-tag">Муза</div>
        `;
        return playerEl;
    }

    /**
     * Setup touch and click interactions
     */
    function setupTouchInteractions() {
        mapContainer.addEventListener('click', handleMapClick);
        mapContainer.addEventListener('touchend', handleMapClick, { passive: false });
    }

    /**
     * Handle click/tap on the map
     */
    function handleMapClick(event) {
        if (event.type === 'touchend') {
            event.preventDefault();
        }
        if (isMoving) return;

        const frameEl = event.target.closest('.room-frame, .entrance-marker');
        if (frameEl) {
            const roomId = frameEl.dataset.roomId;
            handleRoomTap(roomId);
        }
    }

    /**
     * Handle room tap/click
     */
    function handleRoomTap(roomId) {
        if (isMoving) return;

        const roomState = roomStates[roomId];
        if (roomState && roomState.status === 'locked') {
            pulseFrame(roomId);
            showPrompt(window.GameData.MESSAGES.cannotEnter);
            return;
        }

        movePlayerTo(roomId);
    }

    /**
     * Visual pulse effect on frame
     */
    function pulseFrame(roomId) {
        const frameEl = frameElements[roomId];
        if (!frameEl) return;

        frameEl.classList.add('shake');
        setTimeout(() => frameEl.classList.remove('shake'), 500);

        if (navigator.vibrate) {
            navigator.vibrate([50, 50, 50]);
        }
    }

    /**
     * Update player visual position
     */
    function updatePlayerPosition(roomId, animate = true) {
        if (!playerMarker) return;

        const xPos = playerPositions[roomId] || 50;

        if (!animate) {
            playerMarker.style.transition = 'none';
        }

        playerMarker.style.setProperty('--player-x', xPos + '%');

        if (!animate) {
            // Force reflow then restore transition
            playerMarker.offsetHeight;
            playerMarker.style.transition = '';
        }
    }

    /**
     * Move player to a room
     */
    function movePlayerTo(roomId) {
        if (isMoving) return;

        isMoving = true;
        const previousRoom = currentRoom;
        currentRoom = roomId;

        // Start walking animation
        if (playerMarker) {
            playerMarker.classList.add('walking');
        }

        // Move player to new position
        updatePlayerPosition(roomId, true);

        // Update current room visual
        updateCurrentFrameVisual(roomId);

        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }

        // End walking animation and trigger callback
        setTimeout(() => {
            if (playerMarker) {
                playerMarker.classList.remove('walking');
            }
            isMoving = false;
            onRoomEnter(roomId, previousRoom);
        }, 500);
    }

    /**
     * Update visual highlighting for current frame
     */
    function updateCurrentFrameVisual(roomId) {
        // Remove current class from all frames
        Object.values(frameElements).forEach(el => {
            if (el && el.classList) {
                el.classList.remove('current');
            }
        });

        // Add current class to new frame
        if (frameElements[roomId] && frameElements[roomId].classList) {
            frameElements[roomId].classList.add('current');
        }
    }

    /**
     * Set room states (locked, active, completed)
     */
    function setRoomStates(states) {
        roomStates = states;

        Object.entries(states).forEach(([roomId, state]) => {
            const frameEl = frameElements[roomId];
            if (!frameEl || !frameEl.classList) return;

            frameEl.classList.remove('locked', 'active', 'completed');
            if (state.status) {
                frameEl.classList.add(state.status);
            }

            // Update indicator icon
            const indicator = frameEl.querySelector('.indicator-icon');
            if (indicator) {
                switch (state.status) {
                    case 'completed':
                        indicator.textContent = '✅';
                        break;
                    case 'active':
                        indicator.textContent = '❓';
                        break;
                    default:
                        indicator.textContent = '🔒';
                }
            }
        });
    }

    /**
     * Set player avatar
     */
    function setPlayerAvatar(avatar) {
        if (playerSprite) {
            playerSprite.textContent = avatar;
        }
    }

    /**
     * Set player name tag
     */
    function setPlayerName(name) {
        const nameTag = document.getElementById('player-name-tag');
        if (nameTag) {
            nameTag.textContent = name;
        }
    }

    /**
     * Position player at room without animation
     */
    function setPlayerPosition(roomId) {
        currentRoom = roomId;
        updatePlayerPosition(roomId, false);
        updateCurrentFrameVisual(roomId);
    }

    /**
     * Show prompt message
     */
    function showPrompt(message) {
        const promptText = document.getElementById('prompt-text');
        if (promptText) {
            promptText.textContent = message;
        }
    }

    /**
     * Get current room ID
     */
    function getCurrentRoom() {
        return currentRoom;
    }

    /**
     * Get room info by ID
     */
    function getRoomInfo(roomId) {
        if (roomId === 'entrance') return layout.entrance;
        return layout.rooms.find(r => r.id === roomId);
    }

    /**
     * Set room photo (for future use with real images)
     * @param {string} roomId - Room ID
     * @param {string} imageUrl - URL of the image
     */
    function setRoomPhoto(roomId, imageUrl) {
        const frameEl = frameElements[roomId];
        if (!frameEl) return;

        const photoEl = frameEl.querySelector('.room-photo');
        if (photoEl) {
            photoEl.classList.remove('placeholder');
            photoEl.style.backgroundImage = `url(${imageUrl})`;
            photoEl.innerHTML = ''; // Remove placeholder icon
        }
    }

    // Public API
    return {
        init,
        movePlayerTo,
        setPlayerPosition,
        setPlayerAvatar,
        setPlayerName,
        setRoomStates,
        getCurrentRoom,
        getRoomInfo,
        showPrompt,
        setRoomPhoto
    };
})();

window.MuseumMap = MuseumMap;
