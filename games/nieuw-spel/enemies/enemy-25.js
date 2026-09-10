const snowGuy = {

    id: "snow-guy",

    name: "Snow Guy",

    behavior:
        "random-bouncer",

    hp: 1,

    size: 1,

    speed:
        "extremelyFast",

    color:
        "#f4fbff",

    image:
        "snow.png",


    modifyDamage(
        enemy,
        damage
    ) {

        return (
            window.IceWorldEffects
                ?.active
        )
            ? damage * 0.5
            : damage;
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.baseSnowSpeed =
            api.getEnemySpeed(
                this.speed
            );


        enemy.rotation =
            0;


        const canvas =
            api.getCanvas();


        /*
            Bij binnenkomen richten we hem
            eerst naar een random punt
            binnen de arena.

            Anders kan een volledig random
            richting hem juist verder buiten
            het level sturen.
        */

        const targetX =
            canvas.width *
            (
                0.2 +
                Math.random() *
                0.6
            );


        const targetY =
            canvas.height *
            (
                0.2 +
                Math.random() *
                0.6
            );


        const dx =
            targetX -
            enemy.x;


        const dy =
            targetY -
            enemy.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        const speed =
            enemy.baseSnowSpeed *
            multiplier;


        enemy.speed =
            speed;


        enemy.vx =
            dx /
            distance *
            speed;


        enemy.vy =
            dy /
            distance *
            speed;
    },


    chooseRandomDirection(
        enemy,
        api,
        hitLeft,
        hitRight,
        hitTop,
        hitBottom
    ) {

        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        const speed =
            enemy.baseSnowSpeed *
            multiplier;


        let angle =
            0;


        /*
            Kies een richting die daadwerkelijk
            terug de arena in wijst.
        */

        for (
            let attempt = 0;
            attempt < 30;
            attempt++
        ) {

            angle =
                Math.random() *
                Math.PI *
                2;


            const vx =
                Math.cos(
                    angle
                );


            const vy =
                Math.sin(
                    angle
                );


            if (
                hitLeft &&
                vx <= 0
            ) {

                continue;
            }


            if (
                hitRight &&
                vx >= 0
            ) {

                continue;
            }


            if (
                hitTop &&
                vy <= 0
            ) {

                continue;
            }


            if (
                hitBottom &&
                vy >= 0
            ) {

                continue;
            }


            break;
        }


        enemy.vx =
            Math.cos(
                angle
            ) *
            speed;


        enemy.vy =
            Math.sin(
                angle
            ) *
            speed;


        enemy.speed =
            speed;
    },


    update(
        enemy,
        dt,
        api
    ) {

        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        const wantedSpeed =
            enemy.baseSnowSpeed *
            multiplier;


        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;


        enemy.vx =
            enemy.vx /
            velocityLength *
            wantedSpeed;


        enemy.vy =
            enemy.vy /
            velocityLength *
            wantedSpeed;


        enemy.speed =
            wantedSpeed;


        enemy.x +=
            enemy.vx *
            dt;


        enemy.y +=
            enemy.vy *
            dt;


        enemy.rotation +=
            wantedSpeed /
            Math.max(
                1,
                enemy.radius
            ) *
            dt;


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
            !enemy.enteredArena
        ) {

            return;
        }


        const canvas =
            api.getCanvas();


        const margin =
            enemy.radius +
            14;


        const hitLeft =
            enemy.x <=
            margin;


        const hitRight =
            enemy.x >=
            canvas.width -
            margin;


        const hitTop =
            enemy.y <=
            margin;


        const hitBottom =
            enemy.y >=
            canvas.height -
            margin;


        if (
            !hitLeft &&
            !hitRight &&
            !hitTop &&
            !hitBottom
        ) {

            return;
        }


        enemy.x =
            Math.max(
                margin,
                Math.min(
                    canvas.width -
                    margin,
                    enemy.x
                )
            );


        enemy.y =
            Math.max(
                margin,
                Math.min(
                    canvas.height -
                    margin,
                    enemy.y
                )
            );


        this.chooseRandomDirection(
            enemy,
            api,
            hitLeft,
            hitRight,
            hitTop,
            hitBottom
        );
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const r =
            enemy.radius;


        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(
            enemy.rotation || 0
        );


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#f4fbff";

        ctx.fill();


        const image =
            api.getAssetImage(
                this.image
            );


        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {

            ctx.save();

            ctx.clip();

            ctx.drawImage(
                image,
                -r,
                -r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }


        ctx.lineWidth =
            2;

        ctx.strokeStyle =
            "#bfe9f5";

        ctx.stroke();


        /*
            Rotatie-streepjes zodat je
            duidelijk ziet dat hij draait.
        */

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r * 0.62,
            -0.7,
            0.7
        );

        ctx.strokeStyle =
            "rgba(120,190,220,0.8)";

        ctx.stroke();


        ctx.restore();


        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowGuy;