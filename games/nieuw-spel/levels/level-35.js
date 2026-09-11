import iceGoon from "../enemies/enemy-24.js";
import snowGuy from "../enemies/enemy-25.js";
import snowMan from "../enemies/enemy-26.js";
import snowball from "../enemies/enemy-33.js";
import snowstorm from "../enemies/enemy-27.js";
import snowProtector from "../enemies/enemy-28.js";
import snowWorm from "../enemies/enemy-29.js";
import snowHealer from "../enemies/enemy-30.js";
import snowWarrior from "../enemies/enemy-31.js";
import icePuller from "../enemies/enemy-32.js";

import iceTank from "../enemies/boss-07.js";


export const config = {

    number: 35,

    name: "Level 35",

    startDelayMs: 5000,

    background: {
        image: "ice.png",
        alpha: 0.58,
        color: "#dceff5"
    },

    enemyTypes: {
        iceGoon,
        snowGuy,
        snowMan,
        snowball,
        snowstorm,
        snowProtector,
        snowWorm,
        snowHealer,
        snowWarrior,
        icePuller,

        iceTank
    },

    spawnGroups: [

        { enemy: "snowHealer", count: 5, start: 5, duration: 30},
        { enemy: "snowball", count: 70, start: 5, duration: 30},

        { enemy: "snowHealer", count: 6, start: 45, duration: 30},
        { enemy: "snowball", count: 70, start: 45, duration: 30},

        { enemy: "iceGoon", count: 500, start: 80, duration: 400},
        { enemy: "snowHealer", count: 1, start: 80, duration: 30},
        { enemy: "snowHealer", count: 1, start: 160, duration: 30},
        { enemy: "snowHealer", count: 1, start: 240, duration: 30},
        { enemy: "snowMan", count: 8, start: 80, duration: 120},
        { enemy: "snowGuy", count: 20, start: 80, duration: 120},
        { enemy: "snowProtector", count: 3, start: 80, duration: 120},

        { enemy: "iceTank", count: 1, start: 200, duration: 1}

    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(config, context);
}

export async function startLevel(context = {}) {
    return start(context);
}

export default {
    config,
    start,
    startLevel
};