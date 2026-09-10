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

    number: 31,

    name: "Level 31",

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

        { enemy: "iceGoon", count: 10, start: 5, duration: 60},
        { enemy: "snowGuy", count: 8, start: 5, duration: 60},
        { enemy: "snowMan", count: 4, start: 5, duration: 60},
        { enemy: "snowball", count: 8, start: 5, duration: 60},
        { enemy: "snowstorm", count: 1, start: 50, duration: 60},
        { enemy: "snowProtector", count: 3, start: 25, duration: 50},
        { enemy: "snowWorm", count: 8, start: 80, duration: 60},
        { enemy: "snowhealer", count: 2, start: 80, duration: 60},
        { enemy: "snowWarrior", count: 6, start: 80, duration: 800},
        { enemy: "icePuller", count: 1, start: 80, duration: 1}

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