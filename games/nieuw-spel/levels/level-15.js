import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";
import grassBen from "../enemies/boss-03.js";
import shielder from "../enemies/enemy-14.js";

export const config = {

    number: 15,

    name: "Level 15",

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
        snake,
        grassBen,
        shielder
    },

    spawnGroups: [

        { enemy: "grassGoon", count: 100, start: 5, duration: 155},
        { enemy: "camoGoon", count: 40, start: 5, duration: 155},
        { enemy: "knight", count: 20, start: 5, duration: 155},
        { enemy: "shotgunGoon", count: 18, start: 5, duration: 155},
        { enemy: "snake", count: 150, start: 5, duration: 155},
        { enemy: "shielder", count: 10, start: 5, duration: 155},
        { enemy: "grassBen", count: 1, start: 160, duration: 1},
        { enemy: "shotgunGoon", count: 50, start: 160, duration: 260},

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