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
            enemy: "stoneBurrower",
            count: 5,
            start: 5,
            duration: 25
        },
        
        {
            enemy: "stoneThrower",
            count: 5,
            start: 5,
            duration: 25
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 30,
            duration: 10
        },

        {
            enemy: "insect",
            count: 30,
            start: 25,
            duration: 30
        },

        {
            enemy: "stoneThrower",
            count: 6,
            start: 40,
            duration: 20
        },

        {
            enemy: "stone",
            count: 5,
            start: 70,
            duration: 20
        },

        {
            enemy: "stoner",
            count: 1,
            start: 75,
            duration: 1
        },

        {
            enemy: "stoner",
            count: 1,
            start: 100,
            duration: 1
        },

        {
            enemy: "stoneburrower",
            count: 5,
            start: 125,
            duration: 10
        },

        {
            enemy: "insect",
            count: 80,
            start: 70,
            duration: 80
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 50,
            duration: 10
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 70,
            duration: 10
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 90,
            duration: 10
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 115,
            duration: 10
        },

        {
            enemy: "stoneGoon",
            count: 20,
            start: 130,
            duration: 10
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