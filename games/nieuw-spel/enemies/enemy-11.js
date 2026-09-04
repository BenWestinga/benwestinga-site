const camoGoon = {
    id: "camo-goon",
    name: "Camo Goon",

    behavior: "camo-chase",

    hp: 2,
    size: 2,

    speed: "slow",

    /*
        Sand Bomb = 0.3
        2x = 0.6
    */

    tracking: 0.6,

    color: "#a6d987",


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


        /*
            Tracking enemy:
            nooit meer uit arena.
        */

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
                1 onzichtbaar.
            */

            const phase =
                enemy.camoTimer %
                5;


            enemy.isInvisible =
                phase >= 4;
        }


        /*
            Healthbar mag hem tijdens
            invisibility niet verraden.
        */

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
                    this.color
            }
        );


        /*
            Grass / camo sprinkels.
        */

        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        ctx.fillStyle =
            "#4e9440";


        const dots = [
            [-0.48, -0.35],
            [0.35, -0.48],
            [-0.10, -0.58],
            [0.52, 0.05],
            [-0.48, 0.22],
            [0.12, 0.48],
            [0.42, 0.38],
            [-0.28, 0.52]
        ];


        for (
            const [
                dx,
                dy
            ]
            of dots
        ) {
            ctx.beginPath();

            ctx.arc(
                x + dx * r,
                y + dy * r,
                Math.max(
                    1.5,
                    r * 0.07
                ),
                0,
                Math.PI * 2
            );

            ctx.fill();
        }


        /*
            Kleine grassprietjes.
        */

        ctx.strokeStyle =
            "#5da448";

        ctx.lineWidth =
            Math.max(
                1.5,
                r * 0.07
            );


        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.45,
            y - r * 0.52
        );

        ctx.lineTo(
            x - r * 0.36,
            y - r * 0.78
        );


        ctx.moveTo(
            x + r * 0.12,
            y - r * 0.58
        );

        ctx.lineTo(
            x + r * 0.20,
            y - r * 0.82
        );


        ctx.moveTo(
            x + r * 0.42,
            y - r * 0.42
        );

        ctx.lineTo(
            x + r * 0.55,
            y - r * 0.65
        );


        ctx.stroke();


        ctx.restore();
    }
};


export default camoGoon;