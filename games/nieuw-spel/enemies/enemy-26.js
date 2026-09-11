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
        FASE 1:
        30 HP

        FASE 2:
        25 HP

        FASE 3:
        12 HP

        Totaal = 67 HP
    */

    hp: 67,

    size: 6,

    speed: "medium",

    tracking: 0.5,

    color:
        "#f4fbff",

    image:
        "snow.png",

    /*
        10 seconden volgen.

        Daarna 3 seconden
        rechtdoor.

        Daarna opnieuw.
    */

    followDuration:
        10,

    straightDuration:
        3,

    /*
        Alleen fase 3.
    */

    snowballCooldown:
        3,


    modifyDamage(
        enemy,
        damage
    ) {

        /*
            Snowstorm effect.
        */

        if (
            window.IceWorldEffects
                ?.active
        ) {

            return damage * 0.5;
        }


        return damage;
    },


    getPhase(
        enemy
    ) {

        /*
            Start:
            67 HP

            30 damage nodig
            voor fase 2.

            Dus:
            67 -> 37

            Daarna 25 HP:
            37 -> 12

            Daarna laatste
            12 HP.
        */

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


        const oldPhase =
            enemy.phase;


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


        enemy.phaseBaseSpeed =
            api.getEnemySpeed(
                data.speed
            );


        enemy.tracking =
            data.tracking;


        /*
            Fasewissel effect.
        */

        if (
            !force &&
            oldPhase !==
                newPhase
        ) {

            enemy.phaseFlash =
                0.65;
        }


        /*
            Wanneer fase 3 begint
            niet meteen een bal afvuren.

            Eerst ongeveer 1 seconde.
        */

        if (
            newPhase === 3 &&
            oldPhase !== 3
        ) {

            enemy.snowballTimer =
                1;
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


        enemy.snowballTimer =
            this.snowballCooldown;


        enemy.visualTime =
            Math.random() *
            100;


        this.applyPhase(
            enemy,
            api,
            true
        );


        const stormMultiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.phaseBaseSpeed *
            stormMultiplier;


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

        /*
            Controleer fase.
        */

        this.applyPhase(
            enemy,
            api
        );


        enemy.visualTime +=
            dt;


        if (
            enemy.phaseFlash > 0
        ) {

            enemy.phaseFlash -=
                dt;
        }


        /*
            Snowstorm snelheid.
        */

        const stormMultiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.phaseBaseSpeed *
            stormMultiplier;


        /*
            ==================================
            MOVEMENT CYCLE
            ==================================

            10 sec volgen
            3 sec rechtdoor
        */

        const cycleLength =
            this.followDuration +
            this.straightDuration;


        const previousMode =

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


        const mode =

            enemy.moveCycle <
                this.followDuration

                ? "follow"
                : "straight";


        /*
            Wanneer straight begint:
            één keer richten.

            Daarna richting vasthouden.
        */

        if (
            mode !==
                previousMode &&

            mode ===
                "straight"
        ) {

            api.aimVelocityAtPlayer(
                enemy
            );
        }


        enemy.moveMode =
            mode;


        /*
            ==================================
            VOLGEN
            ==================================
        */

        if (
            mode ===
            "follow"
        ) {

            api.moveTowardPlayer(
                enemy,
                dt,
                enemy.tracking
            );


        } else {

            /*
                ==================================
                RECHTDOOR
                ==================================
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


            api.moveStraight(
                enemy,
                dt
            );
        }


        /*
            Arena binnenkomen.
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
            SnowMan blijft altijd
            in het level.

            Bounce tegen muur.
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


        /*
            ==================================
            FASE 3 SNOWBALL ATTACK
            ==================================
        */

        if (
            enemy.phase === 3 &&
            enemy.enteredArena
        ) {

            enemy.snowballTimer -=
                dt;


            if (
                enemy.snowballTimer <=
                    0
            ) {

                enemy.snowballTimer +=
                    this.snowballCooldown;


                /*
                    Snowball wordt precies
                    op SnowMan gespawned.

                    Snowball.js ziet dat hij
                    binnen de arena spawnt
                    en richt hem daardoor
                    op de speler.
                */

                api.spawnEnemyAt(
                    "snowball",
                    enemy.x,
                    enemy.y
                );


                /*
                    Kleine attack animatie.
                */

                enemy.shootFlash =
                    0.18;
            }
        }


        if (
            enemy.shootFlash > 0
        ) {

            enemy.shootFlash -=
                dt;
        }
    },


    /*
        ======================================
        VISUAL HELPER
        ======================================
    */

    drawSnowBall(
        ctx,
        image,
        x,
        y,
        radius,
        variant = 0
    ) {

        ctx.save();


        /*
            Schaduw.
        */

        ctx.beginPath();

        ctx.ellipse(
            x,
            y +
                radius * 0.68,

            radius * 0.68,
            radius * 0.20,

            0,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(30,80,100,0.12)";

        ctx.fill();


        /*
            Hoofdbal.
        */

        const gradient =
            ctx.createRadialGradient(

                x -
                    radius * 0.28,

                y -
                    radius * 0.30,

                radius * 0.05,

                x,
                y,

                radius
            );


        gradient.addColorStop(
            0,
            "#ffffff"
        );


        if (
            variant === 0
        ) {

            gradient.addColorStop(
                0.65,
                "#effaff"
            );

            gradient.addColorStop(
                1,
                "#cceaf3"
            );


        } else if (
            variant === 1
        ) {

            gradient.addColorStop(
                0.65,
                "#eaf8fc"
            );

            gradient.addColorStop(
                1,
                "#bfe3ee"
            );


        } else {

            gradient.addColorStop(
                0.65,
                "#f3fbff"
            );

            gradient.addColorStop(
                1,
                "#c7eaf4"
            );
        }


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            gradient;

        ctx.fill();


        /*
            snow.png heel subtiel.
        */

        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {

            ctx.save();


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius * 0.96,
                0,
                Math.PI * 2
            );

            ctx.clip();


            ctx.globalAlpha =
                0.20;


            ctx.drawImage(
                image,

                x -
                    radius,

                y -
                    radius,

                radius * 2,
                radius * 2
            );


            ctx.restore();
        }


        /*
            IJsblauwe rand.
        */

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "#acd9e7";


        ctx.lineWidth =
            Math.max(
                2,
                radius * 0.055
            );


        ctx.stroke();


        /*
            Highlight.
        */

        ctx.beginPath();

        ctx.arc(
            x -
                radius * 0.18,

            y -
                radius * 0.22,

            radius * 0.57,

            Math.PI * 1.08,
            Math.PI * 1.60
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.75)";


        ctx.lineWidth =
            Math.max(
                2,
                radius * 0.07
            );


        ctx.lineCap =
            "round";


        ctx.stroke();


        /*
            Iedere lichaamsbal ziet
            iets anders uit.
        */

        if (
            variant === 0
        ) {

            /*
                Onderste grote bal.
            */

            ctx.beginPath();

            ctx.arc(
                x -
                    radius * 0.30,

                y +
                    radius * 0.18,

                radius * 0.08,

                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(125,190,210,0.34)";

            ctx.fill();


            ctx.beginPath();

            ctx.arc(
                x +
                    radius * 0.25,

                y +
                    radius * 0.38,

                radius * 0.06,

                0,
                Math.PI * 2
            );

            ctx.fill();


        } else if (
            variant === 1
        ) {

            /*
                Middelste lichaamsbal.
            */

            ctx.beginPath();

            ctx.arc(
                x +
                    radius * 0.28,

                y -
                    radius * 0.06,

                radius * 0.07,

                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(255,255,255,0.82)";

            ctx.fill();


        } else {

            /*
                Hoofd:
                klein sneeuwaccent.
            */

            ctx.beginPath();

            ctx.arc(
                x -
                    radius * 0.34,

                y -
                    radius * 0.05,

                radius * 0.055,

                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(110,190,215,0.28)";

            ctx.fill();
        }


        ctx.restore();
    },


    drawButtons(
        ctx,
        x,
        y,
        radius
    ) {

        ctx.save();


        ctx.fillStyle =
            "#547580";


        const buttonRadius =
            Math.max(
                2.5,
                radius * 0.075
            );


        ctx.beginPath();

        ctx.arc(
            x,
            y -
                radius * 0.18,

            buttonRadius,

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x,
            y +
                radius * 0.12,

            buttonRadius,

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x,
            y +
                radius * 0.42,

            buttonRadius,

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();
    },


    drawArms(
        ctx,
        x,
        y,
        radius
    ) {

        ctx.save();


        ctx.strokeStyle =
            "#98c9d8";


        ctx.lineWidth =
            Math.max(
                3,
                radius * 0.09
            );


        ctx.lineCap =
            "round";


        /*
            Linkerarm.
        */

        ctx.beginPath();

        ctx.moveTo(
            x -
                radius * 0.56,

            y -
                radius * 0.05
        );


        ctx.lineTo(
            x -
                radius * 1.02,

            y -
                radius * 0.32
        );


        ctx.lineTo(
            x -
                radius * 1.18,

            y -
                radius * 0.16
        );


        ctx.stroke();


        /*
            Rechterarm.
        */

        ctx.beginPath();

        ctx.moveTo(
            x +
                radius * 0.56,

            y -
                radius * 0.05
        );


        ctx.lineTo(
            x +
                radius * 1.02,

            y -
                radius * 0.32
        );


        ctx.lineTo(
            x +
                radius * 1.18,

            y -
                radius * 0.16
        );


        ctx.stroke();


        ctx.restore();
    },


    drawPhaseFlash(
        enemy,
        ctx
    ) {

        if (
            enemy.phaseFlash <= 0
        ) {

            return;
        }


        const progress =
            1 -
            enemy.phaseFlash /
            0.65;


        ctx.save();


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,

            enemy.radius *
            (
                1.15 +
                progress *
                1.15
            ),

            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            `rgba(190,240,255,${
                1 - progress
            })`;


        ctx.lineWidth =
            6;


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


        /*
            ==================================
            FASE 1
            ==================================

                 HEAD
                  O

                BODY
                  O

             BIG BODY
                 OOO

            Grootste bal zit onderaan.
        */

        if (
            enemy.phase === 1
        ) {

            const bottomRadius =
                r * 0.72;


            const bodyRadius =
                r * 0.51;


            const headRadius =
                r * 0.37;


            const bottomX =
                enemy.x;


            const bottomY =
                enemy.y +
                r * 0.34;


            const bodyX =
                enemy.x;


            const bodyY =
                enemy.y -
                r * 0.37;


            const headX =
                enemy.x;


            const headY =
                enemy.y -
                r * 0.98;


            /*
                Grootste onderste bal.
            */

            this.drawSnowBall(
                ctx,
                image,

                bottomX,
                bottomY,

                bottomRadius,

                0
            );


            /*
                Middelste lichaamsdeel.
            */

            this.drawSnowBall(
                ctx,
                image,

                bodyX,
                bodyY,

                bodyRadius,

                1
            );


            /*
                Armen aan middelste bal.
            */

            this.drawArms(
                ctx,

                bodyX,
                bodyY,

                bodyRadius
            );


            /*
                Knoopjes.
            */

            this.drawButtons(
                ctx,

                bodyX,
                bodyY,

                bodyRadius
            );


            /*
                Hoofd.
            */

            this.drawSnowBall(
                ctx,
                image,

                headX,
                headY,

                headRadius,

                2
            );


            /*
                Alleen hoofd krijgt
                standaard boos gezicht.
            */

            api.drawEnemyFace({

                ...enemy,

                x:
                    headX,

                y:
                    headY,

                radius:
                    headRadius
            });


            this.drawPhaseFlash(
                enemy,
                ctx
            );


            return;
        }


        /*
            ==================================
            FASE 2
            ==================================

            Grootste onderste bal is weg.

                 HEAD
                  O

                BODY
                  O
        */

        if (
            enemy.phase === 2
        ) {

            const bodyRadius =
                r * 0.72;


            const headRadius =
                r * 0.49;


            const bodyX =
                enemy.x;


            const bodyY =
                enemy.y +
                r * 0.25;


            const headX =
                enemy.x;


            const headY =
                enemy.y -
                r * 0.63;


            /*
                Body.
            */

            this.drawSnowBall(
                ctx,
                image,

                bodyX,
                bodyY,

                bodyRadius,

                1
            );


            /*
                Armen.
            */

            this.drawArms(
                ctx,

                bodyX,
                bodyY,

                bodyRadius
            );


            /*
                Knoopjes.
            */

            this.drawButtons(
                ctx,

                bodyX,
                bodyY,

                bodyRadius
            );


            /*
                Hoofd.
            */

            this.drawSnowBall(
                ctx,
                image,

                headX,
                headY,

                headRadius,

                2
            );


            api.drawEnemyFace({

                ...enemy,

                x:
                    headX,

                y:
                    headY,

                radius:
                    headRadius
            });


            this.drawPhaseFlash(
                enemy,
                ctx
            );


            return;
        }


        /*
            ==================================
            FASE 3
            ==================================

            Alleen hoofd.

                  O

            GEEN ROTATIE.
        */

        this.drawSnowBall(
            ctx,
            image,

            enemy.x,
            enemy.y,

            r,

            2
        );


        /*
            Kleine attack-flash
            wanneer Snowball geschoten wordt.
        */

        if (
            enemy.shootFlash > 0
        ) {

            const alpha =
                Math.min(
                    1,
                    enemy.shootFlash /
                    0.18
                );


            ctx.save();


            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,

                r * 1.28,

                0,
                Math.PI * 2
            );


            ctx.strokeStyle =
                `rgba(220,250,255,${
                    alpha
                })`;


            ctx.lineWidth =
                5;


            ctx.stroke();


            ctx.restore();
        }


        /*
            Boos gezicht blijft op
            laatste hoofd.
        */

        api.drawEnemyFace({

            ...enemy,

            x:
                enemy.x,

            y:
                enemy.y,

            radius:
                r
        });


        this.drawPhaseFlash(
            enemy,
            ctx
        );
    }
};


export default snowMan;