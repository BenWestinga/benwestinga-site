const rocks =
    [];


const throws =
    [];


function clearBossRuntime() {

    rocks.length =
        0;

    throws.length =
        0;
}


function getBossState(
    enemy
) {

    if (
        !enemy.bossState
    ) {

        enemy.bossState = {

            fightStarted:
                false,


            dropActive:
                true,

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


            minionTimer:
                0,


            shotsFired:
                0,

            nextShotTime:
                0,


            chargeCount:
                0,

            nextChargeTime:
                0,

            chargeState:
                "idle",

            chargeTimer:
                0,


            throwDone:
                false,

            flash:
                false,


            guardianSpawned:
                false
        };
    }


    return enemy.bossState;
}


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


    state.minionTimer =
        0;


    state.chargeState =
        "idle";


    state.chargeTimer =
        0;


    state.flash =
        false;
}


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
        Onder 100 HP:
        Attack 1 / 2 / 3 random.
    */

    if (
        enemy.hp <=
        config
            .attackSystem
            .lowHealthThreshold
    ) {

        return (

            1 +

            Math.floor(
                Math.random() *
                3
            )
        );
    }


    /*
        Boven 100 HP:
        Attack 1 en 2 allebei
        precies één keer per cyclus.
    */

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


    if (
        attackId ===
        1
    ) {

        state.shotsFired =
            0;


        state.nextShotTime =
            0;
    }


    if (
        attackId ===
        2
    ) {

        state.chargeCount =
            0;


        state.nextChargeTime =
            0;


        state.chargeState =
            "idle";


        state.chargeTimer =
            0;
    }


    if (
        attackId ===
        3
    ) {

        state.throwDone =
            false;
    }
}


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


function fireRock(
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


    const attack =
        config.attack1;


    rocks.push({

        x:
            enemy.x,

        y:
            enemy.y,


        vx:

            (
                dx /
                distance
            ) *

            attack
                .projectileSpeed,


        vy:

            (
                dy /
                distance
            ) *

            attack
                .projectileSpeed,


        radius:

            api.getEnemyRadius(

                attack
                    .projectileSize
            ),


        color:
            attack
                .projectileColor,


        image:
            attack
                .projectileImage,


        bounceCount:
            0,


        maxBounces:
            attack
                .maxBounces
    });
}


function beginChargeWarning(
    enemy
) {

    const state =
        getBossState(
            enemy
        );


    state.chargeState =
        "warning";


    state.chargeTimer =
        0;


    state.flash =
        true;


    enemy.vx =
        0;


    enemy.vy =
        0;
}


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


    if (
        state.chargeState ===
        "warning"
    ) {

        state.chargeTimer +=
            dt;


        const flashPart =

            attack
                .warningDuration /

            Math.max(

                1,

                attack
                    .warningFlashes *
                2
            );


        state.flash =

            (
                Math.floor(

                    state.chargeTimer /
                    flashPart
                ) %

                2
            ) === 0;


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

                attack
                    .dashSpeed;


            enemy.vy =

                (
                    dy /
                    distance
                ) *

                attack
                    .dashSpeed;


            state.chargeState =
                "dash";


            state.chargeTimer =
                0;
        }


        return true;
    }


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


        if (
            hitWall
        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            state.chargeState =
                "wall-pause";


            state.chargeTimer =
                0;
        }


        return true;
    }


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

            state.chargeState =
                "idle";


            state.chargeTimer =
                0;
        }


        return true;
    }


    return false;
}


function launchWormBall(
    enemy,
    api,
    config
) {

    const player =
        api.getPlayer();


    const attack =
        config.attack3;


    throws.push({

        startX:
            enemy.x,

        startY:
            enemy.y,


        x:
            enemy.x,

        y:
            enemy.y,


        targetX:
            player.x,

        targetY:
            player.y,


        elapsed:
            0,


        duration:
            attack
                .flightDuration,


        radius:

            api.getEnemyRadius(

                attack
                    .projectileSize
            ),


        color:
            attack
                .projectileColor,


        targetColor:
            attack
                .targetColor,


        targetOutline:
            attack
                .targetOutline,


        targetRadius:
            attack
                .targetRadius,


        spawnEnemy:
            attack
                .spawnEnemy
    });
}


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

            fireRock(
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


    if (
        state.attackId ===
        2
    ) {

        const attack =
            config.attack2;


        const spacing =

            attack.duration /

            Math.max(
                1,
                attack.charges
            );


        if (
            state.chargeState ===
                "idle" &&

            state.chargeCount <
                attack.charges &&

            state.attackElapsed >=
                state.nextChargeTime
        ) {

            beginChargeWarning(
                enemy
            );


            state.chargeCount++;


            state.nextChargeTime =

                state.chargeCount *

                spacing;
        }
    }


    if (
        state.attackId ===
        3
    ) {

        const attack =
            config.attack3;


        if (
            !state.throwDone &&

            state.attackElapsed >=
                attack.warningDuration
        ) {

            state.throwDone =
                true;


            launchWormBall(
                enemy,
                api,
                config
            );
        }
    }
}


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


    const cycleDuration =
        config
            .attackSystem
            .cycleDuration;


    const phaseDuration =
        config
            .attackSystem
            .phaseDuration;


    state.cycleTime +=
        dt;


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

            3,

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
    }


    updateAttackLogic(
        enemy,
        dt,
        api,
        config
    );
}


