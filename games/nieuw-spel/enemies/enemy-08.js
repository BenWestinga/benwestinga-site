const guardians =
    new Map();


let nextGuardianId =
    1;


function addShield(
    target,
    sourceId
) {

    if (!target) {
        return;
    }


    if (
        !(
            target
                .guardianShieldSources
            instanceof Set
        )
    ) {

        target.guardianShieldSources =
            new Set();
    }


    target
        .guardianShieldSources
        .add(
            sourceId
        );
}


function removeShield(
    target,
    sourceId
) {

    if (
        !target
            ?.guardianShieldSources
    ) {

        return;
    }


    target
        .guardianShieldSources
        .delete(
            sourceId
        );


    if (
        target
            .guardianShieldSources
            .size ===
        0
    ) {

        delete target
            .guardianShieldSources;
    }
}


function getHighestHpTarget(
    api
) {

    let target =
        null;

    let highestHp =
        -Infinity;


    for (
        const enemy
        of api.getEnemies()
    ) {

        if (
            !enemy ||
            enemy.hp <= 0
        ) {

            continue;
        }


        if (
            enemy.hp >
            highestHp
        ) {

            highestHp =
                enemy.hp;

            target =
                enemy;
        }
    }


    return target;
}


function clearGuardians() {

    for (
        const guardian
        of guardians.values()
    ) {

        removeShield(

            guardian.target,

            guardian
                .shieldSourceId
        );
    }


    guardians.clear();


    nextGuardianId =
        1;
}


