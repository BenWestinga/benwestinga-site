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


/* =====================================================
   STONE DRAW
   ===================================================== */

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
}


/* =====================================================
   STONE LOSKOPPELEN VAN OWNER
   ===================================================== */

function detachStoneFromOwner(
    stone
) {

    const owner =
        stone
            ?.thrownStoneState
            ?.owner;


    const ownerState =
        owner
            ?.stoneThrowerState;


    if (
        ownerState
            ?.activeStones instanceof Set
    ) {

        ownerState
            .activeStones
            .delete(
                stone
            );
    }
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
        3,

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
            Steen blijft oneindig
            tegen muren bouncen.
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
            BELANGRIJKE OPTIMALISATIE:

            We zoeken de owner NIET meer
            met getEnemies().find().

            De steen bewaart rechtstreeks
            een verwijzing naar zijn owner.
        */

        const owner =
            state.owner;


        if (
            !owner ||
            !api.isEnemyAlive(
                owner
            )
        ) {

            detachStoneFromOwner(
                stone
            );


            api.removeEnemy(
                stone
            );


            return;
        }


        const ownerState =
            owner.stoneThrowerState;


        if (
            !ownerState ||
            ownerState.carriedStones >=
                2
        ) {

            return;
        }


        const dx =
            stone.x -
            owner.x;


        const dy =
            stone.y -
            owner.y;


        const pickupRadius =

            owner.radius +
            stone.radius +
            18;


        /*
            Geen Math.hypot nodig.

            Kwadratische afstand is
            iets goedkoper.
        */

        if (

            dx *
            dx +

            dy *
            dy <=

            pickupRadius *
            pickupRadius

        ) {

            ownerState
                .carriedStones++;


            ownerState
                .pickupFlash =
                0.18;


            ownerState
                .activeStones
                .delete(
                    stone
                );


            api.removeEnemy(
                stone
            );
        }
    },


    onDeath(
        stone
    ) {

        detachStoneFromOwner(
            stone
        );
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
        Steen iets sneller
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

                    /*
                        Rechtstreekse owner.
                    */

                    owner:
                        enemy,

                    pickupDelay:
                        0.75,

                    rotation:

                        Math.random() *
                        Math.PI *
                        2
                }
            }
        );


    api.getEnemies()
        .push(
            stone
        );


    /*
        Stone Thrower bewaart zelf
        welke stenen van hem zijn.
    */

    state.activeStones
        .add(
            stone
        );


    state.carriedStones--;


    state.throwCooldown =
        definition
            .throwCooldown;


    state.throwFlash =
        0.18;
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
        Zelfde soort beweging
        als Big Goon.
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
        Gegooide steen.
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


            /*
                Hier bewaren we alleen
                de eigen gegooide stenen.

                Veel sneller dan elke
                frame alle enemies doorzoeken.
            */

            activeStones:
                new Set()
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


        /* =================================================
           MOVEMENT
           ================================================= */

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


        /* =================================================
           THROW CHECK
           ================================================= */

        if (
            !enemy.enteredArena ||
            state.carriedStones <=
                0 ||
            state.throwCooldown >
                0
        ) {

            return;
        }


        const dx =
            player.x -
            enemy.x;


        const dy =
            player.y -
            enemy.y;


        /*
            Ook hier geen Math.hypot.
        */

        if (

            dx *
            dx +

            dy *
            dy <=

            this.throwRadius *
            this.throwRadius

        ) {

            throwStone(
                enemy,
                api,
                this
            );
        }
    },


    /* =================================================
       DEATH
       ================================================= */

    onDeath(
        enemy,
        api
    ) {

        const state =
            enemy.stoneThrowerState;


        if (
            !state
                ?.activeStones
        ) {

            return;
        }


        /*
            Oude versie liep door
            ALLE enemies.

            Nieuwe versie loopt alleen
            door stenen van deze thrower.
        */

        for (
            const stone
            of [
                ...state.activeStones
            ]
        ) {

            if (
                api.isEnemyAlive(
                    stone
                )
            ) {

                api.removeEnemy(
                    stone
                );
            }
        }


        state.activeStones
            .clear();
    },


    /* =================================================
       DRAW
       ================================================= */

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
            BODY.
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
                    3
            }
        );


        /*
            ==========================================
            SIMPELER ARMOR

            Oude versie:
            6 extra stone.png afbeeldingen
            PER THROWER PER FRAME.

            Nu:
            maar 3 simpele cirkels.
            ==========================================
        */

        ctx.save();


        const armorAngles = [
            -2.35,
            0,
            2.35
        ];


        for (
            const angle
            of armorAngles
        ) {

            const px =

                enemy.x +

                Math.cos(
                    angle
                ) *

                r *
                0.72;


            const py =

                enemy.y +

                Math.sin(
                    angle
                ) *

                r *
                0.72;


            ctx.beginPath();


            ctx.arc(

                px,

                py,

                r *
                    0.19,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#969da2";


            ctx.fill();


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "#4a5054";


            ctx.stroke();
        }


        ctx.restore();


        /* =================================================
           CARRIED STONES
           ================================================= */

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


        /*
            Eerste steen.
        */

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

                0
            );
        }


        /*
            Tweede steen.
        */

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

                0
            );
        }


        /* =================================================
           AMMO NUMBER
           ================================================= */

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


        /* =================================================
           THROW FLASH
           ================================================= */

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
                    1.25,

                enemy.y +

                    frontY *
                    r *
                    1.25
            );


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "rgba(215,220,225,0.9)";


            ctx.stroke();
        }


        ctx.restore();
    }
};


export default stoneThrower;