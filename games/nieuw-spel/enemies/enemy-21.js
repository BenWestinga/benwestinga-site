function drawStoneImage(
    enemy,
    ctx,
    api,
    rotation = 0,
    glow = false
) {

    const image =
        api.getAssetImage(
            "stone.png"
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
            18;


        ctx.shadowColor =
            "rgba(215,220,225,0.80)";
    }


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

            r *
                2,

            r *
                2
        );

    } else {

        ctx.fillStyle =
            "#747a80";


        ctx.fillRect(

            -r,
            -r,

            r *
                2,

            r *
                2
        );
    }


    ctx.restore();


    /*
        Lichte outline zodat
        stone zichtbaar blijft.
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

        glow

            ? "#ffffff"

            : "#d0d5d9";


    ctx.stroke();


    ctx.restore();
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
        Ability.
    */

    triggerRadius:
        430,

    chargeDuration:
        0.5,

    rollSpeed:
        520,

    abilityCooldown:
        15,


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

                state.cooldown -
                    dt
            );


        state.shakeTime +=
            dt;


        /* =========================================
           NORMAAL
           ========================================= */

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
                state.cooldown >
                    0
            ) {

                return;
            }


            const player =
                api.getPlayer();


            const distance =
                Math.hypot(

                    player.x -
                        enemy.x,

                    player.y -
                        enemy.y
                );


            /*
                Speler komt dichtbij:
                ability starten.
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


        /* =========================================
           0.5 SEC CHARGEN
           ========================================= */

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
                Stone begint al hard
                rond te draaien.
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
                    Snapshot player direction.
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


        /* =========================================
           ROLL ATTACK
           ========================================= */

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
                PNG rolt echt.
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


            if (
                enemy.x <=
                margin
            ) {

                enemy.x =
                    margin;


                hitWall =
                    true;
            }


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


            if (
                enemy.y <=
                margin
            ) {

                enemy.y =
                    margin;


                hitWall =
                    true;
            }


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
                Muur geraakt:
                direct weer normaal lopen.

                Geen stop.
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
            Tijdens charge:
            zichtbaar trillen.
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


            drawStoneImage(

                enemy,

                ctx,

                api,

                state.rollAngle ||
                    0,

                true
            );


            enemy.x =
                originalX;


            enemy.y =
                originalY;


            return;
        }


        drawStoneImage(

            enemy,

            ctx,

            api,

            state.rollAngle ||
                0,

            rolling
        );


        /*
            Alleen face tijdens
            normaal lopen.

            Tijdens rollen draait
            alles mee.
        */

        if (
            !rolling
        ) {

            api.drawEnemyFace(
                enemy
            );
        }
    }
};


export default stoneRoller;