function updateMinions(
    enemy,
    dt,
    api,
    config
) {

    const state =
        getBossState(
            enemy
        );


    state.minionTimer +=
        dt;


    while (
        state.minionTimer >=
        config.minionInterval
    ) {

        state.minionTimer -=
            config.minionInterval;


        api.spawnEnemy(
            config.minionEnemy
        );
    }
}


function updateRocks(
    dt,
    api
) {

    const canvas =
        api.getCanvas();


    for (
        let i =
            rocks.length -
            1;

        i >= 0;

        i--
    ) {

        const rock =
            rocks[i];


        rock.x +=
            rock.vx *
            dt;


        rock.y +=
            rock.vy *
            dt;


        if (
            api.playerTouchesCircle(

                rock.x,

                rock.y,

                rock.radius
            )
        ) {

            rocks.splice(
                i,
                1
            );


            api.killPlayer();


            return;
        }


        const margin =
            rock.radius +
            14;


        let hitWall =
            false;


        if (
            rock.x <=
            margin
        ) {

            rock.x =
                margin;


            rock.vx =
                Math.abs(
                    rock.vx
                );


            hitWall =
                true;
        }


        if (
            rock.x >=
            canvas.width -
            margin
        ) {

            rock.x =
                canvas.width -
                margin;


            rock.vx =
                -Math.abs(
                    rock.vx
                );


            hitWall =
                true;
        }


        if (
            rock.y <=
            margin
        ) {

            rock.y =
                margin;


            rock.vy =
                Math.abs(
                    rock.vy
                );


            hitWall =
                true;
        }


        if (
            rock.y >=
            canvas.height -
            margin
        ) {

            rock.y =
                canvas.height -
                margin;


            rock.vy =
                -Math.abs(
                    rock.vy
                );


            hitWall =
                true;
        }


        if (
            hitWall
        ) {

            /*
                maxBounces = 4

                Dus 4 keer stuiteren.
                Bij de volgende wall-hit
                verdwijnt hij.
            */

            if (
                rock.bounceCount >=
                rock.maxBounces
            ) {

                rocks.splice(
                    i,
                    1
                );


                continue;
            }


            rock.bounceCount++;
        }
    }
}


function updateThrows(
    dt,
    api
) {

    for (
        let i =
            throws.length -
            1;

        i >= 0;

        i--
    ) {

        const projectile =
            throws[i];


        projectile.elapsed +=
            dt;


        const progress =
            Math.min(

                1,

                projectile.elapsed /
                projectile.duration
            );


        projectile.x =

            projectile.startX +

            (
                projectile.targetX -
                projectile.startX
            ) *

            progress;


        projectile.y =

            projectile.startY +

            (
                projectile.targetY -
                projectile.startY
            ) *

            progress;


        if (
            progress <
            1
        ) {

            continue;
        }


        if (
            api.playerTouchesCircle(

                projectile.targetX,

                projectile.targetY,

                projectile.targetRadius
            )
        ) {

            api.killPlayer();
        }


        api.spawnEnemyAt(

            projectile.spawnEnemy,

            projectile.targetX,

            projectile.targetY
        );


        throws.splice(
            i,
            1
        );


        if (
            api.getPlayer()
                .alive ===
            false
        ) {

            return;
        }
    }
}


