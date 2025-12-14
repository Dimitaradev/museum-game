/* ============================================
   DATA.JS - Museum Data Configuration

   This file contains all game data:
   - Characters/guides
   - Museum layout (rooms) - REALISTIC FLOOR PLAN
   - Route with riddles

   CUSTOMIZE: Modify this file to change content
   for your presentation.
   ============================================ */

/**
 * CHARACTERS / GUIDES
 * Players select one of these at the start.
 */
const CHARACTERS = [
    {
        id: 'muse',
        name: 'Златната Муза',
        shortName: 'Муза',
        description: 'Духът на изкуството',
        avatar: '👩‍🎨',
        color: '#DAA520'
    },
    {
        id: 'painter',
        name: 'Майсторът',
        shortName: 'Майстор',
        description: 'Духът на художниците',
        avatar: '👨‍🎨',
        color: '#8B4513'
    },
    {
        id: 'explorer',
        name: 'Откривателят',
        shortName: 'Откривател',
        description: 'Вечният пътешественик',
        avatar: '🧑‍🎓',
        color: '#228B22'
    }
];

/**
 * MUSEUM LAYOUT - Realistic Floor Plan
 * Based on a typical gallery layout with main corridor and exhibition halls
 *
 * SVG viewBox: 0 0 400 600 (portrait for mobile)
 * Coordinates are center points of rooms
 */
const MUSEUM_LAYOUT = {
    // Map dimensions
    viewBox: '0 0 400 650',

    // Starting point (entrance/lobby)
    entrance: {
        id: 'entrance',
        x: 200,
        y: 600,
        width: 160,
        height: 70,
        label: 'Вход',
        displayLabel: 'ВХОД',
        isEntrance: true
    },

    // Main corridors
    corridors: [
        {
            id: 'corridor-main',
            points: [
                { x: 200, y: 560 },
                { x: 200, y: 100 }
            ],
            width: 50
        },
        {
            id: 'corridor-left',
            points: [
                { x: 200, y: 350 },
                { x: 80, y: 350 }
            ],
            width: 40
        },
        {
            id: 'corridor-right',
            points: [
                { x: 200, y: 350 },
                { x: 320, y: 350 }
            ],
            width: 40
        }
    ],

    // Exhibition rooms - arranged realistically
    rooms: [
        // Ground floor - near entrance
        {
            id: 'room-19',
            x: 80,
            y: 480,
            width: 100,
            height: 90,
            label: 'Зала 19',
            displayNumber: '19',
            theme: 'Възраждане'
        },
        {
            id: 'room-20',
            x: 320,
            y: 480,
            width: 100,
            height: 90,
            label: 'Зала 20',
            displayNumber: '20',
            theme: 'Пейзажи'
        },

        // Middle section
        {
            id: 'room-21',
            x: 80,
            y: 350,
            width: 100,
            height: 100,
            label: 'Зала 21',
            displayNumber: '21',
            theme: 'Портрети'
        },
        {
            id: 'room-22',
            x: 320,
            y: 350,
            width: 100,
            height: 100,
            label: 'Зала 22',
            displayNumber: '22',
            theme: 'Народен бит'
        },

        // Upper section
        {
            id: 'room-23',
            x: 80,
            y: 220,
            width: 100,
            height: 90,
            label: 'Зала 23',
            displayNumber: '23',
            theme: 'Модернизъм'
        },
        {
            id: 'room-24',
            x: 320,
            y: 220,
            width: 100,
            height: 90,
            label: 'Зала 24',
            displayNumber: '24',
            theme: 'Литература'
        },

        // Top - main gallery
        {
            id: 'room-25',
            x: 200,
            y: 80,
            width: 180,
            height: 100,
            label: 'Зала 25',
            displayNumber: '25',
            theme: 'Главна галерия',
            isMainHall: true
        }
    ],

    // Waypoints for player navigation (invisible path nodes)
    waypoints: {
        'entrance': { x: 200, y: 580, connections: ['wp-main-1'] },
        'wp-main-1': { x: 200, y: 480, connections: ['entrance', 'room-19', 'room-20', 'wp-main-2'] },
        'wp-main-2': { x: 200, y: 350, connections: ['wp-main-1', 'room-21', 'room-22', 'wp-main-3'] },
        'wp-main-3': { x: 200, y: 220, connections: ['wp-main-2', 'room-23', 'room-24', 'wp-main-4'] },
        'wp-main-4': { x: 200, y: 120, connections: ['wp-main-3', 'room-25'] },
        'room-19': { x: 80, y: 480, connections: ['wp-main-1'] },
        'room-20': { x: 320, y: 480, connections: ['wp-main-1'] },
        'room-21': { x: 80, y: 350, connections: ['wp-main-2'] },
        'room-22': { x: 320, y: 350, connections: ['wp-main-2'] },
        'room-23': { x: 80, y: 220, connections: ['wp-main-3'] },
        'room-24': { x: 320, y: 220, connections: ['wp-main-3'] },
        'room-25': { x: 200, y: 80, connections: ['wp-main-4'] }
    }
};

