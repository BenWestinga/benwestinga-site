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
            count: 80,
            start: 5,
            duration: 55
        },

        {
            enemy: "stone",
            count: 15,
            start: 10,
            duration: 55
        },

        {
            enemy: "insect",
            count: 24,
            start: 15,
            duration: 45
        },


        /*
            =====================================
            ZWAARDERE ENEMIES
            =====================================
        */

        {
            enemy: "stoneThrower",
            count: 12,
            start: 60,
            duration: 60
        },

        {
            enemy: "stoneRoller",
            count: 8,
            start: 65,
            duration: 55
        },

        {
            enemy: "stoner",
            count: 2,
            start: 50,
            duration: 70
        },

        {
            enemy: "stoneBurrower",
            count: 100,
            start: 120,
            duration: 380
        },


        /*
            =====================================
            LAATSTE WAVE VOOR BOSS
            =====================================
        */

        {
            enemy: "stoneGoon",
            count: 180,
            start: 120,
            duration: 280
        },

        {
            enemy: "stone",
            count: 5,
            start: 130,
            duration: 30
        },

        {
            enemy: "insect",
            count: 20,
            start: 115,
            duration: 50
        },

        {
            enemy: "stoneThrower",
            count: 4,
            start: 115,
            duration: 50
        },


        {
            enemy: "stoneBurrower",
            count: 5,
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
            start: 160,
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