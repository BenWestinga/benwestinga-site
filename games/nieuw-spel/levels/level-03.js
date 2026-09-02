import sandGoon from "../enemies/enemy-01.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";


export const config = {

    number: 3,

    name: "Level 3",


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

        sandBomb,

        sandShooter
    },


    // ==========================================
    // LEVEL 3 SPAWNS
    // ==========================================

    spawnGroups: [

        {

            enemy:
                "sandGoon",

            count:
                65,

            start:
                5,

            duration:
                45
        },


        {

            enemy:
                "sandBomb",

            count:
                30,

            start:
                5,

            duration:
                30
        },


        {

            enemy:
                "sandShooter",

            count:
                10,

            start:
                5,

            duration:
                100
        },


        // Tweede wave

        {

            enemy:
                "sandGoon",

            count:
                65,

            start:
                60,

            duration:
                35
        },


        {

            enemy:
                "sandBomb",

            count:
                40,

            start:
                70,

            duration:
                60
        },


        {

            enemy:
                "sandShooter",

            count:
                8,

            start:
                75,

            duration:
                35
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