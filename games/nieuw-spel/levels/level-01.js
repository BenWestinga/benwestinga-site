import grassGoon
    from "../enemies/enemy-01.js?v=4";

import bigGrassGoon
    from "../enemies/enemy-02.js?v=4";

import grassBomb
    from "../enemies/enemy-03.js?v=4";


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

        grassGoon,

        bigGrassGoon,

        grassBomb
    },


    // ==========================================
    // LEVEL 1 SPAWNS
    // ==========================================

    spawnGroups: [

        /*
            40 Grass Goons

            Start:
            5 seconden

            Verspreid over:
            60 seconden

            Dus ongeveer tussen:
            5s - 65s
        */

        {

            enemy:
                "grassGoon",

            count:
                50,

            start:
                5,

            duration:
                60
        },


        /*
            4 Grass Bombs

            25s - 35s
        */

        {

            enemy:
                "grassBomb",

            count:
                8,

            start:
                25,

            duration:
                15
        },


        /*
            6 Big Grass Goons

            40s - 50s
        */

        {

            enemy:
                "bigGrassGoon",

            count:
                6,

            start:
                40,

            duration:
                20
        },


        /*
            Tweede grote groep:

            50 Grass Goons

            80s - 130s
        */

        {

            enemy:
                "grassGoon",

            count:
                60,

            start:
                80,

            duration:
                50
        },


        /*
            Tegelijk met bovenstaande:

            8 Grass Bombs

            80s - 130s
        */

        {

            enemy:
                "grassBomb",

            count:
                10,

            start:
                80,

            duration:
                50
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