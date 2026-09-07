import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 21,

    name: "Level 21",

    startDelayMs: 5000,


    background: {

        image:
            "mountain.png",

        alpha:
            0.55,

        color:
            "#20252a"
    },


    enemyTypes: {

        stone,

        stoneGoon,

        stoneThrower,

        insect,

        stoneRoller,

        stoner,

        stoneBurrower
    },


    spawnGroups: [

        { enemy: "stoneGoon", count: 140, start: 5, duration: 95},
        { enemy: "stoneThrower", count: 8, start: 5, duration: 30},
        { enemy: "stone", count: 5, start: 40, duration: 20},
        { enemy: "stoneThrower", count: 10, start: 70, duration: 40},
        { enemy: "stoneGoon", count: 70, start: 105, duration: 35},
        { enemy: "stone", count: 8, start: 90, duration: 40},
    ]
};


export async function start(
    context = {}
) {

    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(
    context = {}
) {

    return start(
        context
    );
}


export default {
    config,
    start,
    startLevel
};