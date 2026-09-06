const snakeBullets = [];
const healEffects = [];
const snakeBombs = [];


/* =====================================================
   RUNTIME
   ===================================================== */

function clearRuntime() {

    snakeBullets.length =
        0;

    healEffects.length =
        0;

    snakeBombs.length =
        0;
}


/* =====================================================
   HEAL VISUAL
   ===================================================== */

function addHealEffect(
    enemy,
    amount
) {

    if (
        !enemy ||
        amount <= 0
    ) {

        return;
    }


    healEffects.push({

        x:
            enemy.x,

        y:
            enemy.y,

        amount,

        elapsed:
            0,

        duration:
            1
    });
}


/* =====================================================
   NORMAL SNAKE DIRECTION
   ===================================================== */

function configureSnakeDirection(
    snake,
    angle
) {

    if (!snake) {

        return;
    }


    const dx =
        Math.cos(
            angle
        );


    const dy =
        Math.sin(
            angle
        );


    /*
        Skip the Snake's normal
        first 2 second chase.
    */

    snake.snakeTimer =
        2;


    snake.snakeMode =
        "wave";


    snake.snakeDirectionX =
        dx;


    snake.snakeDirectionY =
        dy;


    snake.snakePerpendicularX =
        -dy;


    snake.snakePerpendicularY =
        dx;


    snake.snakeOriginX =
        snake.x;


    snake.snakeOriginY =
        snake.y;


    snake.snakeDistance =
        0;


    snake.vx =
        dx *
        snake.speed;


    snake.vy =
        dy *
        snake.speed;


    snake.enteredArena =
        true;
}


/* =====================================================
   RAGE SNAKES
   ===================================================== */

function applyRageToSnake(
    snake,
    config
) {

    if (
        !snake ||
        snake.type !==
            "snake"
    ) {

        return;
    }


    if (
        snake.snakeMachineRageActive
    ) {

        return;
    }


    snake.snakeMachineRageActive =
        true;


    snake.snakeMachineOriginalSize =
        snake.size;


    snake.snakeMachineOriginalRadius =
        snake.radius;


    snake.snakeMachineOriginalSpeed =
        snake.speed;


    /*
        Rage snakes become
        2x bigger.
    */

    snake.size *=
        2;


    snake.radius *=
        2;


    /*
        Slightly faster.
    */

    snake.speed *=
        config
            .rageSnakeSpeedMultiplier;


    const velocityLength =
        Math.hypot(

            snake.vx,

            snake.vy
        );


    if (
        velocityLength >
        0
    ) {

        snake.vx =

            snake.vx /
            velocityLength *

            snake.speed;


        snake.vy =

            snake.vy /
            velocityLength *

            snake.speed;
    }
}


function removeRageFromSnake(
    snake
) {

    if (
        !snake ||
        !snake
            .snakeMachineRageActive
    ) {

        return;
    }


    snake.size =

        snake
            .snakeMachineOriginalSize ??

        snake.size;


    snake.radius =

        snake
            .snakeMachineOriginalRadius ??

        snake.radius;


    snake.speed =

        snake
            .snakeMachineOriginalSpeed ??

        snake.speed;


    const velocityLength =
        Math.hypot(

            snake.vx,

            snake.vy
        );


    if (
        velocityLength >
        0
    ) {

        snake.vx =

            snake.vx /
            velocityLength *

            snake.speed;


        snake.vy =

            snake.vy /
            velocityLength *

            snake.speed;
    }


    delete snake
        .snakeMachineOriginalSize;


    delete snake
        .snakeMachineOriginalRadius;


    delete snake
        .snakeMachineOriginalSpeed;


    snake.snakeMachineRageActive =
        false;
}


/* =====================================================
   RAGE START / END
   ===================================================== */

