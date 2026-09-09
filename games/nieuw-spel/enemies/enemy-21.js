function drawRockImage(
    enemy,
    ctx,
    api,
    rotation = 0,
    glow = false
) {

    const image =
        api.getAssetImage(
            "rock.png"
        );


    const r =
        enemy.radius;


    ctx.save();


    ctx.translate(
        enemy.x,
        enemy.y
    );


    ctx.rotate(
        rotation
    );


    if (
        glow
    ) {

        ctx.shadowBlur =
            14;

        ctx.shadowColor =
            "rgba(230,235,240,0.8)";
    }


    ctx.beginPath();

    ctx.arc(
        0,
        0,
        r,
        0,
        Math.PI * 2
    );

    ctx.clip();


    if (
        image &&
        image.complete &&
        image.naturalWidth > 0
    ) {

        ctx.drawImage(
            image,
            -r,
            -r,
            r * 2,
            r * 2
        );

    } else {

        /*
            Fallback als rock.png
            niet gevonden wordt.
        */

        ctx.fillStyle =
            "#777d83";

        ctx.fillRect(
            -r,
            -r,
            r * 2,
            r * 2
        );
    }


    ctx.restore();


    /*
        Lichte outline zodat hij
        zichtbaar blijft op mountain.png
    */

    ctx.beginPath();

    ctx.arc(
        enemy.x,
        enemy.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.lineWidth =
        3;

    ctx.strokeStyle =
        glow
            ? "#ffffff"
            : "#d0d5d9";

    ctx.stroke();
}


/* =====================================================
   STONE ROLLER
   ===================================================== */

const stoneRoller = {

    id:
        "stone-roller",

    name:
        "Stone Roller",

    behavior:
        "stone-roller",

    hp:
        9,

    size:
        4,

    shape:
        "circle",

    speed:
        "fast",

    tracking:
        0.65,

    color:
        "#747a80",


    /*
        Als speler binnen deze
        radius komt kan hij rollen.
    */

    triggerRadius:
        430,


    /*
        Eerst 0.5 sec stilstaan.
    */

    chargeDuration:
        0.5,


    /*
        Daarna snel rollen.
    */

    rollSpeed:
        520,


    /*
        Na muur-hit 15 seconden
        cooldown.
    */

    abilityCooldown:
        6,


    onSpawn(
        enemy,
        api
    ) {

        enemy.stoneRollerState = {

            mode:
                "normal",

            cooldown:
                0,

            chargeTimer:
                0,

            rollAngle:
                Math.random() *
                Math.PI *
                2,

            shakeTime:
                0
        };


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy.stoneRollerState;


        if (!state) {

            return;
        }


        state.cooldown =
            Math.max(
                0,
                state.cooldown - dt
            );


        state.shakeTime +=
            dt;


        /* =================================================
           NORMAAL LOPEN
           ================================================= */

        if (
            state.mode ===
            "normal"
        ) {

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );


            if (
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

                api.keepInsideArena(
                    enemy,
                    14,
                    false
                );
            }


            if (
                !enemy.enteredArena ||
                state.cooldown > 0
            ) {

                return;
            }


            const player =
                api.getPlayer();


            const dx =
                player.x -
                enemy.x;


            const dy =
                player.y -
                enemy.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                );


            /*
                Speler dichtbij genoeg:
                roll attack voorbereiden.
            */

            if (
                distance <=
                this.triggerRadius
            ) {

                state.mode =
                    "charging";

                state.chargeTimer =
                    0;

                enemy.vx =
                    0;

                enemy.vy =
                    0;
            }


            return;
        }


        /* =================================================
           CHARGE
           ================================================= */

        if (
            state.mode ===
            "charging"
        ) {

            enemy.vx =
                0;

            enemy.vy =
                0;


            state.chargeTimer +=
                dt;


            /*
                Rock begint zichtbaar
                steeds sneller te draaien.
            */

            state.rollAngle +=
                dt *
                15;


            if (
                state.chargeTimer >=
                this.chargeDuration
            ) {

                const player =
                    api.getPlayer();


                const dx =
                    player.x -
                    enemy.x;


                const dy =
                    player.y -
                    enemy.y;


                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                /*
                    Richting wordt hier
                    vastgezet.

                    Tijdens rollen trackt
                    hij niet meer.
                */

                enemy.vx =
                    (
                        dx /
                        distance
                    ) *
                    this.rollSpeed;


                enemy.vy =
                    (
                        dy /
                        distance
                    ) *
                    this.rollSpeed;


                state.mode =
                    "rolling";
            }


            return;
        }


        /* =================================================
           ROLLEN
           ================================================= */

        if (
            state.mode ===
            "rolling"
        ) {

            enemy.x +=
                enemy.vx *
                dt;


            enemy.y +=
                enemy.vy *
                dt;


            /*
                Rock PNG draait zichtbaar.
            */

            state.rollAngle +=
                (
                    this.rollSpeed /
                    Math.max(
                        1,
                        enemy.radius *
                        0.72
                    )
                ) *
                dt;


            const canvas =
                api.getCanvas();


            const margin =
                enemy.radius +
                14;


            let hitWall =
                false;


            /*
                LINKS
            */

            if (
                enemy.x <=
                margin
            ) {

                enemy.x =
                    margin;

                hitWall =
                    true;
            }


            /*
                RECHTS
            */

            if (
                enemy.x >=
                canvas.width -
                margin
            ) {

                enemy.x =
                    canvas.width -
                    margin;

                hitWall =
                    true;
            }


            /*
                BOVEN
            */

            if (
                enemy.y <=
                margin
            ) {

                enemy.y =
                    margin;

                hitWall =
                    true;
            }


            /*
                ONDER
            */

            if (
                enemy.y >=
                canvas.height -
                margin
            ) {

                enemy.y =
                    canvas.height -
                    margin;

                hitWall =
                    true;
            }


            /*
                Zodra hij een muur raakt:

                - roll stopt meteen
                - normaal lopen
                - 15 sec cooldown
            */

            if (
                hitWall
            ) {

                state.mode =
                    "normal";


                state.cooldown =
                    this.abilityCooldown;


                enemy.vx =
                    0;

                enemy.vy =
                    0;


                api.aimVelocityAtPlayer(
                    enemy
                );
            }
        }
    },


    /* =================================================
       DRAW
       ================================================= */

    draw(
        enemy,
        ctx,
        api
    ) {

        const state =
            enemy.stoneRollerState ||
            {};


        const charging =
            state.mode ===
            "charging";


        const rolling =
            state.mode ===
            "rolling";


        /*
            Tijdens charge trilt hij.
        */

        if (
            charging
        ) {

            const originalX =
                enemy.x;


            const originalY =
                enemy.y;


            enemy.x +=
                Math.sin(
                    state.shakeTime *
                    38
                ) *
                3;


            enemy.y +=
                Math.cos(
                    state.shakeTime *
                    31
                ) *
                3;


            drawRockImage(
                enemy,
                ctx,
                api,
                state.rollAngle || 0,
                true
            );


            /*
                GEZICHT

                Het gezicht draait niet
                mee met de PNG zodat je
                het duidelijk kunt zien.
            */

            api.drawEnemyFace(
                enemy
            );


            enemy.x =
                originalX;


            enemy.y =
                originalY;


            return;
        }


        /*
            Normale rock.
        */

        drawRockImage(
            enemy,
            ctx,
            api,
            state.rollAngle || 0,
            rolling
        );


        /*
            ALTIJD een gezicht.

            Dus ook tijdens de roll.
        */

        api.drawEnemyFace(
            enemy
        );
    }
};


export default stoneRoller;