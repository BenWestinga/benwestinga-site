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

import iceTank from "../enemies/boss-08.js";


export const config = {

    number: 40,

    name: "Level 40",

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

        { enemy: "iceGoon", count: 150, start: 5, duration: 175},
        { enemy: "snowGuy", count: 30, start: 5, duration: 175},
        { enemy: "snowMan", count: 10, start: 5, duration: 175},
        { enemy: "snowball", count: 100, start: 5, duration: 175},
        { enemy: "snowProtector", count: 6, start: 5, duration: 175},
        { enemy: "snowWorm", count: 10, start: 5, duration: 175},
        { enemy: "snowHealer", count: 8, start: 5, duration: 175},
        { enemy: "snowWarrior", count: 5, start: 5, duration: 175},
        { enemy: "icePuller", count: 6, start: 5, duration: 175},
        { enemy: "iceGoon", count: 400, start: 175, duration: 200},

        { enemy: "iceTank", count: 1, start: 180, duration: 1}

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