function startRage(
    boss,
    api,
    config
) {

    const state =
        boss
            .snakeMachineState;


    if (!state) {

        return;
    }


    state.raging =
        true;


    state.rageRemaining =
        config.rageDuration;


    state.rageTimer =
        0;


    /*
        Boss becomes 2x faster
        during Rage.
    */

    boss.speed =

        state.baseSpeed *

        config
            .rageBossSpeedMultiplier;


    /*
        Existing normal snakes
        also enter Rage.
    */

    for (
        const enemy
        of api.getEnemies()
    ) {

        if (
            enemy?.type ===
            "snake"
        ) {

            applyRageToSnake(

                enemy,

                config
            );
        }
    }
}


function stopRage(
    boss,
    api
) {

    const state =
        boss
            .snakeMachineState;


    if (!state) {

        return;
    }


    state.raging =
        false;


    state.rageRemaining =
        0;


    state.rageTimer =
        0;


    boss.speed =
        state.baseSpeed;


    for (
        const enemy
        of api.getEnemies()
    ) {

        if (
            enemy?.type ===
            "snake"
        ) {

            removeRageFromSnake(
                enemy
            );
        }
    }
}


/* =====================================================
   GREEN STAGES

   0 snakes  = normal green
   4 snakes  = green stage 1
   8 snakes  = green stage 2
   12 snakes = green stage 3
   16 snakes = green stage 4
   20 snakes = maximum green
   ===================================================== */

function getSnakeMachineColor(
    stage
) {

    const colors = [

        "#4c8d45",

        "#469845",

        "#3fa546",

        "#35b247",

        "#28c34a",

        "#18d84d"
    ];


    return colors[

        Math.max(

            0,

            Math.min(

                5,

                stage ||
                0
            )
        )
    ];
}


/* =====================================================
   ABSORB / HEAL FROM SNAKES
   ===================================================== */

function absorbTouchingSnakes(
    boss,
    api,
    config
) {

    const state =
        boss
            .snakeMachineState;


    if (!state) {

        return;
    }


    const enemies = [

        ...api.getEnemies()
    ];


    for (
        const snake
        of enemies
    ) {

        if (

            !snake ||

            snake ===
                boss ||

            snake.type !==
                "snake" ||

            !api.isEnemyAlive(
                snake
            )

        ) {

            continue;
        }


        const distance =
            Math.hypot(

                snake.x -
                    boss.x,

                snake.y -
                    boss.y
            );


        if (

            distance >

            snake.radius +
                boss.radius

        ) {

            continue;
        }


        /*
            Snake disappears
            into the boss.
        */

        api.removeEnemy(
            snake
        );


        /*
            Every Snake heals
            exactly 3 HP.

            HP cannot exceed
            max HP.
        */

        const oldHp =
            boss.hp;


        boss.hp =
            Math.min(

                boss.maxHp,

                boss.hp +
                    config
                        .snakeHealAmount
            );


        const actualHeal =
            boss.hp -
            oldHp;


        if (
            actualHeal >
            0
        ) {

            addHealEffect(

                boss,

                actualHeal
            );
        }


        /*
            While the big bomb
            is already charging,
            extra Snakes can still
            heal the boss.

            They do NOT count
            toward the next bomb yet.
        */

        if (
            state
                .bombCharging
        ) {

            continue;
        }


        state.absorbedForBomb++;


        /*
            Every 4 Snakes makes
            the boss greener.

            20 / 5 stages = 4.
        */

        state.greenStage =
            Math.min(

                5,

                Math.floor(

                    state
                        .absorbedForBomb /

                    4
                )
            );


        /*
            20 Snakes:
            start the 2-second
            bomb charge.
        */

        if (

            state
                .absorbedForBomb >=

            config
                .snakesForBomb

        ) {

            state.absorbedForBomb =
                config
                    .snakesForBomb;


            state.greenStage =
                5;


            state.bombCharging =
                true;


            state.bombChargeTimer =
                0;


            boss.vx =
                0;


            boss.vy =
                0;
        }
    }
}


/* =====================================================
   BIG SNAKE BOMB
   ===================================================== */

