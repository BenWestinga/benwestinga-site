import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 29,

    name: "Level 29",

    startDelayMs: 5000,


    background: {
        image: "mountain.png",
        alpha: 0.55,
        color: "#20252a"
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

        {
            enemy: "stoneGoon",
            count: 100,
            start: 5,
            duration: 175
        },

        {
            enemy: "stone",
            count: 48,
            start: 5,
            duration: 175
        },

        {
            enemy: "insect",
            count: 40,
            start: 10,
            duration: 170
        },

        {
            enemy: "stoneThrower",
            count: 17,
            start: 20,
            duration: 155
        },

        {
            enemy: "stoneRoller",
            count: 16,
            start: 25,
            duration: 150
        },

        {
            enemy: "stoner",
            count: 6,
            start: 40,
            duration: 135
        },

        {
            enemy: "stoneBurrower",
            count: 14,
            start: 30,
            duration: 145
        }
    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(context = {}) {
    return start(context);
}


export default {
    config,
    start,
    startLevel
};