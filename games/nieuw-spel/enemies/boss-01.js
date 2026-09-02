export default {

    // ==========================================
    // BASIC
    // ==========================================

    id:
        "sand-ben",

    name:
        "Sand-Ben",

    behavior:
        "sand-boss",

    boss:
        true,


    // ==========================================
    // LOOK
    // ==========================================

    size:
        6,

    shape:
        "circle",

    image:
        "Ben.png",

    color:
        "#e0bd38",

    borderColor:
        "#ffffff",

    borderWidth:
        4,


    // ==========================================
    // HEALTH
    // ==========================================

    hp:
        200,

    alwaysShowHealthBar:
        true,

    hideWorldHealthBar:
        true,


    // ==========================================
    // MOVEMENT
    // ==========================================

    speed:
        "ultraSlow",

    tracking:
        0.1,

    stayInsideArena:
        true,


    // ==========================================
    // EXTRA SAND GOONS
    // ==========================================

    minionEnemy:
        "sandGoon",

    minionInterval:
        1,


    // ==========================================
    // ATTACK SYSTEM
    // ==========================================

    attackSystem: {

        cycleDuration:
            60,

        phaseDuration:
            15,

        lowHealthThreshold:
            75
    },


    // ==========================================
    // ATTACK 1
    //
    // ROCK BALLS
    // ==========================================

    attack1: {

        id:
            "rock-barrage",

        duration:
            15,

        shots:
            6,

        projectileSize:
            2,

        projectileSpeed:
            300,

        projectileImage:
            "rock.png",

        projectileColor:
            "#e0bd38",

        maxBounces:
            2,

        instantKill:
            true
    },


    // ==========================================
    // ATTACK 2
    //
    // CHARGE
    // ==========================================

    attack2: {

        id:
            "charge",

        duration:
            15,

        charges:
            2,

        warningDuration:
            2,

        warningFlashes:
            2,

        dashSpeed:
            700,

        wallPause:
            1,

        instantKill:
            true
    },


    // ==========================================
    // ATTACK 3
    //
    // SAND WORM THROW
    //
    // Alleen beschikbaar bij <= 75 HP
    // ==========================================

    attack3: {

        id:
            "worm-throw",

        duration:
            15,

        unlockHp:
            75,

        throws:
            1,

        warningDuration:
            2,

        projectileSize:
            5,

        projectileColor:
            "#e0bd38",

        flightDuration:
            1.25,

        targetColor:
            "rgba(0,0,0,0.60)",

        targetOutline:
            "#000000",

        targetRadius:
            46,

        spawnEnemy:
            "sandWorm",

        instantKill:
            true
    }
};