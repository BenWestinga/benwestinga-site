const snowProtector = {

    id: "snow-protector",

    name: "Snow Protector",

    behavior:
        "protection-aura",

    hp: 28,

    size: 4,

    speed: "slow",

    tracking: 0.7,

    image:
        "snow.png",

    auraRadius:
        230,

    followDuration:
        5,

    straightDuration:
        10,


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

        enemy.baseProtectorSpeed =
            api.getEnemySpeed(
                this.speed
            );


        enemy.movementTimer =
            0;


        enemy.previousMode =
            "follow";


        enemy.auraAnimation =
            Math.random() *
            Math.PI *
            2;


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseProtectorSpeed *
            multiplier;


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    beforeUpdate(
        dt,
        api
    ) {

        const enemies =
            api.getEnemies();


        /*
            Eerst alle oude SnowProtector
            references opruimen.
        */

        for (
            const target
            of enemies
        ) {

            if (
                !(
                    target
                        ?.guardianShieldSources
                    instanceof Set
                )
            ) {

                continue;
            }


            for (
                const source
                of [
                    ...target
                        .guardianShieldSources
                ]
            ) {

                if (
                    source
                        ?.definition
                        ?.id ===
                    this.id
                ) {

                    target
                        .guardianShieldSources
                        .delete(
                            source
                        );
                }
            }
        }


        const protectors =
            enemies.filter(
                enemy =>
                    enemy &&
                    enemy.hp > 0 &&
                    enemy.definition
                        ?.id ===
                        this.id
            );


        for (
            const protector
            of protectors
        ) {

            for (
                const target
                of enemies
            ) {

                if (
                    !target ||
                    target ===
                        protector ||

                    target.hp <= 0 ||

                    target.definition
                        ?.id ===
                        this.id ||

                    target.definition
                        ?.id ===
                        "snowstorm"
                ) {

                    continue;
                }


                const distance =
                    Math.hypot(

                        target.x -
                            protector.x,

                        target.y -
                            protector.y
                    );


                if (
                    distance >
                    this.auraRadius +
                    target.radius
                ) {

                    continue;
                }


                if (
                    !(
                        target
                            .guardianShieldSources
                        instanceof Set
                    )
                ) {

                    target.guardianShieldSources =
                        new Set();
                }


                target
                    .guardianShieldSources
                    .add(
                        protector
                    );
            }
        }
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
            enemy.baseProtectorSpeed *
            multiplier;


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
            mode !==
            previousMode &&
            mode ===
            "straight"
        ) {

            api.aimVelocityAtPlayer(
                enemy
            );
        }


        if (
            mode ===
            "follow"
        ) {

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
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

            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }


        enemy.auraAnimation +=
            dt *
            2.4;
    },


    onDeath(
        enemy,
        api
    ) {

        for (
            const target
            of api.getEnemies()
        ) {

            target
                ?.guardianShieldSources
                ?.delete?.(
                    enemy
                );
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const pulse =
            1 +
            Math.sin(
                enemy.auraAnimation || 0
            ) *
            0.035;


        /*
            BESCHERMINGSRADIUS
        */

        ctx.save();


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            this.auraRadius *
                pulse,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(235,250,255,0.075)";

        ctx.fill();


        ctx.lineWidth =
            4;


        ctx.strokeStyle =
            "rgba(245,253,255,0.55)";

        ctx.stroke();


        ctx.restore();


        /*
            BODY
        */

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,

                color:
                    "#dff7ff",

                strokeStyle:
                    "#8ac9dc",

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
                enemy.radius * 0.88,
                0,
                Math.PI * 2
            );

            ctx.clip();


            ctx.globalAlpha =
                0.72;


            ctx.drawImage(
                image,

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius * 2,
                enemy.radius * 2
            );


            ctx.restore();
        }


        /*
            Protector armour.
        */

        const r =
            enemy.radius;


        ctx.save();


        ctx.strokeStyle =
            "#eefcff";


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.12
            );


        ctx.beginPath();


        ctx.arc(
            enemy.x,
            enemy.y +
                r * 0.12,

            r * 0.68,

            0.2,
            Math.PI - 0.2
        );


        ctx.stroke();


        ctx.restore();


        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowProtector;