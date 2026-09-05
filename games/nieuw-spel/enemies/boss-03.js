const snakeBullets = [];
const healEffects = [];


/*
    =====================================================
    RUNTIME
    =====================================================
*/

function clearRuntime() {
    snakeBullets.length = 0;
    healEffects.length = 0;
}


/*
    =====================================================
    HEAL VISUAL
    =====================================================
*/

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
        x: enemy.x,
        y: enemy.y,

        amount,

        elapsed: 0,
        duration: 1
    });
}


/*
    =====================================================
    TURN NORMAL SNAKE INTO A STRAIGHT/WAVE SNAKE
    =====================================================
*/

function configureSnakeDirection(
    snake,
    angle
) {
    if (!snake) {
        return;
    }


    const dx =
        Math.cos(angle);

    const dy =
        Math.sin(angle);


    /*
        Skip the Snake's normal
        first 2 second chase.
    */

    snake.snakeTimer = 2;

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


/*
    =====================================================
    RAGE SNAKES
    =====================================================
*/

function applyRageToSnake(
    snake,
    config
) {
    if (
        !snake ||
        snake.type !== "snake"
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


    /*
        Remember original values.
    */

    snake.snakeMachineOriginalSize =
        snake.size;

    snake.snakeMachineOriginalRadius =
        snake.radius;

    snake.snakeMachineOriginalSpeed =
        snake.speed;


    /*
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
        config.rageSnakeSpeedMultiplier;


    /*
        Keep current direction,
        only increase speed.
    */

    const velocityLength =
        Math.hypot(
            snake.vx,
            snake.vy
        );


    if (
        velocityLength > 0
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
        !snake.snakeMachineRageActive
    ) {
        return;
    }


    snake.size =
        snake.snakeMachineOriginalSize ??
        snake.size;

    snake.radius =
        snake.snakeMachineOriginalRadius ??
        snake.radius;

    snake.speed =
        snake.snakeMachineOriginalSpeed ??
        snake.speed;


    /*
        Restore velocity magnitude.
    */

    const velocityLength =
        Math.hypot(
            snake.vx,
            snake.vy
        );


    if (
        velocityLength > 0
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


    delete snake.snakeMachineOriginalSize;
    delete snake.snakeMachineOriginalRadius;
    delete snake.snakeMachineOriginalSpeed;


    snake.snakeMachineRageActive =
        false;
}


/*
    =====================================================
    RAGE START / END
    =====================================================
*/

function startRage(
    boss,
    api,
    config
) {
    const state =
        boss.snakeMachineState;


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
        Boss moves 2x as fast.
    */

    boss.speed =
        state.baseSpeed *
        config.rageBossSpeedMultiplier;


    /*
        Existing snakes become enraged.
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
        boss.snakeMachineState;


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


/*
    =====================================================
    SNAKE HEAL

    NOW ACTIVE ALL THE TIME,
    NOT ONLY DURING RAGE.
    =====================================================
*/

function absorbTouchingSnakes(
    boss,
    api,
    config
) {
    const enemies = [
        ...api.getEnemies()
    ];


    for (
        const snake
        of enemies
    ) {
        if (
            !snake ||
            snake === boss ||
            snake.type !== "snake" ||
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
            Snake disappears into boss.
        */

        api.removeEnemy(
            snake
        );


        const oldHp =
            boss.hp;


        boss.hp =
            Math.min(
                boss.maxHp,
                boss.hp +
                    config.snakeHealAmount
            );


        const actualHeal =
            boss.hp -
            oldHp;


        if (
            actualHeal > 0
        ) {
            addHealEffect(
                boss,
                actualHeal
            );
        }
    }
}


/*
    =====================================================
    SNAKE GUN
    =====================================================
*/

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
        ) || 1;


    const vx =
        dx /
        length *
        config.snakeBulletSpeed;

    const vy =
        dy /
        length *
        config.snakeBulletSpeed;


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
            config.snakeBulletRadius,

        raging:
            boss.snakeMachineState
                ?.raging === true
    });
}


/*
    Bullet reaches wall:
    turn exactly 180 degrees,
    then become normal Snake.
*/

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
        If Snake Machine is currently
        raging, new Snake also gets rage.
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


/*
    =====================================================
    DRAW BOSS
    =====================================================
*/

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


    const raging =
        enemy.snakeMachineState
            ?.raging === true;


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
        Math.PI * 2
    );


    ctx.fillStyle =
        raging
            ? "#26dc45"
            : "#438f45";


    ctx.fill();


    /*
        BEN IMAGE
    */

    if (
        image &&
        image.complete &&
        image.naturalWidth > 0
    ) {
        ctx.save();


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            r * 0.91,
            0,
            Math.PI * 2
        );

        ctx.clip();


        ctx.drawImage(
            image,

            x - r * 0.91,
            y - r * 0.91,

            r * 1.82,
            r * 1.82
        );


        /*
            Green tint.
        */

        ctx.globalCompositeOperation =
            "source-atop";


        ctx.fillStyle =
            raging
                ? "rgba(25,255,55,0.46)"
                : "rgba(35,185,60,0.34)";


        ctx.fillRect(
            x - r,
            y - r,
            r * 2,
            r * 2
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
        Math.PI * 2
    );


    ctx.strokeStyle =
        raging
            ? "#caffbc"
            : "#e2ffda";


    ctx.lineWidth =
        Math.max(
            4,
            r * 0.07
        );


    ctx.stroke();


    /*
        =========================================
        SNAKE MACHINE GUN
        =========================================
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
        r * 0.08,
        -r * 0.18,

        r * 0.56,
        r * 0.36,

        r * 0.08
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
            r * 0.14
        );

    ctx.lineCap =
        "round";


    ctx.beginPath();

    ctx.moveTo(
        r * 0.40,
        0
    );

    ctx.lineTo(
        r * 1.10,
        0
    );

    ctx.stroke();


    /*
        Green barrel inside.
    */

    ctx.strokeStyle =
        raging
            ? "#67ff6d"
            : "#65be62";


    ctx.lineWidth =
        Math.max(
            4,
            r * 0.06
        );


    ctx.beginPath();

    ctx.moveTo(
        r * 0.42,
        0
    );

    ctx.lineTo(
        r * 1.12,
        0
    );

    ctx.stroke();


    /*
        Barrel end.
    */

    ctx.beginPath();

    ctx.arc(
        r * 1.10,
        0,
        r * 0.12,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        "#173a1b";

    ctx.fill();


    ctx.restore();
}


