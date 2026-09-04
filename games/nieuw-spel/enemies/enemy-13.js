const snake = {
    id: "snake",
    name: "Snake",

    behavior: "snake-wave",

    hp: 1.8,

    size: 2.4,

    speed: "mediumFast",

    color: "#397c35",

    chaseDuration: 2,

    chaseTracking: 1,

    waveAmplitude: 32,

    waveLength: 130,


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
            speler volgen.
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


                /*
                    Huidige richting vastzetten.
                */

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
                    -enemy.snakeDirectionY;

                enemy.snakePerpendicularY =
                    enemy.snakeDirectionX;


                enemy.snakeOriginX =
                    enemy.x;

                enemy.snakeOriginY =
                    enemy.y;


                enemy.snakeDistance =
                    0;
            }

        } else {

            /*
                Rechtdoor met
                slangenbeweging.
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
                Velocity ongeveer tangent
                aan zijn huidige beweging.

                Vooral voor visuals /
                andere systemen.
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
            Snake is een straight-through
            enemy.

            Dus NIET binnen houden.

            Wanneer hij volledig aan de
            andere kant verdwijnt,
            wordt hij verwijderd.
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


    draw(enemy, ctx, api) {
        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        /*
            Richting waarin slang kijkt.
        */

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
            Alles blijft bewust
            BINNEN de ronde hitbox.

              -r -------- +r

            Daardoor klopt wat je ziet
            met wat je kunt raken.
        */


        /*
            Donkere buitenkant lichaam.
        */

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.72,
            0
        );


        ctx.bezierCurveTo(
            -r * 0.48,
            -r * 0.34,

            -r * 0.22,
            r * 0.34,

            0,
            0
        );


        ctx.bezierCurveTo(
            r * 0.22,
            -r * 0.30,

            r * 0.40,
            r * 0.18,

            r * 0.58,
            0
        );


        ctx.strokeStyle =
            "#214d25";

        ctx.lineWidth =
            Math.max(
                7,
                r * 0.44
            );

        ctx.lineCap =
            "round";

        ctx.lineJoin =
            "round";

        ctx.stroke();


        /*
            Groene binnenkant.
        */

        ctx.strokeStyle =
            this.color;

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.28
            );

        ctx.stroke();


        /*
            Kop.
        */

        const headX =
            r * 0.58;


        ctx.beginPath();

        ctx.arc(
            headX,
            0,
            r * 0.24,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#4b9442";

        ctx.fill();


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.07
            );

        ctx.strokeStyle =
            "#214d25";

        ctx.stroke();


        /*
            Ogen.
        */

        ctx.fillStyle =
            "#111111";


        ctx.beginPath();

        ctx.arc(
            headX + r * 0.06,
            -r * 0.08,
            Math.max(
                1.5,
                r * 0.045
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            headX + r * 0.06,
            r * 0.08,
            Math.max(
                1.5,
                r * 0.045
            ),
            0,
            Math.PI * 2
        );

        ctx.fill();


        /*
            Tong.
        */

        ctx.strokeStyle =
            "#cc3030";

        ctx.lineWidth =
            Math.max(
                1.5,
                r * 0.05
            );


        ctx.beginPath();

        ctx.moveTo(
            headX + r * 0.20,
            0
        );

        ctx.lineTo(
            headX + r * 0.31,
            0
        );

        ctx.stroke();


        ctx.restore();
    }
};


export default snake;