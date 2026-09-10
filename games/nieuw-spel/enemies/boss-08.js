import iceTank35
from "./boss-07.js";


function pointSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {

    const dx =
        x2 - x1;


    const dy =
        y2 - y1;


    const lengthSquared =
        dx * dx +
        dy * dy;


    if (
        lengthSquared === 0
    ) {

        return Math.hypot(
            px - x1,
            py - y1
        );
    }


    let t =
        (
            (
                px - x1
            ) *
            dx +
            (
                py - y1
            ) *
            dy
        ) /
        lengthSquared;


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const x =
        x1 +
        dx *
        t;


    const y =
        y1 +
        dy *
        t;


    return Math.hypot(
        px - x,
        py - y
    );
}


const iceTank40 = {

    ...iceTank35,


    id:
        "ice-tank-level-40",

    name:
        "Ice Tank MK II",

    hp:
        600,

    size:
        9,


    landingWarningDuration:
        1,


    spinnerInitialDelay:
        10,

    spinnerDuration:
        20,

    spinnerCooldown:
        25,

    spinnerSpeed:
        1.8,

    spinnerLength:
        230,

    spinnerWidth:
        13,


    reset() {

        iceTank35
            .reset
            ?.call(
                this
            );
    },


    onPlayerDeath() {

        iceTank35
            .onPlayerDeath
            ?.call(
                this
            );
    },


    onLevelWin() {

        iceTank35
            .onLevelWin
            ?.call(
                this
            );
    },


    onSpawn(
        enemy,
        api
    ) {

        iceTank35
            .onSpawn
            .call(
                this,
                enemy,
                api
            );


        const player =
            api.getPlayer();


        /*
            Boss 40 landt op de plek
            waar speler stond op spawn.
        */

        enemy.landing =
            true;


        enemy.landingTimer =
            this
                .landingWarningDuration;


        enemy.landingMax =
            this
                .landingWarningDuration;


        enemy.landingTargetX =
            player.x;


        enemy.landingTargetY =
            player.y;


        enemy.landingStartY =
            -enemy.radius *
            4;


        enemy.x =
            enemy.landingTargetX;


        enemy.y =
            enemy.landingStartY;


        enemy.vx =
            0;


        enemy.vy =
            0;


        enemy.collidesWithPlayer =
            false;


        enemy.spinnerRemaining =
            0;


        enemy.spinnerCooldownTimer =
            this.spinnerInitialDelay;


        enemy.spinnerAngle =
            0;
    },


    beforeUpdate(
        dt,
        api
    ) {

        /*
            Oude IceTank ijspegels blijven
            volledig werken.
        */

        iceTank35
            .beforeUpdate
            .call(
                this,
                dt,
                api
            );
    },


    startSpinner(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        /*
            Start aan tegenovergestelde
            kant van speler.
        */

        enemy.spinnerAngle =

            Math.atan2(

                player.y -
                    enemy.y,

                player.x -
                    enemy.x

            ) +

            Math.PI;


        enemy.spinnerRemaining =
            this.spinnerDuration;
    },


    updateSpinner(
        enemy,
        dt,
        api
    ) {

        if (
            enemy.spinnerRemaining >
            0
        ) {

            enemy.spinnerRemaining -=
                dt;


            enemy.spinnerAngle +=
                this.spinnerSpeed *
                dt;


            const innerRadius =
                enemy.radius *
                1.05;


            const outerRadius =
                innerRadius +
                this.spinnerLength;


            const cos =
                Math.cos(
                    enemy.spinnerAngle
                );


            const sin =
                Math.sin(
                    enemy.spinnerAngle
                );


            const x1 =
                enemy.x +
                cos *
                innerRadius;


            const y1 =
                enemy.y +
                sin *
                innerRadius;


            const x2 =
                enemy.x +
                cos *
                outerRadius;


            const y2 =
                enemy.y +
                sin *
                outerRadius;


            const player =
                api.getPlayer();


            const distance =
                pointSegmentDistance(

                    player.x,
                    player.y,

                    x1,
                    y1,
                    x2,
                    y2
                );


            if (
                distance <=

                player.radius +
                this.spinnerWidth /
                2
            ) {

                api.killPlayer();

                return;
            }


            if (
                enemy.spinnerRemaining <=
                0
            ) {

                enemy.spinnerRemaining =
                    0;


                enemy.spinnerCooldownTimer =
                    this.spinnerCooldown;
            }


            return;
        }


        enemy.spinnerCooldownTimer -=
            dt;


        if (
            enemy.spinnerCooldownTimer <=
            0
        ) {

            this.startSpinner(
                enemy,
                api
            );
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        /*
            ===================================
            LANDING
            ===================================
        */

        if (
            enemy.landing
        ) {

            enemy.landingTimer -=
                dt;


            const progress =
                Math.min(
                    1,

                    1 -
                    enemy.landingTimer /
                    enemy.landingMax
                );


            /*
                Sneller vallen richting einde.
            */

            const eased =
                progress *
                progress;


            enemy.x =
                enemy.landingTargetX;


            enemy.y =
                enemy.landingStartY +
                (
                    enemy.landingTargetY -
                    enemy.landingStartY
                ) *
                eased;


            if (
                enemy.landingTimer <=
                0
            ) {

                enemy.landing =
                    false;


                enemy.x =
                    enemy.landingTargetX;


                enemy.y =
                    enemy.landingTargetY;


                enemy.collidesWithPlayer =
                    true;


                enemy.enteredArena =
                    true;
            }


            return;
        }


        /*
            Alle Boss 35 mechanics.
        */

        iceTank35
            .update
            .call(
                this,
                enemy,
                dt,
                api
            );


        /*
            Extra Boss 40 attack.
        */

        this.updateSpinner(
            enemy,
            dt,
            api
        );
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        /*
            LANDING WARNING.
        */

        if (
            enemy.landing
        ) {

            const progress =
                1 -
                enemy.landingTimer /
                enemy.landingMax;


            ctx.save();


            ctx.beginPath();

            ctx.arc(
                enemy.landingTargetX,
                enemy.landingTargetY,

                enemy.radius *
                (
                    1.15 -
                    progress *
                    0.25
                ),

                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(120,220,255,0.13)";

            ctx.fill();


            ctx.strokeStyle =
                `rgba(220,250,255,${
                    0.45 +
                    progress *
                    0.55
                })`;


            ctx.lineWidth =
                6;


            ctx.stroke();


            /*
                Kruis in landingplek.
            */

            ctx.beginPath();


            ctx.moveTo(
                enemy.landingTargetX -
                    25,

                enemy.landingTargetY
            );


            ctx.lineTo(
                enemy.landingTargetX +
                    25,

                enemy.landingTargetY
            );


            ctx.moveTo(
                enemy.landingTargetX,

                enemy.landingTargetY -
                    25
            );


            ctx.lineTo(
                enemy.landingTargetX,

                enemy.landingTargetY +
                    25
            );


            ctx.stroke();


            ctx.restore();
        }


        /*
            Normale Ice Tank tekenen.
        */

        iceTank35
            .draw
            .call(
                this,
                enemy,
                ctx,
                api
            );


        /*
            DRAAIENDE IJSSTOK.
        */

        if (
            enemy.spinnerRemaining >
            0 &&
            !enemy.landing
        ) {

            const innerRadius =
                enemy.radius *
                1.05;


            const cos =
                Math.cos(
                    enemy.spinnerAngle
                );


            const sin =
                Math.sin(
                    enemy.spinnerAngle
                );


            const x1 =
                enemy.x +
                cos *
                innerRadius;


            const y1 =
                enemy.y +
                sin *
                innerRadius;


            const x2 =
                enemy.x +
                cos *
                (
                    innerRadius +
                    this.spinnerLength
                );


            const y2 =
                enemy.y +
                sin *
                (
                    innerRadius +
                    this.spinnerLength
                );


            ctx.save();


            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );


            ctx.strokeStyle =
                "#a9edff";


            ctx.lineWidth =
                this.spinnerWidth;


            ctx.lineCap =
                "round";


            ctx.shadowBlur =
                15;


            ctx.shadowColor =
                "#61d7ff";


            ctx.stroke();


            /*
                Witte kern.
            */

            ctx.beginPath();

            ctx.moveTo(
                x1,
                y1
            );

            ctx.lineTo(
                x2,
                y2
            );


            ctx.strokeStyle =
                "rgba(245,253,255,0.85)";


            ctx.lineWidth =
                4;


            ctx.stroke();


            ctx.restore();
        }
    }
};


export default iceTank40;