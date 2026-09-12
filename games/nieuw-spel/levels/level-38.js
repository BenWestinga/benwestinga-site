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

    number: 38,

    name: "Level 38",

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

        { enemy: "snowGuy", count: 20, start: 5, duration: 1},
        { enemy: "snowball", count: 35, start: 20, duration: 1},
        { enemy: "snowWorm", count: 2, start: 5, duration: 35},
        { enemy: "iceGoon", count: 35, start: 30, duration: 1},
        { enemy: "snowMan", count: 5, start: 5, duration: 60},
        { enemy: "snowWarrior", count: 10, start: 50, duration: 100},
        { enemy: "snowWorm", count: 5, start: 60, duration: 40},
        { enemy: "snowGuy", count: 20, start: 75, duration: 1},
        { enemy: "snowMan", count: 5, start: 100, duration: 50},
        { enemy: "icePuller", count: 3, start: 100, duration: 50},
        { enemy: "snowball", count: 50, start: 100, duration: 40},
        { enemy: "snowWarrior", count: 5, start: 110, duration: 1},
        { enemy: "iceGoon", count: 130, start: 130, duration: 30}

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