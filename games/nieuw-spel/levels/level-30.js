import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";

import steenBen from "../enemies/boss-06.js";


export const config = {

    number: 30,

    name: "Level 30",

    startDelayMs: 5000,


    background: {
        image: "mountain.png",
        alpha: 0.55,
        color: "#20252a"
    },


    enemyTypes: {
        stone,
        stoneGoon,
        stoneThrower,
        insect,
        stoneRoller,
        stoner,
        stoneBurrower,
        steenBen
    },


    spawnGroups: [

        /*
            =====================================
            EERSTE WAVE
            =====================================
        */

        {
            enemy: "stoneGoon",
            count: 65,
            start: 5,
            duration: 105
        },

        {
            enemy: "stone",
            count: 30,
            start: 10,
            duration: 105
        },

        {
            enemy: "insect",
            count: 24,
            start: 15,
            duration: 100
        },


        /*
            =====================================
            ZWAARDERE ENEMIES
            =====================================
        */

        {
            enemy: "stoneThrower",
            count: 10,
            start: 25,
            duration: 90
        },

        {
            enemy: "stoneRoller",
            count: 10,
            start: 35,
            duration: 85
        },

        {
            enemy: "stoner",
            count: 4,
            start: 50,
            duration: 70
        },

        {
            enemy: "stoneBurrower",
            count: 8,
            start: 45,
            duration: 80
        },


        /*
            =====================================
            LAATSTE WAVE VOOR BOSS
            =====================================
        */

        {
            enemy: "stoneGoon",
            count: 35,
            start: 105,
            duration: 35
        },

        {
            enemy: "stone",
            count: 20,
            start: 110,
            duration: 30
        },

        {
            enemy: "insect",
            count: 12,
            start: 115,
            duration: 25
        },

        {
            enemy: "stoneThrower",
            count: 4,
            start: 115,
            duration: 25
        },

        {
            enemy: "stoneRoller",
            count: 4,
            start: 120,
            duration: 20
        },

        {
            enemy: "stoneBurrower",
            count: 4,
            start: 120,
            duration: 20
        },


        /*
            =====================================
            BOSS 30
            =====================================
        */

        {
            enemy: "steenBen",
            count: 1,
            start: 150,
            duration: 1
        }
    ]
};


export async function start(
    context = {}
) {

    return window.startStoryLevel(
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