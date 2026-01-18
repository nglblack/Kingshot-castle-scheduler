// Troop Statistics Data - Extracted from Datasheet

const TROOP_DATA = {
    infantry: {
        T1: { time: 12, meat: 36, wood: 27, coal: 7, iron: 2, svs: 3, koi: 1, as: 1, op: 1 },
        T2: { time: 17, meat: 58, wood: 44, coal: 10, iron: 3, svs: 4, koi: 2, as: 1, op: 2 },
        T3: { time: 24, meat: 92, wood: 69, coal: 17, iron: 4, svs: 5, koi: 3, as: 2, op: 3 },
        T4: { time: 32, meat: 120, wood: 90, coal: 21, iron: 5, svs: 8, koi: 5, as: 3, op: 4 },
        T5: { time: 44, meat: 156, wood: 117, coal: 27, iron: 6, svs: 12, koi: 7, as: 4, op: 6 },
        T6: { time: 60, meat: 186, wood: 140, coal: 33, iron: 7, svs: 18, koi: 11, as: 7, op: 9 },
        T7: { time: 83, meat: 279, wood: 210, coal: 49, iron: 11, svs: 25, koi: 16, as: 10, op: 12 },
        T8: { time: 113, meat: 558, wood: 419, coal: 98, iron: 21, svs: 35, koi: 23, as: 14, op: 17 },
        T9: { time: 131, meat: 1394, wood: 1046, coal: 244, iron: 51, svs: 45, koi: 30, as: 18, op: 22 },
        T10: { time: 152, meat: 2788, wood: 2091, coal: 488, iron: 102, svs: 60, koi: 39, as: 24, op: 30 },
        T11: { time: 180, meat: 6970, wood: 5228, coal: 1220, iron: 253, svs: 75, koi: 49, as: 30, op: 37 }
    },
    lancer: {
        T1: { time: 12, meat: 23, wood: 34, coal: 6, iron: 2 },
        T2: { time: 17, meat: 36, wood: 54, coal: 9, iron: 4 },
        T3: { time: 24, meat: 58, wood: 86, coal: 15, iron: 5 },
        T4: { time: 32, meat: 75, wood: 111, coal: 19, iron: 6 },
        T5: { time: 44, meat: 97, wood: 144, coal: 24, iron: 8 },
        T6: { time: 60, meat: 117, wood: 173, coal: 29, iron: 10 },
        T7: { time: 83, meat: 175, wood: 258, coal: 44, iron: 14 },
        T8: { time: 113, meat: 349, wood: 516, coal: 87, iron: 28 },
        T9: { time: 131, meat: 872, wood: 1290, coal: 217, iron: 70 },
        T10: { time: 152, meat: 1743, wood: 2579, coal: 433, iron: 140 },
        T11: { time: 180, meat: 4357, wood: 6448, coal: 1081, iron: 349 }
    },
    marksman: {
        T1: { time: 12, meat: 32, wood: 30, coal: 7, iron: 2 },
        T2: { time: 17, meat: 51, wood: 48, coal: 10, iron: 3 },
        T3: { time: 24, meat: 81, wood: 76, coal: 16, iron: 4 },
        T4: { time: 32, meat: 105, wood: 99, coal: 21, iron: 5 },
        T5: { time: 44, meat: 136, wood: 129, coal: 27, iron: 7 },
        T6: { time: 60, meat: 163, wood: 154, coal: 32, iron: 8 },
        T7: { time: 83, meat: 244, wood: 231, coal: 48, iron: 11 },
        T8: { time: 113, meat: 488, wood: 461, coal: 95, iron: 22 },
        T9: { time: 131, meat: 1220, wood: 1151, coal: 237, iron: 55 },
        T10: { time: 152, meat: 2440, wood: 2301, coal: 474, iron: 109 },
        T11: { time: 180, meat: 6099, wood: 5751, coal: 1185, iron: 271 }
    }
};

// Export for use in other modules
window.TROOP_DATA = TROOP_DATA;
