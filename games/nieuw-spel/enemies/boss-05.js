const rockProjectiles =
    [];


const rockFragments =
    [];


const meteors =
    [];


/* =========================================================
   RUNTIME
   ========================================================= */

function clearRuntime() {

    rockProjectiles.length =
        0;


    rockFragments.length =
        0;


    meteors.length =
        0;
}


/* =========================================================
   BOSS STATE
   ========================================================= */

function getBossState(
    enemy
) {

    if (
        !enemy.steenBenState
    ) {

        enemy.steenBenState = {

            fightStarted:
                false,


            /*
                Boss-06 kan de Boss-02
                landing gebruiken.
            */

            dropActive:
                false,

            dropTimer:
                0,

            dropDuration:
                1,

            dropX:
                enemy.x,

            dropY:
                enemy.y,

            dropRadius:
                enemy.radius +
                28,


            cycleTime:
                0,

            phase:
                -1,

            firstAttack:
                null,


            attackId:
                0,

            attackElapsed:
                0,


            shotsFired:
                0,

            nextShotTime:
                0,


            chargeState:
                "idle",

            chargeTimer:
                0,

            chargeRunsDone:
                0,


            summonDone:
                false,


            flash:
                false
        };
    }


    return enemy.steenBenState;
}


/* =========================================================
   START FIGHT
   ========================================================= */

function startFight(
    enemy
) {

    const state =
        getBossState(
            enemy
        );


    if (
        state.fightStarted
    ) {

        return;
    }


    state.fightStarted =
        true;


    state.cycleTime =
        0;


    state.phase =
        -1;


    state.firstAttack =
        null;


    state.attackId =
        0;


    state.attackElapsed =
        0;


    state.shotsFired =
        0;


    state.nextShotTime =
        0;


    state.chargeState =
        "idle";


    state.chargeTimer =
        0;


    state.chargeRunsDone =
        0;


    state.summonDone =
        false;


    state.flash =
        false;
}


/* =========================================================
   ATTACK KIEZEN
   ========================================================= */

function chooseAttack(
    enemy,
    slot,
    config
) {

    const state =
        getBossState(
            enemy
        );


    /*
        ==========================================
        BOSS 25

        Attack 1 en Attack 2 komen allebei
        één keer per cyclus.

        Welke eerst komt is random.
        ==========================================
    */

    if (
        !config.attack3
            ?.enabled
    ) {

        if (
            slot ===
            1
        ) {

            const attack =

                Math.random() <
                0.5

                    ? 1

                    : 2;


            state.firstAttack =
                attack;


            return attack;
        }


        return (
            state.firstAttack ===
            1

                ? 2

                : 1
        );
    }


    /*
        Boss 30:
        vaste volgorde 1 -> 2 -> 3.
    */

    return slot;
}


/* =========================================================
   START ATTACK
   ========================================================= */

function startAttack(
    enemy,
    attackId
) {

    const state =
        getBossState(
            enemy
        );


    state.attackId =
        attackId;


    state.attackElapsed =
        0;


    state.flash =
        false;


    /*
        Attack 1
    */

    if (
        attackId ===
        1
    ) {

        state.shotsFired =
            0;


        state.nextShotTime =
            0;
    }


    /*
        Attack 2
    */

    if (
        attackId ===
        2
    ) {

        state.chargeState =
            "warning";


        state.chargeTimer =
            0;


        state.chargeRunsDone =
            0;


        state.flash =
            true;


        enemy.vx =
            0;


        enemy.vy =
            0;
    }


    /*
        Attack 3
        Alleen Boss 30.
    */

    if (
        attackId ===
        3
    ) {

        state.summonDone =
            false;


        state.flash =
            true;


        enemy.vx =
            0;


        enemy.vy =
            0;
    }
}


/* =========================================================
   END ATTACK
   ========================================================= */

function endAttack(
    enemy
) {

    const state =
        getBossState(
            enemy
        );


    state.attackId =
        0;


    state.attackElapsed =
        0;


    state.flash =
        false;


    state.chargeState =
        "idle";


    state.chargeTimer =
        0;
}


/* =========================================================
   ATTACK 1

   GROTE STONE
   -> RAAKT MUUR
   -> BREEKT IN 3
   -> NIETS BOUNCET
   ========================================================= */

function fireStoneProjectile(
    enemy,
    api,
    config
) {

    const player =
        api.getPlayer();


    const attack =
        config.attack1;


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


    rockProjectiles.push({

        x:
            enemy.x,

        y:
            enemy.y,


        vx:

            (
                dx /
                distance
            ) *

            attack.projectileSpeed,


        vy:

            (
                dy /
                distance
            ) *

            attack.projectileSpeed,


        radius:

            api.getEnemyRadius(
                attack.projectileSize
            ),


        image:
            attack.projectileImage,


        rotation:

            Math.random() *
            Math.PI *
            2,


        rotationSpeed:
            4.5
    });
}


