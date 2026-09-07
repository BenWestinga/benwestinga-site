const stonerGroups =
    new Map();


const stonerRocks =
    [];


let nextStonerId =
    1;


/* =====================================================
   HELPERS
   ===================================================== */

function clearRuntime() {

    stonerGroups.clear();


    stonerRocks.length =
        0;


    nextStonerId =
        1;
}


function clamp01(
    value
) {

    return Math.max(

        0,

        Math.min(
            1,
            value
        )
    );
}


function lerp(
    a,
    b,
    t
) {

    return (

        a +

        (
            b -
            a
        ) *

        t
    );
}


function lerpPoint(
    a,
    b,
    t
) {

    return {

        x:
            lerp(
                a.x,
                b.x,
                t
            ),

        y:
            lerp(
                a.y,
                b.y,
                t
            )
    };
}


function turnAngleToward(
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


function getAliveHands(
    group,
    api
) {

    return group.hands.filter(

        hand =>

            hand &&

            api.isEnemyAlive(
                hand
            )
    );
}


function getBodyBasis(
    group
) {

    return {

        forwardX:
            Math.cos(
                group.facingAngle
            ),

        forwardY:
            Math.sin(
                group.facingAngle
            ),

        sideX:
            Math.cos(

                group.facingAngle +
                Math.PI /
                2
            ),

        sideY:
            Math.sin(

                group.facingAngle +
                Math.PI /
                2
            )
    };
}


/* =====================================================
   HAND POSITIES
   ===================================================== */

function getNormalHandPoint(
    group,
    hand
) {

    const body =
        group.body;


    const b =
        getBodyBasis(
            group
        );


    const sideDistance =

        body.radius +

        hand.radius *
            0.90 +

        8;


    return {

        x:

            body.x +

            b.sideX *
                hand.handSide *
                sideDistance +

            b.forwardX *
                body.radius *
                0.05,


        y:

            body.y +

            b.sideY *
                hand.handSide *
                sideDistance +

            b.forwardY *
                body.radius *
                0.05
    };
}


function getBlockHandPoint(
    group,
    hand
) {

    const body =
        group.body;


    const b =
        getBodyBasis(
            group
        );


    return {

        x:

            body.x +

            b.forwardX *

                (
                    body.radius +

                    hand.radius *
                        0.56
                ) +

            b.sideX *
                hand.handSide *
                hand.radius *
                0.70,


        y:

            body.y +

            b.forwardY *

                (
                    body.radius +

                    hand.radius *
                        0.56
                ) +

            b.sideY *
                hand.handSide *
                hand.radius *
                0.70
    };
}


function getGroundPickupPoint(
    group,
    hand
) {

    const body =
        group.body;


    const b =
        getBodyBasis(
            group
        );


    return {

        x:

            body.x -

            b.forwardX *
                body.radius *
                0.12 +

            b.sideX *
                hand.handSide *
                hand.radius *
                0.44,


        y:

            body.y -

            b.forwardY *
                body.radius *
                0.12 +

            b.sideY *
                hand.handSide *
                hand.radius *
                0.44 +

            body.radius *
                0.72
    };
}


/* =====================================================
   STONE DRAW
   ===================================================== */

function drawStoneTexture(
    ctx,
    api,
    x,
    y,
    radius,
    rotation = 0,
    tint = null
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


        if (
            tint
        ) {

            ctx.globalCompositeOperation =
                "source-atop";


            ctx.globalAlpha =
                0.32;


            ctx.fillStyle =
                tint;


            ctx.fillRect(

                -radius,

                -radius,

                radius *
                    2,

                radius *
                    2
            );
        }

    } else {

        ctx.fillStyle =
            tint ||
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


    /*
        Lichte outline.
    */

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
                0.06
        );


    ctx.strokeStyle =
        "rgba(220,225,228,0.88)";


    ctx.stroke();


    ctx.restore();
}


/* =====================================================
   ACTION RESET
   ===================================================== */

