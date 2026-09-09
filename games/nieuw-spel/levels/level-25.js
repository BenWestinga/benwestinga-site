import stone from "../enemies/enemy-17.js";
import stoneGoon from "../enemies/enemy-18.js";
import stoneThrower from "../enemies/enemy-19.js";
import insect from "../enemies/enemy-20.js";
import stoneRoller from "../enemies/enemy-21.js";
import stoner from "../enemies/enemy-22.js";
import stoneBurrower from "../enemies/enemy-23.js";

import steenBen from "../enemies/boss-05.js";


export const config = {

    number: 25,

    name: "Level 25",

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
        stoneBurrower,
        steenBen
    },


    spawnGroups: [

        {
            enemy: "stoneGoon",
            count: 45,
            start: 5,
            duration: 45
        },

        {
            enemy: "stone",
            count: 10,
            start: 5,
            duration: 10
        },

        {
            enemy: "insect",
            count: 10,
            start: 60,
            duration: 1
        },

        {
            enemy: "stoneThrower",
            count: 3,
            start: 70,
            duration: 1
        },

         {
            enemy: "insect",
            count: 10,
            start: 80,
            duration: 1
        },

        {
            enemy: "stoneRoller",
            count: 160,
            start: 80,
            duration: 320
        },

         {
            enemy: "insect",
            count: 15,
            start: 100,
            duration: 1
        },

        {
            enemy: "stoneThrower",
            count: 8,
            start: 110,
            duration: 40
        },

        {
            enemy: "stoneGoon",
            count: 50,
            start: 120,
            duration: 20
        },

        {
            enemy: "steenBen",
            count: 1,
            start: 140,
            duration: 1
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