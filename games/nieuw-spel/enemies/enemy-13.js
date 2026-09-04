const snake = {
    id: "snake",
    name: "Snake",

    behavior: "snake-wave",

    hp: 1.8,

    size: 3.4,

    speed: "mediumFast",

    color: "#1f5a22",

    chaseDuration:
        2,

    chaseTracking:
        1,

    waveAmplitude:
        27,

    waveLength:
        360,


    onSpawn(enemy, api) {
        enemy.snakeTimer =
            0;

        enemy.snakeMode =
            "chase";

        enemy.snakeDirectionX =
            0;

        enemy.snakeDirectionY =
            0;

        enemy.snakePerpendicularX =
            0;

        enemy.snakePerpendicularY =
            0;

        enemy.snakeOriginX =
            0;

        enemy.snakeOriginY =
            0;

        enemy.snakeDistance =
            0;


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    update(enemy, dt, api) {
        enemy.snakeTimer +=
            dt;


        if (
            enemy.snakeMode ===
            "chase"
        ) {
            api.moveTowardPlayer(
                enemy,
                dt,
                this.chaseTracking
            );


            if (
                enemy.snakeTimer >=
                this.chaseDuration
            ) {
                enemy.snakeMode =
                    "wave";


                const length =
                    Math.hypot(
                        enemy.vx,
                        enemy.vy
                    ) || 1;


                enemy.snakeDirectionX =
                    enemy.vx /
                    length;

                enemy.snakeDirectionY =
                    enemy.vy /
                    length;


                enemy.snakePerpendicularX =
                    -enemy
                        .snakeDirectionY;

                enemy.snakePerpendicularY =
                    enemy
                        .snakeDirectionX;


                enemy.snakeOriginX =
                    enemy.x;

                enemy.snakeOriginY =
                    enemy.y;


                enemy.snakeDistance =
                    0;
            }

        } else {

            enemy.snakeDistance +=
                enemy.speed *
                dt;


            const wave =

                Math.sin(

                    enemy.snakeDistance /
                        this.waveLength *

                    Math.PI *
                        2

                ) *

                this.waveAmplitude;


            enemy.x =

                enemy.snakeOriginX +

                enemy.snakeDirectionX *
                    enemy.snakeDistance +

                enemy.snakePerpendicularX *
                    wave;


            enemy.y =

                enemy.snakeOriginY +

                enemy.snakeDirectionY *
                    enemy.snakeDistance +

                enemy.snakePerpendicularY *
                    wave;


            const waveDerivative =

                Math.cos(

                    enemy.snakeDistance /
                        this.waveLength *

                    Math.PI *
                        2

                ) *

                this.waveAmplitude *

                (
                    Math.PI *
                    2 /
                    this.waveLength
                );


            let vx =

                enemy.snakeDirectionX +

                enemy.snakePerpendicularX *
                    waveDerivative;


            let vy =

                enemy.snakeDirectionY +

                enemy.snakePerpendicularY *
                    waveDerivative;


            const velocityLength =
                Math.hypot(
                    vx,
                    vy
                ) || 1;


            vx /=
                velocityLength;

            vy /=
                velocityLength;


            enemy.vx =
                vx *
                enemy.speed;

            enemy.vy =
                vy *
                enemy.speed;
        }


        if (
            !enemy.enteredArena &&
            api.isInsideArena(
                enemy
            )
        ) {
            enemy.enteredArena =
                true;
        }


        if (
            enemy.enteredArena &&
            api.isFullyOutsideArena(
                enemy
            )
        ) {
            api.removeEnemy(
                enemy
            );
        }
    },


    draw(enemy, ctx) {
        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        const angle =
            Math.atan2(
                enemy.vy,
                enemy.vx
            );


        ctx.save();

        ctx.translate(
            x,
            y
        );

        ctx.rotate(
            angle
        );

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";


        /*
            Extra lang lichaam
        */

        ctx.beginPath();

        ctx.moveTo(
            -r * 1.02,
            r * 0.03
        );

        ctx.bezierCurveTo(
            -r * 0.88,
            -r * 0.23,

            -r * 0.70,
            -r * 0.34,

            -r * 0.52,
            -r * 0.11
        );

        ctx.bezierCurveTo(
            -r * 0.35,
            r * 0.14,

            -r * 0.14,
            r * 0.25,

            0,
            0
        );

        ctx.bezierCurveTo(
            r * 0.17,
            -r * 0.22,

            r * 0.34,
            -r * 0.26,

            r * 0.50,
            -r * 0.02
        );

        ctx.bezierCurveTo(
            r * 0.63,
            r * 0.17,

            r * 0.75,
            r * 0.14,

            r * 0.88,
            0
        );


        ctx.strokeStyle =
            "#133919";

        ctx.lineWidth =
            Math.max(
                9,
                r * 0.32
            );

        ctx.stroke();


        ctx.strokeStyle =
            this.color;

        ctx.lineWidth =
            Math.max(
                5,
                r * 0.20
            );

        ctx.stroke();


        /*
            Rug-streep
        */

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.82,
            0
        );

        ctx.bezierCurveTo(
            -r * 0.62,
            -r * 0.12,

            -r * 0.28,
            0.14 * r,

            0,
            0
        );

        ctx.bezierCurveTo(
            r * 0.24,
            -r * 0.12,

            r * 0.56,
            0.10 * r,

            r * 0.78,
            0
        );

        ctx.strokeStyle =
            "#2a6b2f";

        ctx.lineWidth =
            Math.max(
                2,
                r * 0.07
            );

        ctx.stroke();


        /*
            Staart
        */

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.98,
            r * 0.02
        );

        ctx.lineTo(
            -r * 1.12,
            r * 0.06
        );

        ctx.strokeStyle =
            "#1b4b21";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.10
            );

        ctx.stroke();


        /*
            Kop
        */

        const headX =
            r * 0.90;


        ctx.beginPath();

        ctx.arc(
            headX,
            0,
            r * 0.22,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#2a6a2f";

        ctx.fill();

        ctx.lineWidth =
            Math.max(
                2,
                r * 0.06
            );

        ctx.strokeStyle =
            "#133919";

        ctx.stroke();


        /*
            Ogen
        */

        ctx.fillStyle =
            "#111111";

        ctx.beginPath();

        ctx.arc(
            headX +
                r * 0.05,
            -r * 0.07,
            Math.max(
                1.5,
                r * 0.038
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            headX +
                r * 0.05,
            r * 0.07,
            Math.max(
                1.5,
                r * 0.038
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
            Tong
        */

        ctx.strokeStyle =
            "#d33a3a";

        ctx.lineWidth =
            Math.max(
                1.5,
                r * 0.045
            );

        ctx.beginPath();

        ctx.moveTo(
            headX +
                r * 0.19,
            0
        );

        ctx.lineTo(
            headX +
                r * 0.31,
            0
        );

        ctx.moveTo(
            headX +
                r * 0.31,
            0
        );

        ctx.lineTo(
            headX +
                r * 0.37,
            -r * 0.05
        );

        ctx.moveTo(
            headX +
                r * 0.31,
            0
        );

        ctx.lineTo(
            headX +
                r * 0.37,
            r * 0.05
        );

        ctx.stroke();

        ctx.restore();
    }
};


export default snake;