function cancelAction(
    group
) {

    group.action =
        null;


    group.actionElapsed =
        0;


    group.slamHand =
        null;


    group.slamTarget =
        null;


    group.slamStart =
        null;


    group.rockThrown =
        false;
}


/* =====================================================
   BODY BLOCK
   ===================================================== */

function blockBodyDamage(
    enemy,
    damage,
    api
) {

    if (
        !enemy.isStonerBody
    ) {

        return damage;
    }


    const group =
        stonerGroups.get(
            enemy.stonerId
        );


    if (!group) {

        return damage;
    }


    const aliveHands =
        getAliveHands(
            group,
            api
        );


    /*
        Geen handen meer:
        body kan gewoon damage krijgen.
    */

    if (
        aliveHands.length ===
        0
    ) {

        return damage;
    }


    /*
        Handen blocken body-hit.

        Iedere hit zet timer
        opnieuw op 3 sec.
    */

    group.blockTimer =
        3;


    group.blockPulse =
        0.20;


    cancelAction(
        group
    );


    return 0;
}


/* =====================================================
   HAND SLAM
   ===================================================== */

function startHandSlam(
    group,
    api
) {

    const aliveHands =
        getAliveHands(
            group,
            api
        );


    if (
        aliveHands.length ===
        0
    ) {

        return false;
    }


    const hand =

        aliveHands[

            Math.floor(

                Math.random() *
                aliveHands.length
            )
        ];


    const player =
        api.getPlayer();


    group.action =
        "hand-slam";


    group.actionElapsed =
        0;


    group.slamHand =
        hand;


    /*
        Snapshot player.
    */

    group.slamTarget = {

        x:
            player.x,

        y:
            player.y
    };


    group.slamStart =
        getNormalHandPoint(
            group,
            hand
        );


    return true;
}


/* =====================================================
   STONE THROW
   ===================================================== */

function startStoneAttack(
    group
) {

    group.action =
        "stone-throw";


    group.actionElapsed =
        0;


    group.rockThrown =
        false;
}


function launchStonerRock(
    group,
    api,
    definition
) {

    const body =
        group.body;


    const player =
        api.getPlayer();


    const b =
        getBodyBasis(
            group
        );


    const startX =

        body.x +

        b.forwardX *
            body.radius *
            0.45;


    const startY =

        body.y +

        b.forwardY *
            body.radius *
            0.45;


    stonerRocks.push({

        ownerStonerId:
            group.id,

        startX,

        startY,

        x:
            startX,

        y:
            startY,

        targetX:
            player.x,

        targetY:
            player.y,

        elapsed:
            0,

        duration:
            definition
                .rockFlightDuration,

        radius:

            api.getEnemyRadius(
                definition.rockSize
            ),

        rotation:

            Math.random() *
            Math.PI *
            2
    });


    group.rockThrown =
        true;
}


/* =====================================================
   STONER PROJECTILES
   ===================================================== */

function updateStonerRocks(
    dt,
    api
) {

    for (

        let i =
            stonerRocks.length -
                1;

        i >=
            0;

        i--

    ) {

        const rock =
            stonerRocks[i];


        rock.elapsed +=
            dt;


        const progress =
            clamp01(

                rock.elapsed /
                rock.duration
            );


        rock.x =
            lerp(

                rock.startX,

                rock.targetX,

                progress
            );


        rock.y =
            lerp(

                rock.startY,

                rock.targetY,

                progress
            );


        rock.rotation +=
            dt *
            7;


        /*
            Visuele boog.
        */

        const arcHeight =

            Math.sin(

                progress *
                Math.PI
            ) *

            115;


        const visibleY =
            rock.y -
            arcHeight;


        if (
            api.playerTouchesCircle(

                rock.x,

                visibleY,

                rock.radius
            )
        ) {

            stonerRocks.splice(
                i,
                1
            );


            api.killPlayer();


            return;
        }


        if (
            progress >=
            1
        ) {

            stonerRocks.splice(
                i,
                1
            );
        }
    }
}


/* =====================================================
   BODY UPDATE
   ===================================================== */

