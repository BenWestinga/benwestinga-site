import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";

export const config = {

    number: 1,

    name: "Level 1",


    /*
        Eerste 5 seconden:

        geen enemies
        geen shooting
    */

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

        sandBomb
    },


    // ==========================================
    // LEVEL 1 SPAWNS
    // ==========================================

    spawnGroups: [

        {

            enemy:
                "sandGoon",

            count:
                50,

            start:
                5,

            duration:
                60
        },


        {

            enemy:
                "sandBomb",

            count:
                8,

            start:
                25,

            duration:
                15
        },

        {

            enemy:
                "bigsandGoon",

            count:
                6,

            start:
                40,

            duration:
                20
        },


        {

            enemy:
                "sandGoon",

            count:
                40,

            start:
                70,

            duration:
                30
        },

        {

            enemy:
                "sandBomb",

            count:
                6,

            start:
                70,

            duration:
                30
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