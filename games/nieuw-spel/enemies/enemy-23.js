const burrowTrail = [];


/* =====================================================
   HELPERS
   ===================================================== */

function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );
}


function randomRange(
    min,
    max
) {

    return (
        min +
        Math.random() *
        (
            max -
            min
        )
    );
}


function clearBurrowTrail() {

    burrowTrail.length =
        0;
}


/* =====================================================
   TRAIL
   ===================================================== */

function addBurrowTrail(
    enemy
) {

    const state =
        enemy.stoneBurrowerState;


    if (!state) {

        return;
    }


    const r =
        state.surfaceRadius;


    burrowTrail.push({

        x:
            enemy.x +
            randomRange(
                -r * 0.35,
                r * 0.35
            ),

        y:
            enemy.y +
            randomRange(
                -r * 0.20,
                r * 0.20
            ),

        radius:
            randomRange(
                r * 0.07,
                r * 0.16
            ),

        life:
            0.55,

        maxLife:
            0.55,

        lift:
            randomRange(
                3,
                10
            )
    });
}


/* =====================================================
   NIEUW ONDERGRONDS DOEL
   ===================================================== */

function chooseBurrowTarget(
    enemy,
    api,
    definition
) {

    const canvas =
        api.getCanvas();


    const player =
        api.getPlayer();


    const angle =
        Math.random() *
        Math.PI *
        2;


    const distance =
        randomRange(

            definition
                .targetMinDistance,

            definition
                .targetMaxDistance
        );


    return {

        x:
            clamp(

                player.x +

                    Math.cos(
                        angle
                    ) *

                    distance,

                70,

                canvas.width -
                    70
            ),

        y:
            clamp(

                player.y +

                    Math.sin(
                        angle
                    ) *

                    distance,

                70,

                canvas.height -
                    70
            )
    };
}


/* =====================================================
   UNDERGROUND
   ===================================================== */

function beginUndergroundTravel(
    enemy,
    api,
    definition
) {

    const state =
        enemy.stoneBurrowerState;


    const target =
        chooseBurrowTarget(

            enemy,

            api,

            definition
        );


    state.mode =
        "underground";


    state.modeTimer =
        0;


    state.targetX =
        target.x;


    state.targetY =
        target.y;


    state.startX =
        enemy.x;


    state.startY =
        enemy.y;


    state.travelDuration =
        randomRange(

            definition
                .undergroundMinDuration,

            definition
                .undergroundMaxDuration
        );


    state.trailTimer =
        0;


    /*
        Radius bijna nul zodat bullets
        hem ondergronds praktisch niet
        kunnen raken.
    */

    enemy.radius =
        0.1;


    enemy.collidesWithPlayer =
        false;


    enemy.vx =
        0;


    enemy.vy =
        0;
}


/* =====================================================
   WARNING
   ===================================================== */

function beginWarning(
    enemy
) {

    const state =
        enemy.stoneBurrowerState;


    state.mode =
        "warning";


    state.modeTimer =
        0;


    enemy.x =
        state.targetX;


    enemy.y =
        state.targetY;


    enemy.radius =
        0.1;


    enemy.collidesWithPlayer =
        false;


    enemy.vx =
        0;


    enemy.vy =
        0;
}


/* =====================================================
   EMERGE
   ===================================================== */

function emerge(
    enemy,
    api,
    definition
) {

    const state =
        enemy.stoneBurrowerState;


    state.mode =
        "surface";


    state.modeTimer =
        0;


    enemy.radius =
        state.surfaceRadius;


    enemy.speed =
        state.surfaceSpeed;


    enemy.collidesWithPlayer =
        true;


    /*
        Als de speler nog op de
        warning staat wanneer hij
        omhoog komt: dood.
    */

    if (
        api.playerTouchesCircle(

            enemy.x,

            enemy.y,

            state.surfaceRadius *

                definition
                    .emergeHitRadiusMultiplier
        )
    ) {

        api.killPlayer();


        return;
    }


    api.aimVelocityAtPlayer(
        enemy
    );
}


