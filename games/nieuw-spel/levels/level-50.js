/*
    ========================================
    WORLD 1
    ========================================
*/

import sandGoon
from "../enemies/enemy-01.js";


import bigsandGoon
from "../enemies/enemy-02.js";


import sandBomb
from "../enemies/enemy-03.js";


import sandShooter
from "../enemies/enemy-04.js";


import sandWorm
from "../enemies/enemy-05.js";


import sandGuy
from "../enemies/enemy-06.js";


import sandBall
from "../enemies/enemy-07.js";


import sandguardianWorm
from "../enemies/enemy-08.js";


/*
    ========================================
    WORLD 2
    ========================================
*/

import grassGoon
from "../enemies/enemy-09.js";


import knight
from "../enemies/enemy-10.js";


import camoGoon
from "../enemies/enemy-11.js";


import shotgunGoon
from "../enemies/enemy-12.js";


import snake
from "../enemies/enemy-13.js";


import shielder
from "../enemies/enemy-14.js";


import snakeQueen
from "../enemies/enemy-15.js";


import biggrassGoon
from "../enemies/enemy-16.js";


/*
    ========================================
    WORLD 3
    ========================================
*/

import stone
from "../enemies/enemy-17.js";


import stoneGoon
from "../enemies/enemy-18.js";


import stoneThrower
from "../enemies/enemy-19.js";


import insect
from "../enemies/enemy-20.js";


import stoneRoller
from "../enemies/enemy-21.js";


import stoner
from "../enemies/enemy-22.js";


import stoneBurrower
from "../enemies/enemy-23.js";


/*
    ========================================
    WORLD 4
    ========================================
*/

import iceGoon
from "../enemies/enemy-24.js";


import snowGuy
from "../enemies/enemy-25.js";


import snowMan
from "../enemies/enemy-26.js";


import snowProtector
from "../enemies/enemy-28.js";


import snowWorm
from "../enemies/enemy-29.js";


import snowHealer
from "../enemies/enemy-30.js";


import snowWarrior
from "../enemies/enemy-31.js";


import icePuller
from "../enemies/enemy-32.js";


import snowball
from "../enemies/enemy-33.js";


/*
    ========================================
    WORLD 5
    ========================================
*/

import lavaGoon
from "../enemies/enemy-34.js";


/*
    Meteor moet geregistreerd zijn,
    omdat Boss 10 deze gebruikt.
*/

import meteor
from "../enemies/enemy-35.js";


import lavaGolem, {
    lavaGolemite
} from "../enemies/enemy-37.js";


import lavaWizard
from "../enemies/enemy-38.js";


import plasmaGuy
from "../enemies/enemy-39.js";


import lavaBurrower
from "../enemies/enemy-40.js";


import emberHealer
from "../enemies/enemy-41.js";


import ashPhantom
from "../enemies/enemy-42.js";


import cinderSplitter, {
    cinder
} from "../enemies/enemy-43.js";


import fireChainTwins
from "../enemies/enemy-44.js";


/*
    ========================================
    SPAWNER EN FINAL BOSS
    ========================================
*/

import spawner
from "../enemies/enemy-45.js";


import finalLavaBen
from "../enemies/boss-10.js";


export const config = {
    number:
        50,


    name:
        "Level 50 - Final LavaBen",


    /*
        De boss verschijnt onmiddellijk.
    */

    startDelayMs:
        0,


    background: {
        image:
            "lava.png",

        alpha:
            0.68,

        color:
            "#7b170f"
    },


    /*
        LavaGolemite en cinder staan
        bewust WEL in enemyTypes.

        De Spawner kiest ze niet zelf,
        maar lavaGolem en cinderSplitter
        hebben ze nodig voor hun eigen
        split-/doodmechaniek.

        snowstorm en lavaWave staan er
        bewust NIET in, want dat zijn
        levelgevaren en geen normale
        bewegende Spawner-enemies.
    */

    enemyTypes: {
        /*
            WORLD 1
        */

        sandGoon,

        bigsandGoon,

        sandBomb,

        sandShooter,

        sandWorm,

        sandGuy,

        sandBall,

        sandguardianWorm,


        /*
            WORLD 2
        */

        grassGoon,

        knight,

        camoGoon,

        shotgunGoon,

        snake,

        shielder,

        snakeQueen,

        biggrassGoon,


        /*
            WORLD 3
        */

        stone,

        stoneGoon,

        stoneThrower,

        insect,

        stoneRoller,

        stoner,

        stoneBurrower,


        /*
            WORLD 4
        */

        iceGoon,

        snowGuy,

        snowMan,

        snowProtector,

        snowWorm,

        snowHealer,

        snowWarrior,

        icePuller,

        snowball,


        /*
            WORLD 5
        */

        lavaGoon,

        meteor,

        lavaGolem,

        lavaGolemite,

        lavaWizard,

        plasmaGuy,

        lavaBurrower,

        emberHealer,

        ashPhantom,

        cinderSplitter,

        cinder,

        fireChainTwins,


        /*
            LEVEL 50
        */

        spawner,

        finalLavaBen
    },


    /*
        Alleen Boss 10 wordt automatisch
        door het level gespawned.

        Er zijn dus geen normale
        level-enemies of andere bosses.

        Alle andere enemies verschijnen
        uitsluitend via de Spawners.
    */

    spawnGroups: [
        {
            enemy:
                "finalLavaBen",

            count:
                1,

            start:
                5,

            duration:
                0.01
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