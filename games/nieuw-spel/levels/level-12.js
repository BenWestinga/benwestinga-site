import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";

export const config = {

    number: 12,

    name: "Level 12",

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

        { enemy: "snake", count: 50, start: 5, duration: 60},
        { enemy: "camoGoon", count: 20, start: 30, duration: 90},
        { enemy: "snake", count: 50, start: 100, duration: 50},
        { enemy: "grassGoon", count: 20, start: 110, duration: 40},
        { enemy: "knight", count: 12, start: 80, duration: 60}
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