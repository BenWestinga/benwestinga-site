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
        /*
            PLAATS HIER DE ENEMY WAVES.

            Beschikbare namen:

            "lavaGoon"
            "meteor"
            "lavaWave"
            "lavaGolem"
            "lavaWizard"
            "plasmaGuy"

            Lava Golemites worden automatisch
            door een gedode Lava Golem gespawned.
            Hiervoor is geen eigen wave nodig.
        */
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