function updateBody(
    enemy,
    dt,
    api,
    definition
) {

    const group =
        stonerGroups.get(
            enemy.stonerId
        );


    if (!group) {

        return;
    }


    const player =
        api.getPlayer();


    /*
        BODY KIJKT NAAR PLAYER.
    */

    const wantedAngle =
        Math.atan2(

            player.y -
                enemy.y,

            player.x -
                enemy.x
        );


    group.facingAngle =
        turnAngleToward(

            group.facingAngle,

            wantedAngle,

            definition
                .faceTurnSpeed *
                dt
        );


    group.blockTimer =
        Math.max(

            0,

            group.blockTimer -
                dt
        );


    group.blockPulse =
        Math.max(

            0,

            group.blockPulse -
                dt
        );


    /*
        Eerst arena in.
    */

    if (
        !enemy.enteredArena
    ) {

        api.moveTowardPlayer(

            enemy,

            dt,

            definition.tracking
        );


        if (
            api.isInsideArena(
                enemy
            )
        ) {

            enemy.enteredArena =
                true;


            api.keepInsideArena(
                enemy,
                14,
                false
            );
        }


        return;
    }


    /*
        BLOCK MODE
    */

    if (
        group.blockTimer >
        0
    ) {

        api.moveTowardPlayer(

            enemy,

            dt,

            definition.tracking *
                0.55
        );


        api.keepInsideArena(
            enemy,
            14,
            false
        );


        return;
    }


    /*
        ACTIVE ATTACK.
    */

    if (
        group.action
    ) {

        group.actionElapsed +=
            dt;


        enemy.vx =
            0;


        enemy.vy =
            0;


        /*
            HAND SLAM.
        */

        if (
            group.action ===
            "hand-slam"
        ) {

            const hand =
                group.slamHand;


            if (
                !hand ||
                !api.isEnemyAlive(
                    hand
                )
            ) {

                cancelAction(
                    group
                );


                return;
            }


            if (

                group.actionElapsed >=
                definition
                    .handSlamDuration

            ) {

                cancelAction(
                    group
                );
            }


            return;
        }


        /*
            STONE THROW.
        */

        if (
            group.action ===
            "stone-throw"
        ) {

            const aliveHands =
                getAliveHands(
                    group,
                    api
                );


            /*
                Alleen met BEIDE handen.
            */

            if (
                aliveHands.length <
                2
            ) {

                cancelAction(
                    group
                );


                return;
            }


            if (

                !group.rockThrown &&

                group.actionElapsed >=
                    definition
                        .rockPickupDuration

            ) {

                launchStonerRock(

                    group,

                    api,

                    definition
                );
            }


            if (

                group.actionElapsed >=
                definition
                    .stoneAttackDuration

            ) {

                cancelAction(
                    group
                );
            }


            return;
        }
    }


    /*
        NORMAAL BEWEGEN.
    */

    api.moveTowardPlayer(

        enemy,

        dt,

        definition.tracking
    );


    api.keepInsideArena(

        enemy,

        14,

        false
    );


    /*
        ATTACK TIMER.
    */

    group.attackTimer +=
        dt;


    if (

        group.attackTimer <
        definition.attackInterval

    ) {

        return;
    }


    group.attackTimer =
        0;


    const aliveHands =
        getAliveHands(
            group,
            api
        );


    if (
        aliveHands.length ===
        0
    ) {

        return;
    }


    /*
        Met 2 handen:
        willekeurig.

        Met 1 hand:
        alleen hand slam.
    */

    if (

        aliveHands.length ===
            2 &&

        Math.random() <
            0.5

    ) {

        startStoneAttack(
            group
        );

    } else {

        startHandSlam(
            group,
            api
        );
    }
}


/* =====================================================
   HAND UPDATE
   ===================================================== */

