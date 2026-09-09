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
            enemy: "stoneRoller",
            count: 5,
            start: 5,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 10,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 18,
            duration: 2
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 23,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 28,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 35,
            duration: 2
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 42,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 50,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 60,
            duration: 2
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 68,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 75,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 80,
            duration: 2
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 90,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 100,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 120,
            duration: 2
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 130,
            duration: 0
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 130,
            duration: 10
        },

        {
            enemy: "stoneRoller",
            count: 5,
            start: 140,
            duration: 2
        },


        
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