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

    number: 32,

    name: "Level 32",

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

        { enemy: "snowball", count: 10, start: 5, duration: 1},
        { enemy: "snowGuy", count: 70, start: 5, duration: 20},
        { enemy: "snowball", count: 20, start: 25, duration: 5},
        { enemy: "snowGuy", count: 20, start: 30, duration: 20},
        { enemy: "snowstorm", count: 1, start: 60, duration: 1},
        { enemy: "snowGuy", count: 10, start: 50, duration: 5},
        { enemy: "iceGoon", count: 40, start: 60, duration: 30},
        { enemy: "snowball", count: 50, start: 75, duration: 25},
        { enemy: "snowMan", count: 3, start: 100, duration: 20},
        { enemy: "snowGuy", count: 20, start: 120, duration: 10},
        { enemy: "snowGuy", count: 30, start: 135, duration: 15},

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