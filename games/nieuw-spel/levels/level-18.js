import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";
import snakeMachine from "../enemies/boss-03.js";
import shielder from "../enemies/enemy-14.js";
import snakeQueen from "../enemies/enemy-15.js";
import biggrassGoon from "../enemies/enemy-16.js";

export const config = {

    number: 18,

    name: "Level 18",

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
        snakeMachine,
        shielder,
        snakeQueen,
        biggrassGoon
    },


    spawnGroups: [
        { enemy: "snake", count: 10, start: 5, duration: 25},
        { enemy: "snakeQueen", count: 1, start: 5, duration: 1},
        { enemy: "knight", count: 10, start: 28, duration: 5},
        { enemy: "grassGoon", count: 100, start: 50, duration: 25},
        { enemy: "snake", count: 20, start: 50, duration: 25},
        { enemy: "snakeQueen", count: 4, start: 80, duration: 1},
        { enemy: "snake", count: 50, start: 90, duration: 50},
        { enemy: "shotgunGoon", count: 15, start: 5, duration: 130}
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