function launchSnakeBomb(
    boss,
    api,
    config
) {

    const state =
        boss
            .snakeMachineState;


    const player =
        api.getPlayer();


    if (
        !state ||
        !player
    ) {

        return;
    }


    /*
        Player position is stored
        at the exact moment the
        boss throws the bomb.
    */

    snakeBombs.push({

        startX:
            boss.x,

        startY:
            boss.y,


        x:
            boss.x,

        y:
            boss.y,


        targetX:
            player.x,

        targetY:
            player.y,


        elapsed:
            0,


        duration:
            config
                .bombFlightDuration,


        radius:
            config
                .bombRadius,


        explosionRadius:
            config
                .bombExplosionRadius
    });


    /*
        Like Snake Queen:
        after throwing the ball,
        reset the green charge.
    */

    state.bombCharging =
        false;


    state.bombChargeTimer =
        0;


    state.absorbedForBomb =
        0;


    state.greenStage =
        0;
}


/* =====================================================
   UPDATE BIG SNAKE BOMBS
   ===================================================== */

function updateSnakeBombs(
    dt,
    api
) {

    for (

        let i =
            snakeBombs.length -
            1;

        i >=
        0;

        i--

    ) {

        const bomb =
            snakeBombs[i];


        bomb.elapsed +=
            dt;


        const progress =
            Math.min(

                1,

                bomb.elapsed /
                    bomb.duration
            );


        bomb.x =

            bomb.startX +

            (
                bomb.targetX -
                    bomb.startX
            ) *

            progress;


        bomb.y =

            bomb.startY +

            (
                bomb.targetY -
                    bomb.startY
            ) *

            progress;


        if (
            progress <
            1
        ) {

            continue;
        }


        /*
            SMALL EXPLOSION.

            createExplosion also
            handles player collision.
        */

        api.createExplosion(

            bomb.targetX,

            bomb.targetY,

            bomb.explosionRadius,

            0.35
        );


        /*
            Spawn exactly
            1 Snake Queen.
        */

        api.spawnEnemyAt(

            "snakeQueen",

            bomb.targetX,

            bomb.targetY
        );


        /*
            Spawn exactly
            5 normal Snakes.
        */

        for (

            let snakeIndex =
                0;

            snakeIndex <
                5;

            snakeIndex++

        ) {

            const angle =

                snakeIndex /
                5 *

                Math.PI *
                2;


            api.spawnEnemyAt(

                "snake",

                bomb.targetX +

                    Math.cos(
                        angle
                    ) *

                    55,

                bomb.targetY +

                    Math.sin(
                        angle
                    ) *

                    55
            );
        }


        snakeBombs.splice(

            i,

            1
        );


        if (
            api.getPlayer()
                ?.alive ===
            false
        ) {

            return;
        }
    }
}


/* =====================================================
   SNAKE GUN
   ===================================================== */

function shootSnakeBullet(
    boss,
    api,
    config
) {

    const player =
        api.getPlayer();


    const dx =
        player.x -
        boss.x;


    const dy =
        player.y -
        boss.y;


    const length =
        Math.hypot(

            dx,

            dy

        ) ||
        1;


    const vx =

        dx /
        length *

        config
            .snakeBulletSpeed;


    const vy =

        dy /
        length *

        config
            .snakeBulletSpeed;


    snakeBullets.push({

        x:
            boss.x,

        y:
            boss.y,


        vx,

        vy,


        angle:
            Math.atan2(

                vy,

                vx
            ),


        radius:
            config
                .snakeBulletRadius,


        raging:

            boss
                .snakeMachineState
                ?.raging ===
            true
    });
}


/* =====================================================
   SNAKE BULLET -> NORMAL SNAKE
   ===================================================== */

function transformBulletIntoSnake(
    bullet,
    api,
    config
) {

    const canvas =
        api.getCanvas();


    const margin =
        30;


    const spawnX =
        Math.max(

            margin,

            Math.min(

                canvas.width -
                    margin,

                bullet.x
            )
        );


    const spawnY =
        Math.max(

            margin,

            Math.min(

                canvas.height -
                    margin,

                bullet.y
            )
        );


    const snake =
        api.spawnEnemyAt(

            "snake",

            spawnX,

            spawnY
        );


    if (!snake) {

        return;
    }


    /*
        Exact 180 degree turn.
    */

    configureSnakeDirection(

        snake,

        bullet.angle +
            Math.PI
    );


    /*
        If the Snake Machine
        was raging when it fired,
        this Snake also gets Rage.
    */

    if (
        bullet.raging
    ) {

        applyRageToSnake(

            snake,

            config
        );
    }
}


