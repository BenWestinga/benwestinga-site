import grassGoon
    from "../enemies/enemy-01.js";

import bigGrassGoon
    from "../enemies/enemy-02.js";

import grassBomb
    from "../enemies/enemy-03.js";


export const config = {

    number: 1,

    name: "Level 1",


    // Eerste 5 seconden:
    // geen enemies en geen shooting.
    startDelayMs:
        5000,


    background: {

        image:
            "sand.png",

        alpha:
            0.58,

        color:
            "#6f9f4d"
    },


    enemyTypes: {

        grassGoon,

        bigGrassGoon,

        grassBomb
    },


    spawnGroups: [

        /*
            40 Grass Goons
            tussen 5s en 65s.
        */

        {
            enemy:
                "grassGoon",

            count:
                40,

            start:
                5,

            duration:
                60
        },


        /*
            4 Grass Bombs
            tussen 25s en 35s.
        */

        {
            enemy:
                "grassBomb",

            count:
                4,

            start:
                25,

            duration:
                10
        },


        /*
            6 Big Grass Goons
            tussen 40s en 50s.
        */

        {
            enemy:
                "bigGrassGoon",

            count:
                6,

            start:
                40,

            duration:
                10
        },


        /*
            Laatste grote wave.

            50 Grass Goons
            tussen 80s en 130s.
        */

        {
            enemy:
                "grassGoon",

            count:
                50,

            start:
                80,

            duration:
                50
        },


        /*
            Tegelijkertijd
            8 Grass Bombs.
        */

        {
            enemy:
                "grassBomb",

            count:
                8,

            start:
                80,

            duration:
                50
        }
    ]
};


export async function start(
    context = {}
) {

    return window
        .startStoryLevel(
            config,
            context
        );
}


/*
    Voor compatibility
    met verschillende loaders.
*/

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