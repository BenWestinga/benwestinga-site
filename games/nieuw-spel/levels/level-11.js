import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";

export const config = {

    number: 11,

    name: "Level 11",

    startDelayMs: 5000,

    background: {
        image: "grass.png",
        alpha: 0.28,
        color: "#6f9f4d"
    },

    enemyTypes: {
        grassGoon,
        knight,
        camoGoon,
        shotgunGoon,
        snake
    },

    spawnGroups: [

        { enemy: "grassGoon", count: 60, start: 5, duration: 60},
        { enemy: "knight", count: 10, start: 5, duration: 60},
        { enemy: "camoGoon", count: 8, start: 30, duration: 120},
        { enemy: "shotgunGoon", count: 12, start: 60, duration: 28},
        { enemy: "grassGoon", count: 40, start: 90, duration: 60},
        { enemy: "knight", count: 18, start: 90, duration: 60}
    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(context = {}) {
    return start(
        context
    );
}


export default {
    config,
    start,
    startLevel
};