/* =====================================================
   DRAW BOSS
   ===================================================== */

function drawSnakeMachine(
    enemy,
    ctx,
    api,
    config
) {

    const image =
        api.getAssetImage(
            config.image
        );


    const x =
        enemy.x;


    const y =
        enemy.y;


    const r =
        enemy.radius;


    const state =
        enemy
            .snakeMachineState ||
        {};


    const raging =
        state.raging ===
        true;


    const greenStage =
        state.greenStage ||
        0;


    /*
        During Rage, add another
        visual green stage.
    */

    const bodyColor =
        getSnakeMachineColor(

            raging

                ? Math.min(

                    5,

                    greenStage +
                        1
                )

                : greenStage
        );


    ctx.save();


    /*
        GREEN BODY
    */

    ctx.beginPath();


    ctx.arc(

        x,

        y,

        r,

        0,

        Math.PI *
            2
    );


    ctx.fillStyle =
        bodyColor;


    ctx.fill();


    /*
        BEN IMAGE
    */

    if (

        image &&

        image.complete &&

        image.naturalWidth >
        0

    ) {

        ctx.save();


        ctx.beginPath();


        ctx.arc(

            x,

            y,

            r *
                0.91,

            0,

            Math.PI *
                2
        );


        ctx.clip();


        ctx.drawImage(

            image,

            x -
                r *
                0.91,

            y -
                r *
                0.91,

            r *
                1.82,

            r *
                1.82
        );


        /*
            Every green stage
            gives the image a
            stronger green tint.
        */

        const greenAlpha =

            0.22 +

            greenStage *
                0.055;


        ctx.globalCompositeOperation =
            "source-atop";


        ctx.fillStyle =

            raging

                ? `rgba(25,255,55,${Math.min(
                    0.62,
                    greenAlpha +
                        0.12
                )})`

                : `rgba(35,215,60,${Math.min(
                    0.55,
                    greenAlpha
                )})`;


        ctx.fillRect(

            x -
                r,

            y -
                r,

            r *
                2,

            r *
                2
        );


        ctx.restore();
    }


    /*
        BORDER
    */

    ctx.beginPath();


    ctx.arc(

        x,

        y,

        r,

        0,

        Math.PI *
            2
    );


    ctx.strokeStyle =

        raging

            ? "#caffbc"

            : "#e2ffda";


    ctx.lineWidth =
        Math.max(

            4,

            r *
                0.07
        );


    ctx.stroke();


    /*
        SNAKE MACHINE GUN
    */

    const player =
        api.getPlayer();


    const gunAngle =
        Math.atan2(

            player.y -
                y,

            player.x -
                x
        );


    ctx.translate(

        x,

        y
    );


    ctx.rotate(
        gunAngle
    );


    /*
        Gun body.
    */

    ctx.fillStyle =
        "#315f32";


    ctx.beginPath();


    ctx.roundRect(

        r *
            0.08,

        -r *
            0.18,

        r *
            0.56,

        r *
            0.36,

        r *
            0.08
    );


    ctx.fill();


    /*
        Barrel outline.
    */

    ctx.strokeStyle =
        "#183c1c";


    ctx.lineWidth =
        Math.max(

            8,

            r *
                0.14
        );


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(

        r *
            0.40,

        0
    );


    ctx.lineTo(

        r *
            1.10,

        0
    );


    ctx.stroke();


    /*
        Green barrel.
    */

    ctx.strokeStyle =

        raging

            ? "#67ff6d"

            : bodyColor;


    ctx.lineWidth =
        Math.max(

            4,

            r *
                0.06
        );


    ctx.beginPath();


    ctx.moveTo(

        r *
            0.42,

        0
    );


    ctx.lineTo(

        r *
            1.12,

        0
    );


    ctx.stroke();


    /*
        Barrel end.
    */

    ctx.beginPath();


    ctx.arc(

        r *
            1.10,

        0,

        r *
            0.12,

        0,

        Math.PI *
            2
    );


    ctx.fillStyle =
        "#173a1b";


    ctx.fill();


    ctx.restore();
}


