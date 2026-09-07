import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 26,

    name: "Level 26",

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
            count: 65,
            start: 5,
            duration: 125
        },

        {
            enemy: "stone",
            count: 30,
            start: 10,
            duration: 125
        },

        {
            enemy: "insect",
            count: 25,
            start: 15,
            duration: 120
        },

        {
            enemy: "stoneThrower",
            count: 10,
            start: 25,
            duration: 110
        },

        {
            enemy: "stoneRoller",
            count: 9,
            start: 35,
            duration: 100
        },

        {
            enemy: "stoner",
            count: 3,
            start: 55,
            duration: 80
        },

        {
            enemy: "stoneBurrower",
            count: 7,
            start: 45,
            duration: 95
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