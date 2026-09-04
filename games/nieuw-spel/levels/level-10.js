import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandGuy from "../enemies/enemy-06.js";
import sandBall from "../enemies/enemy-07.js";
import sandguardianWorm from "../enemies/enemy-08.js";

import sandBen from "../enemies/boss-02.js";


export const config = {

    number: 10,

    name: "Level 10",

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
        sandguardianWorm,
        sandBen
    },

    spawnGroups: [

        { enemy: "sandGoon", count: 50, start: 5, duration: 45},
        { enemy: "sandBomb", count: 40, start: 5, duration: 75 },
        { enemy: "bigsandGoon", count: 5, start: 5, duration: 75 },
        { enemy: "sandguardianWorm", count: 1, start: 60, duration: 1 },
        { enemy: "sandGuy", count: 60, start: 50, duration: 90 },
        { enemy: "sandShooter", count: 60, start: 60, duration: 240 },
        { enemy: "sandWorm", count: 5, start: 100, duration: 180 },
        { enemy: "sandBomb", count: 80, start: 130, duration: 170 },
        { enemy: "sandBall", count: 50, start: 5, duration: 300 },
        { enemy: "bigsandGoon", count: 40, start: 280, duration: 500 },

        {
            enemy: "sandBen",
            count: 1,
            start: 300,
            duration: 1
        }
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