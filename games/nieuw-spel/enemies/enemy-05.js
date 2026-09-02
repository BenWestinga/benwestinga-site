export default {

    id:
        "sand-worm",

    name:
        "Sand Worm",

    behavior:
        "sand-worm",

    speed:
        "medium",


    // ==========================================
    // BODY
    // ==========================================

    // Hoofd + 4 lichaamsdelen
    segmentCount:
        4,

    // IEDER deel heeft zijn eigen 4 HP
    partHp:
        4,

    headSize:
        3,

    segmentSize:
        2.3,


    // Iets donkerder geel dan
    // de gewone Sand enemies.
    headColor:
        "#c7a92f",

    segmentColor:
        "#d8bc3c",


    /*
        Klein beetje overlap zodat de
        balletjes visueel echt aan elkaar
        vast lijken te zitten.
    */

    bodyOverlap:
        4,


    // ==========================================
    // MOVEMENT
    // ==========================================

    // 3 seconden speler volgen
    chaseDuration:
        6,

    chaseTracking:
        0.4,

    // Daarna 3 seconden rond bewegen
    wanderDuration:
        2,

    // Hoe snel zijn beweging tijdens
    // de ronde fase van richting draait.
    turnSpeed:
        0.75
};