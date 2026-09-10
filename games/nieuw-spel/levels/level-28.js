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
            count: 410,
            start: 5,
            duration: 200
        },

        {
            enemy: "stoneBurrower",
            count: 20,
            start: 5,
            duration: 200
        },

        {
            enemy: "insect",
            count: 100,
            start: 5,
            duration: 200
        },

        {
            enemy: "stoneThrower",
            count: 5,
            start: 50,
            duration: 20
        },

        {
            enemy: "stoneRoller",
            count: 10,
            start: 110,
            duration: 50
        },

        {
            enemy: "stoner",
            count: 3,
            start: 150,
            duration: 50
        },

        {
            enemy: "stone",
            count: 10,
            start: 190,
            duration: 60
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