/* =====================================================
   DIG DOWN
   ===================================================== */

function beginDive(
    enemy
) {

    const state =
        enemy.stoneBurrowerState;


    state.mode =
        "diving";


    state.modeTimer =
        0;


    state.diveStartRadius =
        state.surfaceRadius;


    enemy.vx =
        0;


    enemy.vy =
        0;


    enemy.collidesWithPlayer =
        false;
}


/* =====================================================
   CRACK
   ===================================================== */

function drawCrack(
    ctx,
    x,
    y,
    radius,
    angle
) {

    const middleX =

        x +

        Math.cos(
            angle
        ) *

        radius *
        0.45;


    const middleY =

        y +

        Math.sin(
            angle
        ) *

        radius *
        0.45;


    const endX =

        x +

        Math.cos(
            angle +
            0.20
        ) *

        radius *
        0.90;


    const endY =

        y +

        Math.sin(
            angle +
            0.20
        ) *

        radius *
        0.90;


    ctx.beginPath();


    ctx.moveTo(
        x,
        y
    );


    ctx.lineTo(
        middleX,
        middleY
    );


    ctx.lineTo(
        endX,
        endY
    );


    ctx.stroke();
}


/* =====================================================
   DRAW BODY
   ===================================================== */

function drawStoneBody(
    enemy,
    ctx
) {

    const state =
        enemy.stoneBurrowerState;


    const r =
        enemy.radius;


    const movementAngle =
        Math.atan2(

            enemy.vy,

            enemy.vx
        );


    const facing =

        Math.hypot(
            enemy.vx,
            enemy.vy
        ) >

        1

            ? movementAngle

            : state.bodyAngle;


    const forwardX =
        Math.cos(
            facing
        );


    const forwardY =
        Math.sin(
            facing
        );


    const sideX =
        Math.cos(

            facing +
            Math.PI /
            2
        );


    const sideY =
        Math.sin(

            facing +
            Math.PI /
            2
        );


    ctx.save();


    /*
        =========================================
        STENEN LICHAAM
        =========================================
    */

    ctx.beginPath();


    ctx.arc(

        enemy.x,

        enemy.y,

        r,

        0,

        Math.PI *
            2
    );


    ctx.fillStyle =
        "#5e656a";


    ctx.fill();


    ctx.lineWidth =
        Math.max(

            3,

            r *
                0.07
        );


    ctx.strokeStyle =
        "#d1d6da";


    ctx.stroke();


    /*
        Steenplaten.
    */

    for (
        let i =
            0;

        i <
            6;

        i++
    ) {

        const angle =

            state.bodyAngle +

            i *
            Math.PI *
            2 /
            6;


        ctx.beginPath();


        ctx.arc(

            enemy.x +

                Math.cos(
                    angle
                ) *

                r *
                0.63,


            enemy.y +

                Math.sin(
                    angle
                ) *

                r *
                0.63,


            r *
                0.19,

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =

            i %
            2 ===
            0

                ? "#80878c"

                : "#484e52";


        ctx.fill();
    }


    /*
        =========================================
        GRAAFKLAUWEN
        =========================================
    */

    for (
        const side
        of [
            -1,
            1
        ]
    ) {

        const clawX =

            enemy.x +

            forwardX *
                r *
                0.58 +

            sideX *
                side *
                r *
                0.62;


        const clawY =

            enemy.y +

            forwardY *
                r *
                0.58 +

            sideY *
                side *
                r *
                0.62;


        ctx.save();


        ctx.translate(
            clawX,
            clawY
        );


        ctx.rotate(

            facing +

            side *
                0.30
        );


        ctx.beginPath();


        ctx.moveTo(

            r *
                0.52,

            0
        );


        ctx.lineTo(

            -r *
                0.18,

            -r *
                0.31
        );


        ctx.lineTo(

            -r *
                0.04,

            0
        );


        ctx.lineTo(

            -r *
                0.18,

            r *
                0.31
        );


        ctx.closePath();


        ctx.fillStyle =
            "#969da2";


        ctx.fill();


        ctx.lineWidth =
            2;


        ctx.strokeStyle =
            "#363b3e";


        ctx.stroke();


        ctx.restore();
    }


    /*
        =========================================
        OGEN
        =========================================
    */

    for (
        const side
        of [
            -1,
            1
        ]
    ) {

        ctx.beginPath();


        ctx.arc(

            enemy.x +

                forwardX *
                    r *
                    0.45 +

                sideX *
                    side *
                    r *
                    0.20,


            enemy.y +

                forwardY *
                    r *
                    0.45 +

                sideY *
                    side *
                    r *
                    0.20,


            Math.max(

                2,

                r *
                    0.07
            ),

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =
            "#f2e7a9";


        ctx.fill();
    }


    ctx.restore();
}


/* =====================================================
   STONE BURROWER
   ===================================================== */

const stoneBurrower = {

    id:
        "stone-burrower",

    name:
        "Stone Burrower",

    behavior:
        "stone-burrower",

    hp:
        10,

    size:
        3.5,

    shape:
        "circle",


    /*
        Ondergronds snel.
    */

    speed:
        "fast",


    /*
        Boven de grond langzamer.
    */

    surfaceSpeed:
        "mediumSlow",

    tracking:
        0.55,

    color:
        "#5e656a",


    /*
        Ondergronds ongeveer
        1.15 - 1.8 sec.
    */

    undergroundMinDuration:
        1.15,

    undergroundMaxDuration:
        1.80,


    /*
        Nieuwe locatie redelijk
        dicht bij speler.
    */

    targetMinDistance:
        70,

    targetMaxDistance:
        235,


    /*
        Warning voordat hij
        omhoog komt.
    */

    warningDuration:
        0.8,


    /*
        2 sec bovengronds.
    */

    surfaceDuration:
        2,


    /*
        Tijd om weer in grond
        te verdwijnen.
    */

    diveDuration:
        0.38,


    /*
        Emergence hitbox.
    */

    emergeHitRadiusMultiplier:
        1.25,


    reset() {

        clearBurrowTrail();
    },


    onPlayerDeath() {

        clearBurrowTrail();
    },


    onLevelWin() {

        clearBurrowTrail();
    },


    /* =================================================
       SPAWN
       ================================================= */

    onSpawn(
        enemy,
        api
    ) {

        const canvas =
            api.getCanvas();


        const surfaceRadius =
            api.getEnemyRadius(
                this.size
            );


        /*
            Hij begint ergens random
            IN de arena, maar ondergronds.
        */

        enemy.x =
            randomRange(

                90,

                Math.max(

                    91,

                    canvas.width -
                        90
                )
            );


        enemy.y =
            randomRange(

                90,

                Math.max(

                    91,

                    canvas.height -
                        90
                )
            );


        enemy.enteredArena =
            true;


        enemy.stoneBurrowerState = {

            mode:
                "underground",

            modeTimer:
                0,

            surfaceRadius,

            undergroundSpeed:

                api.getEnemySpeed(
                    this.speed
                ),

            surfaceSpeed:

                api.getEnemySpeed(
                    this.surfaceSpeed
                ),

            startX:
                enemy.x,

            startY:
                enemy.y,

            targetX:
                enemy.x,

            targetY:
                enemy.y,

            travelDuration:
                1,

            trailTimer:
                0,

            bodyAngle:

                Math.random() *
                Math.PI *
                2,

            diveStartRadius:
                surfaceRadius
        };


        beginUndergroundTravel(

            enemy,

            api,

            this
        );
    },


    /* =================================================
       INVULNERABLE UNDERGROUND
       ================================================= */

    modifyDamage(
        enemy,
        damage
    ) {

        const mode =
            enemy
                .stoneBurrowerState
                ?.mode;


        /*
            Alleen tijdens surface
            kun je hem raken.
        */

        if (
            mode !==
            "surface"
        ) {

            return 0;
        }


        return damage;
    },


    /* =================================================
       TRAIL UPDATE
       ================================================= */

    beforeUpdate(
        dt
    ) {

        for (

            let i =
                burrowTrail.length -
                    1;

            i >=
                0;

            i--

        ) {

            const particle =
                burrowTrail[i];


            particle.life -=
                dt;


            particle.y -=

                particle.lift *
                dt;


            if (
                particle.life <=
                0
            ) {

                burrowTrail.splice(
                    i,
                    1
                );
            }
        }
    },


    /* =================================================
       UPDATE
       ================================================= */

    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy.stoneBurrowerState;


        if (!state) {

            return;
        }


        state.modeTimer +=
            dt;


        state.bodyAngle +=
            dt *
            0.9;


        /* =========================================
           UNDERGROUND
           ========================================= */

        if (
            state.mode ===
            "underground"
        ) {

            const progress =
                Math.min(

                    1,

                    state.modeTimer /
                        state.travelDuration
                );


            /*
                Smooth movement.
            */

            const smooth =

                progress *
                progress *

                (
                    3 -

                    2 *
                    progress
                );


            enemy.x =

                state.startX +

                (
                    state.targetX -
                    state.startX
                ) *

                smooth;


            enemy.y =

                state.startY +

                (
                    state.targetY -
                    state.startY
                ) *

                smooth;


            /*
                Steentjes achter hem.
            */

            state.trailTimer +=
                dt;


            while (
                state.trailTimer >=
                0.065
            ) {

                state.trailTimer -=
                    0.065;


                addBurrowTrail(
                    enemy
                );
            }


            if (
                progress >=
                1
            ) {

                beginWarning(
                    enemy
                );
            }


            return;
        }


        /* =========================================
           WARNING
           ========================================= */

        if (
            state.mode ===
            "warning"
        ) {

            enemy.x =
                state.targetX;


            enemy.y =
                state.targetY;


            enemy.vx =
                0;


            enemy.vy =
                0;


            if (

                state.modeTimer >=
                this.warningDuration

            ) {

                emerge(

                    enemy,

                    api,

                    this
                );
            }


            return;
        }


        /* =========================================
           SURFACE
           ========================================= */

        if (
            state.mode ===
            "surface"
        ) {

            enemy.speed =
                state.surfaceSpeed;


            api.moveTowardPlayer(

                enemy,

                dt,

                this.tracking
            );


            api.keepInsideArena(

                enemy,

                14,

                false
            );


            if (

                state.modeTimer >=
                this.surfaceDuration

            ) {

                beginDive(
                    enemy
                );
            }


            return;
        }


        /* =========================================
           DIVING
           ========================================= */

        if (
            state.mode ===
            "diving"
        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            const progress =
                Math.min(

                    1,

                    state.modeTimer /
                        this.diveDuration
                );


            /*
                Hij zakt letterlijk
                kleiner de grond in.
            */

            enemy.radius =
                Math.max(

                    0.1,

                    state.diveStartRadius *

                    (
                        1 -
                        progress
                    )
                );


            if (
                progress >=
                1
            ) {

                beginUndergroundTravel(

                    enemy,

                    api,

                    this
                );
            }
        }
    },


    /* =================================================
       TRAIL
       ================================================= */

    drawBelow(
        ctx
    ) {

        for (
            const particle
            of burrowTrail
        ) {

            const alpha =

                particle.life /
                particle.maxLife;


            ctx.save();


            ctx.globalAlpha =
                alpha;


            ctx.beginPath();


            ctx.arc(

                particle.x,

                particle.y,

                particle.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#858b8e";


            ctx.fill();


            ctx.lineWidth =
                1;


            ctx.strokeStyle =
                "#414548";


            ctx.stroke();


            ctx.restore();
        }
    },


    /* =================================================
       DRAW
       ================================================= */

    draw(
        enemy,
        ctx
    ) {

        const state =
            enemy.stoneBurrowerState;


        if (!state) {

            return;
        }


        const r =
            state.surfaceRadius;


        /* =========================================
           UNDERGROUND
           ========================================= */

        if (
            state.mode ===
            "underground"
        ) {

            const pulse =

                (
                    Math.sin(

                        state.modeTimer *
                        16
                    ) +

                    1
                ) /

                2;


            ctx.save();


            /*
                Donkere grondhoop.
            */

            ctx.beginPath();


            ctx.ellipse(

                enemy.x,

                enemy.y,

                r *
                    0.88,

                r *
                    0.40,

                0,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(42,40,38,0.68)";


            ctx.fill();


            /*
                Stenen boven de grond.
            */

            for (
                let i =
                    0;

                i <
                    5;

                i++
            ) {

                const angle =

                    state.modeTimer *

                        (
                            2.1 +

                            i *
                                0.18
                        ) +

                    i *
                    Math.PI *
                    2 /
                    5;


                const distance =

                    r *

                    (
                        0.30 +

                        i *
                        0.09
                    );


                ctx.beginPath();


                ctx.arc(

                    enemy.x +

                        Math.cos(
                            angle
                        ) *

                        distance,


                    enemy.y +

                        Math.sin(
                            angle
                        ) *

                        distance *
                        0.40 -

                        pulse *
                        3,


                    Math.max(

                        2,

                        r *

                        (
                            0.08 +

                            i *
                            0.008
                        )
                    ),

                    0,

                    Math.PI *
                        2
                );


                ctx.fillStyle =

                    i %
                    2 ===
                    0

                        ? "#969b9e"

                        : "#646a6e";


                ctx.fill();
            }


            ctx.restore();


            return;
        }


        /* =========================================
           WARNING
           ========================================= */

        if (
            state.mode ===
            "warning"
        ) {

            const progress =
                Math.min(

                    1,

                    state.modeTimer /
                        this.warningDuration
                );


            const pulse =

                (
                    Math.sin(

                        state.modeTimer *
                        24
                    ) +

                    1
                ) /

                2;


            const warningRadius =

                r *
                1.25;


            ctx.save();


            /*
                Warning circle.
            */

            ctx.beginPath();


            ctx.arc(

                enemy.x,

                enemy.y,

                warningRadius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =

                `rgba(70,70,70,${
                    0.15 +
                    pulse *
                    0.10
                })`;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =

                `rgba(225,230,232,${
                    0.45 +
                    progress *
                    0.50
                })`;


            ctx.stroke();


            /*
                Scheuren in de grond.
            */

            ctx.strokeStyle =
                "#34383a";


            ctx.lineWidth =
                3;


            for (
                let i =
                    0;

                i <
                    7;

                i++
            ) {

                drawCrack(

                    ctx,

                    enemy.x,

                    enemy.y,

                    warningRadius,

                    i *
                    Math.PI *
                    2 /
                    7 +

                    state.bodyAngle
                );
            }


            /*
                Losse stenen.
            */

            for (
                let i =
                    0;

                i <
                    6;

                i++
            ) {

                const angle =

                    i *
                    Math.PI *
                    2 /
                    6 +

                    state.bodyAngle;


                ctx.beginPath();


                ctx.arc(

                    enemy.x +

                        Math.cos(
                            angle
                        ) *

                        warningRadius *
                        0.70,


                    enemy.y +

                        Math.sin(
                            angle
                        ) *

                        warningRadius *
                        0.70,


                    r *

                    (
                        0.08 +

                        progress *
                        0.06
                    ),

                    0,

                    Math.PI *
                        2
                );


                ctx.fillStyle =
                    "#858b8f";


                ctx.fill();
            }


            ctx.restore();


            return;
        }


        /* =========================================
           DIVING
           ========================================= */

        if (
            state.mode ===
            "diving"
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.ellipse(

                enemy.x,

                enemy.y +
                    r *
                    0.42,

                r *
                    0.95,

                r *
                    0.36,

                0,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(42,40,38,0.60)";


            ctx.fill();


            ctx.restore();


            if (
                enemy.radius >
                1
            ) {

                drawStoneBody(

                    enemy,

                    ctx
                );
            }


            return;
        }


        /*
            BOVENGRONDS.
        */

        drawStoneBody(

            enemy,

            ctx
        );
    }
};


export default stoneBurrower;