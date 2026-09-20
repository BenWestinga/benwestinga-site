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
    number: 47,

    name: "Level 47",

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
        { enemy: "ashPhantom", count: 2, start: 5, duration: 5},
        { enemy: "cinderSplitter", count: 10, start: 15, duration: 1},
        { enemy: "emberHealer", count: 3, start: 40, duration: 1},
        { enemy: "ashPhantom", count: 3, start: 45, duration: 5},
        { enemy: "plasmaGuy", count: 2, start: 60, duration: 40},
        { enemy: "lavaGolem", count: 2, start: 60, duration: 40},
        { enemy: "emberHealer", count: 3, start: 70, duration: 20},
        { enemy: "lavaGoon", count: 10, start: 50, duration: 30},
        { enemy: "ashPhantom", count: 5, start: 105, duration: 5},
        { enemy: "lavaBurrower", count: 3, start: 105, duration: 15},
        { enemy: "emberHealer", count: 2, start: 110, duration: 10},
        { enemy: "meteor", count: 10, start: 5, duration: 135},
        { enemy: "lavaBurrower", count: 4, start: 120, duration: 5},
        { enemy: "lavaGoon", count: 20, start: 125, duration: 15}
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