const sandguardianWorm = {

    id:
        "sand-guardian-worm",

    name:
        "Sand Guardian Worm",

    behavior:
        "sand-guardian-worm",


    armor:
        true,

    classes: [
        "armor"
    ],


    spawnSize:
        3,


    speed:
        "medium",


    /*
        Normale Sand Worm:
        hoofd + 4

        Guardian:
        hoofd + 6
    */

    segmentCount:
        6,


    /*
        Normale worm = 4 HP per deel.
        Guardian = 8 HP per deel.
    */

    partHp:
        8,


    headSize:
        3,

    segmentSize:
        2.3,


    headColor:
        "#b99d35",

    segmentColor:
        "#c9ad43",


    armorColor:
        "#6f7883",

    armorHighlight:
        "#aeb7c1",


    bodyOverlap:
        4,


    /*
        Geen wander-fase.

        Hij chased ALTIJD de player.
    */

    chaseTracking:
        0.4,


    reset() {

        clearGuardians();
    },


    onPlayerDeath() {

        clearGuardians();
    },


    onLevelWin() {

        clearGuardians();
    },


    spawn({

        definition,

        position,

        api

    }) {

        const guardianId =
            nextGuardianId++;


        const shieldSourceId =
            `sand-guardian-${guardianId}`;


        const speed =
            api.getEnemySpeed(
                definition.speed
            );


        const headRadius =
            api.getEnemyRadius(
                definition.headSize
            );


        const segmentRadius =
            api.getEnemyRadius(
                definition.segmentSize
            );


        const player =
            api.getPlayer();


        const angle =
            Math.atan2(

                player.y -
                    position.y,

                player.x -
                    position.x
            );


        /*
            Target wordt HIER
            één keer gekozen.

            Later wordt dit dus
            NIET opnieuw berekend.
        */

        const guardian = {

            id:
                guardianId,

            parts:
                [],

            speed,

            angle,

            target:
                getHighestHpTarget(
                    api
                ),

            shieldSourceId
        };


        const totalParts =

            1 +

            definition
                .segmentCount;


        for (
            let i = 0;

            i < totalParts;

            i++
        ) {

            const isHead =
                i === 0;


            const radius =
                isHead

                    ? headRadius

                    : segmentRadius;


            const spacing =

                headRadius +

                segmentRadius -

                definition
                    .bodyOverlap;


            const part =
                api.createEntity(

                    definition,

                    {

                        x:

                            position.x -

                            Math.cos(
                                angle
                            ) *

                            spacing *

                            i,


                        y:

                            position.y -

                            Math.sin(
                                angle
                            ) *

                            spacing *

                            i

                    },

                    {

                        hp:
                            definition
                                .partHp,

                        maxHp:
                            definition
                                .partHp,


                        radius,

                        speed,


                        tracking:
                            definition
                                .chaseTracking,


                        color:

                            isHead

                                ? definition
                                    .headColor

                                : definition
                                    .segmentColor,


                        armor:
                            true,

                        classes: [
                            "armor"
                        ],


                        isGuardianPart:
                            true,

                        isWormPart:
                            true,

                        isWormHead:
                            isHead,


                        guardianId,


                        headRadius,

                        segmentRadius,


                        headColor:
                            definition
                                .headColor,

                        segmentColor:
                            definition
                                .segmentColor,


                        vx:

                            Math.cos(
                                angle
                            ) *

                            speed,


                        vy:

                            Math.sin(
                                angle
                            ) *

                            speed
                    }
                );


            guardian.parts.push(
                part
            );
        }


        guardians.set(

            guardianId,

            guardian
        );


        /*
            Target wordt nu shielded.
        */

        addShield(

            guardian.target,

            shieldSourceId
        );


        return guardian.parts;
    },


    /*
        Boss-02 gebruikt dit zodat de
        Guardian die hij op 100 HP
        spawnt gegarandeerd Sand-Ben
        beschermt.
    */

    forceTarget(
        part,
        target
    ) {

        const guardian =
            guardians.get(
                part?.guardianId
            );


        if (
            !guardian ||
            !target
        ) {

            return;
        }


        removeShield(

            guardian.target,

            guardian
                .shieldSourceId
        );


        guardian.target =
            target;


        addShield(

            guardian.target,

            guardian
                .shieldSourceId
        );
    },


    beforeUpdate(
        dt,
        api
    ) {

        const config =
            this;


        for (
            const guardian
            of guardians.values()
        ) {

            if (
                guardian
                    .parts
                    .length ===
                0
            ) {

                continue;
            }


            const head =
                guardian.parts[0];


            head.isWormHead =
                true;


            const player =
                api.getPlayer();


            const dx =
                player.x -
                head.x;


            const dy =
                player.y -
                head.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                ) || 1;


            const desiredVx =

                (
                    dx /
                    distance
                ) *

                guardian.speed;


            const desiredVy =

                (
                    dy /
                    distance
                ) *

                guardian.speed;


            const steering =

                1 -

                Math.exp(

                    -config
                        .chaseTracking *

                    dt
                );


            head.vx +=

                (
                    desiredVx -
                    head.vx
                ) *

                steering;


            head.vy +=

                (
                    desiredVy -
                    head.vy
                ) *

                steering;


            guardian.angle =
                Math.atan2(
                    head.vy,
                    head.vx
                );


            head.x +=
                head.vx *
                dt;


            head.y +=
                head.vy *
                dt;


            /*
                BODY VOLGT HEAD
            */

            for (
                let i = 1;

                i <
                guardian
                    .parts
                    .length;

                i++
            ) {

                const previous =
                    guardian.parts[
                        i - 1
                    ];


                const part =
                    guardian.parts[i];


                part.isWormHead =
                    false;


                part.radius =
                    part.segmentRadius;


                part.color =
                    part.segmentColor;


                const bodyDx =
                    part.x -
                    previous.x;


                const bodyDy =
                    part.y -
                    previous.y;


                const bodyDistance =
                    Math.hypot(

                        bodyDx,

                        bodyDy
                    ) || 1;


                const wantedDistance =
                    Math.max(

                        2,

                        previous.radius +

                        part.radius -

                        config
                            .bodyOverlap
                    );


                part.x =

                    previous.x +

                    (
                        bodyDx /
                        bodyDistance
                    ) *

                    wantedDistance;


                part.y =

                    previous.y +

                    (
                        bodyDy /
                        bodyDistance
                    ) *

                    wantedDistance;


                part.vx =
                    head.vx;


                part.vy =
                    head.vy;
            }
        }
    },


    update() {

    },


    onDeath(
        enemy
    ) {

        const guardian =
            guardians.get(
                enemy.guardianId
            );


        if (!guardian) {

            return;
        }


        const index =
            guardian
                .parts
                .indexOf(
                    enemy
                );


        if (
            index ===
            -1
        ) {

            return;
        }


        guardian.parts.splice(
            index,
            1
        );


        /*
            Hele worm dood:
            shield weg.
        */

        if (
            guardian
                .parts
                .length ===
            0
        ) {

            removeShield(

                guardian.target,

                guardian
                    .shieldSourceId
            );


            guardians.delete(
                enemy.guardianId
            );


            return;
        }


        /*
            Hoofd dood:
            volgende bal wordt hoofd.
        */

        if (
            index ===
            0
        ) {

            const newHead =
                guardian.parts[0];


            newHead.isWormHead =
                true;


            newHead.radius =
                newHead.headRadius;


            newHead.color =
                newHead.headColor;


            newHead.vx =

                Math.cos(
                    guardian.angle
                ) *

                guardian.speed;


            newHead.vy =

                Math.sin(
                    guardian.angle
                ) *

                guardian.speed;
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        /*
            Basis lichaam +
            dikke armor rand.
        */

        api.drawDefaultEnemy(

            enemy,

            {

                face:
                    enemy
                        .isWormHead,


                color:
                    enemy.color,


                strokeStyle:
                    this.armorColor,


                lineWidth:
                    Math.max(

                        4,

                        enemy.radius *
                        0.18
                    )
            }
        );


        /*
            Extra metalen plaat/
            highlight op ieder deel.
        */

        ctx.save();


        ctx.beginPath();


        ctx.arc(

            enemy.x,

            enemy.y,

            Math.max(
                2,
                enemy.radius - 5
            ),

            Math.PI * 1.12,

            Math.PI * 1.88
        );


        ctx.lineWidth =
            Math.max(

                2,

                enemy.radius *
                0.08
            );


        ctx.strokeStyle =
            this.armorHighlight;


        ctx.globalAlpha =
            0.8;


        ctx.stroke();


        ctx.restore();
    },


    /*
        De lijn is alleen VISUEEL.

        Geen collisions.
    */

    drawBelow(
        ctx,
        api
    ) {

        for (
            const guardian
            of guardians.values()
        ) {

            if (
                guardian.parts.length ===
                    0 ||

                !guardian.target ||

                !api.isEnemyAlive(
                    guardian.target
                )
            ) {

                continue;
            }


            const head =
                guardian.parts[0];


            const target =
                guardian.target;


            ctx.save();


            ctx.beginPath();


            ctx.moveTo(
                head.x,
                head.y
            );


            ctx.lineTo(
                target.x,
                target.y
            );


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "rgba(80,165,255,0.52)";


            ctx.setLineDash([
                12,
                7
            ]);


            ctx.stroke();


            ctx.restore();
        }
    },


    /*
        BLUE SHIELD
    */

    drawGlobal(
        ctx,
        api
    ) {

        for (
            const guardian
            of guardians.values()
        ) {

            if (
                !guardian.target ||

                !api.isEnemyAlive(
                    guardian.target
                )
            ) {

                continue;
            }


            const target =
                guardian.target;


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                target.x,

                target.y,

                target.radius +
                    9,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(70,150,255,0.12)";


            ctx.fill();


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "rgba(85,175,255,0.82)";


            ctx.stroke();


            ctx.restore();
        }
    }
};


export default sandguardianWorm;