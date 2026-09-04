const queenBalls =
    [];

const snakeBursts =
    [];


let nextQueenId =
    1;



function clearQueenRuntime() {

    queenBalls.length =
        0;

    snakeBursts.length =
        0;

    nextQueenId =
        1;
}



function queueAction(
    state,
    action
) {

    if (
        action ===
            "ball" &&

        (
            state.ballQueued ||

            state.action ===
                "ball"
        )
    ) {
        return;
    }


    state.queue.push(
        action
    );


    if (
        action ===
        "ball"
    ) {

        state.ballQueued =
            true;
    }
}



function randomDirection(
    enemy
) {

    const angle =

        Math.random() *

        Math.PI *
        2;


    enemy.vx =

        Math.cos(
            angle
        ) *

        enemy.speed;


    enemy.vy =

        Math.sin(
            angle
        ) *

        enemy.speed;
}



function configureSnakeRandomly(
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
        Sla de normale eerste
        2 sec chase over.
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



function clampPointToArena(
    x,
    y,
    api,
    margin = 30
) {

    const canvas =
        api.getCanvas();


    return {

        x:

            Math.max(

                margin,

                Math.min(

                    canvas.width -
                        margin,

                    x
                )
            ),


        y:

            Math.max(

                margin,

                Math.min(

                    canvas.height -
                        margin,

                    y
                )
            )
    };
}



function spawnRandomSnakeAround(
    x,
    y,
    minRadius,
    maxRadius,
    api
) {

    const angle =

        Math.random() *

        Math.PI *
        2;


    const distance =

        minRadius +

        Math.random() *

        Math.max(

            0,

            maxRadius -
                minRadius
        );


    const point =

        clampPointToArena(

            x +

                Math.cos(
                    angle
                ) *

                distance,

            y +

                Math.sin(
                    angle
                ) *

                distance,

            api,

            34
        );


    const snake =

        api.spawnEnemyAt(

            "snake",

            point.x,

            point.y
        );


    if (!snake) {

        return null;
    }


    configureSnakeRandomly(

        snake,

        Math.random() *

            Math.PI *
            2
    );


    return snake;
}



function startAction(
    enemy,
    action
) {

    const state =
        enemy.queenState;


    state.action =
        action;


    state.actionElapsed =
        0;


    enemy.vx =
        0;

    enemy.vy =
        0;


    if (
        action ===
        "summon"
    ) {

        /*
            4 random momenten
            tussen 0 en 2 sec.
        */

        state.summonTimes =

            Array.from(

                {
                    length:
                        4
                },

                () =>

                    Math.random() *
                    2

            ).sort(

                (
                    a,
                    b
                ) =>

                    a - b
            );


        state.summonIndex =
            0;
    }
}



function finishAction(
    enemy
) {

    const state =
        enemy.queenState;


    state.action =
        null;


    state.actionElapsed =
        0;


    /*
        Minimaal halve seconde
        tot volgende queued action.
    */

    state.cooldown =
        0.5;
}



function launchQueenBall(
    enemy,
    api,
    config
) {

    const player =
        api.getPlayer();


    queenBalls.push({

        ownerId:
            enemy.queenId,


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
            config
                .ballFlightDuration,


        radius:
            config.ballRadius,


        targetRadius:
            config
                .ballLandingRadius
    });


    /*
        Na het gooien weer
        normale groene kleur.
    */

    enemy
        .queenState
        .greenStage =
        0;


    enemy
        .queenState
        .absorbedForBall =
        0;


    enemy
        .queenState
        .ballQueued =
        false;
}



function absorbTouchingSnakes(
    queen,
    api
) {

    const state =
        queen.queenState;


    const enemies = [
        ...api.getEnemies()
    ];


    for (
        const snake
        of enemies
    ) {

        if (
            !snake ||

            snake === queen ||

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
                    queen.x,

                snake.y -
                    queen.y
            );


        if (
            distance >

            snake.radius +
                queen.radius
        ) {

            continue;
        }


        /*
            Snake wordt opgenomen.
        */

        api.removeEnemy(
            snake
        );


        /*
            +2 HP maar nooit
            boven max HP.
        */

        queen.hp =

            Math.min(

                queen.maxHp,

                queen.hp +
                    2
            );


        /*
            Als er nog geen ball
            klaarstaat tellen we
            richting 5.
        */

        if (
            !state.ballQueued &&

            state.action !==
                "ball"
        ) {

            state.absorbedForBall++;


            state.greenStage =

                Math.min(

                    5,

                    state
                        .absorbedForBall
                );


            if (
                state.absorbedForBall >=
                5
            ) {

                queueAction(
                    state,
                    "ball"
                );
            }
        }
    }
}



function getQueenColor(
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
                stage || 0
            )
        )
    ];
}



