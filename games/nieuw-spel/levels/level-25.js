import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";

import steenBen from "../enemies/boss-05.js";


export const config = {

    number: 25,

    name: "Level 25",

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

        {
            enemy: "stoneGoon",
            count: 45,
            start: 5,
            duration: 95
        },

        {
            enemy: "stone",
            count: 20,
            start: 10,
            duration: 95
        },

        {
            enemy: "insect",
            count: 16,
            start: 20,
            duration: 85
        },

        {
            enemy: "stoneThrower",
            count: 7,
            start: 30,
            duration: 75
        },

        {
            enemy: "stoneRoller",
            count: 6,
            start: 40,
            duration: 65
        },

        {
            enemy: "stoner",
            count: 2,
            start: 65,
            duration: 40
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 55,
            duration: 55
        },

        {
            enemy: "steenBen",
            count: 1,
            start: 125,
            duration: 1
        }
    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(context = {}) {
    return start(context);
}


export default {
    config,
    start,
    startLevel
};