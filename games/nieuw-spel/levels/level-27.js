import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 27,

    name: "Level 27",

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
            count: 75,
            start: 5,
            duration: 140
        },

        {
            enemy: "stone",
            count: 35,
            start: 10,
            duration: 140
        },

        {
            enemy: "insect",
            count: 30,
            start: 15,
            duration: 135
        },

        {
            enemy: "stoneThrower",
            count: 12,
            start: 25,
            duration: 120
        },

        {
            enemy: "stoneRoller",
            count: 11,
            start: 35,
            duration: 115
        },

        {
            enemy: "stoner",
            count: 4,
            start: 50,
            duration: 100
        },

        {
            enemy: "stoneBurrower",
            count: 9,
            start: 40,
            duration: 110
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