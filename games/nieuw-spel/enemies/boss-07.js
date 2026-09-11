const icicles =
    [];


const iceBalls =
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


function stormSpeedMultiplier() {

    if (
        !window.IceWorldEffects
            ?.active
    ) {

        return 1;
    }


    const multiplier =
        Number(
            window.IceWorldEffects
                ?.speedMultiplier
        );


    return Number.isFinite(
        multiplier
    )
        ? multiplier
        : 1.2;
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

    hideWorldHealthBar:
        true,

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


    /*
        ==========================================
        LARGE SPLITTING ICE BALL
        ==========================================

        Every 30 seconds the Ice Tank fires
        one large rotating ice ball directly
        toward the player's current position.

        Every wall hit:
        - the current ball splits into 2
        - both new pieces are smaller
        - both new pieces are faster
        - both pieces keep bouncing
        - both can split again

        This happens for 5 split generations.
        After generation 5 the final pieces
        keep bouncing without splitting again.
    */

    iceBallCooldown:
        30,

    iceBallRadius:
        38,

    iceBallSpeed:
        270,

    iceBallMaxSplits:
        5,

    iceBallSizeMultiplier:
        0.72,

    iceBallSpeedMultiplier:
        1.22,

    iceBallSplitAngle:
        0.36,


    reset() {

        icicles.length =
            0;


        iceBalls.length =
            0;
    },


    onPlayerDeath() {

        icicles.length =
            0;


        iceBalls.length =
            0;
    },


    onLevelWin() {

        icicles.length =
            0;


        iceBalls.length =
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


        enemy.iceBallTimer =
            this.iceBallCooldown;


        enemy.treadAnimation =
            0;


        const multiplier =
            stormSpeedMultiplier();


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


    fireIceBall(
        enemy,
        api
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


        const angle =
            Math.atan2(
                dy,
                dx
            );


        const radius =
            this.iceBallRadius;


        const spawnDistance =
            enemy.radius +
            radius +
            10;


        iceBalls.push({

            x:
                enemy.x +
                Math.cos(
                    angle
                ) *
                spawnDistance,

            y:
                enemy.y +
                Math.sin(
                    angle
                ) *
                spawnDistance,

            vx:
                dx /
                distance *
                this.iceBallSpeed,

            vy:
                dy /
                distance *
                this.iceBallSpeed,

            radius,

            generation:
                0,

            rotation:
                0,

            rotationSpeed:
                3.8
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


        /*
            ==========================================
            LARGE ICE BALL PROJECTILES
            ==========================================
        */

        const canvas =
            api.getCanvas();


        for (
            let i =
                iceBalls.length -
                1;

            i >= 0;

            i--
        ) {

            const ball =
                iceBalls[i];


            ball.x +=
                ball.vx *
                dt;


            ball.y +=
                ball.vy *
                dt;


            ball.rotation +=
                ball.rotationSpeed *
                dt;


            if (
                Math.hypot(
                    player.x -
                        ball.x,

                    player.y -
                        ball.y
                ) <=

                player.radius +
                ball.radius
            ) {

                api.killPlayer();

                return;
            }


            const margin =
                ball.radius +
                14;


            let hitVerticalWall =
                false;


            let hitHorizontalWall =
                false;


            if (
                ball.x <=
                margin
            ) {

                ball.x =
                    margin;


                hitVerticalWall =
                    true;
            } else if (
                ball.x >=
                canvas.width -
                    margin
            ) {

                ball.x =
                    canvas.width -
                    margin;


                hitVerticalWall =
                    true;
            }


            if (
                ball.y <=
                margin
            ) {

                ball.y =
                    margin;


                hitHorizontalWall =
                    true;
            } else if (
                ball.y >=
                canvas.height -
                    margin
            ) {

                ball.y =
                    canvas.height -
                    margin;


                hitHorizontalWall =
                    true;
            }


            if (
                !hitVerticalWall &&
                !hitHorizontalWall
            ) {

                continue;
            }


            let reflectedVx =
                ball.vx;


            let reflectedVy =
                ball.vy;


            if (
                hitVerticalWall
            ) {

                reflectedVx =
                    -reflectedVx;
            }


            if (
                hitHorizontalWall
            ) {

                reflectedVy =
                    -reflectedVy;
            }


            /*
                Final generation:
                keep bouncing forever,
                but do not split anymore.
            */

            if (
                ball.generation >=
                this.iceBallMaxSplits
            ) {

                ball.vx =
                    reflectedVx;


                ball.vy =
                    reflectedVy;


                continue;
            }


            const currentSpeed =
                Math.hypot(
                    reflectedVx,
                    reflectedVy
                );


            const newSpeed =
                currentSpeed *
                this.iceBallSpeedMultiplier;


            const newRadius =
                Math.max(
                    6,

                    ball.radius *
                    this.iceBallSizeMultiplier
                );


            const baseAngle =
                Math.atan2(
                    reflectedVy,
                    reflectedVx
                );


            iceBalls.splice(
                i,
                1
            );


            for (
                const side
                of [
                    -1,
                    1
                ]
            ) {

                const angle =
                    baseAngle +
                    side *
                    this.iceBallSplitAngle;


                iceBalls.push({

                    x:
                        Math.max(
                            newRadius +
                                16,

                            Math.min(
                                canvas.width -
                                    newRadius -
                                    16,

                                ball.x
                            )
                        ),

                    y:
                        Math.max(
                            newRadius +
                                16,

                            Math.min(
                                canvas.height -
                                    newRadius -
                                    16,

                                ball.y
                            )
                        ),

                    vx:
                        Math.cos(
                            angle
                        ) *
                        newSpeed,

                    vy:
                        Math.sin(
                            angle
                        ) *
                        newSpeed,

                    radius:
                        newRadius,

                    generation:
                        ball.generation +
                        1,

                    rotation:
                        ball.rotation,

                    rotationSpeed:
                        ball.rotationSpeed *
                        -side *
                        1.08
                });
            }
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        const multiplier =
            stormSpeedMultiplier();


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
            ==========================================
            LARGE SPLITTING ICE BALL
            ==========================================

            Independent 30 second attack timer.
            It keeps counting even when a SnowStorm
            is active.
        */

        enemy.iceBallTimer -=
            dt;


        if (
            enemy.iceBallTimer <=
            0
        ) {

            enemy.iceBallTimer +=
                this.iceBallCooldown;


            this.fireIceBall(
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


        /*
            ==========================================
            LARGE SPLITTING ICE BALLS
            ==========================================
        */

        for (
            const ball
            of iceBalls
        ) {

            ctx.save();


            ctx.translate(
                ball.x,
                ball.y
            );


            ctx.rotate(
                ball.rotation
            );


            const gradient =
                ctx.createRadialGradient(

                    -ball.radius *
                        0.28,

                    -ball.radius *
                        0.32,

                    ball.radius *
                        0.10,

                    0,
                    0,

                    ball.radius
                );


            gradient.addColorStop(
                0,
                "#f2fdff"
            );


            gradient.addColorStop(
                0.38,
                "#9de7f5"
            );


            gradient.addColorStop(
                0.72,
                "#5dbbd4"
            );


            gradient.addColorStop(
                1,
                "#2f7795"
            );


            ctx.shadowBlur =
                Math.max(
                    8,
                    ball.radius *
                        0.45
                );


            ctx.shadowColor =
                "rgba(120,225,255,0.90)";


            ctx.beginPath();


            ctx.arc(
                0,
                0,
                ball.radius,
                0,
                Math.PI *
                    2
            );


            ctx.fillStyle =
                gradient;


            ctx.fill();


            ctx.lineWidth =
                Math.max(
                    2,
                    ball.radius *
                        0.10
                );


            ctx.strokeStyle =
                "#eaffff";


            ctx.stroke();


            /*
                Dark ice cracks.
            */

            ctx.shadowBlur =
                0;


            ctx.strokeStyle =
                "rgba(45,105,130,0.55)";


            ctx.lineWidth =
                Math.max(
                    1.5,
                    ball.radius *
                        0.045
                );


            ctx.beginPath();


            ctx.moveTo(
                -ball.radius *
                    0.72,
                -ball.radius *
                    0.12
            );


            ctx.lineTo(
                -ball.radius *
                    0.18,
                ball.radius *
                    0.15
            );


            ctx.lineTo(
                ball.radius *
                    0.15,
                -ball.radius *
                    0.42
            );


            ctx.moveTo(
                ball.radius *
                    0.12,
                ball.radius *
                    0.70
            );


            ctx.lineTo(
                ball.radius *
                    0.02,
                ball.radius *
                    0.10
            );


            ctx.stroke();


            /*
                BLACK ROTATING CROSS.

                Because the entire canvas context
                is rotated above, the cross visibly
                rotates together with the ice ball.
            */

            ctx.strokeStyle =
                "#090b0e";


            ctx.lineWidth =
                Math.max(
                    4,
                    ball.radius *
                        0.18
                );


            ctx.lineCap =
                "round";


            const cross =
                ball.radius *
                0.48;


            ctx.beginPath();


            ctx.moveTo(
                -cross,
                -cross
            );


            ctx.lineTo(
                cross,
                cross
            );


            ctx.moveTo(
                cross,
                -cross
            );


            ctx.lineTo(
                -cross,
                cross
            );


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
    },


    /* =====================================================
       BOSS HUD

       Same layout as Boss 6 / SteenBen.
       Only the displayed name is different.
       ===================================================== */

    drawHud(
        ctx,
        api,
        definition
    ) {

        const boss =

            api.getEnemies()
                .find(

                    enemy =>

                        enemy.definition ===
                            definition &&

                        enemy.enteredArena
                );


        if (
            !boss
        ) {

            return;
        }


        const canvas =
            api.getCanvas();


        const width =
            Math.min(

                620,

                canvas.width *
                0.62
            );


        const height =
            26;


        const x =

            canvas.width /
                2 -

            width /
                2;


        const y =
            68;


        const hpRatio =
            Math.max(

                0,

                Math.min(

                    1,

                    boss.hp /
                    boss.maxHp
                )
            );


        ctx.save();


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.font =
            "bold 24px Arial";


        ctx.lineWidth =
            5;


        /*
            Name outline.
        */

        ctx.strokeStyle =
            "rgba(0,0,0,0.80)";


        ctx.strokeText(

            "ICE TANK",

            canvas.width /
                2,

            y -
                21
        );


        /*
            Name.
        */

        ctx.fillStyle =
            "#dddddd";


        ctx.fillText(

            "ICE TANK",

            canvas.width /
                2,

            y -
                21
        );


        /*
            HP background.
        */

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";


        ctx.fillRect(

            x -
                4,

            y -
                4,

            width +
                8,

            height +
                8
        );


        /*
            HP.
        */

        ctx.fillStyle =
            "#777777";


        ctx.fillRect(

            x,

            y,

            width *
                hpRatio,

            height
        );


        /*
            Border.
        */

        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth =
            2;


        ctx.strokeRect(

            x,

            y,

            width,

            height
        );


        /*
            HP number.
        */

        ctx.font =
            "bold 14px Arial";


        ctx.fillStyle =
            "#ffffff";


        ctx.fillText(

            `${Math.ceil(
                boss.hp
            )} / ${boss.maxHp}`,

            canvas.width /
                2,

            y +
                height /
                    2
        );


        ctx.restore();
    }
};


export default iceTank;