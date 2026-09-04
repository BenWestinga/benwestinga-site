const snake = {
    id: "snake",
    name: "Snake",

    behavior: "snake-wave",

    hp: 1.8,

    /*
        Iets langer/groter.
    */

    size: 3,

    speed: "mediumFast",

    color: "#397c35",

    chaseDuration:
        2,

    chaseTracking:
        1,

    /*
        Zelfde voorwaartse snelheid,
        maar veel langzamere kronkel.
    */

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


        /*
            Eerste 2 seconden:
            richting speler.
        */

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

            /*
                Voorwaartse afstand blijft
                gewoon enemy.speed.

                Dus de langzamere kronkel
                verlaagt de snelheid niet.
            */

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


            /*
                Richting voor visual.
            */

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


        /*
            Snake blijft niet binnen.

            Hij gaat uiteindelijk
            door de arena heen.
        */

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


        /*
            LANGER SLANGENLICHAAM.

            Blijft wel binnen
            de ronde hitbox.
        */

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";


        /*
            DONKERE BUITENRAND
        */

        ctx.beginPath();


        ctx.moveTo(
            -r * 0.82,
            0
        );


        ctx.bezierCurveTo(

            -r * 0.67,
            -r * 0.26,

            -r * 0.48,
            -r * 0.30,

            -r * 0.31,
            -r * 0.06
        );


        ctx.bezierCurveTo(

            -r * 0.14,
            r * 0.23,

            r * 0.05,
            r * 0.25,

            r * 0.22,
            0
        );


        ctx.bezierCurveTo(

            r * 0.38,
            -r * 0.23,

            r * 0.54,
            -r * 0.21,

            r * 0.70,
            0
        );


        ctx.strokeStyle =
            "#214d25";

        ctx.lineWidth =
            Math.max(
                7,
                r * 0.34
            );

        ctx.stroke();


        /*
            GROENE BINNENKANT
        */

        ctx.strokeStyle =
            this.color;

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.22
            );

        ctx.stroke();


        /*
            STAARTPUNT
        */

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.82,
            0
        );

        ctx.lineTo(
            -r * 0.92,
            r * 0.04
        );


        ctx.strokeStyle =
            "#397c35";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.14
            );

        ctx.stroke();


        /*
            KOP
        */

        const headX =
            r * 0.70;


        ctx.beginPath();

        ctx.arc(
            headX,
            0,
            r * 0.22,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#4c9844";

        ctx.fill();


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.06
            );

        ctx.strokeStyle =
            "#214d25";

        ctx.stroke();


        /*
            EYES
        */

        ctx.fillStyle =
            "#111111";


        ctx.beginPath();

        ctx.arc(
            headX +
                r * 0.06,

            -r * 0.075,

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
                r * 0.06,

            r * 0.075,

            Math.max(
                1.5,
                r * 0.038
            ),

            0,

            Math.PI * 2
        );

        ctx.fill();


        /*
            TONG
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