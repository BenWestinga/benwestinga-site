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
    number: 48,

    name: "Level 48",

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

        { enemy: "fireChainTwins", count: 5, start: 5, duration: 1},
        { enemy: "lavaGoon", count: 350, start: 20, duration: 180},
        { enemy: "fireChainTwins", count: 5, start: 50, duration: 1},
        { enemy: "fireChainTwins", count: 5, start: 100, duration: 1},
        { enemy: "fireChainTwins", count: 5, start: 150, duration: 1},
        { enemy: "fireChainTwins", count: 5, start: 200, duration: 1},
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