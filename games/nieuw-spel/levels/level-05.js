import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandBen from "../enemies/boss-01.js";


export const config = {

    number: 5,

    name: "Level 5",

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

        sandBen
    },


    spawnGroups: [

        {
            enemy: "sandWorm",
            count: 4,
            start: 5,
            duration: 1
        },


        {
            enemy: "sandBomb",
            count: 30,
            start: 10,
            duration: 60
        },


        {
            enemy: "sandShooter",
            count: 10,
            start: 35,
            duration: 35
        },


        {
            enemy: "bigsandGoon",
            count: 5,
            start: 5,
            duration: 80
        },


        {
            enemy: "sandWorm",
            count: 2,
            start: 80,
            duration: 1
        },


        {
            enemy: "sandBomb",
            count: 60,
            start: 100,
            duration: 50
        },


        {
            enemy: "sandShooter",
            count: 150,
            start: 150,
            duration: 600
        },


        {
            enemy: "sandBen",
            count: 1,
            start: 150,
            duration: 1
        }
    ]
};


export async function start(
    context = {}
) {

    return window
        .startStoryLevel(
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