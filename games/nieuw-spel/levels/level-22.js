import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";


export const config = {

    number: 22,

    name: "Level 22",

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
            duration: 55
        },

        {
            enemy: "insect",
            start: 15,

            formation: {
                type: "column",
                count: 20,
                side: "left",
                spacing: 60
            }
        },

        {
            enemy: "insect",
            count: 40,
            start: 5,
            duration: 55
        },

        {
            enemy: "insect",
            start: 50,

            formation: {
                type: "column",
                count: 25,
                side: "left",
                spacing: 30
            }
        },

        {
            enemy: "stone",
            count: 6,
            start: 60,
            duration: 1
        },

        {
            enemy: "stoneThrower",
            count: 10,
            start: 70,
            duration: 50
        },

        {
            enemy: "stoneGoon",
            count: 30,
            start: 90,
            duration: 50
        },

        {
            enemy: "insect",
            count: 50,
            start: 95,
            duration: 45
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