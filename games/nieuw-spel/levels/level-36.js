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


export const config = {

    number: 36,

    name: "Level 36",

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
        icePuller
    },

    spawnGroups: [

        { enemy: "snowstorm", count: 1, start: 5, duration: 1},
        { enemy: "iceGoon", count: 200, start: 5, duration: 50},
        { enemy: "snowWorm", count: 2, start: 40, duration: 20},
        { enemy: "snowGuy", count: 45, start: 40, duration: 60},
        { enemy: "snowHealer", count: 5, start: 75, duration: 100},
        { enemy: "snowWorm", count: 10, start: 75, duration: 65},
        { enemy: "snowstorm", count: 1, start: 100, duration: 1},
        { enemy: "snowstorm", count: 1, start: 160, duration: 1},
        { enemy: "iceGoon", count: 100, start: 120, duration: 30},
        { enemy: "snowWorm", count: 5, start: 140, duration: 1},
        { enemy: "iceGoon", count: 100, start: 170, duration: 30}

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