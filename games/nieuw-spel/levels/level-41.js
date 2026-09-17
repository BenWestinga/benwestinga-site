import lavaGoon from "../enemies/enemy-34.js";
import meteor from "../enemies/enemy-35.js";
import lavaWave from "../enemies/enemy-36.js";

import lavaGolem, {
    lavaGolemite
} from "../enemies/enemy-37.js";

import lavaWizard from "../enemies/enemy-38.js";
import plasmaGuy from "../enemies/enemy-39.js";
import lavaBen from "../enemies/boss-09.js";
import lavaBurrower from "../enemies/enemy-40.js";
import emberHealer from "../enemies/enemy-41.js";
import ashPhantom from "../enemies/enemy-42.js";



export const config = {
    number: 41,

    name: "Level 41",

    startDelayMs: 5000,

    background: {
        image: "lava.png",
        alpha: 0.58,
        color: "#9b3827"
    },

    enemyTypes: {
        lavaGoon,
        meteor,
        lavaWave,
        lavaGolem,
        lavaGolemite,
        lavaWizard,
        plasmaGuy,
        lavaBen,
        lavaBurrower,
        emberHealer,
        ashPhantom
    },

    spawnGroups: [

        { enemy: "lavaGoon", count: 40, start: 5, duration: 40},
        { enemy: "meteor", count: 18, start: 15, duration: 50},
        { enemy: "lavaWave", count: 5, start: 25, duration: 30},
        { enemy: "lavaGolem", count: 1, start: 30, duration: 10},
        { enemy: "lavaWizard", count: 2, start: 50, duration: 50},
        { enemy: "lavaGoon", count: 110, start: 60, duration: 90},
        { enemy: "meteor", count: 40, start: 80, duration: 70},
        { enemy: "lavaWave", count: 15, start: 95, duration: 55}
        
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
    return start(context);
}


export default {
    config,
    start,
    startLevel
};