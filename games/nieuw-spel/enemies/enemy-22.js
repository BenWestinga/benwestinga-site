const stonerGroups = new Map();
let nextStonerId = 1;

function clearRuntime() {
    stonerGroups.clear();
    nextStonerId = 1;
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function turnAngleToward(current, target, maxStep) {
    let difference = target - current;

    while (difference > Math.PI) difference -= Math.PI * 2;
    while (difference < -Math.PI) difference += Math.PI * 2;

    if (Math.abs(difference) <= maxStep) return target;

    return current + Math.sign(difference) * maxStep;
}

function getAliveHands(group, api) {
    return group.hands.filter(
        hand => hand && api.isEnemyAlive(hand)
    );
}

function getBodyBasis(group) {
    return {
        forwardX: Math.cos(group.facingAngle),
        forwardY: Math.sin(group.facingAngle),

        sideX:
            Math.cos(
                group.facingAngle +
                Math.PI / 2
            ),

        sideY:
            Math.sin(
                group.facingAngle +
                Math.PI / 2
            )
    };
}

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
            0.9 +
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
                0.7,

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
                0.7
    };
}

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
        Math.PI * 2
    );

    ctx.clip();

    if (
        image &&
        image.complete &&
        image.naturalWidth > 0
    ) {
        ctx.drawImage(
            image,
            -radius,
            -radius,
            radius * 2,
            radius * 2
        );

        if (tint) {
            ctx.globalCompositeOperation =
                "source-atop";

            ctx.globalAlpha =
                0.28;

            ctx.fillStyle =
                tint;

            ctx.fillRect(
                -radius,
                -radius,
                radius * 2,
                radius * 2
            );
        }

    } else {
        ctx.fillStyle =
            tint ||
            "#777d83";

        ctx.fillRect(
            -radius,
            -radius,
            radius * 2,
            radius * 2
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
        Math.PI * 2
    );

    ctx.lineWidth =
        Math.max(
            2,
            radius * 0.06
        );

    ctx.strokeStyle =
        "rgba(220,225,228,0.88)";

    ctx.stroke();

    ctx.restore();
}

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

        body is gewoon kwetsbaar.
    */

    if (
        aliveHands.length === 0
    ) {
        return damage;
    }

    /*
        Nog minstens 1 hand:

        body-hit volledig blocken.

        Iedere nieuwe body-hit
        zet de slow opnieuw op
        5 seconden.
    */

    group.blockTimer =
        group.definition
            .blockDuration;

    group.blockPulse =
        0.2;

    return 0;
}

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

    if (!player) {
        return;
    }

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

    const aliveHands =
        getAliveHands(
            group,
            api
        );

    /*
        ============================
        BEIDE HANDEN WEG
        ============================

        Body is kwetsbaar.

        Hij blijft redelijk snel
        achter de speler aan.
    */

    if (
        aliveHands.length === 0
    ) {
        group.blockTimer =
            0;

        enemy.speed =
            api.getEnemySpeed(
                definition
                    .noHandsSpeed
            );

        enemy.tracking =
            definition
                .noHandsTracking;
    }

    /*
        ============================
        BODY HIT GEBLOCKT
        ============================

        Extreem langzaam voor
        5 seconden.
    */

    else if (
        group.blockTimer > 0
    ) {
        enemy.speed =
            api.getEnemySpeed(
                definition
                    .blockedSpeed
            );

        enemy.tracking =
            definition
                .blockedTracking;
    }

    /*
        ============================
        NORMAAL MET HANDEN
        ============================

        Heel snel naar speler.
    */

    else {
        enemy.speed =
            api.getEnemySpeed(
                definition
                    .handsAliveSpeed
            );

        enemy.tracking =
            definition.tracking;
    }

    api.moveTowardPlayer(
        enemy,
        dt,
        enemy.tracking
    );

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
            false
        );
    }
}

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

    /*
        Als Stoner in block-mode zit,
        gaan handen voor zijn body.

        Anders hangen ze naast hem.
    */

    const target =
        group.blockTimer > 0

            ? getBlockHandPoint(
                group,
                hand
            )

            : getNormalHandPoint(
                group,
                hand
            );

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
        Stone plates.
    */

    ctx.save();

    for (
        let i = 0;
        i < 7;
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
            r * 0.16,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            i % 2 === 0
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
        Ogen.
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
        Korte flash wanneer body-hit
        geblockt wordt.
    */

    if (
        group.blockPulse > 0
    ) {
        ctx.save();

        ctx.globalAlpha =
            Math.min(
                1,
                group.blockPulse /
                    0.2
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

    drawStoneTexture(
        ctx,
        api,
        hand.x,
        hand.y,
        r *
            0.78,
        group.facingAngle,
        "#767d82"
    );

    ctx.save();

    ctx.translate(
        hand.x,
        hand.y
    );

    ctx.rotate(
        group.facingAngle
    );

    /*
        4 vingers.
    */

    for (
        let i = 0;
        i < 4;
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
            i % 2 === 0
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

    color:
        "#696f74",


    /*
        HANDS
    */

    handHp:
        10,

    handSize:
        3,


    /*
        ===========================
        SPEED MET HANDEN
        ===========================

        Heel snel achter speler aan.
    */

    handsAliveSpeed:
        "veryFast",

    tracking:
        1.0,


    /*
        ===========================
        BLOCK SPEED
        ===========================

        Als body geraakt wordt terwijl
        minstens één hand leeft:

        5 sec ultraSlow.
    */

    blockedSpeed:
        "ultraSlow",

    blockedTracking:
        1.0,

    blockDuration:
        5,


    /*
        ===========================
        SPEED ZONDER HANDEN
        ===========================

        Permanent redelijk snel.
    */

    noHandsSpeed:
        "mediumFast",

    noHandsTracking:
        0.85,


    faceTurnSpeed:
        6.0,


    reset() {
        clearRuntime();
    },


    onPlayerDeath() {
        clearRuntime();
    },


    onLevelWin() {
        clearRuntime();
    },


    /*
        ===========================
        SPAWN
        ===========================
    */

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
            Body.
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

                    speed:
                        api.getEnemySpeed(
                            definition
                                .handsAliveSpeed
                        ),

                    tracking:
                        definition
                            .tracking,

                    color:
                        definition
                            .color,

                    isStonerBody:
                        true,

                    isStonerHand:
                        false,

                    stonerId,

                    collidesWithPlayer:
                        true
                }
            );

        const group = {
            id:
                stonerId,

            definition,

            body,

            hands:
                [],

            facingAngle,

            blockTimer:
                0,

            blockPulse:
                0,

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
            Twee handen.
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
                    0.9 +
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
                            side < 0
                                ? "stoner-left-hand"
                                : "stoner-right-hand",

                        name:
                            side < 0
                                ? "Stone Left Hand"
                                : "Stone Right Hand",

                        hp:
                            definition
                                .handHp,

                        maxHp:
                            definition
                                .handHp,

                        size:
                            definition
                                .handSize,

                        radius:
                            handRadius,

                        speed:
                            0,

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


    /*
        ===========================
        DAMAGE
        ===========================
    */

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


    /*
        ===========================
        UPDATE
        ===========================
    */

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

            if (group) {
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


    /*
        ===========================
        DEATH
        ===========================
    */

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
            Body dood:
            handen ook verwijderen.
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

            stonerGroups.delete(
                group.id
            );

            return;
        }

        /*
            Hand dood.
        */

        if (
            enemy.isStonerHand
        ) {
            group.hands =
                group.hands.filter(
                    hand =>
                        hand !== enemy
                );

            /*
                Beide handen weg:

                eventuele block meteen stoppen.
            */

            if (
                group.hands.length === 0
            ) {
                group.blockTimer =
                    0;
            }
        }
    },


    /*
        ===========================
        DRAW
        ===========================
    */

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