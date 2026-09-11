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

    number: 34,

    name: "Level 34",

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

        { enemy: "snowGuy", count: 100, start: 5, duration: 200},
        { enemy: "iceGoon", count: 100, start: 5, duration: 200},
        { enemy: "snowMan", count: 14, start: 5, duration: 200},
        { enemy: "snowball", count: 100, start: 5, duration: 200},
        { enemy: "snowProtector", count: 5, start: 5, duration: 200},
        { enemy: "snowHealer", count: 5, start: 5, duration: 200},
        { enemy: "snowstorm", count: 1, start: 70, duration: 1},
        { enemy: "snowstorm", count: 1, start: 140, duration: 1}

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