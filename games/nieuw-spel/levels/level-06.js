import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandGuy from "../enemies/enemy-06.js";
import sandBall from "../enemies/enemy-07.js";
import sandguardianWorm from "../enemies/enemy-08.js";


export const config = {

    number: 6,

    name: "Level 6",

    startDelayMs:
        5000,


    background: {

        image:
            "sand.png",

        alpha:
            0.58,

        color:
            "#d8c18b"
    },


    enemyTypes: {

        sandGoon,

        bigsandGoon,

        sandBomb,

        sandShooter,

        sandWorm,

        sandGuy,

        sandBall,

        sandguardianWorm
    },


    spawnGroups: [

        {
            enemy: "sandBomb",
            count: 10,
            start: 5,
            duration: 10
        },

        {
            enemy: "sandWorm",
            count: 2,
            start: 5,
            duration: 120
        },

        {
            enemy: "sandGuy",
            count: 40,
            start: 10,
            duration: 80
        },

        {
            enemy: "sandGoon",
            count: 60,
            start: 20,
            duration: 80
        },

        {
            enemy: "bigsandGoon",
            count: 5,
            start: 10,
            duration: 100
        },

        {
            enemy: "sandGuy",
            start: 70,

            formation: {
                type: "column",
                count: 15,
                side: "left",
                spacing: 80
            }
        },

        {
            enemy: "sandShooter",
            count: 20,
            start: 5,
            duration: 140
        },

        {
            enemy: "sandBomb",
            count: 10,
            start: 50,
            duration: 20
        },

        {
            enemy: "sandGuy",
            start: 90,

            formation: {
                type: "column",
                count: 15,
                side: "right",
                spacing: 80
            }
        },

        {
            enemy: "bigsandGoon",
            count: 4,
            start: 100,
            duration: 20
        },

        {
            enemy: "sandBomb",
            count: 50,
            start: 90,
            duration: 50
        }
    ]
};


export async function start(
    context = {}
) {

    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(
    context = {}
) {

    return start(
        context
    );
}


export default {
    config,
    start,
    startLevel
};