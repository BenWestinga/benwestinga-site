const camoGoon = {
    id: "camo-goon",
    name: "Camo Goon",

    behavior: "camo-chase",

    hp: 2,
    size: 2,

    speed: "slow",

    tracking: 0.6,

    color: "#a8e88a",


    onSpawn(enemy) {
        enemy.camoStarted =
            false;

        enemy.camoTimer =
            0;

        enemy.firstCamoCycle =
            true;

        enemy.isInvisible =
            false;
    },


    update(enemy, dt, api) {
        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );


        if (
            !enemy.enteredArena &&
            api.isInsideArena(
                enemy
            )
        ) {
            enemy.enteredArena =
                true;

            enemy.camoStarted =
                true;

            enemy.camoTimer =
                0;

            enemy.firstCamoCycle =
                true;
        }


        if (
            enemy.enteredArena
        ) {
            api.keepInsideArena(
                enemy
            );
        }


        if (
            !enemy.camoStarted
        ) {
            enemy.isInvisible =
                false;

            enemy.hideWorldHealthBar =
                false;

            return;
        }


        enemy.camoTimer +=
            dt;


        /*
            Eerste cyclus:
            5 zichtbaar
            1 onzichtbaar
        */

        if (
            enemy.firstCamoCycle
        ) {
            if (
                enemy.camoTimer <
                5
            ) {
                enemy.isInvisible =
                    false;

            } else if (
                enemy.camoTimer <
                6
            ) {
                enemy.isInvisible =
                    true;

            } else {
                enemy.firstCamoCycle =
                    false;

                enemy.camoTimer -=
                    6;

                enemy.isInvisible =
                    false;
            }

        } else {

            /*
                Daarna:
                4 zichtbaar
                1 onzichtbaar
            */

            const phase =
                enemy.camoTimer %
                5;


            enemy.isInvisible =
                phase >= 4;
        }


        enemy.hideWorldHealthBar =
            enemy.isInvisible;
    },


    draw(enemy, ctx, api) {
        if (
            enemy.isInvisible
        ) {
            return;
        }


        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    true,

                color:
                    this.color,

                strokeStyle:
                    "#41793c",

                lineWidth:
                    4
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
            GROTE CAMO PATCHES
        */

        const patches = [

            {
                x: -0.42,
                y: -0.30,
                radius: 0.20,
                color: "#44883d"
            },

            {
                x: 0.32,
                y: -0.42,
                radius: 0.17,
                color: "#397936"
            },

            {
                x: -0.18,
                y: 0.38,
                radius: 0.21,
                color: "#579b44"
            },

            {
                x: 0.48,
                y: 0.26,
                radius: 0.15,
                color: "#3b7434"
            },

            {
                x: 0.04,
                y: -0.52,
                radius: 0.12,
                color: "#619f4c"
            }
        ];


        for (
            const patch
            of patches
        ) {
            ctx.beginPath();

            ctx.arc(
                x +
                    patch.x *
                    r,

                y +
                    patch.y *
                    r,

                patch.radius *
                    r,

                0,

                Math.PI * 2
            );

            ctx.fillStyle =
                patch.color;

            ctx.fill();
        }


        /*
            LICHTE KLEINE SPRINKELS
        */

        const dots = [
            [-0.60, 0.02],
            [-0.30, -0.60],
            [0.18, 0.55],
            [0.62, -0.10],
            [0.48, 0.52],
            [-0.50, 0.48],
            [0.60, -0.45],
            [-0.02, 0.64]
        ];


        ctx.fillStyle =
            "#d1e5a4";


        for (
            const [
                dx,
                dy
            ]
            of dots
        ) {
            ctx.beginPath();

            ctx.arc(
                x +
                    dx *
                    r,

                y +
                    dy *
                    r,

                Math.max(
                    2,
                    r * 0.065
                ),

                0,

                Math.PI * 2
            );

            ctx.fill();
        }


        /*
            GRASSPRIETJES
        */

        ctx.strokeStyle =
            "#2f6d31";

        ctx.lineWidth =
            Math.max(
                2,
                r * 0.07
            );

        ctx.lineCap =
            "round";


        const grass = [
            [-0.55, -0.48, -0.68, -0.82],
            [-0.28, -0.58, -0.20, -0.90],
            [0.02, -0.61, 0.08, -0.91],
            [0.30, -0.55, 0.45, -0.82],
            [0.54, -0.38, 0.70, -0.62],
            [-0.61, 0.14, -0.80, 0.02],
            [0.61, 0.10, 0.80, -0.03]
        ];


        ctx.beginPath();


        for (
            const [
                x1,
                y1,
                x2,
                y2
            ]
            of grass
        ) {
            ctx.moveTo(
                x + x1 * r,
                y + y1 * r
            );

            ctx.lineTo(
                x + x2 * r,
                y + y2 * r
            );
        }


        ctx.stroke();


        ctx.restore();
    }
};


export default camoGoon;