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
import cinderSplitter, {
    cinder
} from "../enemies/enemy-43.js";
import fireChainTwins from "../enemies/enemy-44.js";




export const config = {
    number: 43,

    name: "Level 43",

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
        ashPhantom,
        cinderSplitter,
        cinder,
        fireChainTwins
    },

    spawnGroups: [

        { enemy: "lavaBurrower", count: 8, start: 5, duration: 25},
        { enemy: "meteor", count: 40, start: 10, duration: 45},
        { enemy: "plasmaGuy", count: 1, start: 50, duration: 1},
        { enemy: "lavaWizard", count: 1, start: 50, duration: 1},
        { enemy: "lavaBurrower", count: 4, start: 65, duration: 15},
        { enemy: "plasmaGuy", count: 1, start: 80, duration: 1},
        { enemy: "lavaWizard", count: 1, start: 80, duration: 1},
        { enemy: "meteor", count: 40, start: 90, duration: 60},
        { enemy: "lavaGoon", count: 100, start: 5, duration: 145},
        { enemy: "plasmaGuy", count: 1, start: 110, duration: 1},
        { enemy: "lavaWizard", count: 1, start: 110, duration: 1},
        { enemy: "lavaBurrower", count: 5, start: 125, duration: 10}
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