/*
    =====================================================
    BOSS
    =====================================================
*/

const snakeMachine = {
    id: "snake-machine",

    name: "Snake Machine",

    behavior:
        "snake-machine-boss",

    boss: true,


    /*
        This property will only hide
        LEVEL 15 while THIS boss
        is active.
    */

    hideLevelTitleWhenActive:
        true,


    hp: 250,

    /*
        Same base size/speed
        as previous Ben boss.
    */

    size: 6,

    shape: "circle",

    speed: "ultraSlow",

    tracking: 0.1,

    image: "ben.png",

    color: "#438f45",

    borderColor:
        "#ffffff",

    borderWidth: 4,

    stayInsideArena: true,


    /*
        =================================================
        SNAKE GUN
        =================================================
    */

    normalSnakeGunInterval:
        5,

    /*
        Rage = twice as fast shooting.

        5 / 2 = 2.5 seconds.
    */

    rageSnakeGunInterval:
        2.5,

    snakeBulletSpeed:
        420,

    snakeBulletRadius:
        11,


    /*
        =================================================
        HEAL
        =================================================
    */

    snakeHealAmount:
        3,


    /*
        =================================================
        RAGE
        =================================================

        40 seconds normal
        20 seconds rage
        repeat.
    */

    rageInterval:
        40,

    rageDuration:
        20,

    rageBossSpeedMultiplier:
        2,

    rageSnakeSpeedMultiplier:
        1.2,


    reset() {
        clearRuntime();
    },


    onPlayerDeath() {
        clearRuntime();
    },


    onLevelWin() {
        clearRuntime();
    },


    onSpawn(
        enemy,
        api
    ) {
        enemy.snakeMachineState = {
            /*
                Snake gun.
            */

            shootTimer: 0,


            /*
                Rage.
            */

            raging: false,

            rageTimer: 0,

            rageRemaining: 0,


            /*
                Original base speed.
            */

            baseSpeed:
                enemy.speed
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
            enemy.snakeMachineState;


        if (!state) {
            return;
        }


        /*
            =================================================
            ENTER ARENA
            =================================================
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
            }


            return;
        }


        /*
            =================================================
            HEAL FROM EVERY SNAKE

            THIS HAPPENS DURING NORMAL PHASE
            AND DURING RAGE.
            =================================================
        */

        absorbTouchingSnakes(
            enemy,
            api,
            this
        );


        /*
            =================================================
            MOVEMENT
            =================================================
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


        /*
            =================================================
            SNAKE GUN

            Normal: every 5 sec
            Rage:   every 2.5 sec
            =================================================
        */

        state.shootTimer +=
            dt;


        const currentShootInterval =
            state.raging
                ? this.rageSnakeGunInterval
                : this.normalSnakeGunInterval;


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


        /*
            =================================================
            RAGE
            =================================================
        */

        if (
            state.raging
        ) {
            state.rageRemaining -=
                dt;


            /*
                Any Snake spawned during
                rage also gets rage.
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


    /*
        =====================================================
        BULLETS + EFFECTS
        =====================================================
    */

    afterUpdate(
        dt,
        api
    ) {
        const canvas =
            api.getCanvas();


        /*
            Snake gun bullets.
        */

        for (
            let i =
                snakeBullets.length - 1;

            i >= 0;

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
                Player collision.
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
                Hits wall:
                transform into Snake.
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
                healEffects.length - 1;

            i >= 0;

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


    /*
        =====================================================
        BOSS DEATH

        EXACT SAME IDEA AS OLD BOSSES:
        - clear all enemies
        - stop remaining spawns
        - clear explosions
        - complete level
        =====================================================
    */

    onDeath(
        enemy,
        api
    ) {
        clearRuntime();


        /*
            Restore rage modifications first.
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


    /*
        =====================================================
        BOSS VISUAL
        =====================================================
    */

    draw(
        enemy,
        ctx,
        api
    ) {
        drawSnakeMachine(
            enemy,
            ctx,
            api,
            this
        );
    },


    /*
        =====================================================
        RAGE AURA
        =====================================================
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
                            definition &&
                        enemy.enteredArena
                );


        if (
            !boss ||
            !boss.snakeMachineState
                ?.raging
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
            Math.PI * 2
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


    /*
        =====================================================
        FLYING SNAKE BULLETS + HEALS
        =====================================================
    */

    drawGlobal(
        ctx
    ) {
        /*
            Snake bullets.
        */

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
                Dark outline body.
            */

            ctx.strokeStyle =
                "#123b18";

            ctx.lineWidth =
                r * 0.86;

            ctx.lineCap =
                "round";


            ctx.beginPath();

            ctx.moveTo(
                -r * 1.55,
                0
            );

            ctx.lineTo(
                r * 0.55,
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
                r * 0.52;


            ctx.beginPath();

            ctx.moveTo(
                -r * 1.50,
                0
            );

            ctx.lineTo(
                r * 0.55,
                0
            );

            ctx.stroke();


            /*
                Head.
            */

            ctx.beginPath();

            ctx.arc(
                r * 0.65,
                0,
                r * 0.62,
                0,
                Math.PI * 2
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
                r * 0.82,
                -r * 0.18,
                Math.max(
                    1.5,
                    r * 0.12
                ),
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.beginPath();

            ctx.arc(
                r * 0.82,
                r * 0.18,
                Math.max(
                    1.5,
                    r * 0.12
                ),
                0,
                Math.PI * 2
            );

            ctx.fill();


            ctx.restore();
        }


        /*
            Heal animations.
        */

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
                Math.PI * 2
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


    /*
        =====================================================
        BOSS HEALTH BAR

        Only appears once Snake Machine
        entered the arena.
        =====================================================
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


        ctx.save();


        /*
            NAME
        */

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 24px Arial";

        ctx.lineWidth =
            5;


        ctx.strokeStyle =
            "rgba(0,0,0,0.80)";


        ctx.strokeText(
            boss.snakeMachineState
                ?.raging
                ? "SNAKE MACHINE - RAGE"
                : "SNAKE MACHINE",

            canvas.width /
                2,

            y - 21
        );


        ctx.fillStyle =
            boss.snakeMachineState
                ?.raging
                ? "#70ff7c"
                : "#ffffff";


        ctx.fillText(
            boss.snakeMachineState
                ?.raging
                ? "SNAKE MACHINE - RAGE"
                : "SNAKE MACHINE",

            canvas.width /
                2,

            y - 21
        );


        /*
            BAR BACKGROUND
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";


        ctx.fillRect(
            x - 4,
            y - 4,
            width + 8,
            height + 8
        );


        /*
            HP
        */

        ctx.fillStyle =
            boss.snakeMachineState
                ?.raging
                ? "#39e853"
                : "#4ba653";


        ctx.fillRect(
            x,
            y,
            width *
                hpRatio,
            height
        );


        /*
            BORDER
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
            HP NUMBER
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