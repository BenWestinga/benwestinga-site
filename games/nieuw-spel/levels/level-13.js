import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";
import shielder from "../enemies/enemy-14.js";
import snakeQueen from "../enemies/enemy-15.js";
import warrior from "../enemies/enemy-16.js";

export const config = {

    number: 13,

    name: "Level 13",

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
        shielder,
        snakeQueen,
        warrior

    },

    spawnGroups: [

        { enemy: "shielder", count: 5, start: 5, duration: 35},
        { enemy: "knight", count: 10, start: 10, duration: 30},
        { enemy: "shotgunGoon", count: 5, start: 12, duration: 30},
        { enemy: "knight", count: 12, start: 55, duration: 45},
        { enemy: "shielder", count: 8, start: 55, duration: 45},
        { enemy: "shotgunGoon", count: 4, start: 65, duration: 5},
        { enemy: "shotgunGoon", count: 4, start: 90, duration: 5},
        { enemy: "shotgunGoon", count: 3, start: 110, duration: 5},
        { enemy: "shotgunGoon", count: 3, start: 130, duration: 5}

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