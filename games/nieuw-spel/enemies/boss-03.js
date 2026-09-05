const snakeBullets = [];
const healEffects = [];


function clearRuntime() {
    snakeBullets.length = 0;
    healEffects.length = 0;
}


function addHealEffect(
    enemy,
    amount
) {
    healEffects.push({
        x:
            enemy.x,

        y:
            enemy.y,

        amount,

        elapsed: 0,

        duration: 1
    });
}


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


function shootSnake(
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

    const distance =
        Math.hypot(
            dx,
            dy
        ) || 1;


    const vx =
        dx /
        distance *
        config.snakeBulletSpeed;

    const vy =
        dy /
        distance *
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

        rage:
            boss.grassBenState
                ?.raging === true
    });
}


function spawnSnakeFromBullet(
    bullet,
    api,
    config
) {
    const canvas =
        api.getCanvas();


    const margin = 30;


    const x =
        Math.max(
            margin,
            Math.min(
                canvas.width -
                    margin,
                bullet.x
            )
        );


    const y =
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
            x,
            y
        );


    if (!snake) {
        return;
    }


    /*
        EXACT 180 DEGREE TURN.
    */

    const reverseAngle =
        bullet.angle +
        Math.PI;


    configureSnakeDirection(
        snake,
        reverseAngle
    );


    if (
        bullet.rage
    ) {
        applyRageToSnake(
            snake,
            config
        );
    }
}


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
        snake.grassBenRageActive
    ) {
        return;
    }


    snake.grassBenRageActive =
        true;


    snake.grassBenOriginalSize =
        snake.size;

    snake.grassBenOriginalRadius =
        snake.radius;

    snake.grassBenOriginalSpeed =
        snake.speed;


    snake.size *=
        2;

    snake.radius *=
        2;

    snake.speed *=
        config.rageSnakeSpeedMultiplier;


    /*
        Ook huidige velocity
        iets sneller maken.
    */

    snake.vx *=
        config.rageSnakeSpeedMultiplier;

    snake.vy *=
        config.rageSnakeSpeedMultiplier;
}


function removeRageFromSnake(
    snake
) {
    if (
        !snake ||
        !snake.grassBenRageActive
    ) {
        return;
    }


    snake.size =
        snake.grassBenOriginalSize ??
        snake.size;

    snake.radius =
        snake.grassBenOriginalRadius ??
        snake.radius;

    snake.speed =
        snake.grassBenOriginalSpeed ??
        snake.speed;


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


    delete snake.grassBenOriginalSize;
    delete snake.grassBenOriginalRadius;
    delete snake.grassBenOriginalSpeed;

    snake.grassBenRageActive =
        false;
}


function startRage(
    boss,
    api,
    config
) {
    const state =
        boss.grassBenState;


    state.raging =
        true;

    state.rageRemaining =
        config.rageDuration;

    state.rageCooldown =
        0;


    boss.speed =
        state.baseSpeed *
        config.rageBossSpeedMultiplier;


    /*
        ALLE BESTAANDE SNAKES.
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
        boss.grassBenState;


    state.raging =
        false;

    state.rageRemaining =
        0;

    state.rageCooldown =
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


function healBossFromSnakes(
    boss,
    api
) {
    const state =
        boss.grassBenState;


    if (
        !state?.raging
    ) {
        return;
    }


    const enemies = [
        ...api.getEnemies()
    ];


    for (
        const enemy
        of enemies
    ) {
        if (
            !enemy ||
            enemy === boss ||
            enemy.type !== "snake" ||
            !api.isEnemyAlive(enemy)
        ) {
            continue;
        }


        const distance =
            Math.hypot(
                enemy.x -
                    boss.x,

                enemy.y -
                    boss.y
            );


        if (
            distance >
            enemy.radius +
                boss.radius
        ) {
            continue;
        }


        /*
            SNAKE ABSORBED.
        */

        api.removeEnemy(
            enemy
        );


        const oldHp =
            boss.hp;


        boss.hp =
            Math.min(
                boss.maxHp,
                boss.hp + 3
            );


        const actualHeal =
            boss.hp -
            oldHp;


        addHealEffect(
            boss,
            actualHeal
        );
    }
}


function drawGreenBen(
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


    ctx.save();


    /*
        GREEN OUTER BODY
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
        enemy.grassBenState
            ?.raging
            ? "#30d64a"
            : "#4c9d4c";

    ctx.fill();


    /*
        BEN.PNG
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
            r * 0.90,
            0,
            Math.PI * 2
        );

        ctx.clip();


        ctx.drawImage(
            image,
            x - r * 0.90,
            y - r * 0.90,
            r * 1.80,
            r * 1.80
        );


        /*
            GREEN TINT
        */

        ctx.globalCompositeOperation =
            "source-atop";

        ctx.fillStyle =
            enemy.grassBenState
                ?.raging
                ? "rgba(20,255,45,0.45)"
                : "rgba(40,180,55,0.34)";

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
        enemy.grassBenState
            ?.raging
            ? "#b7ff9e"
            : "#dcffcf";

    ctx.lineWidth =
        Math.max(
            4,
            r * 0.07
        );

    ctx.stroke();


    /*
        SNAKEGUN
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
        BARREL
    */

    ctx.strokeStyle =
        "#244e28";

    ctx.lineWidth =
        Math.max(
            7,
            r * 0.13
        );

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        r * 0.30,
        0
    );

    ctx.lineTo(
        r * 1.02,
        0
    );

    ctx.stroke();


    /*
        GREEN BARREL INSIDE
    */

    ctx.strokeStyle =
        "#5ebf59";

    ctx.lineWidth =
        Math.max(
            3,
            r * 0.055
        );

    ctx.beginPath();

    ctx.moveTo(
        r * 0.40,
        0
    );

    ctx.lineTo(
        r * 1.03,
        0
    );

    ctx.stroke();


    /*
        GUN STOCK
    */

    ctx.fillStyle =
        "#3d6d37";

    ctx.beginPath();

    ctx.roundRect(
        r * 0.05,
        -r * 0.17,
        r * 0.45,
        r * 0.34,
        r * 0.08
    );

    ctx.fill();


    ctx.restore();
}


