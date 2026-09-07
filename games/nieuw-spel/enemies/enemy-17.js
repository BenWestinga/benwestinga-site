const stone = {
    id: "stone",
    name: "Stone",
    behavior: "rolling-stone",

    hp: 12,
    size: 6,
    shape: "circle",
    speed: "extremelyFast",

    image: "stone.png",
    color: "#777777",

    stayInsideArena: true,

    onSpawn(
        enemy,
        api
    ) {

        /*
            Eerst richting speler zodat een Stone
            die buiten het scherm spawnt de arena
            daadwerkelijk binnenrolt.
        */

        api.aimVelocityAtPlayer(
            enemy,
            enemy.speed
        );


        enemy.stoneState = {

            rollAngle:
                Math.random() *
                Math.PI *
                2,

            curveTime:
                Math.random() *
                Math.PI *
                2,

            curveDirection:
                Math.random() <
                0.5
                    ? -1
                    : 1,

            curveSwapTimer:
                1.4 +
                Math.random() *
                1.8
        };
    },


    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy.stoneState ||
            (
                enemy.stoneState = {

                    rollAngle:
                        0,

                    curveTime:
                        0,

                    curveDirection:
                        1,

                    curveSwapTimer:
                        2
                }
            );


        /*
            ==========================================
            ARENA BINNENROLLEN
            ==========================================
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


            state.rollAngle +=

                (
                    enemy.speed *
                    dt
                ) /

                Math.max(
                    1,
                    enemy.radius *
                    0.72
                );


            return;
        }


        /*
            ==========================================
            GEBOGEN ROLLEN

            Niet recht.
            Niet als een Snake.

            De steen maakt brede bochten en verandert
            af en toe van draairichting.
            ==========================================
        */

        state.curveTime +=
            dt;


        state.curveSwapTimer -=
            dt;


        if (
            state.curveSwapTimer <=
            0
        ) {

            state.curveSwapTimer =

                1.4 +

                Math.random() *
                1.8;


            if (
                Math.random() <
                0.65
            ) {

                state.curveDirection *=
                    -1;
            }
        }


        let heading =
            Math.atan2(
                enemy.vy,
                enemy.vx
            );


        const broadCurve =

            state.curveDirection *
            0.55;


        const rollingWobble =

            Math.sin(

                state.curveTime *
                1.45

            ) *

            0.24;


        heading +=

            (
                broadCurve +
                rollingWobble
            ) *

            dt;


        enemy.vx =

            Math.cos(
                heading
            ) *

            enemy.speed;


        enemy.vy =

            Math.sin(
                heading
            ) *

            enemy.speed;


        api.moveStraight(
            enemy,
            dt
        );


        /*
            Bounce tegen alle muren.
        */

        api.keepInsideArena(
            enemy,
            14,
            true
        );


        /*
            Echte rolrotatie op basis
            van afgelegde afstand.
        */

        state.rollAngle +=

            (
                enemy.speed *
                dt
            ) /

            Math.max(
                1,
                enemy.radius *
                0.72
            );
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const image =
            api.getAssetImage(
                this.image
            );


        const state =
            enemy.stoneState ||
            {};


        const rotation =
            state.rollAngle ||
            0;


        const r =
            enemy.radius;


        /*
            ==========================================
            DRAAIENDE STONE.PNG
            ==========================================
        */

        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            rotation
        );


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            r,
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

                -r,
                -r,

                r * 2,
                r * 2
            );

        } else {

            ctx.fillStyle =
                this.color;


            ctx.fillRect(

                -r,
                -r,

                r * 2,
                r * 2
            );
        }


        /*
            Kleine highlight die mee roteert,
            zodat de rolbeweging extra zichtbaar is.
        */

        ctx.fillStyle =
            "rgba(255,255,255,0.13)";


        ctx.beginPath();


        ctx.arc(

            -r * 0.28,

            -r * 0.34,

            r * 0.25,

            0,

            Math.PI *
                2
        );


        ctx.fill();


        /*
            Scheurtje/details.
        */

        ctx.strokeStyle =
            "rgba(25,25,25,0.65)";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.055
            );


        ctx.beginPath();


        ctx.moveTo(
            -r * 0.42,
            r * 0.08
        );


        ctx.lineTo(
            -r * 0.08,
            -r * 0.06
        );


        ctx.lineTo(
            r * 0.20,
            r * 0.20
        );


        ctx.stroke();


        ctx.restore();


        /*
            Buitenrand draait niet mee.
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
            3;


        ctx.strokeStyle =
            "rgba(35,35,35,0.9)";


        ctx.stroke();


        ctx.restore();
    }
};


export default stone;