function drawTintedCircleImage(

    ctx,

    api,

    source,

    x,

    y,

    radius,

    color,

    tintAlpha

) {

    const image =
        api.getAssetImage(
            source
        );


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


    ctx.clip();


    if (
        image &&
        image.complete &&
        image.naturalWidth >
            0
    ) {

        ctx.drawImage(

            image,

            x - radius,

            y - radius,

            radius *
                2,

            radius *
                2
        );


        ctx.globalCompositeOperation =
            "source-atop";


        ctx.globalAlpha =
            tintAlpha;


        ctx.fillStyle =
            color;


        ctx.fillRect(

            x - radius,

            y - radius,

            radius *
                2,

            radius *
                2
        );


        ctx.globalCompositeOperation =
            "source-over";


        ctx.globalAlpha =
            1;

    } else {

        ctx.fillStyle =
            color;


        ctx.fillRect(

            x - radius,

            y - radius,

            radius *
                2,

            radius *
                2
        );
    }


    ctx.restore();
}


const sandBen = {

    id:
        "sand-ben-level-10",

    name:
        "Sand-Ben",

    behavior:
        "sand-boss",


    boss:
        true,


    hp:
        250,


    /*
        Level 5 = size 6
        Level 10 = size 8
    */

    size:
        8,


    shape:
        "circle",


    speed:
        "ultraSlow",

    tracking:
        0.1,


    image:
        "Ben.png",

    color:
        "#e0bd38",


    borderColor:
        "#ffffff",

    borderWidth:
        4,


    hideWorldHealthBar:
        true,

    alwaysShowHealthBar:
        true,


    minionEnemy:
        "sandGoon",

    minionInterval:
        1,


    attackSystem: {

        cycleDuration:
            60,

        phaseDuration:
            15,

        lowHealthThreshold:
            100
    },


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


        /*
            Level 5 = 2
            Level 10 = 4
        */

        maxBounces:
            4,


        instantKill:
            true
    },


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


        /*
            Level 5 = 700
            Level 10 = 1400
        */

        dashSpeed:
            1400,


        wallPause:
            1,

        instantKill:
            true
    },


    attack3: {

        id:
            "worm-throw",

        duration:
            15,


        unlockHp:
            100,


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
    },


    reset() {

        clearBossRuntime();
    },


    onPlayerDeath() {

        clearBossRuntime();
    },


    onLevelWin() {

        clearBossRuntime();
    },


    /*
        BOSS DROP SPAWN
    */

    onSpawn(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        const state =
            getBossState(
                enemy
            );


        /*
            Spelerpositie wordt NU
            opgeslagen.

            De boss landt pas
            één seconde later.
        */

        state.dropX =
            player.x;


        state.dropY =
            player.y;


        state.dropRadius =
            enemy.radius +
            28;


        state.dropTimer =
            0;


        state.dropDuration =
            1;


        state.dropActive =
            true;


        enemy.x =
            state.dropX;


        enemy.y =
            state.dropY;


        enemy.vx =
            0;


        enemy.vy =
            0;


        /*
            Tijdens waarschuwing
            kan invisible boss de
            speler niet raken.
        */

        enemy.collidesWithPlayer =
            false;
    },


    /*
        Wanneer 100 HP voor het eerst
        bereikt wordt:
        Guardian Worm.
    */

    onDamage(

        enemy,

        damage,

        oldHp,

        api

    ) {

        const state =
            getBossState(
                enemy
            );


        if (
            !state.guardianSpawned &&

            oldHp >
                100 &&

            enemy.hp <=
                100
        ) {

            state.guardianSpawned =
                true;


            const guardianHead =
                api.spawnEnemy(
                    "sandguardianWorm"
                );


            /*
                Guardian target
                GARANDEERD de boss.
            */

            guardianHead
                ?.definition
                ?.forceTarget
                ?.(
                    guardianHead,
                    enemy,
                    api
                );
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        const config =
            enemy.definition;


        const state =
            getBossState(
                enemy
            );


        /*
            ==================================
            DROP WARNING
            ==================================
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
                    Sta je 1 seconde later
                    nog in de cirkel?
                    Dood.
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


        startFight(
            enemy
        );


        updateMinions(

            enemy,

            dt,

            api,

            config
        );


        updateCycle(

            enemy,

            dt,

            api,

            config
        );


        /*
            Charge bestuurt boss zelf.
        */

        if (
            state.attackId ===
                2 &&

            updateCharge(

                enemy,

                dt,

                api,

                config
            )
        ) {

            return;
        }


        /*
            Worm throw:
            eerste 2 sec stil.
        */

        if (
            state.attackId ===
                3 &&

            !state.throwDone
        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            api.keepInsideArena(
                enemy,
                14,
                false
            );


            return;
        }


        /*
            Normale boss chase.
        */

        api.moveTowardPlayer(

            enemy,

            dt,

            config.tracking
        );


        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },


    afterUpdate(
        dt,
        api
    ) {

        updateRocks(
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


        updateThrows(
            dt,
            api
        );
    },


    onDeath(
        enemy,
        api
    ) {

        api.completeLevelNow({

            clearEnemies:
                true,

            stopSpawns:
                true,

            clearExplosions:
                true
        });
    },


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
            Tijdens zwarte warning
            is Sand-Ben nog niet zichtbaar.
        */

        if (
            state.dropActive
        ) {

            return;
        }


        const config =
            enemy.definition;


        drawTintedCircleImage(

            ctx,

            api,

            config.image,

            enemy.x,

            enemy.y,

            enemy.radius,

            config.color,

            0.58
        );


        if (
            state.flash
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(

                enemy.x,

                enemy.y,

                enemy.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(255,235,70,0.72)";


            ctx.fill();


            ctx.restore();
        }


        ctx.save();


        ctx.beginPath();


        ctx.arc(

            enemy.x,

            enemy.y,

            enemy.radius,

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
    },


    /*
        Onder enemies:
        - boss landing circle
        - Attack 3 circle
    */

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


        if (boss) {

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
                    "rgba(0,0,0,0.72)";


                ctx.fill();


                ctx.lineWidth =
                    4;


                ctx.strokeStyle =
                    "rgba(0,0,0,0.95)";


                ctx.stroke();


                ctx.restore();
            }
        }


        for (
            const projectile
            of throws
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(

                projectile.targetX,

                projectile.targetY,

                projectile.targetRadius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                projectile
                    .targetColor;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                projectile
                    .targetOutline;


            ctx.stroke();


            ctx.restore();
        }
    },


    drawGlobal(
        ctx,
        api
    ) {

        /*
            ROCK BALLS
        */

        for (
            const rock
            of rocks
        ) {

            drawTintedCircleImage(

                ctx,

                api,

                rock.image,

                rock.x,

                rock.y,

                rock.radius,

                rock.color,

                0.55
            );


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                rock.x,

                rock.y,

                rock.radius,

                0,

                Math.PI *
                    2
            );


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "rgba(90,65,0,0.95)";


            ctx.stroke();


            ctx.restore();
        }


        /*
            WORM THROW BALL
        */

        for (
            const projectile
            of throws
        ) {

            const progress =
                Math.min(

                    1,

                    projectile.elapsed /
                    projectile.duration
                );


            const arcHeight =

                Math.sin(

                    progress *
                    Math.PI
                ) *

                120;


            const drawY =

                projectile.y -

                arcHeight;


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                projectile.x,

                drawY,

                projectile.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                projectile.color;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "rgba(255,255,255,0.9)";


            ctx.stroke();


            ctx.restore();
        }
    },


    /*
        Boss healthbar.
    */

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
                        definition
                );


        if (!boss) {

            return;
        }


        const state =
            getBossState(
                boss
            );


        if (
            state.dropActive ||
            !state.fightStarted
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
            88;


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
            "bold 22px Arial";


        ctx.lineWidth =
            5;


        ctx.strokeStyle =
            "rgba(0,0,0,0.75)";


        ctx.strokeText(

            boss.name,

            canvas.width /
                2,

            y - 17
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(

            boss.name,

            canvas.width /
                2,

            y - 17
        );


        ctx.fillStyle =
            "rgba(0,0,0,0.52)";


        ctx.fillRect(
            x,
            y,
            width,
            height
        );


        ctx.fillStyle =
            "#35c759";


        ctx.fillRect(

            x,

            y,

            width *
                hpRatio,

            height
        );


        ctx.lineWidth =
            3;


        ctx.strokeStyle =
            "rgba(255,255,255,0.88)";


        ctx.strokeRect(
            x,
            y,
            width,
            height
        );


        const hpText =

            `${Math.max(
                0,
                Math.ceil(
                    boss.hp
                )
            )} / ${boss.maxHp}`;


        ctx.font =
            "bold 14px Arial";


        ctx.lineWidth =
            3;


        ctx.strokeStyle =
            "rgba(0,0,0,0.85)";


        ctx.strokeText(

            hpText,

            canvas.width /
                2,

            y +
                height /
                2
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(

            hpText,

            canvas.width /
                2,

            y +
                height /
                2
        );


        ctx.restore();
    }
};


export default sandBen;