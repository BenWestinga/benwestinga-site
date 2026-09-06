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

    number: 17,

    name: "Level 17",

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

        { enemy: "biggrassGoon", count: 30, start: 5, duration: 155},
        { enemy: "knight", count: 30, start: 5, duration: 155},
        { enemy: "shotgunGoon", count: 12, start: 5, duration: 155},
        { enemy: "shielder", count: 12, start: 5, duration: 50},
        { enemy: "shielder", count: 12, start: 85, duration: 50},
        { enemy: "snakeQueen", count: 2, start: 120, duration: 1}

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