function updateHand(
    hand,
    dt,
    api
) {

    const group =
        stonerGroups.get(
            hand.stonerId
        );


    if (
        !group ||
        !group.body ||
        !api.isEnemyAlive(
            group.body
        )
    ) {

        api.removeEnemy(
            hand
        );


        return;
    }


    const body =
        group.body;


    let target =
        getNormalHandPoint(
            group,
            hand
        );


    /*
        BLOCK MODE.
    */

    if (
        group.blockTimer >
        0
    ) {

        target =
            getBlockHandPoint(
                group,
                hand
            );

    } else if (

        group.action ===
            "hand-slam" &&

        group.slamHand ===
            hand

    ) {

        /*
            =================================
            HAND SLAM ANIMATION
            =================================
        */

        const t =
            group.actionElapsed;


        const normal =

            group.slamStart ||

            getNormalHandPoint(
                group,
                hand
            );


        const b =
            getBodyBasis(
                group
            );


        const windup = {

            x:

                normal.x -

                b.forwardX *
                    hand.radius *
                    0.90,


            y:

                normal.y -

                b.forwardY *
                    hand.radius *
                    0.90
        };


        const targetPoint =
            group.slamTarget;


        if (
            t <
            0.22
        ) {

            target =
                lerpPoint(

                    normal,

                    windup,

                    t /
                    0.22
                );

        } else if (
            t <
            0.52
        ) {

            target =
                lerpPoint(

                    windup,

                    targetPoint,

                    (
                        t -
                        0.22
                    ) /

                    0.30
                );

        } else if (
            t <
            0.68
        ) {

            target =
                targetPoint;

        } else {

            target =
                lerpPoint(

                    targetPoint,

                    getNormalHandPoint(
                        group,
                        hand
                    ),

                    clamp01(

                        (
                            t -
                            0.68
                        ) /

                        0.47
                    )
                );
        }

    } else if (

        group.action ===
        "stone-throw"

    ) {

        /*
            =================================
            STONE UIT GROND PAKKEN
            =================================
        */

        const t =
            group.actionElapsed;


        const normal =
            getNormalHandPoint(
                group,
                hand
            );


        const pickup =
            getGroundPickupPoint(
                group,
                hand
            );


        const b =
            getBodyBasis(
                group
            );


        const throwPoint = {

            x:

                body.x +

                b.forwardX *

                    (
                        body.radius +

                        hand.radius *
                            0.40
                    ) +

                b.sideX *
                    hand.handSide *
                    hand.radius *
                    0.55,


            y:

                body.y +

                b.forwardY *

                    (
                        body.radius +

                        hand.radius *
                            0.40
                    ) +

                b.sideY *
                    hand.handSide *
                    hand.radius *
                    0.55
        };


        if (
            t <
            0.35
        ) {

            target =
                lerpPoint(

                    normal,

                    pickup,

                    t /
                    0.35
                );

        } else if (
            t <
            0.48
        ) {

            target =
                pickup;

        } else if (
            t <
            0.72
        ) {

            target =
                lerpPoint(

                    pickup,

                    throwPoint,

                    (
                        t -
                        0.48
                    ) /

                    0.24
                );

        } else {

            target =
                lerpPoint(

                    throwPoint,

                    normal,

                    clamp01(

                        (
                            t -
                            0.72
                        ) /

                        0.48
                    )
                );
        }
    }


    /*
        VLOEIEND BEWEGEN.
    */

    const follow =

        1 -

        Math.exp(
            -18 *
            dt
        );


    hand.x =
        lerp(

            hand.x,

            target.x,

            follow
        );


    hand.y =
        lerp(

            hand.y,

            target.y,

            follow
        );


    hand.vx =
        body.vx;


    hand.vy =
        body.vy;


    hand.enteredArena =
        body.enteredArena;
}


/* =====================================================
   DRAW BODY
   ===================================================== */

