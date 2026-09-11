const snowball = {

    id: "snowball",

    name: "Snowball",

    behavior:
        "rolling-snowball",

    /*
        Snowball is een OBJECT.

        Dus:
        - geen gezicht
        - 5 HP
        - size 6
        - medium speed
    */

    hp: 5,

    size: 6,

    speed: "medium",

    color:
        "#f4fbff",

    image:
        "snow.png",


    modifyDamage(
        enemy,
        damage
    ) {

        if (
            window.IceWorldEffects
                ?.active
        ) {

            return damage * 0.5;
        }


        return damage;
    },


    spawn({
        definition,
        position,
        api
    }) {

        const canvas =
            api.getCanvas();


        /*
            Wordt hij BINNEN arena
            gespawned?

            Dan komt hij van SnowMan.
        */

        const spawnedInside =

            position.x >= 0 &&
            position.x <=
                canvas.width &&

            position.y >= 0 &&
            position.y <=
                canvas.height;


        if (
            spawnedInside
        ) {

            return api.createEntity(

                definition,

                {
                    x:
                        position.x,

                    y:
                        position.y
                },

                {
                    spawnedBySnowMan:
                        true
                }
            );
        }


        /*
            Normale level-spawn.

            Snowballs mogen alleen
            precies links of rechts
            verschijnen.
        */

        const side =

            position.x < 0

                ? "left"

                : position.x >
                    canvas.width

                    ? "right"

                    : Math.random() <
                        0.5

                        ? "left"
                        : "right";


        const spawnPosition =
            api.randomSpawnPosition(

                api.getEnemyRadius(
                    definition.size
                ),

                {
                    side
                }
            );


        return api.createEntity(

            definition,

            spawnPosition,

            {
                spawnedBySnowMan:
                    false,

                spawnSide:
                    side
            }
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
            Math.random() *
            Math.PI *
            2;


        const stormMultiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseSnowballSpeed *
            stormMultiplier;


        /*
            ==================================
            SNOWMAN SNOWBALL
            ==================================

            Binnen arena gespawned.

            Richt één keer op speler.

            Daarna blijft hij rechtdoor gaan.
        */

        if (
            enemy.spawnedBySnowMan
        ) {

            api.aimVelocityAtPlayer(
                enemy
            );


            enemy.enteredArena =
                true;


            return;
        }


        /*
            ==================================
            NORMALE LEVEL SNOWBALL
            ==================================

            Exact horizontaal.

            Links -> rechts.

            Rechts -> links.
        */

        enemy.vy =
            0;


        if (
            enemy.spawnSide ===
                "left"
        ) {

            enemy.vx =
                enemy.speed;


        } else {

            enemy.vx =
                -enemy.speed;
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        /*
            Snowstorm snelheid.
        */

        const stormMultiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseSnowballSpeed *
            stormMultiplier;


        /*
            Zelfde richting houden,
            maar correcte actuele speed.
        */

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;


        enemy.vx =
            enemy.vx /
            velocityLength *
            enemy.speed;


        enemy.vy =
            enemy.vy /
            velocityLength *
            enemy.speed;


        /*
            Rechtdoor bewegen.
        */

        api.moveStraight(
            enemy,
            dt
        );


        /*
            Snowball zelf MAG draaien.

            Dit is een los rollend object,
            niet de SnowMan.
        */

        enemy.rollAngle +=

            enemy.speed /
            Math.max(
                10,
                enemy.radius
            ) *
            dt;


        /*
            Binnen arena registreren.
        */

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
            Snowball blijft in map
            en bounced tegen muren.
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


        const image =
            api.getAssetImage(
                this.image
            );


        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            enemy.rollAngle || 0
        );


        /*
            Zachte schaduw.
        */

        ctx.beginPath();

        ctx.ellipse(
            0,
            r * 0.62,

            r * 0.72,
            r * 0.19,

            0,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(30,80,100,0.12)";


        ctx.fill();


        /*
            Sneeuwbal gradient.
        */

        const gradient =
            ctx.createRadialGradient(

                -r * 0.30,
                -r * 0.32,

                r * 0.08,

                0,
                0,

                r
            );


        gradient.addColorStop(
            0,
            "#ffffff"
        );


        gradient.addColorStop(
            0.55,
            "#f3fbfe"
        );


        gradient.addColorStop(
            1,
            "#c3e6f0"
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
            gradient;


        ctx.fill();


        /*
            snow.png subtiel erin.
        */

        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {

            ctx.save();


            ctx.beginPath();

            ctx.arc(
                0,
                0,
                r * 0.96,
                0,
                Math.PI * 2
            );


            ctx.clip();


            ctx.globalAlpha =
                0.23;


            ctx.drawImage(
                image,

                -r,
                -r,

                r * 2,
                r * 2
            );


            ctx.restore();
        }


        /*
            Buitenrand.
        */

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "#9fd4e3";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.055
            );


        ctx.stroke();


        /*
            Groot highlight.
        */

        ctx.beginPath();

        ctx.arc(
            -r * 0.12,
            -r * 0.10,

            r * 0.65,

            Math.PI * 1.12,
            Math.PI * 1.60
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.84)";


        ctx.lineWidth =
            Math.max(
                3,
                r * 0.07
            );


        ctx.lineCap =
            "round";


        ctx.stroke();


        /*
            Rollende sneeuwpatronen.

            Omdat ctx zelf roteert,
            zie je daadwerkelijk dat
            de bal rolt.
        */

        ctx.beginPath();

        ctx.arc(
            0,
            0,

            r * 0.64,

            -0.90,
            0.65
        );


        ctx.strokeStyle =
            "rgba(109,190,215,0.47)";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.045
            );


        ctx.stroke();


        ctx.beginPath();

        ctx.arc(
            r * 0.15,
            -r * 0.12,

            r * 0.31,

            1,
            2.65
        );


        ctx.strokeStyle =
            "rgba(130,205,225,0.38)";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.035
            );


        ctx.stroke();


        /*
            Paar kleine sneeuwplekjes.
        */

        ctx.fillStyle =
            "rgba(255,255,255,0.68)";


        ctx.beginPath();

        ctx.arc(
            r * 0.31,
            r * 0.20,

            r * 0.075,

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            -r * 0.37,
            r * 0.10,

            r * 0.055,

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();


        /*
            GEEN drawEnemyFace().

            Snowball is een object,
            geen levende enemy met gezicht.
        */
    }
};


export default snowball;