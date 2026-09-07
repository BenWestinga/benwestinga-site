let nextStoneThrowerId = 1;


function moveAngleToward(
    current,
    target,
    maxStep
) {

    let difference =
        target -
        current;


    while (
        difference >
        Math.PI
    ) {

        difference -=
            Math.PI *
            2;
    }


    while (
        difference <
        -Math.PI
    ) {

        difference +=
            Math.PI *
            2;
    }


    if (
        Math.abs(
            difference
        ) <=
        maxStep
    ) {

        return target;
    }


    return (
        current +
        Math.sign(
            difference
        ) *
        maxStep
    );
}


function drawStoneCircle(
    ctx,
    api,
    x,
    y,
    radius,
    rotation = 0
) {

    const image =
        api.getAssetImage(
            "stone.png"
        );


    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        rotation
    );


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        radius,
        0,
        Math.PI *
            2
    );


    ctx.clip();


    if (
        image &&
        image.complete &&
        image.naturalWidth >
            0
    ) {

        ctx.drawImage(
            image,
            -radius,
            -radius,
            radius *
                2,
            radius *
                2
        );

    } else {

        ctx.fillStyle =
            "#777d83";


        ctx.fillRect(
            -radius,
            -radius,
            radius *
                2,
            radius *
                2
        );
    }


    ctx.restore();


    ctx.save();


    ctx.beginPath();


    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI *
            2
    );


    ctx.lineWidth =
        Math.max(
            2,
            radius *
                0.12
        );


    ctx.strokeStyle =
        "#d0d5d9";


    ctx.stroke();


    ctx.restore();
}


/* =====================================================
   GEGooide STONE
   ===================================================== */

const thrownStoneDefinition = {

    id:
        "stone-thrower-ball",

    name:
        "Thrown Stone",

    behavior:
        "stone-thrower-ball",

    hp:
        5,

    size:
        1,

    shape:
        "circle",

    color:
        "#7b8085",

    collidesWithPlayer:
        true,


    update(
        stone,
        dt,
        api
    ) {

        const state =
            stone.thrownStoneState;


        if (!state) {

            return;
        }


        stone.x +=
            stone.vx *
            dt;


        stone.y +=
            stone.vy *
            dt;


        state.rotation +=

            (
                stone.speed /
                Math.max(
                    1,
                    stone.radius
                )
            ) *

            dt;


        state.pickupDelay =
            Math.max(
                0,
                state.pickupDelay -
                    dt
            );


        /*
            Steen bouncet oneindig.
        */

        api.keepInsideArena(
            stone,
            4,
            true
        );


        if (
            state.pickupDelay >
            0
        ) {

            return;
        }


        /*
            Zoek zijn eigen Stone Thrower.
        */

        const owner =

            api.getEnemies()
                .find(

                    enemy =>

                        enemy &&
                        enemy.id ===
                            state.ownerEntityId &&
                        enemy.definition
                            ?.id ===
                            "stone-thrower"
                );


        if (
            !owner ||
            !api.isEnemyAlive(
                owner
            )
        ) {

            return;
        }


        const ownerState =
            owner.stoneThrowerState;


        if (
            !ownerState ||
            ownerState
                .carriedStones >=
                2
        ) {

            return;
        }


        const distance =
            Math.hypot(

                stone.x -
                    owner.x,

                stone.y -
                    owner.y
            );


        const pickupRadius =

            owner.radius +
            stone.radius +
            18;


        /*
            Komt de steen weer dichtbij
            de Stone Thrower?

            Dan pakt hij hem terug.
        */

        if (
            distance <=
            pickupRadius
        ) {

            ownerState
                .carriedStones++;


            ownerState
                .pickupFlash =
                0.25;


            api.removeEnemy(
                stone
            );
        }
    },


    draw(
        stone,
        ctx,
        api
    ) {

        drawStoneCircle(
            ctx,
            api,
            stone.x,
            stone.y,
            stone.radius,
            stone
                .thrownStoneState
                ?.rotation ||
                0
        );
    }
};


/* =====================================================
   STONE GOOIEN
   ===================================================== */

function throwStone(
    enemy,
    api,
    definition
) {

    const state =
        enemy.stoneThrowerState;


    if (
        !state ||
        state.carriedStones <=
            0
    ) {

        return;
    }


    const player =
        api.getPlayer();


    const dx =
        player.x -
        enemy.x;


    const dy =
        player.y -
        enemy.y;


    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;


    /*
        Steen beweegt iets sneller
        dan Stone Thrower.
    */

    const speed =

        enemy.speed *

        definition
            .stoneSpeedMultiplier;


    const radius =
        api.getEnemyRadius(
            definition.stoneSize
        );


    const startDistance =

        enemy.radius +
        radius +
        5;


    const stone =
        api.createEntity(

            thrownStoneDefinition,

            {
                x:

                    enemy.x +

                    (
                        dx /
                        distance
                    ) *

                    startDistance,

                y:

                    enemy.y +

                    (
                        dy /
                        distance
                    ) *

                    startDistance
            },

            {
                type:
                    "stone-thrower-ball",

                hp:
                    definition
                        .stoneHp,

                maxHp:
                    definition
                        .stoneHp,

                size:
                    definition
                        .stoneSize,

                radius,

                speed,

                vx:

                    (
                        dx /
                        distance
                    ) *

                    speed,

                vy:

                    (
                        dy /
                        distance
                    ) *

                    speed,

                enteredArena:
                    true,

                collidesWithPlayer:
                    true,

                stoneThrowerProjectile:
                    true,

                thrownStoneState: {

                    ownerEntityId:
                        enemy.id,

                    pickupDelay:
                        0.75,

                    rotation:

                        Math.random() *
                        Math.PI *
                        2
                }
            }
        );


    /*
        createEntity voegt hem niet
        automatisch toe.
    */

    api.getEnemies()
        .push(
            stone
        );


    state.carriedStones--;


    state.throwCooldown =
        definition
            .throwCooldown;


    state.throwFlash =
        0.22;
}


/* =====================================================
   STONE THROWER
   ===================================================== */

const stoneThrower = {

    id:
        "stone-thrower",

    name:
        "Stone Thrower",

    behavior:
        "stone-thrower",

    hp:
        14,

    size:
        5,

    shape:
        "circle",

    speed:
        "fast",

    tracking:
        0.8,

    color:
        "#737a80",


    /*
        Zelfde soort movement als
        Big Sand / Big Grass Goon.
    */

    chaseDuration:
        12,

    straightDuration:
        4,


    /*
        Attack.
    */

    throwRadius:
        420,

    throwCooldown:
        5,

    carriedStoneCount:
        2,


    /*
        Gegooide stenen.
    */

    stoneHp:
        5,

    stoneSize:
        1,

    stoneSpeedMultiplier:
        1.18,


    reset() {

        nextStoneThrowerId =
            1;
    },


    onSpawn(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        enemy.stoneThrowerId =
            nextStoneThrowerId++;


        enemy.stoneThrowerState = {

            movementTimer:
                0,

            movementMode:
                "chase",

            carriedStones:
                this.carriedStoneCount,

            throwCooldown:
                0,

            throwFlash:
                0,

            pickupFlash:
                0,

            bodyAngle:

                Math.atan2(

                    player.y -
                        enemy.y,

                    player.x -
                        enemy.x
                ),

            armorRotation:

                Math.random() *
                Math.PI *
                2
        };


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy.stoneThrowerState;


        if (!state) {

            return;
        }


        state.throwCooldown =
            Math.max(

                0,

                state.throwCooldown -
                    dt
            );


        state.throwFlash =
            Math.max(

                0,

                state.throwFlash -
                    dt
            );


        state.pickupFlash =
            Math.max(

                0,

                state.pickupFlash -
                    dt
            );


        state.armorRotation +=
            dt *
            0.8;


        const player =
            api.getPlayer();


        const targetAngle =
            Math.atan2(

                player.y -
                    enemy.y,

                player.x -
                    enemy.x
            );


        state.bodyAngle =
            moveAngleToward(

                state.bodyAngle,

                targetAngle,

                4.2 *
                dt
            );


        /* =========================================
           MOVEMENT
           ========================================= */

        state.movementTimer +=
            dt;


        if (
            state.movementMode ===
            "chase"
        ) {

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );


            if (

                state.movementTimer >=
                this.chaseDuration

            ) {

                state.movementTimer =
                    0;


                state.movementMode =
                    "straight";


                const length =
                    Math.hypot(

                        enemy.vx,

                        enemy.vy
                    ) || 1;


                enemy.vx =

                    (
                        enemy.vx /
                        length
                    ) *

                    enemy.speed;


                enemy.vy =

                    (
                        enemy.vy /
                        length
                    ) *

                    enemy.speed;
            }

        } else {

            api.moveStraight(
                enemy,
                dt
            );


            if (

                state.movementTimer >=
                this.straightDuration

            ) {

                state.movementTimer =
                    0;


                state.movementMode =
                    "chase";
            }
        }


        if (
            api.isInsideArena(
                enemy
            )
        ) {

            enemy.enteredArena =
                true;
        }


        if (
            enemy.enteredArena
        ) {

            api.keepInsideArena(

                enemy,

                14,

                state.movementMode ===
                    "straight"
            );
        }


        /* =========================================
           GOOIEN
           ========================================= */

        if (
            !enemy.enteredArena ||
            state.carriedStones <=
                0 ||
            state.throwCooldown >
                0
        ) {

            return;
        }


        const distanceToPlayer =
            Math.hypot(

                player.x -
                    enemy.x,

                player.y -
                    enemy.y
            );


        if (

            distanceToPlayer <=
            this.throwRadius

        ) {

            throwStone(
                enemy,
                api,
                this
            );
        }
    },


    onDeath(
        enemy,
        api
    ) {

        /*
            Stenen van dode
            Stone Thrower verwijderen.
        */

        for (
            const other
            of [
                ...api.getEnemies()
            ]
        ) {

            if (

                other
                    ?.stoneThrowerProjectile &&

                other
                    .thrownStoneState
                    ?.ownerEntityId ===
                    enemy.id

            ) {

                api.removeEnemy(
                    other
                );
            }
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const state =
            enemy.stoneThrowerState ||
            {};


        const r =
            enemy.radius;


        /*
            BODY
        */

        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    true,

                color:

                    state.pickupFlash >
                        0

                        ? "#aeb5ba"

                        : "#737a80",

                strokeStyle:
                    "#d4d9dd",

                lineWidth:
                    4
            }
        );


        /*
            STONE ARMOUR
        */

        const armorAngles = [

            -2.45,

            -1.55,

            -0.65,

            0.55,

            1.45,

            2.35
        ];


        for (

            let i =
                0;

            i <
                armorAngles.length;

            i++

        ) {

            const angle =

                armorAngles[i] +

                (
                    state
                        .armorRotation ||
                    0
                ) *

                0.08;


            drawStoneCircle(

                ctx,

                api,


                enemy.x +

                    Math.cos(
                        angle
                    ) *

                    r *
                    0.78,


                enemy.y +

                    Math.sin(
                        angle
                    ) *

                    r *
                    0.78,


                r *
                    0.20,


                (
                    state
                        .armorRotation ||
                    0
                ) +

                i
            );
        }


        /*
            =====================================
            ZICHTBARE STENEN: 0, 1 OF 2
            =====================================
        */

        const carried =
            Math.max(

                0,

                Math.min(

                    2,

                    state
                        .carriedStones ||
                    0
                )
            );


        const facing =
            state.bodyAngle ||
            0;


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


        const frontX =
            Math.cos(
                facing
            );


        const frontY =
            Math.sin(
                facing
            );


        const ammoRadius =

            api.getEnemyRadius(
                this.stoneSize
            ) *

            0.72;


        if (
            carried >=
            1
        ) {

            drawStoneCircle(

                ctx,

                api,


                enemy.x +

                    sideX *
                    r *
                    0.82 +

                    frontX *
                    r *
                    0.12,


                enemy.y +

                    sideY *
                    r *
                    0.82 +

                    frontY *
                    r *
                    0.12,


                ammoRadius,


                -(
                    state
                        .armorRotation ||
                    0
                ) *

                1.8
            );
        }


        if (
            carried >=
            2
        ) {

            drawStoneCircle(

                ctx,

                api,


                enemy.x -

                    sideX *
                    r *
                    0.82 +

                    frontX *
                    r *
                    0.12,


                enemy.y -

                    sideY *
                    r *
                    0.82 +

                    frontY *
                    r *
                    0.12,


                ammoRadius,


                (
                    state
                        .armorRotation ||
                    0
                ) *

                1.8
            );
        }


        /*
            Nummer boven enemy.
        */

        ctx.save();


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.font =
            `bold ${Math.max(
                11,
                r *
                    0.30
            )}px Arial`;


        ctx.lineWidth =
            3;


        ctx.strokeStyle =
            "rgba(0,0,0,0.88)";


        ctx.strokeText(

            String(
                carried
            ),

            enemy.x,

            enemy.y -
                r *
                1.18
        );


        ctx.fillStyle =
            "#f1f1f1";


        ctx.fillText(

            String(
                carried
            ),

            enemy.x,

            enemy.y -
                r *
                1.18
        );


        /*
            Throw animation.
        */

        if (
            state.throwFlash >
            0
        ) {

            ctx.beginPath();


            ctx.moveTo(

                enemy.x +

                    frontX *
                    r *
                    0.45,

                enemy.y +

                    frontY *
                    r *
                    0.45
            );


            ctx.lineTo(

                enemy.x +

                    frontX *
                    r *
                    1.35,

                enemy.y +

                    frontY *
                    r *
                    1.35
            );


            ctx.lineWidth =
                5;


            ctx.strokeStyle =

                `rgba(215,220,225,${
                    Math.min(
                        1,
                        state.throwFlash /
                        0.22
                    )
                })`;


            ctx.stroke();
        }


        ctx.restore();
    }
};


export default stoneThrower;