/* =========================================================
   STONE SPLIT
   ========================================================= */

function splitStoneAtWall(
    rock,
    wall,
    api,
    config
) {

    const attack =
        config.attack1;


    /*
        De originele steen verdwijnt.

        Er ontstaan exact drie nieuwe
        kleinere stukken.

        De stukken vliegen terug de arena in.
        Die stukken kunnen NIET bouncen.
    */

    let inwardAngle =
        Math.atan2(

            -rock.vy,

            -rock.vx
        );


    if (
        wall ===
        "left"
    ) {

        inwardAngle =
            0;

    } else if (
        wall ===
        "right"
    ) {

        inwardAngle =
            Math.PI;

    } else if (
        wall ===
        "top"
    ) {

        inwardAngle =
            Math.PI /
            2;

    } else if (
        wall ===
        "bottom"
    ) {

        inwardAngle =
            -Math.PI /
            2;
    }


    const offsets = [

        -attack.splitAngle,

        0,

        attack.splitAngle
    ];


    for (
        const offset
        of offsets
    ) {

        const angle =
            inwardAngle +
            offset;


        rockFragments.push({

            x:
                rock.x,

            y:
                rock.y,


            vx:

                Math.cos(
                    angle
                ) *

                attack.fragmentSpeed,


            vy:

                Math.sin(
                    angle
                ) *

                attack.fragmentSpeed,


            radius:

                api.getEnemyRadius(
                    attack.fragmentSize
                ),


            image:
                attack.projectileImage,


            rotation:

                Math.random() *
                Math.PI *
                2,


            rotationSpeed:
                7
        });
    }
}


/* =========================================================
   UPDATE ATTACK 1 STONES
   ========================================================= */

