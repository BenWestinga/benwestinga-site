import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandGuy from "../enemies/enemy-06.js";
import sandBall from "../enemies/enemy-07.js";
import sandguardianWorm from "../enemies/enemy-08.js";


export const config = {

    number: 8,

    name: "Level 8",

    startDelayMs: 5000,

    background: {
        image: "sand.png",
        alpha: 0.58,
        color: "#d8c18b"
    },

    enemyTypes: {
        sandGoon,
        bigsandGoon,
        sandBomb,
        sandShooter,
        sandWorm,
        sandGuy,
        sandBall,
        sandguardianWorm
    },

    spawnGroups: [

        { enemy: "sandBall", count: 165, start: 5, duration: 200 },
        { enemy: "bigsandGoon", count: 1, start: 20, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 40, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 60, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 80, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 100, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 120, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 140, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 160, duration: 1 },
        { enemy: "bigsandGoon", count: 1, start: 180, duration: 1 }
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