/* =====================================================
   BOSS
   ===================================================== */

const snakeMachine = {

    id:
        "snake-machine",


    name:
        "Snake Machine",


    behavior:
        "snake-machine-boss",


    boss:
        true,


    hideLevelTitleWhenActive:
        true,


    /*
        Same HP as Boss 3.
    */

    hp:
        250,


    /*
        Boss 3 = size 6.
        Boss 4 = +2 size.
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
        "ben.png",


    color:
        "#438f45",


    borderColor:
        "#ffffff",


    borderWidth:
        4,


    stayInsideArena:
        true,


    /* =================================================
       SNAKE GUN
       ================================================= */

    normalSnakeGunInterval:
        5,


    rageSnakeGunInterval:
        2.5,


    snakeBulletSpeed:
        420,


    snakeBulletRadius:
        11,


    /* =================================================
       SNAKE HEAL
       ================================================= */

    snakeHealAmount:
        3,


    /* =================================================
       20-SNAKE BOMB
       ================================================= */

    snakesForBomb:
        20,


    /*
        Boss stands completely
        still for 2 seconds.
    */

    bombChargeDuration:
        2,


    /*
        Time the large ball spends
        flying toward the stored
        player position.
    */

    bombFlightDuration:
        0.85,


    bombRadius:
        24,


    /*
        Small explosion radius.
    */

    bombExplosionRadius:
        58,


    /* =================================================
       RAGE
       ================================================= */

    rageInterval:
        40,


    rageDuration:
        20,


    rageBossSpeedMultiplier:
        2,


    rageSnakeSpeedMultiplier:
        1.2,


    /* =================================================
       RESET
       ================================================= */

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
       SPAWN DROP LIKE BOSS 2
       ================================================= */

    onSpawn(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        enemy.snakeMachineState = {

            /*
                Snake gun.
            */

            shootTimer:
                0,


            /*
                Rage.
            */

            raging:
                false,

            rageTimer:
                0,

            rageRemaining:
                0,


            /*
                Store original
                non-rage speed.
            */

            baseSpeed:
                enemy.speed,


            /*
                Snake absorption.
            */

            absorbedForBomb:
                0,

            greenStage:
                0,


            /*
                Big bomb.
            */

            bombCharging:
                false,

            bombChargeTimer:
                0,


            /*
                Boss 2 style
                drop spawn.
            */

            dropActive:
                true,

            dropTimer:
                0,

            dropDuration:
                1,

            dropX:
                player.x,

            dropY:
                player.y,

            dropRadius:
                enemy.radius +
                28
        };


        /*
            Store the player's
            current position.

            Boss stays invisible
            here for one second.
        */

        enemy.x =
            player.x;


        enemy.y =
            player.y;


        enemy.vx =
            0;


        enemy.vy =
            0;


        enemy.enteredArena =
            false;


        enemy.collidesWithPlayer =
            false;
    },


    /* =================================================
       UPDATE BOSS
       ================================================= */

    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy
                .snakeMachineState;


        if (!state) {

            return;
        }


        /* =============================================
           DROP ON PLAYER
           ============================================= */

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


            /*
                After one second,
                boss lands.
            */

            if (

                state.dropTimer >=
                state.dropDuration

            ) {

                /*
                    Player still inside
                    the landing circle?
                    Kill player.
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


                api.aimVelocityAtPlayer(
                    enemy
                );
            }


            return;
        }


        /* =============================================
           ABSORB SNAKES
           ============================================= */

        absorbTouchingSnakes(

            enemy,

            api,

            this
        );


        /* =============================================
           20 SNAKES
           -> STOP 2 SEC
           -> THROW BIG BOMB
           ============================================= */

        if (
            state.bombCharging
        ) {

            enemy.vx =
                0;


            enemy.vy =
                0;


            state.bombChargeTimer +=
                dt;


            if (

                state
                    .bombChargeTimer >=

                this
                    .bombChargeDuration

            ) {

                launchSnakeBomb(

                    enemy,

                    api,

                    this
                );
            }


            /*
                No movement,
                no Snake Gun,
                while charging.
            */

            return;
        }


        /* =============================================
           NORMAL MOVEMENT
           ============================================= */

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


        /* =============================================
           SNAKE GUN
           ============================================= */

        state.shootTimer +=
            dt;


        const currentShootInterval =

            state.raging

                ? this
                    .rageSnakeGunInterval

                : this
                    .normalSnakeGunInterval;


        while (

            state.shootTimer >=
            currentShootInterval

        ) {

            state.shootTimer -=
                currentShootInterval;


            shootSnakeBullet(

                enemy,

                api,

                this
            );
        }


        /* =============================================
           RAGE
           ============================================= */

        if (
            state.raging
        ) {

            state.rageRemaining -=
                dt;


            /*
                New normal Snakes
                spawned during Rage
                also receive Rage.
            */

            for (
                const other
                of api.getEnemies()
            ) {

                if (
                    other?.type ===
                    "snake"
                ) {

                    applyRageToSnake(

                        other,

                        this
                    );
                }
            }


            if (

                state.rageRemaining <=
                0

            ) {

                stopRage(

                    enemy,

                    api
                );
            }

        } else {

            state.rageTimer +=
                dt;


            if (

                state.rageTimer >=
                this.rageInterval

            ) {

                startRage(

                    enemy,

                    api,

                    this
                );
            }
        }
    },


    /* =================================================
       BULLETS + BOMB + HEAL EFFECTS
       ================================================= */

    afterUpdate(
        dt,
        api
    ) {

        const canvas =
            api.getCanvas();


        /*
            Big bomb.
        */

        updateSnakeBombs(

            dt,

            api
        );


        /*
            Snake gun bullets.
        */

        for (

            let i =
                snakeBullets.length -
                1;

            i >=
            0;

            i--

        ) {

            const bullet =
                snakeBullets[i];


            bullet.x +=
                bullet.vx *
                dt;


            bullet.y +=
                bullet.vy *
                dt;


            /*
                Bullet touches player.
            */

            if (
                api.playerTouchesCircle(

                    bullet.x,

                    bullet.y,

                    bullet.radius
                )
            ) {

                snakeBullets.splice(

                    i,

                    1
                );


                api.killPlayer();


                return;
            }


            /*
                Wall collision.
            */

            let hitWall =
                false;


            if (
                bullet.x <=
                bullet.radius
            ) {

                bullet.x =
                    bullet.radius;


                hitWall =
                    true;
            }


            if (

                bullet.x >=

                canvas.width -
                    bullet.radius

            ) {

                bullet.x =

                    canvas.width -
                    bullet.radius;


                hitWall =
                    true;
            }


            if (
                bullet.y <=
                bullet.radius
            ) {

                bullet.y =
                    bullet.radius;


                hitWall =
                    true;
            }


            if (

                bullet.y >=

                canvas.height -
                    bullet.radius

            ) {

                bullet.y =

                    canvas.height -
                    bullet.radius;


                hitWall =
                    true;
            }


            /*
                Snake bullet hits wall:
                become normal Snake.
            */

            if (
                hitWall
            ) {

                transformBulletIntoSnake(

                    bullet,

                    api,

                    snakeMachine
                );


                snakeBullets.splice(

                    i,

                    1
                );
            }
        }


        /*
            Heal effects.
        */

        for (

            let i =
                healEffects.length -
                1;

            i >=
            0;

            i--

        ) {

            const effect =
                healEffects[i];


            effect.elapsed +=
                dt;


            if (

                effect.elapsed >=
                effect.duration

            ) {

                healEffects.splice(

                    i,

                    1
                );
            }
        }
    },


    /* =================================================
       BOSS DEATH
       ================================================= */

    onDeath(
        enemy,
        api
    ) {

        clearRuntime();


        /*
            Restore normal Snakes
            before level cleanup.
        */

        for (
            const other
            of api.getEnemies()
        ) {

            if (
                other?.type ===
                "snake"
            ) {

                removeRageFromSnake(
                    other
                );
            }
        }


        api.completeLevelNow({

            clearEnemies:
                true,

            stopSpawns:
                true,

            clearExplosions:
                true
        });
    },


    /* =================================================
       BOSS VISUAL
       ================================================= */

    draw(
        enemy,
        ctx,
        api
    ) {

        const state =
            enemy
                .snakeMachineState;


        /*
            Like Boss 2:
            invisible during
            landing warning.
        */

        if (
            state?.dropActive
        ) {

            return;
        }


        drawSnakeMachine(

            enemy,

            ctx,

            api,

            this
        );
    },


    /* =================================================
       BELOW ENEMIES

       - landing warning
       - bomb target
       - Rage aura
       ================================================= */

    drawBelow(
        ctx,
        api,
        definition
    ) {

        /*
            IMPORTANT:
            do not require
            enteredArena here,
            otherwise the landing
            warning cannot be drawn.
        */

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
            boss
                .snakeMachineState;


        if (!state) {

            return;
        }


        /* =============================================
           BLACK LANDING WARNING
           ============================================= */

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


            return;
        }


        /* =============================================
           BIG BOMB TARGET
           ============================================= */

        for (
            const bomb
            of snakeBombs
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(

                bomb.targetX,

                bomb.targetY,

                bomb.explosionRadius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(40,190,65,0.10)";


            ctx.fill();


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "rgba(75,230,95,0.55)";


            ctx.stroke();


            ctx.restore();
        }


        /* =============================================
           RAGE AURA
           ============================================= */

        if (

            !state.raging ||

            !boss.enteredArena

        ) {

            return;
        }


        const pulse =

            (
                Math.sin(

                    performance.now() /
                    120
                ) +

                1
            ) /

            2;


        ctx.save();


        ctx.beginPath();


        ctx.arc(

            boss.x,

            boss.y,


            boss.radius *

                (
                    1.35 +

                    pulse *
                        0.16
                ),


            0,

            Math.PI *
                2
        );


        ctx.fillStyle =
            "rgba(40,255,65,0.10)";


        ctx.fill();


        ctx.lineWidth =
            5;


        ctx.strokeStyle =
            "rgba(80,255,95,0.65)";


        ctx.stroke();


        ctx.restore();
    },


    /* =================================================
       GLOBAL VISUALS

       - big bomb
       - Snake bullets
       - heal effects
       ================================================= */

    drawGlobal(
        ctx
    ) {

        /* =============================================
           BIG THROWN BOMB
           ============================================= */

        for (
            const bomb
            of snakeBombs
        ) {

            const progress =
                Math.min(

                    1,

                    bomb.elapsed /
                        bomb.duration
                );


            /*
                Makes the ball fly
                in a visible arc.
            */

            const arcHeight =

                Math.sin(

                    progress *
                        Math.PI

                ) *

                150;


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                bomb.x,

                bomb.y -
                    arcHeight,

                bomb.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#36d94f";


            ctx.shadowBlur =
                22;


            ctx.shadowColor =
                "rgba(60,255,90,0.95)";


            ctx.fill();


            ctx.shadowBlur =
                0;


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "#123d1b";


            ctx.stroke();


            ctx.restore();
        }


        /* =============================================
           SNAKE GUN BULLETS
           ============================================= */

        for (
            const bullet
            of snakeBullets
        ) {

            const angle =
                Math.atan2(

                    bullet.vy,

                    bullet.vx
                );


            ctx.save();


            ctx.translate(

                bullet.x,

                bullet.y
            );


            ctx.rotate(
                angle
            );


            const r =

                bullet.raging

                    ? bullet.radius *
                        1.4

                    : bullet.radius;


            /*
                Dark outline.
            */

            ctx.strokeStyle =
                "#123b18";


            ctx.lineWidth =
                r *
                0.86;


            ctx.lineCap =
                "round";


            ctx.beginPath();


            ctx.moveTo(

                -r *
                    1.55,

                0
            );


            ctx.lineTo(

                r *
                    0.55,

                0
            );


            ctx.stroke();


            /*
                Green body.
            */

            ctx.strokeStyle =

                bullet.raging

                    ? "#66f36e"

                    : "#286f30";


            ctx.lineWidth =
                r *
                0.52;


            ctx.beginPath();


            ctx.moveTo(

                -r *
                    1.50,

                0
            );


            ctx.lineTo(

                r *
                    0.55,

                0
            );


            ctx.stroke();


            /*
                Head.
            */

            ctx.beginPath();


            ctx.arc(

                r *
                    0.65,

                0,

                r *
                    0.62,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =

                bullet.raging

                    ? "#65fa6d"

                    : "#33863c";


            ctx.fill();


            /*
                Eyes.
            */

            ctx.fillStyle =
                "#d51f30";


            ctx.beginPath();


            ctx.arc(

                r *
                    0.82,

                -r *
                    0.18,

                Math.max(

                    1.5,

                    r *
                        0.12
                ),

                0,

                Math.PI *
                    2
            );


            ctx.fill();


            ctx.beginPath();


            ctx.arc(

                r *
                    0.82,

                r *
                    0.18,

                Math.max(

                    1.5,

                    r *
                        0.12
                ),

                0,

                Math.PI *
                    2
            );


            ctx.fill();


            ctx.restore();
        }


        /* =============================================
           HEAL ANIMATIONS
           ============================================= */

        for (
            const effect
            of healEffects
        ) {

            const progress =

                effect.elapsed /
                effect.duration;


            const alpha =
                1 -
                progress;


            ctx.save();


            ctx.globalAlpha =
                alpha;


            /*
                Expanding green ring.
            */

            ctx.beginPath();


            ctx.arc(

                effect.x,

                effect.y,


                28 +

                    progress *
                    58,


                0,

                Math.PI *
                    2
            );


            ctx.strokeStyle =
                "#62ff73";


            ctx.lineWidth =
                5;


            ctx.stroke();


            /*
                +3 HP text.
            */

            ctx.fillStyle =
                "#7aff84";


            ctx.font =
                "bold 27px Arial";


            ctx.textAlign =
                "center";


            ctx.fillText(

                `+${effect.amount}`,

                effect.x,


                effect.y -
                    38 -

                    progress *
                        30
            );


            ctx.restore();
        }
    },


    /* =================================================
       BOSS HEALTH BAR
       ================================================= */

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


        if (!boss) {

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


        const state =
            boss
                .snakeMachineState ||
            {};


        let bossName =
            "SNAKE MACHINE";


        if (
            state.bombCharging
        ) {

            bossName =
                "SNAKE MACHINE - BOMB";

        } else if (
            state.raging
        ) {

            bossName =
                "SNAKE MACHINE - RAGE";
        }


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
            Name outline.
        */

        ctx.strokeStyle =
            "rgba(0,0,0,0.80)";


        ctx.strokeText(

            bossName,

            canvas.width /
                2,

            y -
                21
        );


        /*
            Name.
        */

        ctx.fillStyle =

            state.bombCharging

                ? "#7cff83"

                : state.raging

                    ? "#70ff7c"

                    : "#ffffff";


        ctx.fillText(

            bossName,

            canvas.width /
                2,

            y -
                21
        );


        /*
            Bar background.
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
            HP bar.
        */

        ctx.fillStyle =

            state.raging

                ? "#39e853"

                : getSnakeMachineColor(

                    state
                        .greenStage ||
                    0
                );


        ctx.fillRect(

            x,

            y,

            width *
                hpRatio,

            height
        );


        /*
            Bar border.
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
            HP number.
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


export default snakeMachine;