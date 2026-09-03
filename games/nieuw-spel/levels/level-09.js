import sandGoon from "../enemies/enemy-01.js";
import bigsandGoon from "../enemies/enemy-02.js";
import sandBomb from "../enemies/enemy-03.js";
import sandShooter from "../enemies/enemy-04.js";
import sandWorm from "../enemies/enemy-05.js";
import sandGuy from "../enemies/enemy-06.js";
import sandBall from "../enemies/enemy-07.js";
import sandguardianWorm from "../enemies/enemy-08.js";


export const config = {

    number: 9,

    name: "Level 9",

    startDelayMs: 5000,

    background: {
        image: "sand.png",
        alpha: 0.58,
        color: "#d8c18b"
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

        { enemy: "sandShooter", count: 120, start: 5, duration: 380 },
        { enemy: "sandWorm", count: 10, start: 5, duration: 200 },
        {
                    enemy: "sandGuy",
                    start: 40,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "right",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 90,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "left",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 150,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "right",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 200,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "left",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 240,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "right",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 280,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "left",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 300,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "right",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 340,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "left",
                        spacing: 80
                    }
                },
        {
                    enemy: "sandGuy",
                    start: 380,
        
                    formation: {
                        type: "column",
                        count: 15,
                        side: "right",
                        spacing: 80
                    }
                }
    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(config, context);
}


export async function startLevel(context = {}) {
    return start(context);
}


export default {
    config,
    start,
    startLevel
};