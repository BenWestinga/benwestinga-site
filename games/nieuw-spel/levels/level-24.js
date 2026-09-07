import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 24,

    name: "Level 24",

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
            count: 50,
            start: 5,
            duration: 105
        },

        {
            enemy: "stone",
            count: 22,
            start: 10,
            duration: 100
        },

        {
            enemy: "insect",
            count: 20,
            start: 15,
            duration: 95
        },

        {
            enemy: "stoneThrower",
            count: 8,
            start: 25,
            duration: 85
        },

        {
            enemy: "stoneRoller",
            count: 7,
            start: 35,
            duration: 75
        },

        {
            enemy: "stoner",
            count: 2,
            start: 55,
            duration: 50
        },

        {
            enemy: "stoneBurrower",
            count: 5,
            start: 45,
            duration: 65
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