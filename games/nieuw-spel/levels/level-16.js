import grassGoon from "../enemies/enemy-09.js";
import knight from "../enemies/enemy-10.js";
import camoGoon from "../enemies/enemy-11.js";
import shotgunGoon from "../enemies/enemy-12.js";
import snake from "../enemies/enemy-13.js";
import snakeMachine from "../enemies/boss-03.js";
import shielder from "../enemies/enemy-14.js";
import snakeQueen from "../enemies/enemy-15.js";

export const config = {

    number: 16,

    name: "Level 16",

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
        snakeQueen
    },

    spawnGroups: [
        { enemy: "grassGoon", count: 200, start: 5, duration: 155},
        { enemy: "snake", count: 180, start: 5, duration: 155},
        { enemy: "camoGoon", count: 130, start: 5, duration: 155},
        { enemy: "biggrassGoon", count: 10, start: 5, duration: 155},  
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