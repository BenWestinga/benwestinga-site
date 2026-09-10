const PHASES = {

    1: {
        size: 6,
        speed: "medium",
        tracking: 0.5
    },

    2: {
        size: 4,
        speed: "fast",
        tracking: 0.8
    },

    3: {
        size: 2,
        speed: "extremelyFast",
        tracking: 1.2
    }
};


const snowMan = {

    id: "snow-man",

    name: "Snow Man",

    behavior:
        "three-phase-snowman",

    /*
        30 HP fase 1
        25 HP fase 2
        12 HP fase 3

        Totaal effectieve HP = 67.
    */

    hp: 67,

    size: 6,

    speed: "medium",

    tracking: 0.5,

    image:
        "snow.png",

    color:
        "#f7fcff",

    followDuration:
        10,

    straightDuration:
        3,

    snowballCooldown:
        3,


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


    getPhase(
        enemy
    ) {

        if (
            enemy.hp > 37
        ) {

            return 1;
        }


        if (
            enemy.hp > 12
        ) {

            return 2;
        }


        return 3;
    },


    applyPhase(
        enemy,
        api,
        force = false
    ) {

        const newPhase =
            this.getPhase(
                enemy
            );


        if (
            !force &&
            enemy.phase ===
            newPhase
        ) {

            return;
        }


        enemy.phase =
            newPhase;


        const data =
            PHASES[
                newPhase
            ];


        enemy.size =
            data.size;


        enemy.radius =
            api.getEnemyRadius(
                data.size
            );


        enemy.phaseSpeedName =
            data.speed;


        enemy.phaseBaseSpeed =
            api.getEnemySpeed(
                data.speed
            );


        enemy.tracking =
            data.tracking;


        /*
            Animatie bij fasewissel.
        */

        enemy.phaseFlash =
            0.7;


        if (
            newPhase === 3
        ) {

            enemy.snowballTimer =
                1.2;
        }
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.phase =
            1;


        enemy.phaseFlash =
            0;


        enemy.moveCycle =
            0;


        enemy.moveMode =
            "follow";


        enemy.rollAngle =
            0;


        enemy.snowballTimer =
            this.snowballCooldown;


        this.applyPhase(
            enemy,
            api,
            true
        );


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.phaseBaseSpeed *
            multiplier;


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    onDamage(
        enemy,
        damage,
        oldHp,
        api
    ) {

        this.applyPhase(
            enemy,
            api
        );
    },


    update(
        enemy,
        dt,
        api
    ) {

        this.applyPhase(
            enemy,
            api
        );


        if (
            enemy.phaseFlash > 0
        ) {

            enemy.phaseFlash -=
                dt;
        }


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.phaseBaseSpeed *
            multiplier;


        const cycleLength =
            this.followDuration +
            this.straightDuration;


        const oldMode =
            enemy.moveCycle <
            this.followDuration

                ? "follow"
                : "straight";


        enemy.moveCycle +=
            dt;


        if (
            enemy.moveCycle >=
            cycleLength
        ) {

            enemy.moveCycle %=
                cycleLength;
        }


        const newMode =
            enemy.moveCycle <
            this.followDuration

                ? "follow"
                : "straight";


        if (
            oldMode !==
            newMode
        ) {

            enemy.moveMode =
                newMode;


            if (
                newMode ===
                "straight"
            ) {

                /*
                    Bij start van straight
                    één keer op speler richten.
                */

                api.aimVelocityAtPlayer(
                    enemy
                );
            }
        }


        if (
            newMode ===
            "follow"
        ) {

            api.moveTowardPlayer(
                enemy,
                dt,
                enemy.tracking
            );

        } else {

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
            enemy.enteredArena
        ) {

            /*
                SnowMan blijft altijd
                binnen de arena.
            */

            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }


        enemy.rollAngle +=
            enemy.speed /
            Math.max(
                20,
                enemy.radius
            ) *
            dt;


        /*
            FASE 3:

            Iedere 3 seconden wordt
            een echte Snowball enemy
            afgevuurd.
        */

        if (
            enemy.phase === 3 &&
            enemy.enteredArena
        ) {

            enemy.snowballTimer -=
                dt;


            if (
                enemy.snowballTimer <= 0
            ) {

                enemy.snowballTimer +=
                    this.snowballCooldown;


                api.spawnEnemyAt(
                    "snowball",
                    enemy.x,
                    enemy.y
                );
            }
        }
    },


    drawSnowCircle(
        ctx,
        api,
        image,
        x,
        y,
        radius
    ) {

        ctx.save();


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#f6fcff";

        ctx.fill();


        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {

            ctx.save();

            ctx.clip();

            ctx.globalAlpha =
                0.8;


            ctx.drawImage(
                image,
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
            );


            ctx.restore();
        }


        ctx.lineWidth =
            Math.max(
                2,
                radius * 0.06
            );


        ctx.strokeStyle =
            "#b8e5f2";

        ctx.stroke();


        ctx.restore();
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


        if (
            enemy.phase === 1
        ) {

            const bottomR =
                r * 0.66;


            const middleR =
                r * 0.48;


            const headR =
                r * 0.36;


            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                r * 0.23,
                bottomR
            );


            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                -r * 0.27,
                middleR
            );


            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                -r * 0.68,
                headR
            );


            ctx.restore();


            api.drawEnemyFace({
                ...enemy,

                x:
                    enemy.x,

                y:
                    enemy.y -
                    r * 0.68,

                radius:
                    headR
            });


        } else if (
            enemy.phase === 2
        ) {

            const bodyR =
                r * 0.72;


            const headR =
                r * 0.48;


            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                r * 0.20,
                bodyR
            );


            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                -r * 0.54,
                headR
            );


            /*
                IJsarmen fase 2.
            */

            ctx.strokeStyle =
                "#b8ecff";

            ctx.lineWidth =
                Math.max(
                    4,
                    r * 0.12
                );


            ctx.beginPath();

            ctx.moveTo(
                -r * 0.42,
                -r * 0.05
            );

            ctx.lineTo(
                -r * 0.82,
                -r * 0.35
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(
                r * 0.42,
                -r * 0.05
            );

            ctx.lineTo(
                r * 0.82,
                -r * 0.35
            );

            ctx.stroke();


            ctx.restore();


            api.drawEnemyFace({
                ...enemy,

                x:
                    enemy.x,

                y:
                    enemy.y -
                    r * 0.54,

                radius:
                    headR
            });


        } else {

            /*
                Fase 3:
                compacte rollende sneeuwbal.
            */

            this.drawSnowCircle(
                ctx,
                api,
                image,
                0,
                0,
                r
            );


            ctx.beginPath();

            ctx.arc(
                0,
                0,
                r * 0.64,
                -0.7,
                0.7
            );


            ctx.strokeStyle =
                "#82cfe8";

            ctx.lineWidth =
                3;

            ctx.stroke();


            ctx.restore();


            api.drawEnemyFace(
                enemy
            );
        }


        /*
            Fasewissel-animatie.
        */

        if (
            enemy.phaseFlash > 0
        ) {

            const progress =
                1 -
                enemy.phaseFlash /
                0.7;


            ctx.save();

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,

                enemy.radius *
                (
                    1 +
                    progress *
                    1.2
                ),

                0,
                Math.PI * 2
            );


            ctx.strokeStyle =
                `rgba(190,240,255,${1 - progress})`;


            ctx.lineWidth =
                6;


            ctx.stroke();

            ctx.restore();
        }
    }
};


export default snowMan;