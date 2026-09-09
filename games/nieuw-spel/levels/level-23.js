import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 23,

    name: "Level 23",

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
            enemy: "stone",
            count: 3,
            start: 5,
            duration: 1
        },

        {
            enemy: "stone",
            count: 3,
            start: 15,
            duration: 1
        },

        {
            enemy: "stone",
            count: 3,
            start: 25,
            duration: 1
        },

        {
            enemy: "stoneThrower",
            count: 5,
            start: 30,
            duration: 1
        },

        {
            enemy: "insect",
            count: 70,
            start: 40,
            duration: 80
        },

        {
            enemy: "stoneThrower",
            count: 5,
            start: 60,
            duration: 1
        },

        {
            enemy: "stoneThrower",
            count: 5,
            start: 85,
            duration: 1
        },

        {
            enemy: "stoneRoller",
            count: 10,
            start: 110,
            duration: 40
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