/**
 * ROUTE - The game's sequence of stops
 */
const ROUTE = [
    {
        id: 1,
        roomId: 'room-19',
        title: 'Тайната на Ратая',
        artworkName: 'Ратай – Иван Мърквичка',
        riddle: 'В сянката на дървото, след дълъг ден на полето, селянин е намерил покой. Слънцето огрява златните ниви наоколо. Кой чешки майстор, станал българин по душа, е уловил този миг?',
        hint: 'Името му започва с буквата "М" и е един от основателите на българската живопис.',
        correctAnswer: 'мърквичка',
        alternativeAnswers: ['марквичка', 'mrkvicka', 'mrkvička', 'мръквичка'],
        stampIcon: '🌾',
        stampLabel: 'Ратай',
        points: 100
    },
    {
        id: 2,
        roomId: 'room-21',
        title: 'Момичето с книгата',
        artworkName: 'Четящо момиче – Иван Мърквичка',
        riddle: 'Тя е потънала в страници, светлината нежно докосва лицето ѝ. Какво държи момичето в ръцете си?',
        hint: 'Предметът се състои от много страници с текст.',
        correctAnswer: 'книга',
        alternativeAnswers: ['книгата', 'book'],
        stampIcon: '📖',
        stampLabel: 'Четене',
        points: 100
    },
    {
        id: 3,
        roomId: 'room-22',
        title: 'Хоро на поляната',
        artworkName: 'Ръченица – Иван Мърквичка',
        riddle: 'Музиката свири, краката подскачат! Този български народен танц е бърз и весел. Как се казва танцът?',
        hint: 'Името му е свързано с движение на ръцете.',
        correctAnswer: 'ръченица',
        alternativeAnswers: ['rachenitsa', 'ruchenitsa', 'ръченицата'],
        stampIcon: '💃',
        stampLabel: 'Танц',
        points: 100
    },
    {
        id: 4,
        roomId: 'room-24',
        title: 'Портрет на велик българин',
        artworkName: 'Портрет на Иван Вазов',
        riddle: 'Той е патриархът на българската литература, написал "Под игото". Как се казва този велик писател?',
        hint: 'Името му е Иван, а фамилията му започва с "В".',
        correctAnswer: 'вазов',
        alternativeAnswers: ['иван вазов', 'vazov', 'ivan vazov'],
        stampIcon: '✒️',
        stampLabel: 'Поезия',
        points: 100
    },
    {
        id: 5,
        roomId: 'room-25',
        title: 'Легенда за Балкана',
        artworkName: 'Балканска легенда – Цанко Лавренов',
        riddle: 'Планината е свещена, пълна с легенди и митове. Коя планина е в сърцето на българските легенди?',
        hint: 'Друго име за нея е "Стара планина".',
        correctAnswer: 'балкан',
        alternativeAnswers: ['балкана', 'стара планина', 'balkan'],
        stampIcon: '⛰️',
        stampLabel: 'Легенда',
        points: 100
    }
];

/**
 * MESSAGES - UI text
 */
const MESSAGES = {
    correct: [
        '🎉 Браво! Правилно!',
        '✨ Отлично! Печатът е твой!',
        '🌟 Точно така!'
    ],
    incorrect: [
        '❌ Не съвсем... Опитай пак!',
        '🤔 Близо, но не точно.',
        '💭 Помисли още малко...'
    ],
    tapToMove: 'Докосни стая, за да се придвижиш',
    cannotEnter: 'Тази стая е заключена',
    alreadyCompleted: 'Вече си разгадал тази загадка',
    enterRoom: 'Влез в {room}'
};

/**
 * GAME CONFIG
 */
const GAME_CONFIG = {
    playerMoveTime: 600,
    celebrationTime: 2000,
    allowSkipStops: false,
    storageKey: 'museumStampHunt_v2'
};

// Make data available globally
window.GameData = {
    CHARACTERS,
    MUSEUM_LAYOUT,
    ROUTE,
    MESSAGES,
    GAME_CONFIG
};