function drawBody(
    enemy,
    ctx,
    api
) {

    const group =
        stonerGroups.get(
            enemy.stonerId
        );


    if (!group) {

        return;
    }


    const r =
        enemy.radius;


    drawStoneTexture(

        ctx,

        api,

        enemy.x,

        enemy.y,

        r,

        group.bodyRoll,

        "#696f74"
    );


    /*
        Stone armour platen.
    */

    ctx.save();


    for (
        let i =
            0;

        i <
            7;

        i++
    ) {

        const angle =

            group.facingAngle +

            i *
            Math.PI *
            2 /
            7;


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
                0.16,

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =

            i %
            2 ===
            0

                ? "#969ca1"

                : "#555b60";


        ctx.fill();


        ctx.lineWidth =
            1.5;


        ctx.strokeStyle =
            "#30353a";


        ctx.stroke();
    }


    ctx.restore();


    /*
        OGEN.
    */

    const b =
        getBodyBasis(
            group
        );


    const eyeSide =
        r *
        0.23;


    const eyeFront =
        r *
        0.38;


    const eyeRadius =
        Math.max(

            2.5,

            r *
                0.075
        );


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

                b.forwardX *
                    eyeFront +

                b.sideX *
                    side *
                    eyeSide,


            enemy.y +

                b.forwardY *
                    eyeFront +

                b.sideY *
                    side *
                    eyeSide,


            eyeRadius,

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =
            "#151515";


        ctx.fill();
    }


    /*
        BLOCK FLASH.
    */

    if (
        group.blockPulse >
        0
    ) {

        ctx.save();


        ctx.globalAlpha =
            clamp01(

                group.blockPulse /
                0.20
            );


        ctx.beginPath();


        ctx.arc(

            enemy.x,

            enemy.y,

            r *
                1.28,

            0,

            Math.PI *
                2
        );


        ctx.lineWidth =
            5;


        ctx.strokeStyle =
            "#d9dde0";


        ctx.stroke();


        ctx.restore();
    }
}


/* =====================================================
   DRAW HAND
   ===================================================== */