const grassBen = {
    id: "grass-ben",
    name: "Grass Ben",

    behavior: "grass-boss",

    boss: true,

    hp: 250,

    /*
        SAME BASE SIZE AS OLD BEN.
    */
    size: 6,

    shape: "circle",

    /*
        SAME BASE SPEED AS OLD BEN.
    */
    speed: "ultraSlow",

    tracking: 0.1,

    /*
        User's lowercase file.
    */
    image: "ben.png",

    color: "#4c9d4c",

    snakeGunInterval: 5,

    snakeBulletSpeed: 420,

    snakeBulletRadius: 11,

    /*
        40 SEC NORMAL
        -> 20 SEC RAGE
        -> 40 SEC NORMAL...
    */

    rageInterval: 40,

    rageDuration: 20,

    rageBossSpeedMultiplier: 2,

    /*
        2x SIZE,
        20% FASTER.
    */
    rageSnakeSpeedMultiplier: 1.2,


    reset() {
        clearRuntime();
    },


    onPlayerDeath() {
        clearRuntime();
    },


    onLevelWin() {
        clearRuntime();
    },


    onSpawn(enemy) {
        enemy.grassBenState = {
            shootTimer: 0,

            rageCooldown: 0,

            raging: false,

            rageRemaining: 0,

            baseSpeed:
                enemy.speed
        };
    },


    update(enemy, dt, api) {
        const state =
            enemy.grassBenState;


        if (!state) {
            return;
        }


        /*
            =================================
            MOVEMENT
            =================================
        */

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


        /*
            =================================
            SNAKEGUN
            =================================
        */

        state.shootTimer +=
            dt;


        while (
            state.shootTimer >=
            this.snakeGunInterval
        ) {
            state.shootTimer -=
                this.snakeGunInterval;


            shootSnake(
                enemy,
                api,
                this
            );
        }


        /*
            =================================
            RAGE
            =================================
        */

        if (
            state.raging
        ) {
            state.rageRemaining -=
                dt;


            /*
                Nieuwe snakes die ergens
                anders gespawned zijn
                worden ook enraged.
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


            healBossFromSnakes(
                enemy,
                api
            );


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
            state.rageCooldown +=
                dt;


            if (
                state.rageCooldown >=
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


    afterUpdate(dt, api) {
        const canvas =
            api.getCanvas();


        /*
            =================================
            SNAKE BULLETS
            =================================
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
                PLAYER HIT
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
                WALL HIT
            */

            let hitWall =
                false;


            if (
                bullet.x <=
                bullet.radius
            ) {
                bullet.x =
                    bullet.radius;

                hitWall = true;
            }


            if (
                bullet.x >=
                canvas.width -
                    bullet.radius
            ) {
                bullet.x =
                    canvas.width -
                    bullet.radius;

                hitWall = true;
            }


            if (
                bullet.y <=
                bullet.radius
            ) {
                bullet.y =
                    bullet.radius;

                hitWall = true;
            }


            if (
                bullet.y >=
                canvas.height -
                    bullet.radius
            ) {
                bullet.y =
                    canvas.height -
                    bullet.radius;

                hitWall = true;
            }


            if (hitWall) {
                spawnSnakeFromBullet(
                    bullet,
                    api,
                    grassBen
                );


                snakeBullets.splice(
                    i,
                    1
                );
            }
        }


        /*
            HEAL EFFECTS
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


    onDeath(enemy, api) {
        /*
            Als boss doodgaat:
            alle rage-scaling herstellen.
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


        snakeBullets.length = 0;
    },


    draw(enemy, ctx, api) {
        drawGreenBen(
            enemy,
            ctx,
            api,
            this
        );
    },


    drawBelow(ctx, api) {
        /*
            RAGE AURA
        */

        const boss =
            api.getEnemies()
                .find(
                    enemy =>
                        enemy.definition ===
                        this
                );


        if (
            !boss ||
            !boss.grassBenState
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
                    pulse * 0.15
                ),
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(35,255,60,0.10)";

        ctx.fill();


        ctx.lineWidth =
            5;

        ctx.strokeStyle =
            "rgba(70,255,85,0.60)";

        ctx.stroke();


        ctx.restore();
    },


    drawGlobal(ctx) {
        /*
            =================================
            SNAKEGUN PROJECTILES
            =================================
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
                bullet.rage
                    ? bullet.radius * 1.5
                    : bullet.radius;


            /*
                FAST SNAKE BODY
            */

            ctx.strokeStyle =
                "#123b18";

            ctx.lineWidth =
                r * 0.85;

            ctx.lineCap =
                "round";

            ctx.beginPath();

            ctx.moveTo(
                -r * 1.5,
                0
            );

            ctx.lineTo(
                r * 0.55,
                0
            );

            ctx.stroke();


            ctx.strokeStyle =
                bullet.rage
                    ? "#54e85d"
                    : "#246a2b";

            ctx.lineWidth =
                r * 0.52;

            ctx.beginPath();

            ctx.moveTo(
                -r * 1.45,
                0
            );

            ctx.lineTo(
                r * 0.55,
                0
            );

            ctx.stroke();


            /*
                HEAD
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
                bullet.rage
                    ? "#60f16a"
                    : "#318339";

            ctx.fill();


            /*
                RED EYES
            */

            ctx.fillStyle =
                "#d92534";

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
            =================================
            HEAL EFFECT
            =================================
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
                GREEN HEAL RING
            */

            ctx.beginPath();

            ctx.arc(
                effect.x,
                effect.y,
                30 +
                    progress *
                    55,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "#61ff72";

            ctx.lineWidth =
                5;

            ctx.stroke();


            /*
                +3
            */

            if (
                effect.amount > 0
            ) {
                ctx.fillStyle =
                    "#75ff81";

                ctx.font =
                    "bold 26px Arial";

                ctx.textAlign =
                    "center";

                ctx.fillText(
                    `+${effect.amount}`,
                    effect.x,
                    effect.y -
                        40 -
                        progress *
                        30
                );
            }


            ctx.restore();
        }
    },


    drawHud(ctx, api) {
        const boss =
            api.getEnemies()
                .find(
                    enemy =>
                        enemy.definition ===
                        this
                );


        if (!boss) {
            return;
        }


        const canvas =
            api.getCanvas();


        const width =
            Math.min(
                520,
                canvas.width *
                0.55
            );

        const height =
            18;

        const x =
            (
                canvas.width -
                width
            ) /
            2;

        const y =
            24;


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

        ctx.font =
            "bold 20px Arial";

        ctx.textAlign =
            "center";

        ctx.fillStyle =
            boss.grassBenState
                ?.raging
                ? "#73ff79"
                : "#ffffff";

        ctx.fillText(
            boss.grassBenState
                ?.raging
                ? "GRASS BEN - RAGE"
                : "GRASS BEN",

            canvas.width / 2,

            y - 5
        );


        /*
            BACKGROUND
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.75)";

        ctx.fillRect(
            x - 3,
            y + 5,
            width + 6,
            height + 6
        );


        /*
            HP
        */

        ctx.fillStyle =
            boss.grassBenState
                ?.raging
                ? "#39e653"
                : "#4ea853";

        ctx.fillRect(
            x,
            y + 8,
            width *
                hpRatio,
            height
        );


        ctx.strokeStyle =
            "#ffffff";

        ctx.lineWidth =
            2;

        ctx.strokeRect(
            x,
            y + 8,
            width,
            height
        );


        ctx.font =
            "bold 13px Arial";

        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            `${Math.ceil(boss.hp)} / ${boss.maxHp}`,
            canvas.width / 2,
            y + 23
        );


        ctx.restore();
    }
};


export default grassBen;