import lavaGoon from "../enemies/enemy-34.js";
import meteor from "../enemies/enemy-35.js";
import lavaWave from "../enemies/enemy-36.js";

import lavaGolem, {
    lavaGolemite
} from "../enemies/enemy-37.js";

import lavaWizard from "../enemies/enemy-38.js";
import plasmaGuy from "../enemies/enemy-39.js";


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
        plasmaGuy
    },

    spawnGroups: [

        { enemy: "lavaGoon", count: 5, start: 5, duration: 175},
        { enemy: "meteor", count: 5, start: 5, duration: 175},
        { enemy: "lavaWava", count: 5, start: 5, duration: 175},
        { enemy: "lavaGolem", count: 5, start: 5, duration: 175},
        { enemy: "lavaWizard", count: 5, start: 5, duration: 175},
        { enemy: "plasmaGuy", count: 5, start: 5, duration: 175},
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