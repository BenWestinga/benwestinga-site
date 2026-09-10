const snowball = {

    id: "snowball",

    name: "Snowball",

    behavior:
        "rolling-snowball",

    hp: 5,

    size: 6,

    speed: "medium",

    image:
        "snow.png",

    color:
        "#f5fbff",


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


    spawn({
        definition,
        position,
        api
    }) {

        const canvas =
            api.getCanvas();


        let spawnPosition = {
            x:
                position.x,

            y:
                position.y
        };


        const insideArena =

            spawnPosition.x >= 0 &&
            spawnPosition.x <=
                canvas.width &&

            spawnPosition.y >= 0 &&
            spawnPosition.y <=
                canvas.height;


        /*
            Als SnowMan hem midden in
            de arena maakt, behouden we
            die positie.

            Normale level-spawn:
            ALLEEN links of rechts.
        */

        if (
            !insideArena
        ) {

            const alreadyLeftOrRight =

                spawnPosition.x < 0 ||
                spawnPosition.x >
                    canvas.width;


            if (
                !alreadyLeftOrRight
            ) {

                const side =
                    Math.random() <
                    0.5

                        ? "left"
                        : "right";


                spawnPosition =
                    api.randomSpawnPosition(
                        api.getEnemyRadius(
                            definition.size
                        ),
                        {
                            side
                        }
                    );
            }
        }


        return api.createEntity(
            definition,
            spawnPosition
        );
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.baseSnowballSpeed =
            api.getEnemySpeed(
                this.speed
            );


        enemy.rollAngle =
            0;


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseSnowballSpeed *
            multiplier;


        const canvas =
            api.getCanvas();


        const inside =

            enemy.x >= 0 &&
            enemy.x <=
                canvas.width &&

            enemy.y >= 0 &&
            enemy.y <=
                canvas.height;


        if (
            inside
        ) {

            /*
                SnowMan attack:
                recht op huidige speler af.
            */

            api.aimVelocityAtPlayer(
                enemy
            );


            enemy.enteredArena =
                true;


            return;
        }


        /*
            Normale spawn:
            exact horizontaal van links/rechts.
        */

        enemy.vy =
            0;


        enemy.vx =
            enemy.x < 0

                ? enemy.speed
                : -enemy.speed;
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


        enemy.speed =
            enemy.baseSnowballSpeed *
            multiplier;


        const length =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;


        enemy.vx =
            enemy.vx /
            length *
            enemy.speed;


        enemy.vy =
            enemy.vy /
            length *
            enemy.speed;


        api.moveStraight(
            enemy,
            dt
        );


        enemy.rollAngle +=
            enemy.speed /
            Math.max(
                10,
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


        /*
            Volgens jouw algemene regel
            blijft hij daarna in de map.

            Hij bounced dus tegen muren
            totdat hij kapotgeschoten wordt.
        */

        if (
            enemy.enteredArena
        ) {

            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }
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
            enemy.rollAngle || 0
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
            "#f7fcff";

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

            ctx.globalAlpha =
                0.85;


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
            3;

        ctx.strokeStyle =
            "#a9ddec";

        ctx.stroke();


        /*
            Rollende lijnen.
        */

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r * 0.67,
            -0.9,
            0.9
        );

        ctx.strokeStyle =
            "#87c9df";

        ctx.stroke();


        ctx.restore();


        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowball;