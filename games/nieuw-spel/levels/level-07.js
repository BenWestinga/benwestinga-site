import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandGuy from "../enemies/enemy-06.js";
import sandBall from "../enemies/enemy-07.js";
import sandguardianWorm from "../enemies/enemy-08.js";


export const config = {

    number: 7,

    name: "Level 7",

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

        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 },
        { enemy: "", count: 0, start: 0, duration: 0 }
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