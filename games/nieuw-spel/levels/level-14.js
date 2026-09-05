import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";

export const config = {

    number: 14,

    name: "Level 14",

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

        { enemy: "grassGoon", count: 30, start: 5, duration: 35},
        { enemy: "camoGoon", count: 140, start: 10, duration: 160},
        { enemy: "grassGoon", count: 30, start: 50, duration: 30},
        { enemy: "shotgunGoon", count: 12, start: 25, duration: 45},
        { enemy: "grassGoon", count: 30, start: 100, duration: 30},
        { enemy: "shotgunGoon", count: 25, start: 75, duration: 55},
        { enemy: "grassGoon", count: 30, start: 140, duration: 30},


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