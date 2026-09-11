const snowHealer = {

    id: "snow-healer",

    name: "Snow Healer",

    behavior:
        "snow-healer",

    hp: 15,

    size: 4,

    speed: "slow",

    tracking: 0.7,

    image: "snow.png",

    /*
        Heal gebied.
    */

    healRadius: 230,

    healAmount: 1,

    healInterval: 1,

    /*
        Zelfde beweging
        als SnowProtector.
    */

    followDuration: 5,

    straightDuration: 10,


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


    onSpawn(
        enemy,
        api
    ) {
        enemy.baseHealerSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.movementTimer =
            0;

        enemy.healTimer =
            this.healInterval;

        enemy.healPulse =
            0;

        enemy.healSpin =
            Math.random() *
            Math.PI *
            2;

        enemy.visualTime =
            0;

        const multiplier =
            window.IceWorldEffects
                ?.active
                ? 1.5
                : 1;

        enemy.speed =
            enemy.baseHealerSpeed *
            multiplier;

        api.aimVelocityAtPlayer(
            enemy
        );
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
            enemy.baseHealerSpeed *
            multiplier;

        /*
            =================================
            MOVEMENT
            =================================
        */

        const cycle =
            this.followDuration +
            this.straightDuration;

        const previousMode =
            enemy.movementTimer <
            this.followDuration
                ? "follow"
                : "straight";

        enemy.movementTimer +=
            dt;

        if (
            enemy.movementTimer >=
            cycle
        ) {
            enemy.movementTimer %=
                cycle;
        }

        const mode =
            enemy.movementTimer <
            this.followDuration
                ? "follow"
                : "straight";

        if (
            mode !== previousMode &&
            mode === "straight"
        ) {
            api.aimVelocityAtPlayer(
                enemy
            );
        }

        if (
            mode === "follow"
        ) {
            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );
        }

        else {
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

        /*
            Arena.
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
            =================================
            HEAL
            =================================
        */

        enemy.healTimer -=
            dt;

        enemy.healSpin +=
            dt * 0.78;

        enemy.visualTime +=
            dt;

        if (
            enemy.healTimer <= 0
        ) {
            enemy.healTimer +=
                this.healInterval;

            let healedSomething =
                false;

            for (
                const target
                of api.getEnemies()
            ) {
                if (
                    !target ||
                    target ===
                        enemy ||
                    target.hp <= 0 ||
                    target.definition
                        ?.id ===
                        "snowstorm"
                ) {
                    continue;
                }

                const distance =
                    Math.hypot(
                        target.x -
                            enemy.x,

                        target.y -
                            enemy.y
                    );

                if (
                    distance >
                    this.healRadius +
                        target.radius
                ) {
                    continue;
                }

                if (
                    target.hp <
                    target.maxHp
                ) {
                    target.hp =
                        Math.min(
                            target.maxHp,

                            target.hp +
                            this.healAmount
                        );

                    healedSomething =
                        true;
                }
            }

            /*
                Alleen pulse als
                echt iemand geheald werd.
            */

            if (
                healedSomething
            ) {
                enemy.healPulse =
                    0.65;
            }
        }

        if (
            enemy.healPulse > 0
        ) {
            enemy.healPulse -=
                dt;
        }
    },


    /*
        ======================================
        PLUS ICON
        ======================================
    */

    drawPlus(
        ctx,
        x,
        y,
        size,
        alpha = 1
    ) {
        ctx.save();

        ctx.fillStyle =
            `rgba(225,255,240,${
                0.94 * alpha
            })`;

        /*
            Vertical.
        */

        ctx.fillRect(
            x -
                size * 0.14,

            y -
                size * 0.50,

            size * 0.28,

            size
        );

        /*
            Horizontal.
        */

        ctx.fillRect(
            x -
                size * 0.50,

            y -
                size * 0.14,

            size,

            size * 0.28
        );

        ctx.strokeStyle =
            `rgba(75,195,145,${
                0.92 * alpha
            })`;

        ctx.lineWidth =
            Math.max(
                1.5,
                size * 0.07
            );

        ctx.strokeRect(
            x -
                size * 0.14,

            y -
                size * 0.50,

            size * 0.28,

            size
        );

        ctx.strokeRect(
            x -
                size * 0.50,

            y -
                size * 0.14,

            size,

            size * 0.28
        );

        ctx.restore();
    },


    draw(
        enemy,
        ctx,
        api
    ) {
        const r =
            enemy.radius;

        const pulse =
            1 +
            Math.sin(
                enemy.visualTime *
                2.4
            ) *
            0.025;

        const auraRadius =
            this.healRadius *
            pulse;

        /*
            ==================================
            HEAL AURA
            ==================================
        */

        ctx.save();

        const auraGradient =
            ctx.createRadialGradient(
                enemy.x,
                enemy.y,
                r,

                enemy.x,
                enemy.y,
                auraRadius
            );

        auraGradient.addColorStop(
            0,
            "rgba(185,255,225,0.08)"
        );

        auraGradient.addColorStop(
            0.7,
            "rgba(175,245,215,0.05)"
        );

        auraGradient.addColorStop(
            1,
            "rgba(205,255,235,0.13)"
        );

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            auraRadius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            auraGradient;

        ctx.fill();

        ctx.strokeStyle =
            "rgba(205,255,230,0.42)";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            ==================================
            PLUS ICONS RONDOM AURA
            ==================================

            8 in plaats van heel veel:
            duidelijk maar niet laggy.
        */

        const plusCount =
            8;

        for (
            let i = 0;
            i < plusCount;
            i++
        ) {
            const angle =
                enemy.healSpin +
                i /
                plusCount *
                Math.PI *
                2;

            const x =
                enemy.x +
                Math.cos(
                    angle
                ) *
                (
                    auraRadius -
                    10
                );

            const y =
                enemy.y +
                Math.sin(
                    angle
                ) *
                (
                    auraRadius -
                    10
                );

            const size =
                14 +
                Math.sin(
                    enemy.visualTime *
                    2 +
                    i
                ) *
                1.7;

            this.drawPlus(
                ctx,
                x,
                y,
                size,
                0.95
            );
        }

        ctx.restore();

        /*
            ==================================
            BODY
            ==================================
        */

        api.drawDefaultEnemy(
            enemy,

            {
                face: false,

                color:
                    "#eefcf8",

                strokeStyle:
                    "#79cbb0",

                lineWidth:
                    4
            }
        );

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

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                r * 0.87,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.43;

            ctx.drawImage(
                image,
                enemy.x - r,
                enemy.y - r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        ctx.save();

        /*
            ==================================
            HEALER CAP
            ==================================
        */

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y -
                r * 0.47,

            r * 0.40,

            Math.PI,
            Math.PI * 2
        );

        ctx.lineTo(
            enemy.x +
                r * 0.42,

            enemy.y -
                r * 0.40
        );

        ctx.lineTo(
            enemy.x -
                r * 0.42,

            enemy.y -
                r * 0.40
        );

        ctx.closePath();

        ctx.fillStyle =
            "#f2fffb";

        ctx.fill();

        ctx.strokeStyle =
            "#83cdb7";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            Plus op muts.
        */

        this.drawPlus(
            ctx,

            enemy.x,

            enemy.y -
                r * 0.58,

            r * 0.28,

            1
        );

        /*
            ==================================
            HEALER COAT
            ==================================
        */

        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.55,

            enemy.y +
                r * 0.06
        );

        ctx.lineTo(
            enemy.x -
                r * 0.45,

            enemy.y +
                r * 0.78
        );

        ctx.lineTo(
            enemy.x,

            enemy.y +
                r * 0.92
        );

        ctx.lineTo(
            enemy.x +
                r * 0.45,

            enemy.y +
                r * 0.78
        );

        ctx.lineTo(
            enemy.x +
                r * 0.55,

            enemy.y +
                r * 0.06
        );

        ctx.closePath();

        const coatGradient =
            ctx.createLinearGradient(
                enemy.x,
                enemy.y,

                enemy.x,
                enemy.y + r
            );

        coatGradient.addColorStop(
            0,
            "#f4fff9"
        );

        coatGradient.addColorStop(
            1,
            "#c9f1e1"
        );

        ctx.fillStyle =
            coatGradient;

        ctx.fill();

        ctx.strokeStyle =
            "#73bea4";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            Grote heal + op pak.
        */

        this.drawPlus(
            ctx,

            enemy.x,

            enemy.y +
                r * 0.40,

            r * 0.56,

            1
        );

        /*
            ==================================
            HEAL ANIMATION
            ==================================
        */

        if (
            enemy.healPulse > 0
        ) {
            const progress =
                1 -
                enemy.healPulse /
                0.65;

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,

                r *
                (
                    1 +
                    progress *
                    1.9
                ),

                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                `rgba(145,255,205,${
                    1 - progress
                })`;

            ctx.lineWidth =
                5;

            ctx.stroke();
        }

        ctx.restore();

        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowHealer;