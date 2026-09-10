import iceGoon from "../enemies/enemy-24.js";
import snowGuy from "../enemies/enemy-25.js";
import snowMan from "../enemies/enemy-26.js";
import snowball from "../enemies/snowball.js";
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

        // ENEMIES + BOSS 8 HIER

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