function drawHand(
    hand,
    ctx,
    api
) {

    const group =
        stonerGroups.get(
            hand.stonerId
        );


    if (!group) {

        return;
    }


    const r =
        hand.radius;


    const body =
        group.body;


    const angleToBody =
        Math.atan2(

            hand.y -
                body.y,

            hand.x -
                body.x
        );


    /*
        HANDPALM.
    */

    drawStoneTexture(

        ctx,

        api,

        hand.x,

        hand.y,

        r *
            0.78,

        angleToBody +

            hand.handSide *
            0.18,

        "#767d82"
    );


    /*
        VIER VINGERS.
    */

    ctx.save();


    ctx.translate(
        hand.x,
        hand.y
    );


    ctx.rotate(
        group.facingAngle
    );


    for (
        let i =
            0;

        i <
            4;

        i++
    ) {

        const offset =

            (
                i -
                1.5
            ) *

            r *
            0.28;


        ctx.beginPath();


        ctx.ellipse(

            r *
                0.82,

            offset,

            r *
                0.34,

            r *
                0.19,

            0,

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =

            i %
            2 ===
            0

                ? "#8e959a"

                : "#6c7378";


        ctx.fill();


        ctx.lineWidth =
            2;


        ctx.strokeStyle =
            "#30353a";


        ctx.stroke();
    }


    ctx.restore();
}


/* =====================================================
   DRAW STONE PICKUP
   ===================================================== */

function drawPickupStone(
    ctx,
    api,
    group,
    definition
) {

    if (

        group.action !==
            "stone-throw" ||

        group.rockThrown

    ) {

        return;
    }


    const body =
        group.body;


    const b =
        getBodyBasis(
            group
        );


    const progress =
        clamp01(

            group.actionElapsed /
            definition
                .rockPickupDuration
        );


    const radius =
        api.getEnemyRadius(
            definition.rockSize
        );


    const groundX =

        body.x -

        b.forwardX *
            body.radius *
            0.10;


    const groundY =

        body.y -

        b.forwardY *
            body.radius *
            0.10 +

        body.radius *
            0.78;


    const liftX =

        body.x +

        b.forwardX *
            body.radius *
            0.45;


    const liftY =

        body.y +

        b.forwardY *
            body.radius *
            0.45;


    drawStoneTexture(

        ctx,

        api,


        lerp(
            groundX,
            liftX,
            progress
        ),


        lerp(
            groundY,
            liftY,
            progress
        ),


        radius,


        group.actionElapsed *
            5,


        "#777d83"
    );
}


/* =====================================================
   STONER
   ===================================================== */

const stoner = {

    id:
        "stoner",

    name:
        "Stoner",

    behavior:
        "stoner",


    /*
        BODY
    */

    hp:
        25,

    size:
        6,

    spawnSize:
        6,

    speed:
        "slow",

    tracking:
        0.38,

    color:
        "#696f74",


    /*
        HANDEN
    */

    handHp:
        10,

    handSize:
        3,


    /*
        Draaisnelheid naar speler.
    */

    faceTurnSpeed:
        4.2,


    /*
        Iedere 10 sec attack.
    */

    attackInterval:
        10,


    /*
        HAND SLAM.
    */

    handSlamDuration:
        1.15,


    /*
        ROCK THROW.
    */

    rockSize:
        3,

    rockPickupDuration:
        0.48,

    rockFlightDuration:
        0.85,

    stoneAttackDuration:
        1.20,


    reset() {

        clearRuntime();
    },


    onPlayerDeath() {

        clearRuntime();
    },


    onLevelWin() {

        clearRuntime();
    },


    /* =================================================
       SPAWN BODY + 2 HANDEN
       ================================================= */

    spawn({
        definition,
        position,
        api
    }) {

        const stonerId =
            nextStonerId++;


        const bodyRadius =
            api.getEnemyRadius(
                definition.size
            );


        const handRadius =
            api.getEnemyRadius(
                definition.handSize
            );


        const speed =
            api.getEnemySpeed(
                definition.speed
            );


        const player =
            api.getPlayer();


        const facingAngle =
            Math.atan2(

                player.y -
                    position.y,

                player.x -
                    position.x
            );


        /*
            BODY.
        */

        const body =
            api.createEntity(

                definition,

                position,

                {
                    type:
                        "stoner",

                    hp:
                        definition.hp,

                    maxHp:
                        definition.hp,

                    radius:
                        bodyRadius,

                    size:
                        definition.size,

                    speed,

                    tracking:
                        definition.tracking,

                    color:
                        definition.color,

                    isStonerBody:
                        true,

                    isStonerHand:
                        false,

                    stonerId
                }
            );


        const group = {

            id:
                stonerId,

            body,

            hands:
                [],

            facingAngle,

            blockTimer:
                0,

            blockPulse:
                0,

            attackTimer:
                0,

            action:
                null,

            actionElapsed:
                0,

            slamHand:
                null,

            slamTarget:
                null,

            slamStart:
                null,

            rockThrown:
                false,

            bodyRoll:

                Math.random() *
                Math.PI *
                2
        };


        stonerGroups.set(
            stonerId,
            group
        );


        const b =
            getBodyBasis(
                group
            );


        /*
            TWEE HANDEN.
        */

        for (
            const side
            of [
                -1,
                1
            ]
        ) {

            const sideDistance =

                bodyRadius +

                handRadius *
                    0.90 +

                8;


            const hand =
                api.createEntity(

                    definition,

                    {
                        x:

                            body.x +

                            b.sideX *
                                side *
                                sideDistance,

                        y:

                            body.y +

                            b.sideY *
                                side *
                                sideDistance
                    },

                    {
                        type:

                            side <
                            0

                                ? "stoner-left-hand"

                                : "stoner-right-hand",

                        name:

                            side <
                            0

                                ? "Stone Left Hand"

                                : "Stone Right Hand",

                        hp:
                            definition.handHp,

                        maxHp:
                            definition.handHp,

                        size:
                            definition.handSize,

                        radius:
                            handRadius,

                        speed,

                        tracking:
                            0,

                        color:
                            "#777d83",

                        isStonerBody:
                            false,

                        isStonerHand:
                            true,

                        handSide:
                            side,

                        stonerId,

                        enteredArena:
                            false,

                        collidesWithPlayer:
                            true
                    }
                );


            group.hands.push(
                hand
            );
        }


        api.aimVelocityAtPlayer(
            body
        );


        return [
            body,
            ...group.hands
        ];
    },


    /* =================================================
       DAMAGE / BLOCK
       ================================================= */

    modifyDamage(
        enemy,
        damage,
        api
    ) {

        return blockBodyDamage(

            enemy,

            damage,

            api
        );
    },


    /* =================================================
       UPDATE
       ================================================= */

    update(
        enemy,
        dt,
        api
    ) {

        if (
            enemy.isStonerBody
        ) {

            const group =
                stonerGroups.get(
                    enemy.stonerId
                );


            if (
                group
            ) {

                group.bodyRoll +=

                    (
                        Math.hypot(

                            enemy.vx,

                            enemy.vy
                        ) /

                        Math.max(

                            1,

                            enemy.radius
                        )
                    ) *

                    dt *
                    0.18;
            }


            updateBody(

                enemy,

                dt,

                api,

                this
            );


            return;
        }


        if (
            enemy.isStonerHand
        ) {

            updateHand(

                enemy,

                dt,

                api
            );
        }
    },


    afterUpdate(
        dt,
        api
    ) {

        updateStonerRocks(
            dt,
            api
        );
    },


    /* =================================================
       DEATH
       ================================================= */

    onDeath(
        enemy,
        api
    ) {

        const group =
            stonerGroups.get(
                enemy.stonerId
            );


        if (!group) {

            return;
        }


        /*
            BODY DOOD:
            handen weg.
        */

        if (
            enemy.isStonerBody
        ) {

            for (
                const hand
                of [
                    ...group.hands
                ]
            ) {

                if (
                    api.isEnemyAlive(
                        hand
                    )
                ) {

                    api.removeEnemy(
                        hand
                    );
                }
            }


            /*
                Eigen stenen weg.
            */

            for (

                let i =
                    stonerRocks.length -
                    1;

                i >=
                    0;

                i--

            ) {

                if (

                    stonerRocks[i]
                        .ownerStonerId ===
                    group.id

                ) {

                    stonerRocks.splice(
                        i,
                        1
                    );
                }
            }


            stonerGroups.delete(
                group.id
            );


            return;
        }


        /*
            HAND DOOD.
        */

        if (
            enemy.isStonerHand
        ) {

            group.hands =
                group.hands.filter(

                    hand =>
                        hand !==
                        enemy
                );


            if (
                group.slamHand ===
                enemy
            ) {

                cancelAction(
                    group
                );
            }


            /*
                Stone attack kan alleen
                met 2 handen.
            */

            if (

                group.action ===
                    "stone-throw" &&

                group.hands.length <
                    2

            ) {

                cancelAction(
                    group
                );
            }
        }
    },


    /* =================================================
       PICKUP STONE
       ================================================= */

    drawBelow(
        ctx,
        api
    ) {

        for (
            const group
            of stonerGroups.values()
        ) {

            if (
                !group.body ||
                !api.isEnemyAlive(
                    group.body
                )
            ) {

                continue;
            }


            drawPickupStone(

                ctx,

                api,

                group,

                this
            );
        }
    },


    /* =================================================
       THROWN STONE
       ================================================= */

    drawGlobal(
        ctx,
        api
    ) {

        for (
            const rock
            of stonerRocks
        ) {

            const progress =
                clamp01(

                    rock.elapsed /
                    rock.duration
                );


            const arcHeight =

                Math.sin(

                    progress *
                    Math.PI
                ) *

                115;


            drawStoneTexture(

                ctx,

                api,

                rock.x,

                rock.y -
                    arcHeight,

                rock.radius,

                rock.rotation,

                "#777d83"
            );
        }
    },


    /* =================================================
       DRAW BODY / HANDS
       ================================================= */

    draw(
        enemy,
        ctx,
        api
    ) {

        if (
            enemy.isStonerBody
        ) {

            drawBody(
                enemy,
                ctx,
                api
            );

        } else if (
            enemy.isStonerHand
        ) {

            drawHand(
                enemy,
                ctx,
                api
            );
        }
    }
};


export default stoner;