import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";
import snakeMachine from "../enemies/boss-04.js";
import shielder from "../enemies/enemy-14.js";
import snakeQueen from "../enemies/enemy-15.js";
import biggrassGoon from "../enemies/enemy-16.js";

export const config = {

    number: 20,

    name: "Level 20",

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

        { enemy: "grassGoon", count: 100, start: 5, duration: 60},
        { enemy: "biggrassGoon", count: 8, start: 5, duration: 60},
        { enemy: "knight", count: 4, start: 5, duration: 60},
        { enemy: "shotgunGoon", count: 8, start: 5, duration: 60},
        { enemy: "shielder", count: 6, start: 5, duration: 60},
        { enemy: "camoGoon", count: 30, start: 80, duration: 50},
        { enemy: "snake", count: 80, start: 100, duration: 60},
        { enemy: "snakeQueen", count: 2, start: 100, duration: 60},
        { enemy: "snake", count: 600, start: 160, duration: 800},
        { enemy: "snakeQueen", count: 1, start: 250, duration: 1},
        { enemy: "snakeQueen", count: 1, start: 400, duration: 1},
        { enemy: "snakeQueen", count: 1, start: 550, duration: 1},
        { enemy: "snakeMachine", count: 1, start: 160, duration: 1}
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