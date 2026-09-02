import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandShooter from "../enemies/enemy-04.js";


export const config = {

    number: 2,

    name: "Level 2",


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

        sandShooter
    },


    // ==========================================
    // LEVEL 2 SPAWNS
    // ==========================================

    spawnGroups: [

        {

            enemy:
                "sandGoon",

            count:
                45,

            start:
                5,

            duration:
                45
        },


        // Eerste kennismaking met Sand Shooter

        {

            enemy:
                "sandShooter",

            count:
                3,

            start:
                20,

            duration:
                25
        },


        {

            enemy:
                "bigsandGoon",

            count:
                8,

            start:
                40,

            duration:
                25
        },


        // Tweede helft wordt drukker

        {

            enemy:
                "sandGoon",

            count:
                70,

            start:
                55,

            duration:
                35
        },


        {

            enemy:
                "sandShooter",

            count:
                8,

            start:
                65,

            duration:
                20
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