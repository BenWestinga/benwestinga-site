export const config = {

    number: 16,

    name: "Level 16",

    startDelayMs: 5000,

    background: {
        image: "grass.png",
        alpha: 0.28,
        color: "#6f9f4d"
    },

    enemyTypes: {

    },

    spawnGroups: [

        /*
        {
            enemy: "grassEnemy",
            count: 20,
            start: 5,
            duration: 60
        }
        */

    ]
};


export async function start(context = {}) {
    return window.startStoryLevel(
        config,
        context
    );
}


export async function startLevel(context = {}) {
    return start(
        context
    );
}


export default {
    config,
    start,
    startLevel
};