const snakeQueen = {

    id:
        "snake-queen",

    name:
        "Snake Queen",

    behavior:
        "snake-queen",


    hp:
        24,

    size:
        8,

    speed:
        "medium",


    color:
        "#4c8d45",


    directionInterval:
        10,


    summonInterval:
        13.4,


    summonDuration:
        2,


    summonRadius:
        145,


    ballChargeDuration:
        3,


    ballFlightDuration:
        0.85,


    ballRadius:
        14,


    ballLandingRadius:
        28,


    reset() {

        clearQueenRuntime();
    },


    onPlayerDeath() {

        clearQueenRuntime();
    },


    onLevelWin() {

        clearQueenRuntime();
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.queenId =
            nextQueenId++;


        enemy.queenState = {

            directionTimer:
                0,

            directionPending:
                false,


            summonTimer:
                0,


            action:
                null,

            actionElapsed:
                0,


            cooldown:
                0,


            queue:
                [],


            summonTimes:
                [],

            summonIndex:
                0,


            absorbedForBall:
                0,


            greenStage:
                0,


            ballQueued:
                false
        };


        /*
            Eerste richting =
            op speler af.
        */

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
            enemy.queenState;


        if (!state) {
            return;
        }


        /*
            ==========================
            ARENA BINNEN
            ==========================
        */

        if (
            !enemy.enteredArena
        ) {

            api.moveStraight(
                enemy,
                dt
            );


            if (
                api.isInsideArena(
                    enemy
                )
            ) {

                enemy.enteredArena =
                    true;
            }


            return;
        }


        /*
            Eerst snakes controleren.
        */

        absorbTouchingSnakes(
            enemy,
            api
        );


        /*
            ==========================
            DIRECTION TIMER
            ==========================
        */

        state.directionTimer +=
            dt;


        while (
            state.directionTimer >=
            this.directionInterval
        ) {

            state.directionTimer -=
                this.directionInterval;


            state.directionPending =
                true;
        }


        /*
            ==========================
            SUMMON TIMER
            ==========================
        */

        state.summonTimer +=
            dt;


        while (
            state.summonTimer >=
            this.summonInterval
        ) {

            state.summonTimer -=
                this.summonInterval;


            queueAction(
                state,
                "summon"
            );
        }


        /*
            ==========================
            SUMMON ACTION
            ==========================
        */

        if (
            state.action ===
            "summon"
        ) {

            enemy.vx =
                0;

            enemy.vy =
                0;


            state.actionElapsed +=
                dt;


            while (
                state.summonIndex <

                    state
                        .summonTimes
                        .length &&

                state.actionElapsed >=

                    state.summonTimes[
                        state.summonIndex
                    ]
            ) {

                spawnRandomSnakeAround(

                    enemy.x,

                    enemy.y,

                    enemy.radius +
                        35,

                    this.summonRadius,

                    api
                );


                state.summonIndex++;
            }


            if (
                state.actionElapsed >=
                this.summonDuration
            ) {

                finishAction(
                    enemy
                );
            }


            return;
        }


        /*
            ==========================
            BALL ACTION
            ==========================
        */

        if (
            state.action ===
            "ball"
        ) {

            enemy.vx =
                0;

            enemy.vy =
                0;


            state.actionElapsed +=
                dt;


            if (
                state.actionElapsed >=
                this.ballChargeDuration
            ) {

                launchQueenBall(

                    enemy,

                    api,

                    this
                );


                finishAction(
                    enemy
                );
            }


            return;
        }


        /*
            ==========================
            COOLDOWN
            ==========================
        */

        if (
            state.cooldown >
            0
        ) {

            state.cooldown =

                Math.max(

                    0,

                    state.cooldown -
                        dt
                );
        }


        /*
            Volgende queued action
            mag pas na cooldown.
        */

        if (
            state.cooldown <=
                0 &&

            state.queue.length >
                0
        ) {

            startAction(

                enemy,

                state.queue.shift()
            );


            return;
        }


        /*
            Random richting moet
            wachten tot major action
            klaar is.
        */

        if (
            state.directionPending
        ) {

            state.directionPending =
                false;


            randomDirection(
                enemy
            );
        }


        /*
            ==========================
            NORMALE BEWEGING
            ==========================
        */

        api.moveStraight(
            enemy,
            dt
        );


        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },


    onDeath(
        enemy
    ) {

        /*
            Haar vliegende ballen
            verwijderen wanneer
            Queen doodgaat.
        */

        for (
            let i =
                queenBalls.length -
                1;

            i >= 0;

            i--
        ) {

            if (
                queenBalls[i]
                    .ownerId ===
                enemy.queenId
            ) {

                queenBalls.splice(
                    i,
                    1
                );
            }
        }
    },


    afterUpdate(
        dt,
        api
    ) {

        /*
            ==========================
            QUEEN BALLS
            ==========================
        */

        for (
            let i =
                queenBalls.length -
                1;

            i >= 0;

            i--
        ) {

            const ball =
                queenBalls[i];


            ball.elapsed +=
                dt;


            const progress =

                Math.min(

                    1,

                    ball.elapsed /
                        ball.duration
                );


            ball.x =

                ball.startX +

                (
                    ball.targetX -
                        ball.startX
                ) *

                progress;


            ball.y =

                ball.startY +

                (
                    ball.targetY -
                        ball.startY
                ) *

                progress;


            if (
                progress <
                1
            ) {
                continue;
            }


            /*
                Player op landingsplek?
            */

            if (
                api.playerTouchesCircle(

                    ball.targetX,

                    ball.targetY,

                    ball.targetRadius
                )
            ) {

                api.killPlayer();
            }


            /*
                8 snakes.

                De tijden zijn random
                tussen 0 en 1 sec.
            */

            snakeBursts.push({

                x:
                    ball.targetX,

                y:
                    ball.targetY,


                elapsed:
                    0,


                times:

                    Array.from(

                        {
                            length:
                                8
                        },

                        () =>
                            Math.random()

                    ).sort(

                        (
                            a,
                            b
                        ) =>

                            a - b
                    ),


                index:
                    0
            });


            queenBalls.splice(
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


        /*
            ==========================
            8-SNAKE BURSTS
            ==========================
        */

        for (
            let i =
                snakeBursts.length -
                1;

            i >= 0;

            i--
        ) {

            const burst =
                snakeBursts[i];


            burst.elapsed +=
                dt;


            while (
                burst.index <

                    burst.times.length &&

                burst.elapsed >=

                    burst.times[
                        burst.index
                    ]
            ) {

                spawnRandomSnakeAround(

                    burst.x,

                    burst.y,

                    8,

                    70,

                    api
                );


                burst.index++;
            }


            if (
                burst.index >=

                    burst.times.length &&

                burst.elapsed >=
                    1
            ) {

                snakeBursts.splice(
                    i,
                    1
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

            enemy.queenState ||
            {};


        const bodyColor =

            getQueenColor(
                state.greenStage
            );


        /*
            Normale enemy face blijft.
        */

        api.drawDefaultEnemy(

            enemy,

            {

                face:
                    true,

                color:
                    bodyColor,

                strokeStyle:
                    "#173f20",

                lineWidth:

                    Math.max(

                        5,

                        enemy.radius *
                            0.11
                    )
            }
        );


        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        /*
            SNAKE SCALES
        */

        const scalePositions = [

            [-0.48, 0.15],

            [-0.26, 0.48],

            [0.03, 0.57],

            [0.34, 0.40],

            [0.52, 0.10],

            [-0.38, -0.38],

            [0.05, -0.50],

            [0.40, -0.32]
        ];


        for (
            const [
                dx,
                dy
            ]
            of scalePositions
        ) {

            ctx.beginPath();


            ctx.arc(

                x + dx * r,

                y + dy * r,

                r * 0.10,

                0,

                Math.PI
            );


            ctx.strokeStyle =
                "rgba(20,70,30,0.65)";


            ctx.lineWidth =

                Math.max(

                    2,

                    r * 0.035
                );


            ctx.stroke();
        }


        /*
            RED EYES
        */

        const eyeOffsetX =
            r * 0.28;


        const eyeY =

            y -
            r * 0.08;


        const eyeRadius =

            Math.max(

                2.5,

                r * 0.085
            );


        ctx.fillStyle =
            "#b51f2d";


        ctx.beginPath();


        ctx.arc(
            x - eyeOffsetX,
            eyeY,
            eyeRadius,
            0,
            Math.PI * 2
        );


        ctx.fill();


        ctx.beginPath();


        ctx.arc(
            x + eyeOffsetX,
            eyeY,
            eyeRadius,
            0,
            Math.PI * 2
        );


        ctx.fill();


        /*
            SNAKE ON HEAD
        */

        ctx.beginPath();


        ctx.moveTo(
            x - r * 0.40,
            y - r * 0.70
        );


        ctx.bezierCurveTo(

            x - r * 0.20,
            y - r * 1.02,

            x + r * 0.10,
            y - r * 0.62,

            x + r * 0.34,
            y - r * 0.88
        );


        ctx.strokeStyle =
            "#174d26";


        ctx.lineWidth =

            Math.max(

                5,

                r * 0.12
            );


        ctx.lineCap =
            "round";


        ctx.stroke();


        /*
            Snake head.
        */

        ctx.beginPath();


        ctx.arc(

            x + r * 0.38,

            y - r * 0.90,

            r * 0.12,

            0,

            Math.PI * 2
        );


        ctx.fillStyle =
            "#226735";


        ctx.fill();


        ctx.restore();
    },


    drawBelow(
        ctx,
        api
    ) {

        /*
            GREEN SUMMON RADIUS
        */

        for (
            const enemy
            of api.getEnemies()
        ) {

            if (
                enemy.definition !==
                this
            ) {
                continue;
            }


            const state =
                enemy.queenState;


            const activeSummon =

                state?.action ===
                "summon";


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                enemy.x,

                enemy.y,

                this.summonRadius,

                0,

                Math.PI * 2
            );


            ctx.fillStyle =

                activeSummon

                    ? "rgba(70,210,80,0.17)"

                    : "rgba(70,170,75,0.07)";


            ctx.fill();


            ctx.lineWidth =

                activeSummon
                    ? 4
                    : 2;


            ctx.strokeStyle =

                activeSummon

                    ? "rgba(110,255,115,0.72)"

                    : "rgba(90,190,95,0.26)";


            ctx.stroke();


            ctx.restore();
        }


        /*
            BALL LANDING TARGET
        */

        for (
            const ball
            of queenBalls
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(

                ball.targetX,

                ball.targetY,

                ball.targetRadius,

                0,

                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(20,70,20,0.45)";


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "rgba(75,220,80,0.85)";


            ctx.stroke();


            ctx.restore();
        }
    },


    drawGlobal(
        ctx
    ) {

        for (
            const ball
            of queenBalls
        ) {

            const progress =

                Math.min(

                    1,

                    ball.elapsed /
                        ball.duration
                );


            const arcHeight =

                Math.sin(

                    progress *
                    Math.PI

                ) *

                125;


            ctx.save();


            ctx.beginPath();


            ctx.arc(

                ball.x,

                ball.y -
                    arcHeight,

                ball.radius,

                0,

                Math.PI * 2
            );


            ctx.fillStyle =
                "#42d957";


            ctx.shadowBlur =
                16;


            ctx.shadowColor =
                "rgba(75,255,95,0.9)";


            ctx.fill();


            ctx.shadowBlur =
                0;


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "#164c22";


            ctx.stroke();


            ctx.restore();
        }
    }
};


export default snakeQueen;