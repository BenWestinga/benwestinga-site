import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 28,

    name: "Level 28",

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
            count: 85,
            start: 5,
            duration: 155
        },

        {
            enemy: "stone",
            count: 40,
            start: 10,
            duration: 150
        },

        {
            enemy: "insect",
            count: 34,
            start: 15,
            duration: 145
        },

        {
            enemy: "stoneThrower",
            count: 14,
            start: 25,
            duration: 135
        },

        {
            enemy: "stoneRoller",
            count: 13,
            start: 30,
            duration: 130
        },

        {
            enemy: "stoner",
            count: 5,
            start: 45,
            duration: 115
        },

        {
            enemy: "stoneBurrower",
            count: 11,
            start: 35,
            duration: 125
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