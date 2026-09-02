import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";


export const config = {

    number: 4,

    name: "Level 4",


    // Eerste 5 seconden:
    // geen enemies
    // geen shooting

    startDelayMs:
        5000,


    // ==========================================
    // BACKGROUND
    // ==========================================

    background: {

        image:
            "sand.png",

        alpha:
            0.58,

        color:
            "#d8c18b"
    },


    // ==========================================
    // ENEMY TYPES
    // ==========================================

    enemyTypes: {

        sandGoon,

        bigsandGoon,

        sandBomb,

        sandShooter,

        sandWorm
    },


    // ==========================================
    // LEVEL 4 SPAWNS
    // ==========================================

    spawnGroups: [

        {

            enemy:
                "sandGoon",

            count:
                40,

            start:
                5,

            duration:
                35
        },


        {

            enemy:
                "sandShooter",

            count:
                4,

            start:
                15,

            duration:
                25
        },


        {

            enemy:
                "sandBomb",

            count:
                6,

            start:
                30,

            duration:
                20
        },


        // Eerste Sand Worm

        {

            enemy:
                "sandWorm",

            count:
                1,

            start:
                45,

            duration:
                8
        },


        {

            enemy:
                "bigsandGoon",

            count:
                6,

            start:
                55,

            duration:
                25
        },


        // Grote laatste wave

        {

            enemy:
                "sandGoon",

            count:
                50,

            start:
                70,

            duration:
                30
        },


        {

            enemy:
                "sandShooter",

            count:
                5,

            start:
                75,

            duration:
                25
        },


        {

            enemy:
                "sandBomb",

            count:
                7,

            start:
                75,

            duration:
                25
        },


        // Nog één worm richting het einde

        {

            enemy:
                "sandWorm",

            count:
                1,

            start:
                82,

            duration:
                15
        }
    ]
};


// ==========================================
// START LEVEL
// ==========================================

export async function start(
    context = {}
) {

    return window
        .startStoryLevel(
            config,
            context
        );
}


export async function startLevel(
    context = {}
) {

    return start(
        context
    );
}


export default {

    config,

    start,

    startLevel
};