function updateRockProjectiles(
    dt,
    api,
    config
) {

    const canvas =
        api.getCanvas();


    for (

        let i =
            rockProjectiles.length -
            1;

        i >=
        0;

        i--

    ) {

        const rock =
            rockProjectiles[i];


        rock.x +=
            rock.vx *
            dt;


        rock.y +=
            rock.vy *
            dt;


        rock.rotation +=
            rock.rotationSpeed *
            dt;


        /*
            Player geraakt.
        */

        if (
            api.playerTouchesCircle(

                rock.x,

                rock.y,

                rock.radius
            )
        ) {

            rockProjectiles.splice(
                i,
                1
            );


            api.killPlayer();


            return;
        }


        const margin =
            rock.radius +
            14;


        let wall =
            null;


        /*
            Linker muur.
        */

        if (
            rock.x <=
            margin
        ) {

            rock.x =
                margin;


            wall =
                "left";

        } else if (

            rock.x >=
            canvas.width -
                margin

        ) {

            rock.x =
                canvas.width -
                margin;


            wall =
                "right";
        }


        /*
            Boven / onder.
        */

        if (
            rock.y <=
            margin
        ) {

            rock.y =
                margin;


            wall =
                "top";

        } else if (

            rock.y >=
            canvas.height -
                margin

        ) {

            rock.y =
                canvas.height -
                margin;


            wall =
                "bottom";
        }


        /*
            MUUR:
            originele steen weg,
            drie fragmenten.
        */

        if (
            wall
        ) {

            splitStoneAtWall(

                rock,

                wall,

                api,

                config
            );


            rockProjectiles.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   UPDATE SPLIT FRAGMENTS
   ========================================================= */

function updateRockFragments(
    dt,
    api
) {

    const canvas =
        api.getCanvas();


    for (

        let i =
            rockFragments.length -
            1;

        i >=
        0;

        i--

    ) {

        const fragment =
            rockFragments[i];


        fragment.x +=
            fragment.vx *
            dt;


        fragment.y +=
            fragment.vy *
            dt;


        fragment.rotation +=
            fragment.rotationSpeed *
            dt;


        /*
            Player geraakt.
        */

        if (
            api.playerTouchesCircle(

                fragment.x,

                fragment.y,

                fragment.radius
            )
        ) {

            rockFragments.splice(
                i,
                1
            );


            api.killPlayer();


            return;
        }


        /*
            Fragmenten bouncen NOOIT.

            Eerste muur die ze raken:
            verdwijnen.
        */

        if (

            fragment.x <=
                fragment.radius ||

            fragment.x >=
                canvas.width -
                    fragment.radius ||

            fragment.y <=
                fragment.radius ||

            fragment.y >=
                canvas.height -
                    fragment.radius

        ) {

            rockFragments.splice(
                i,
                1
            );
        }
    }
}


/* =========================================================
   ATTACK 2

   CHARGE
   -> MUUR
   -> METEORIETEN
   ========================================================= */

function createMeteorTargets(
    count,
    api,
    config
) {

    const canvas =
        api.getCanvas();


    const attack =
        config.attack2;


    /*
        Verdeling over een grid.

        Daardoor krijg je echt meteorieten
        over de hele map en niet toevallig
        allemaal op één plek.
    */

    const columns =
        Math.ceil(

            Math.sqrt(

                count *

                canvas.width /

                Math.max(
                    1,
                    canvas.height
                )
            )
        );


    const rows =
        Math.ceil(
            count /
            columns
        );


    const cellWidth =
        canvas.width /
        columns;


    const cellHeight =
        canvas.height /
        rows;


    for (

        let index =
            0;

        index <
            count;

        index++

    ) {

        const column =
            index %
            columns;


        const row =
            Math.floor(

                index /
                columns
            );


        const targetX =
            Math.max(

                attack
                    .meteorImpactRadius +
                    20,

                Math.min(

                    canvas.width -

                        attack
                            .meteorImpactRadius -

                        20,


                    column *
                        cellWidth +

                        cellWidth *
                        (
                            0.25 +

                            Math.random() *
                            0.5
                        )
                )
            );


        const targetY =
            Math.max(

                attack
                    .meteorImpactRadius +
                    20,

                Math.min(

                    canvas.height -

                        attack
                            .meteorImpactRadius -

                        20,


                    row *
                        cellHeight +

                        cellHeight *
                        (
                            0.25 +

                            Math.random() *
                            0.5
                        )
                )
            );


        meteors.push({

            targetX,

            targetY,


            delay:

                Math.random() *

                attack.meteorStagger,


            warningDuration:
                attack
                    .meteorWarningDuration,


            fallDuration:
                attack
                    .meteorFallDuration,


            impactDuration:
                0.22,


            elapsed:
                0,


            impactElapsed:
                0,


            stage:
                "warning",


            radius:

                api.getEnemyRadius(
                    attack.meteorSize
                ),


            impactRadius:
                attack
                    .meteorImpactRadius,


            image:
                attack.meteorImage,


            rotation:

                Math.random() *
                Math.PI *
                2
        });
    }
}


/* =========================================================
   START METEOR SHOWER
   ========================================================= */

function startMeteorShower(
    api,
    config
) {

    createMeteorTargets(

        config.attack2
            .meteorCount,

        api,

        config
    );
}


/* =========================================================
   AIM CHARGE
   ========================================================= */

function aimChargeAtPlayer(
    enemy,
    api,
    config
) {

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


    enemy.vx =

        (
            dx /
            distance
        ) *

        config.attack2
            .dashSpeed;


    enemy.vy =

        (
            dy /
            distance
        ) *

        config.attack2
            .dashSpeed;
}


/* =========================================================
   UPDATE CHARGE
   ========================================================= */

function updateCharge(
    enemy,
    dt,
    api,
    config
) {

    const state =
        getBossState(
            enemy
        );


    const attack =
        config.attack2;


    /*
        ==========================================
        WAARSCHUWING
        ==========================================
    */

    if (
        state.chargeState ===
        "warning"
    ) {

        state.chargeTimer +=
            dt;


        const flashPart =

            attack.warningDuration /

            Math.max(

                1,

                attack.warningFlashes *
                2
            );


        state.flash =

            (
                Math.floor(

                    state.chargeTimer /
                    flashPart

                ) %

                2

            ) ===
            0;


        enemy.vx =
            0;


        enemy.vy =
            0;


        if (

            state.chargeTimer >=
            attack.warningDuration

        ) {

            state.flash =
                false;


            state.chargeTimer =
                0;


            state.chargeState =
                "dash";


            aimChargeAtPlayer(

                enemy,

                api,

                config
            );
        }


        return true;
    }


    /*
        ==========================================
        DASH
        ==========================================
    */

    if (
        state.chargeState ===
        "dash"
    ) {

        enemy.x +=
            enemy.vx *
            dt;


        enemy.y +=
            enemy.vy *
            dt;


        const canvas =
            api.getCanvas();


        const margin =
            enemy.radius +
            14;


        let hitWall =
            false;


        if (
            enemy.x <=
            margin
        ) {

            enemy.x =
                margin;


            hitWall =
                true;
        }


        if (

            enemy.x >=
            canvas.width -
                margin

        ) {

            enemy.x =
                canvas.width -
                margin;


            hitWall =
                true;
        }


        if (
            enemy.y <=
            margin
        ) {

            enemy.y =
                margin;


            hitWall =
                true;
        }


        if (

            enemy.y >=
            canvas.height -
                margin

        ) {

            enemy.y =
                canvas.height -
                margin;


            hitWall =
                true;
        }


        /*
            MUUR GERAAKT.
        */

        if (
            hitWall
        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            state.chargeRunsDone++;


            /*
                Iedere wall-hit veroorzaakt
                een meteor shower.

                Boss 25 = 20.
                Boss 30 = 40.
            */

            startMeteorShower(

                api,

                config
            );


            /*
                Boss 30 kan nog twee
                extra charges doen.
            */

            if (

                state.chargeRunsDone <
                attack.chargeRuns

            ) {

                state.chargeState =
                    "wall-pause";


                state.chargeTimer =
                    0;

            } else {

                state.chargeState =
                    "done";


                state.chargeTimer =
                    0;
            }
        }


        return true;
    }


    /*
        ==========================================
        WACHTEN TEGEN MUUR
        ==========================================
    */

    if (
        state.chargeState ===
        "wall-pause"
    ) {

        state.chargeTimer +=
            dt;


        enemy.vx =
            0;


        enemy.vy =
            0;


        if (

            state.chargeTimer >=
            attack.wallPause

        ) {

            state.chargeTimer =
                0;


            state.chargeState =
                "dash";


            /*
                Na het wachten opnieuw
                richten op de HUIDIGE
                positie van de speler.
            */

            aimChargeAtPlayer(

                enemy,

                api,

                config
            );
        }


        return true;
    }


    /*
        Klaar.
    */

    if (
        state.chargeState ===
        "done"
    ) {

        enemy.vx =
            0;


        enemy.vy =
            0;


        return false;
    }


    return false;
}


/* =========================================================
   UPDATE METEORS
   ========================================================= */

function updateMeteors(
    dt,
    api
) {

    for (

        let i =
            meteors.length -
            1;

        i >=
            0;

        i--

    ) {

        const meteor =
            meteors[i];


        meteor.elapsed +=
            dt;


        /*
            Kleine random vertraging.
        */

        if (
            meteor.elapsed <
            meteor.delay
        ) {

            continue;
        }


        const activeTime =

            meteor.elapsed -
            meteor.delay;


        /*
            ==========================================
            WARNING
            ==========================================
        */

        if (

            activeTime <
            meteor.warningDuration

        ) {

            meteor.stage =
                "warning";


            continue;
        }


        /*
            ==========================================
            FALLING
            ==========================================
        */

        if (

            activeTime <

            meteor.warningDuration +
                meteor.fallDuration

        ) {

            meteor.stage =
                "falling";


            meteor.rotation +=
                dt *
                7;


            continue;
        }


        /*
            ==========================================
            IMPACT
            ==========================================
        */

        if (
            meteor.stage !==
            "impact"
        ) {

            meteor.stage =
                "impact";


            meteor.impactElapsed =
                0;


            /*
                Meteor impact is lethal.
            */

            if (
                api.playerTouchesCircle(

                    meteor.targetX,

                    meteor.targetY,

                    meteor.impactRadius
                )
            ) {

                api.killPlayer();
            }
        }


        meteor.impactElapsed +=
            dt;


        if (

            meteor.impactElapsed >=
            meteor.impactDuration

        ) {

            meteors.splice(
                i,
                1
            );
        }


        if (
            api.getPlayer()
                .alive ===
            false
        ) {

            return;
        }
    }
}


/* =========================================================
   ATTACK 3

   BOSS 30 ONLY

   0.5 SEC STIL
   GRIJS KNIPPEREN
   -> 5 STONES
   ========================================================= */

function spawnFiveStones(
    enemy,
    api,
    config
) {

    const attack =
        config.attack3;


    const canvas =
        api.getCanvas();


    const spawnDistance =

        enemy.radius +
        95;


    for (

        let i =
            0;

        i <
            attack.spawnCount;

        i++

    ) {

        const angle =

            (
                i /
                attack.spawnCount
            ) *

            Math.PI *
            2;


        const x =
            Math.max(

                50,

                Math.min(

                    canvas.width -
                    50,


                    enemy.x +

                        Math.cos(
                            angle
                        ) *

                        spawnDistance
                )
            );


        const y =
            Math.max(

                50,

                Math.min(

                    canvas.height -
                    50,


                    enemy.y +

                        Math.sin(
                            angle
                        ) *

                        spawnDistance
                )
            );


        api.spawnEnemyAt(

            attack.spawnEnemy,

            x,

            y
        );
    }
}


/* =========================================================
   GENERAL ATTACK LOGIC
   ========================================================= */

function updateAttackLogic(
    enemy,
    dt,
    api,
    config
) {

    const state =
        getBossState(
            enemy
        );


    if (
        state.attackId ===
        0
    ) {

        return;
    }


    state.attackElapsed +=
        dt;


    /*
        ==========================================
        ATTACK 1
        ==========================================
    */

    if (
        state.attackId ===
        1
    ) {

        const attack =
            config.attack1;


        const spacing =

            attack.duration /

            Math.max(
                1,
                attack.shots
            );


        while (

            state.shotsFired <
                attack.shots &&

            state.attackElapsed >=
                state.nextShotTime

        ) {

            fireStoneProjectile(

                enemy,

                api,

                config
            );


            state.shotsFired++;


            state.nextShotTime =

                state.shotsFired *

                spacing;
        }
    }


    /*
        ==========================================
        ATTACK 3
        BOSS 30
        ==========================================
    */

    if (

        state.attackId ===
            3 &&

        config.attack3
            ?.enabled

    ) {

        const attack =
            config.attack3;


        enemy.vx =
            0;


        enemy.vy =
            0;


        /*
            Snel grijs knipperen.
        */

        state.flash =

            (
                Math.floor(

                    state.attackElapsed /
                    0.08

                ) %

                2

            ) ===
            0;


        /*
            Na 0.5 sec:
            vijf Stones.
        */

        if (

            !state.summonDone &&

            state.attackElapsed >=
                attack.warningDuration

        ) {

            state.summonDone =
                true;


            state.flash =
                false;


            spawnFiveStones(

                enemy,

                api,

                config
            );
        }
    }
}


/* =========================================================
   ATTACK CYCLE

   BOSS 25:
   0 idle
   1 attack
   2 idle
   3 andere attack

   BOSS 30:
   0 idle
   1 attack 1
   2 idle
   3 attack 2
   4 idle
   5 attack 3
   ========================================================= */

function updateCycle(
    enemy,
    dt,
    api,
    config
) {

    const state =
        getBossState(
            enemy
        );


    const phaseDuration =
        config.attackSystem
            .phaseDuration;


    const phaseCount =

        config.attack3
            ?.enabled

            ? 6

            : 4;


    const cycleDuration =

        phaseDuration *
        phaseCount;


    state.cycleTime +=
        dt;


    /*
        Nieuwe cyclus.
    */

    if (

        state.cycleTime >=
        cycleDuration

    ) {

        state.cycleTime %=
            cycleDuration;


        state.phase =
            -1;


        state.firstAttack =
            null;


        endAttack(
            enemy
        );
    }


    const phase =
        Math.min(

            phaseCount -
                1,

            Math.floor(

                state.cycleTime /
                phaseDuration
            )
        );


    if (
        phase !==
        state.phase
    ) {

        state.phase =
            phase;


        /*
            ======================================
            BOSS 25
            ======================================
        */

        if (
            !config.attack3
                ?.enabled
        ) {

            if (
                phase ===
                1
            ) {

                startAttack(

                    enemy,

                    chooseAttack(

                        enemy,

                        1,

                        config
                    )
                );

            } else if (
                phase ===
                3
            ) {

                startAttack(

                    enemy,

                    chooseAttack(

                        enemy,

                        2,

                        config
                    )
                );

            } else {

                endAttack(
                    enemy
                );
            }

        } else {

            /*
                ==================================
                BOSS 30
                ==================================
            */

            if (
                phase ===
                1
            ) {

                startAttack(
                    enemy,
                    1
                );

            } else if (
                phase ===
                3
            ) {

                startAttack(
                    enemy,
                    2
                );

            } else if (
                phase ===
                5
            ) {

                startAttack(
                    enemy,
                    3
                );

            } else {

                endAttack(
                    enemy
                );
            }
        }
    }


    updateAttackLogic(

        enemy,

        dt,

        api,

        config
    );
}


/* =========================================================
   DRAW STONE IMAGE
   ========================================================= */

function drawStoneImage(
    ctx,
    api,
    source,
    x,
    y,
    radius,
    rotation = 0,
    alpha = 1
) {

    const image =
        api.getAssetImage(
            source
        );


    ctx.save();


    ctx.globalAlpha =
        alpha;


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

            radius * 2,
            radius * 2
        );

    } else {

        ctx.fillStyle =
            "#777777";


        ctx.fillRect(

            -radius,
            -radius,

            radius * 2,
            radius * 2
        );
    }


    ctx.restore();


    /*
        Rand.
    */

    ctx.save();


    ctx.globalAlpha =
        alpha;


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
        2;


    ctx.strokeStyle =
        "#343434";


    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   DRAW STEENBEN
   ========================================================= */

function drawSteenBen(
    enemy,
    ctx,
    api,
    config
) {

    const image =
        api.getAssetImage(
            config.image
        );


    const state =
        getBossState(
            enemy
        );


    const r =
        enemy.radius;


    ctx.save();


    ctx.beginPath();


    ctx.arc(

        enemy.x,
        enemy.y,
        r,

        0,
        Math.PI *
            2
    );


    ctx.clip();


    /*
        ==========================================
        BEN.PNG
        ==========================================
    */

    if (

        image &&

        image.complete &&

        image.naturalWidth >
            0

    ) {

        ctx.drawImage(

            image,

            enemy.x -
                r,

            enemy.y -
                r,

            r * 2,

            r * 2
        );


        /*
            Grijze tint over ben.png.
        */

        ctx.globalCompositeOperation =
            "source-atop";


        ctx.globalAlpha =
            0.63;


        ctx.fillStyle =

            state.flash

                ? "#d5d5d5"

                : config.color;


        ctx.fillRect(

            enemy.x -
                r,

            enemy.y -
                r,

            r * 2,

            r * 2
        );

    } else {

        ctx.fillStyle =

            state.flash

                ? "#d5d5d5"

                : config.color;


        ctx.fillRect(

            enemy.x -
                r,

            enemy.y -
                r,

            r * 2,

            r * 2
        );
    }


    ctx.restore();


    /*
        Witte rand.
    */

    ctx.save();


    ctx.beginPath();


    ctx.arc(

        enemy.x,
        enemy.y,
        r,

        0,
        Math.PI *
            2
    );


    ctx.lineWidth =
        config.borderWidth;


    ctx.strokeStyle =
        config.borderColor;


    ctx.stroke();


    ctx.restore();
}


/* =========================================================
   BOSS 25
   ========================================================= */

const steenBen = {

    id:
        "steen-ben-level-25",


    name:
        "SteenBen",


    behavior:
        "steen-ben-boss",


    boss:
        true,


    /*
        ==========================================
        STATS
        ==========================================
    */

    hp:
        200,


    size:
        6,


    shape:
        "circle",


    speed:
        "ultraSlow",


    tracking:
        0.1,


    /*
        BELANGRIJK:
        lowercase ben.png
    */

    image:
        "ben.png",


    color:
        "#777777",


    borderColor:
        "#ffffff",


    borderWidth:
        4,


    stayInsideArena:
        true,


    hideWorldHealthBar:
        true,


    alwaysShowHealthBar:
        true,


    hideLevelTitleWhenActive:
        true,


    /*
        Boss 25 komt normaal
        vanuit buiten de arena.

        Boss 30 zet dit op true.
    */

    dropOnSpawn:
        false,


    /* =====================================================
       ATTACK SYSTEM
       ===================================================== */

    attackSystem: {

        phaseDuration:
            15
    },


    /* =====================================================
       ATTACK 1
       ===================================================== */

    attack1: {

        id:
            "stone-split-barrage",


        duration:
            15,


        /*
            Boss 25:
            6 grote stenen.

            Boss 30:
            12.
        */

        shots:
            6,


        projectileSize:
            2,


        projectileSpeed:
            300,


        projectileImage:
            "stone.png",


        /*
            Split stukken.
        */

        fragmentSize:
            1,


        fragmentSpeed:
            360,


        /*
            Ongeveer 24 graden
            naar links/rechts.
        */

        splitAngle:
            0.42
    },


    /* =====================================================
       ATTACK 2
       ===================================================== */

    attack2: {

        id:
            "stone-charge-meteors",


        warningDuration:
            2,


        warningFlashes:
            2,


        dashSpeed:
            700,


        /*
            Boss 25:
            één charge.

            Boss 30:
            drie charges totaal.
        */

        chargeRuns:
            1,


        wallPause:
            1,


        /*
            Boss 25:
            20 meteors.

            Boss 30:
            40.
        */

        meteorCount:
            20,


        meteorImage:
            "stone.png",


        meteorSize:
            2.5,


        meteorWarningDuration:
            1.15,


        meteorFallDuration:
            0.45,


        meteorStagger:
            0.35,


        meteorImpactRadius:
            34
    },


    /* =====================================================
       ATTACK 3

       UIT BIJ BOSS 25.
       ===================================================== */

    attack3: {

        enabled:
            false,


        warningDuration:
            0.5,


        spawnCount:
            5,


        spawnEnemy:
            "stone"
    },


    /* =====================================================
       RESET
       ===================================================== */

    reset() {

        clearRuntime();
    },


    onPlayerDeath() {

        clearRuntime();
    },


    onLevelWin() {

        clearRuntime();
    },


    /* =====================================================
       SPAWN
       ===================================================== */

    onSpawn(
        enemy,
        api
    ) {

        const state =
            getBossState(
                enemy
            );


        /*
            ======================================
            BOSS 30 LANDING

            boss-06.js zet dropOnSpawn op true.
            ======================================
        */

        if (
            this.dropOnSpawn
        ) {

            const player =
                api.getPlayer();


            state.dropActive =
                true;


            state.dropTimer =
                0;


            state.dropDuration =
                1;


            state.dropX =
                player.x;


            state.dropY =
                player.y;


            state.dropRadius =
                enemy.radius +
                28;


            enemy.x =
                state.dropX;


            enemy.y =
                state.dropY;


            enemy.vx =
                0;


            enemy.vy =
                0;


            enemy.enteredArena =
                false;


            enemy.collidesWithPlayer =
                false;


            return;
        }


        /*
            ======================================
            BOSS 25

            Normaal richting speler / arena.
            ======================================
        */

        api.aimVelocityAtPlayer(
            enemy
        );
    },


    /* =====================================================
       UPDATE
       ===================================================== */

    update(
        enemy,
        dt,
        api
    ) {

        const state =
            getBossState(
                enemy
            );


        /*
            ======================================
            DROP SPAWN
            BOSS 30
            ======================================
        */

        if (
            state.dropActive
        ) {

            state.dropTimer +=
                dt;


            enemy.x =
                state.dropX;


            enemy.y =
                state.dropY;


            enemy.vx =
                0;


            enemy.vy =
                0;


            if (

                state.dropTimer >=
                state.dropDuration

            ) {

                /*
                    Staat speler nog
                    in landingscirkel?
                */

                if (
                    api.playerTouchesCircle(

                        state.dropX,

                        state.dropY,

                        state.dropRadius
                    )
                ) {

                    api.killPlayer();
                }


                state.dropActive =
                    false;


                enemy.collidesWithPlayer =
                    true;


                enemy.enteredArena =
                    true;


                startFight(
                    enemy
                );
            }


            return;
        }


        /*
            ======================================
            BOSS 25 ARENA BINNEN
            ======================================
        */

        if (
            !enemy.enteredArena
        ) {

            api.moveTowardPlayer(

                enemy,

                dt,

                this.tracking
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


                startFight(
                    enemy
                );
            }


            return;
        }


        startFight(
            enemy
        );


        /*
            Attack cycle.
        */

        updateCycle(

            enemy,

            dt,

            api,

            this
        );


        /*
            ======================================
            ATTACK 2

            De charge bepaalt volledig
            hoe SteenBen beweegt.
            ======================================
        */

        if (

            state.attackId ===
                2 &&

            (
                state.chargeState ===
                    "warning" ||

                state.chargeState ===
                    "dash" ||

                state.chargeState ===
                    "wall-pause"
            )

        ) {

            updateCharge(

                enemy,

                dt,

                api,

                this
            );


            return;
        }


        /*
            ======================================
            ATTACK 3

            0.5 sec volledig stil.
            ======================================
        */

        if (

            state.attackId ===
                3 &&

            this.attack3
                ?.enabled &&

            !state.summonDone

        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            return;
        }


        /*
            ======================================
            NORMALE CHASE
            ======================================
        */

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
    },


    /* =====================================================
       PROJECTILES / METEORS
       ===================================================== */

    afterUpdate(
        dt,
        api
    ) {

        updateRockProjectiles(

            dt,

            api,

            this
        );


        if (
            api.getPlayer()
                .alive ===
            false
        ) {

            return;
        }


        updateRockFragments(

            dt,

            api
        );


        if (
            api.getPlayer()
                .alive ===
            false
        ) {

            return;
        }


        updateMeteors(

            dt,

            api
        );
    },


    /* =====================================================
       DEATH
       ===================================================== */

    onDeath(
        enemy,
        api
    ) {

        clearRuntime();


        api.completeLevelNow({

            clearEnemies:
                true,


            stopSpawns:
                true,


            clearExplosions:
                true
        });
    },


    /* =====================================================
       DRAW BOSS
       ===================================================== */

    draw(
        enemy,
        ctx,
        api
    ) {

        const state =
            getBossState(
                enemy
            );


        /*
            Boss 30 is nog onzichtbaar
            tijdens de landing warning.
        */

        if (
            state.dropActive
        ) {

            return;
        }


        drawSteenBen(

            enemy,

            ctx,

            api,

            this
        );
    },


    /* =====================================================
       DRAW BELOW

       - landing warning
       - meteor warning
       ===================================================== */

    drawBelow(
        ctx,
        api,
        definition
    ) {

        const boss =

            api.getEnemies()
                .find(

                    enemy =>

                        enemy.definition ===
                        definition
                );


        /*
            ======================================
            BOSS 30 LANDING CIRCLE
            ======================================
        */

        if (
            boss
        ) {

            const state =
                getBossState(
                    boss
                );


            if (
                state.dropActive
            ) {

                ctx.save();


                ctx.beginPath();


                ctx.arc(

                    state.dropX,

                    state.dropY,

                    state.dropRadius,

                    0,

                    Math.PI *
                        2
                );


                ctx.fillStyle =
                    "rgba(45,45,45,0.72)";


                ctx.fill();


                ctx.lineWidth =
                    4;


                ctx.strokeStyle =
                    "rgba(15,15,15,0.95)";


                ctx.stroke();


                ctx.restore();
            }
        }


        /*
            ======================================
            METEOR WARNINGS
            ======================================
        */

        for (
            const meteor
            of meteors
        ) {

            if (

                meteor.stage !==
                    "warning" ||

                meteor.elapsed <
                    meteor.delay

            ) {

                continue;
            }


            const activeTime =

                meteor.elapsed -
                meteor.delay;


            const progress =
                Math.min(

                    1,

                    activeTime /
                    meteor.warningDuration
                );


            const pulse =

                0.45 +

                Math.sin(

                    activeTime *
                    18

                ) *

                0.12;


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                meteor.targetX,

                meteor.targetY,


                meteor.impactRadius *

                    (
                        0.82 +

                        progress *
                        0.18
                    ),


                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =

                `rgba(70,70,70,${Math.max(
                    0.14,
                    pulse * 0.35
                )})`;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =

                `rgba(230,230,230,${Math.min(
                    0.95,
                    0.45 +
                    progress * 0.5
                )})`;


            ctx.stroke();


            ctx.restore();
        }
    },


    /* =====================================================
       DRAW GLOBAL

       - attack stones
       - fragments
       - falling meteors
       ===================================================== */

    drawGlobal(
        ctx,
        api
    ) {

        /*
            ======================================
            ATTACK 1 STONES
            ======================================
        */

        for (
            const rock
            of rockProjectiles
        ) {

            drawStoneImage(

                ctx,

                api,

                rock.image,

                rock.x,

                rock.y,

                rock.radius,

                rock.rotation
            );
        }


        /*
            ======================================
            SPLIT FRAGMENTS
            ======================================
        */

        for (
            const fragment
            of rockFragments
        ) {

            drawStoneImage(

                ctx,

                api,

                fragment.image,

                fragment.x,

                fragment.y,

                fragment.radius,

                fragment.rotation,

                0.94
            );
        }


        /*
            ======================================
            METEORS
            ======================================
        */

        for (
            const meteor
            of meteors
        ) {

            if (
                meteor.elapsed <
                meteor.delay
            ) {

                continue;
            }


            const activeTime =

                meteor.elapsed -
                meteor.delay;


            /*
                FALLING.
            */

            if (
                meteor.stage ===
                "falling"
            ) {

                const fallProgress =
                    Math.min(

                        1,

                        (
                            activeTime -
                            meteor.warningDuration
                        ) /

                        meteor.fallDuration
                    );


                const startY =

                    meteor.targetY -
                    360;


                const drawY =

                    startY +

                    (
                        meteor.targetY -
                        startY
                    ) *

                    fallProgress;


                drawStoneImage(

                    ctx,

                    api,

                    meteor.image,

                    meteor.targetX,

                    drawY,

                    meteor.radius,

                    meteor.rotation
                );
            }


            /*
                IMPACT FLASH.
            */

            if (
                meteor.stage ===
                "impact"
            ) {

                const progress =
                    Math.min(

                        1,

                        meteor.impactElapsed /
                        meteor.impactDuration
                    );


                ctx.save();


                ctx.beginPath();


                ctx.arc(

                    meteor.targetX,

                    meteor.targetY,


                    meteor.impactRadius *

                        (
                            0.55 +

                            progress *
                            0.65
                        ),


                    0,

                    Math.PI *
                        2
                );


                ctx.fillStyle =

                    `rgba(95,95,95,${0.42 * (
                        1 -
                        progress
                    )})`;


                ctx.fill();


                ctx.restore();
            }
        }
    },


    /* =====================================================
       BOSS HUD
       ===================================================== */

    drawHud(
        ctx,
        api,
        definition
    ) {

        const boss =

            api.getEnemies()
                .find(

                    enemy =>

                        enemy.definition ===
                            definition &&

                        enemy.enteredArena
                );


        if (
            !boss
        ) {

            return;
        }


        const canvas =
            api.getCanvas();


        const width =
            Math.min(

                620,

                canvas.width *
                0.62
            );


        const height =
            26;


        const x =

            canvas.width /
                2 -

            width /
                2;


        const y =
            68;


        const hpRatio =
            Math.max(

                0,

                Math.min(

                    1,

                    boss.hp /
                    boss.maxHp
                )
            );


        ctx.save();


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.font =
            "bold 24px Arial";


        ctx.lineWidth =
            5;


        /*
            Naam outline.
        */

        ctx.strokeStyle =
            "rgba(0,0,0,0.80)";


        ctx.strokeText(

            "STEENBEN",

            canvas.width /
                2,

            y -
                21
        );


        /*
            Naam.
        */

        ctx.fillStyle =
            "#dddddd";


        ctx.fillText(

            "STEENBEN",

            canvas.width /
                2,

            y -
                21
        );


        /*
            Achtergrond HP.
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";


        ctx.fillRect(

            x -
                4,

            y -
                4,

            width +
                8,

            height +
                8
        );


        /*
            HP.
        */

        ctx.fillStyle =
            "#777777";


        ctx.fillRect(

            x,

            y,

            width *
                hpRatio,

            height
        );


        /*
            Rand.
        */

        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth =
            2;


        ctx.strokeRect(

            x,

            y,

            width,

            height
        );


        /*
            HP nummer.
        */

        ctx.font =
            "bold 14px Arial";


        ctx.fillStyle =
            "#ffffff";


        ctx.fillText(

            `${Math.ceil(
                boss.hp
            )} / ${boss.maxHp}`,

            canvas.width /
                2,

            y +
                height /
                    2
        );


        ctx.restore();
    }
};


export default steenBen;