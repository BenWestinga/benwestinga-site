const icicles =
    [];


function stormDamage(
    damage
) {

    return (
        window.IceWorldEffects
            ?.active
    )
        ? damage * 0.5
        : damage;
}


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


    const closestX =
        x1 +
        dx *
        t;


    const closestY =
        y1 +
        dy *
        t;


    return Math.hypot(
        px - closestX,
        py - closestY
    );
}


const iceTank = {

    id:
        "ice-tank",

    name:
        "Ice Tank",

    behavior:
        "ice-tank-boss",

    boss:
        true,

    hp:
        500,

    size:
        8,

    speed:
        "medium",

    tracking:
        0.32,

    image:
        "ice.png",

    alwaysShowHealthBar:
        true,

    hideLevelTitleWhenActive:
        true,

    icicleCooldown:
        3,

    icicleTravelDuration:
        0.72,

    icicleLifetime:
        20,

    snowstormCooldown:
        45,


    reset() {

        icicles.length =
            0;
    },


    onPlayerDeath() {

        icicles.length =
            0;
    },


    onLevelWin() {

        icicles.length =
            0;
    },


    modifyDamage(
        enemy,
        damage
    ) {

        return stormDamage(
            damage
        );
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.baseTankSpeed =
            api.getEnemySpeed(
                this.speed
            );


        enemy.icicleTimer =
            this.icicleCooldown;


        enemy.stormTimer =
            this.snowstormCooldown;


        enemy.treadAnimation =
            0;


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseTankSpeed *
            multiplier;


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    fireIcicle(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        const targetX =
            player.x;


        const targetY =
            player.y;


        const angle =
            Math.atan2(

                targetY -
                    enemy.y,

                targetX -
                    enemy.x
            );


        icicles.push({

            startX:
                enemy.x,

            startY:
                enemy.y,

            x:
                enemy.x,

            y:
                enemy.y,

            targetX,

            targetY,

            angle,

            flying:
                true,

            travelRemaining:
                this.icicleTravelDuration,

            travelDuration:
                this.icicleTravelDuration,

            lifeRemaining:
                this.icicleLifetime,

            length:
                82,

            width:
                15
        });
    },


    beforeUpdate(
        dt,
        api
    ) {

        const player =
            api.getPlayer();


        for (
            let i =
                icicles.length - 1;

            i >= 0;

            i--
        ) {

            const icicle =
                icicles[i];


            if (
                icicle.flying
            ) {

                icicle.travelRemaining -=
                    dt;


                const progress =
                    Math.min(
                        1,

                        1 -
                        icicle
                            .travelRemaining /
                        icicle
                            .travelDuration
                    );


                icicle.x =
                    icicle.startX +
                    (
                        icicle.targetX -
                        icicle.startX
                    ) *
                    progress;


                icicle.y =
                    icicle.startY +
                    (
                        icicle.targetY -
                        icicle.startY
                    ) *
                    progress;


                /*
                    Vliegende ijspegel kan
                    speler ook raken.
                */

                if (
                    Math.hypot(

                        player.x -
                            icicle.x,

                        player.y -
                            icicle.y

                    ) <=

                    player.radius +
                    13
                ) {

                    api.killPlayer();

                    return;
                }


                if (
                    icicle.travelRemaining <=
                    0
                ) {

                    icicle.flying =
                        false;


                    icicle.x =
                        icicle.targetX;


                    icicle.y =
                        icicle.targetY;
                }


                continue;
            }


            icicle.lifeRemaining -=
                dt;


            if (
                icicle.lifeRemaining <=
                0
            ) {

                icicles.splice(
                    i,
                    1
                );

                continue;
            }


            /*
                Stilstaande ijspegel:
                klein lijnsegment als hazard.
            */

            const half =
                icicle.length /
                2;


            const x1 =
                icicle.x -
                Math.cos(
                    icicle.angle
                ) *
                half;


            const y1 =
                icicle.y -
                Math.sin(
                    icicle.angle
                ) *
                half;


            const x2 =
                icicle.x +
                Math.cos(
                    icicle.angle
                ) *
                half;


            const y2 =
                icicle.y +
                Math.sin(
                    icicle.angle
                ) *
                half;


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
                icicle.width /
                2
            ) {

                api.killPlayer();

                return;
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
            enemy.baseTankSpeed *
            multiplier;


        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );


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


        enemy.treadAnimation +=
            enemy.speed *
            dt *
            0.05;


        if (
            !enemy.enteredArena
        ) {

            return;
        }


        /*
            ICE PEGEL:
            iedere 3 seconden.
        */

        enemy.icicleTimer -=
            dt;


        if (
            enemy.icicleTimer <= 0
        ) {

            enemy.icicleTimer +=
                this.icicleCooldown;


            this.fireIcicle(
                enemy,
                api
            );
        }


        /*
            SNOWSTORM:

            Timer telt alleen wanneer
            GEEN SnowStorm actief is.

            Na einde storm begint dus
            opnieuw volledige 45 sec.
        */

        if (
            window.IceWorldEffects
                ?.active
        ) {

            return;
        }


        enemy.stormTimer -=
            dt;


        if (
            enemy.stormTimer <= 0
        ) {

            enemy.stormTimer =
                this.snowstormCooldown;


            api.spawnEnemyAt(
                "snowstorm",
                -10000,
                -10000
            );
        }
    },


    drawGlobal(
        ctx
    ) {

        for (
            const icicle
            of icicles
        ) {

            ctx.save();


            ctx.translate(
                icicle.x,
                icicle.y
            );


            ctx.rotate(
                icicle.angle
            );


            if (
                icicle.flying
            ) {

                ctx.shadowBlur =
                    14;


                ctx.shadowColor =
                    "#8eeaff";
            }


            const half =
                icicle.length /
                2;


            ctx.beginPath();


            ctx.moveTo(
                -half,
                -icicle.width *
                    0.35
            );


            ctx.lineTo(
                half,
                0
            );


            ctx.lineTo(
                -half,
                icicle.width *
                    0.35
            );


            ctx.closePath();


            ctx.fillStyle =
                icicle.flying

                    ? "#bff5ff"
                    : "#88d5ea";


            ctx.fill();


            ctx.strokeStyle =
                "#effdff";


            ctx.lineWidth =
                2;


            ctx.stroke();


            ctx.restore();
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const r =
            enemy.radius;


        const player =
            api.getPlayer();


        const angle =
            Math.atan2(

                player.y -
                    enemy.y,

                player.x -
                    enemy.x
            );


        ctx.save();


        /*
            TRACKS
        */

        ctx.fillStyle =
            "#315967";


        ctx.fillRect(
            enemy.x -
                r * 0.95,

            enemy.y -
                r * 0.72,

            r * 1.9,

            r * 0.36
        );


        ctx.fillRect(
            enemy.x -
                r * 0.95,

            enemy.y +
                r * 0.36,

            r * 1.9,

            r * 0.36
        );


        /*
            Bewegende tread streepjes.
        */

        const offset =
            (
                enemy.treadAnimation ||
                0
            ) %
            16;


        ctx.strokeStyle =
            "#8ac6d6";


        ctx.lineWidth =
            3;


        for (
            let x =
                -r +
                offset;

            x < r;

            x += 16
        ) {

            ctx.beginPath();

            ctx.moveTo(
                enemy.x + x,
                enemy.y -
                    r * 0.71
            );

            ctx.lineTo(
                enemy.x + x,
                enemy.y -
                    r * 0.39
            );

            ctx.stroke();


            ctx.beginPath();

            ctx.moveTo(
                enemy.x + x,
                enemy.y +
                    r * 0.39
            );

            ctx.lineTo(
                enemy.x + x,
                enemy.y +
                    r * 0.71
            );

            ctx.stroke();
        }


        /*
            TANK BODY
        */

        ctx.beginPath();

        ctx.roundRect(
            enemy.x -
                r * 0.72,

            enemy.y -
                r * 0.62,

            r * 1.44,

            r * 1.24,

            r * 0.22
        );


        ctx.fillStyle =
            "#78bed2";


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
                0.55;


            ctx.drawImage(
                image,

                enemy.x - r,
                enemy.y - r,

                r * 2,
                r * 2
            );


            ctx.restore();
        }


        ctx.strokeStyle =
            "#dffaff";


        ctx.lineWidth =
            5;


        ctx.stroke();


        /*
            TURRET + GUN
        */

        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            angle
        );


        ctx.fillStyle =
            "#aee6f5";


        ctx.fillRect(
            0,
            -r * 0.14,

            r * 1.30,

            r * 0.28
        );


        ctx.strokeStyle =
            "#4b899e";


        ctx.lineWidth =
            4;


        ctx.strokeRect(
            0,
            -r * 0.14,

            r * 1.30,

            r * 0.28
        );


        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r * 0.48,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#8ed5e7";

        ctx.fill();

        ctx.stroke();


        ctx.restore();


        /*
            Standaard boze gezicht.
        */

        api.drawEnemyFace({
            ...enemy,

            radius:
                r * 0.42
        });
    }
};


export default iceTank;