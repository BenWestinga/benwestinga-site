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
            count: 90,
            start: 5,
            duration: 180
        },

        {
            enemy: "stoneRoller",
            count: 15,
            start: 20,
            duration: 180
        },

        {
            enemy: "stoneThrower",
            count: 20,
            start: 5,
            duration: 180
        },

        {
            enemy: "insect",
            count: 90,
            start: 5,
            duration: 180
        },

        {
            enemy: "stone",
            count: 15,
            start: 5,
            duration: 180
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