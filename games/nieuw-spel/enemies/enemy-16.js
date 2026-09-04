const warriorSwordThrows =
    [];


function clearWarriorRuntime() {

    warriorSwordThrows.length =
        0;
}



const warriorSwordObject = {

    id:
        "warrior-sword-object",

    name:
        "Warrior Sword",

    behavior:
        "static-object",


    hp:
        3,

    size:
        1.4,

    speed:
        "ultraSlow",


    color:
        "#c9d0d5",


    collidesWithPlayer:
        true,


    draw(
        enemy,
        ctx
    ) {

        const r =
            enemy.radius;


        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            -Math.PI /
            4
        );


        /*
            BLADE OUTLINE
        */

        ctx.strokeStyle =
            "#515a62";


        ctx.lineWidth =

            Math.max(

                7,

                r * 0.42
            );


        ctx.lineCap =
            "round";


        ctx.beginPath();


        ctx.moveTo(
            0,
            r * 0.55
        );


        ctx.lineTo(
            0,
            -r * 0.92
        );


        ctx.stroke();


        /*
            BLADE
        */

        ctx.strokeStyle =
            "#dbe1e5";


        ctx.lineWidth =

            Math.max(

                4,

                r * 0.23
            );


        ctx.beginPath();


        ctx.moveTo(
            0,
            r * 0.48
        );


        ctx.lineTo(
            0,
            -r * 0.90
        );


        ctx.stroke();


        /*
            GUARD
        */

        ctx.strokeStyle =
            "#806b37";


        ctx.lineWidth =

            Math.max(

                5,

                r * 0.28
            );


        ctx.beginPath();


        ctx.moveTo(
            -r * 0.40,
            r * 0.40
        );


        ctx.lineTo(
            r * 0.40,
            r * 0.40
        );


        ctx.stroke();


        /*
            HANDLE
        */

        ctx.strokeStyle =
            "#39281d";


        ctx.beginPath();


        ctx.moveTo(
            0,
            r * 0.40
        );


        ctx.lineTo(
            0,
            r * 0.88
        );


        ctx.stroke();


        ctx.restore();
    }
};



function spawnWarriorSwordObject(
    projectile,
    api
) {

    const sword =

        api.createEntity(

            warriorSwordObject,

            {

                x:
                    projectile.targetX,

                y:
                    projectile.targetY
            },

            {

                hp:
                    3,

                maxHp:
                    3,

                radius:
                    14,

                speed:
                    0,

                vx:
                    0,

                vy:
                    0,

                collidesWithPlayer:
                    true,

                enteredArena:
                    true
            }
        );


    api.getEnemies().push(
        sword
    );
}



function throwWarriorSword(
    enemy,
    api,
    config
) {

    const player =
        api.getPlayer();


    warriorSwordThrows.push({

        ownerId:
            enemy.id,


        startX:
            enemy.x,

        startY:
            enemy.y,


        x:
            enemy.x,

        y:
            enemy.y,


        targetX:
            player.x,

        targetY:
            player.y,


        elapsed:
            0,


        duration:
            config
                .swordFlightDuration,


        radius:
            13,


        targetRadius:
            20
    });


    enemy.swordReady =
        false;


    enemy.swordCooldown =
        0;
}



function startDismount(
    enemy,
    api,
    config
) {

    const previousAngle =

        Math.atan2(
            enemy.vy,
            enemy.vx
        );


    enemy.phase =
        "dismount";


    enemy.dismountTimer =
        config.dismountDuration;


    enemy.vx =
        0;

    enemy.vy =
        0;


    /*
        Nu begint Knight HP.
    */

    enemy.hp =
        config.knightHp;


    enemy.maxHp =
        config.knightHp;


    /*
        Zwaard direct refresh.
    */

    enemy.swordReady =
        true;


    enemy.swordCooldown =
        0;


    enemy.hasBeenDamaged =
        false;


    enemy.dismountHorseRadius =
        enemy.radius;


    enemy.dismountAngle =

        Number.isFinite(
            previousAngle
        )

            ? previousAngle

            : 0;
}



function finishDismount(
    enemy,
    api,
    config
) {

    enemy.phase =
        "knight";


    enemy.size =
        config.knightSize;


    enemy.radius =

        api.getEnemyRadius(
            config.knightSize
        );


    enemy.speed =

        api.getEnemySpeed(
            config.knightSpeed
        );


    enemy.tracking =
        config.knightTracking;


    api.aimVelocityAtPlayer(
        enemy
    );
}



function updateSwordSystem(
    enemy,
    dt,
    api,
    config
) {

    if (
        enemy.phase ===
            "dismount" ||

        !enemy.enteredArena
    ) {
        return;
    }


    if (
        !enemy.swordReady
    ) {

        enemy.swordCooldown +=
            dt;


        if (
            enemy.swordCooldown >=
            config
                .swordRefreshInterval
        ) {

            enemy.swordReady =
                true;


            enemy.swordCooldown =
                0;
        }
    }


    /*
        Zodra er een zwaard
        beschikbaar is wordt hij
        op de speler gegooid.
    */

    if (
        enemy.swordReady
    ) {

        throwWarriorSword(
            enemy,
            api,
            config
        );
    }
}



function drawReadySword(
    ctx,
    x,
    y,
    scale,
    angle = 0.55
) {

    ctx.save();


    ctx.translate(
        x,
        y
    );


    ctx.rotate(
        angle
    );


    ctx.strokeStyle =
        "#dce2e6";


    ctx.lineWidth =

        Math.max(

            4,

            scale * 0.10
        );


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        0,
        scale * 0.20
    );


    ctx.lineTo(
        0,
        -scale * 0.66
    );


    ctx.stroke();


    ctx.strokeStyle =
        "#856d37";


    ctx.lineWidth =

        Math.max(

            4,

            scale * 0.09
        );


    ctx.beginPath();


    ctx.moveTo(
        -scale * 0.15,
        scale * 0.18
    );


    ctx.lineTo(
        scale * 0.15,
        scale * 0.18
    );


    ctx.stroke();


    ctx.strokeStyle =
        "#38271d";


    ctx.beginPath();


    ctx.moveTo(
        0,
        scale * 0.18
    );


    ctx.lineTo(
        0,
        scale * 0.43
    );


    ctx.stroke();


    ctx.restore();
}



function drawKnightForm(
    enemy,
    ctx,
    api,
    config
) {

    api.drawDefaultEnemy(

        enemy,

        {

            face:
                true,

            color:
                config.knightColor,

            strokeStyle:
                "#4a535b",

            lineWidth:

                Math.max(

                    5,

                    enemy.radius *
                        0.13
                )
        }
    );


    const x =
        enemy.x;

    const y =
        enemy.y;

    const r =
        enemy.radius;


    ctx.save();


    /*
        KNIGHT ARMOR
    */

    ctx.beginPath();


    ctx.moveTo(
        x - r * 0.55,
        y + r * 0.03
    );


    ctx.lineTo(
        x - r * 0.40,
        y + r * 0.62
    );


    ctx.quadraticCurveTo(

        x,
        y + r * 0.80,

        x + r * 0.40,
        y + r * 0.62
    );


    ctx.lineTo(
        x + r * 0.55,
        y + r * 0.03
    );


    ctx.quadraticCurveTo(

        x,
        y + r * 0.30,

        x - r * 0.55,
        y + r * 0.03
    );


    ctx.fillStyle =
        "#727d86";


    ctx.fill();


    ctx.lineWidth =

        Math.max(

            3,

            r * 0.08
        );


    ctx.strokeStyle =
        "#3f474e";


    ctx.stroke();


    ctx.restore();


    if (
        enemy.swordReady
    ) {

        drawReadySword(

            ctx,

            x + r * 0.62,

            y + r * 0.10,

            r
        );
    }
}



function drawHorseForm(
    enemy,
    ctx,
    config,
    alpha = 1
) {

    const r =

        enemy.dismountHorseRadius ||

        enemy.radius;


    const angle =

        enemy.phase ===
        "dismount"

            ? enemy.dismountAngle

            : Math.atan2(
                enemy.vy,
                enemy.vx
            );


    ctx.save();


    ctx.globalAlpha =
        alpha;


    ctx.translate(
        enemy.x,
        enemy.y
    );


    ctx.rotate(
        angle
    );


    /*
        ======================
        HORSE BODY
        ======================
    */

    ctx.beginPath();


    ctx.moveTo(
        -r * 0.72,
        -r * 0.30
    );


    ctx.quadraticCurveTo(

        -r * 0.86,
        0,

        -r * 0.72,
        r * 0.30
    );


    ctx.lineTo(
        r * 0.48,
        r * 0.30
    );


    ctx.quadraticCurveTo(

        r * 0.62,
        0,

        r * 0.48,
        -r * 0.30
    );


    ctx.closePath();


    ctx.fillStyle =
        "#835735";


    ctx.fill();


    ctx.lineWidth =

        Math.max(

            4,

            r * 0.08
        );


    ctx.strokeStyle =
        "#4b311f";


    ctx.stroke();


    /*
        HORSE NECK
    */

    ctx.beginPath();


    ctx.moveTo(
        r * 0.38,
        -r * 0.17
    );


    ctx.lineTo(
        r * 0.64,
        -r * 0.58
    );


    ctx.lineTo(
        r * 0.82,
        -r * 0.46
    );


    ctx.lineTo(
        r * 0.56,
        -r * 0.05
    );


    ctx.closePath();


    ctx.fillStyle =
        "#8e603a";


    ctx.fill();

    ctx.stroke();


    /*
        HEAD
    */

    ctx.beginPath();


    ctx.ellipse(

        r * 0.78,

        -r * 0.58,

        r * 0.28,

        r * 0.19,

        0.08,

        0,

        Math.PI * 2
    );


    ctx.fill();

    ctx.stroke();


    /*
        EARS
    */

    ctx.beginPath();


    ctx.moveTo(
        r * 0.66,
        -r * 0.72
    );


    ctx.lineTo(
        r * 0.62,
        -r * 0.90
    );


    ctx.lineTo(
        r * 0.74,
        -r * 0.75
    );


    ctx.moveTo(
        r * 0.83,
        -r * 0.73
    );


    ctx.lineTo(
        r * 0.88,
        -r * 0.90
    );


    ctx.lineTo(
        r * 0.91,
        -r * 0.72
    );


    ctx.fillStyle =
        "#8e603a";


    ctx.fill();


    /*
        LEGS
    */

    ctx.strokeStyle =
        "#654126";


    ctx.lineWidth =

        Math.max(

            5,

            r * 0.09
        );


    ctx.lineCap =
        "round";


    ctx.beginPath();


    ctx.moveTo(
        -r * 0.46,
        r * 0.24
    );


    ctx.lineTo(
        -r * 0.50,
        r * 0.62
    );


    ctx.moveTo(
        -r * 0.12,
        r * 0.26
    );


    ctx.lineTo(
        -r * 0.06,
        r * 0.64
    );


    ctx.moveTo(
        r * 0.25,
        r * 0.25
    );


    ctx.lineTo(
        r * 0.31,
        r * 0.61
    );


    ctx.stroke();


    /*
        TAIL
    */

    ctx.beginPath();


    ctx.moveTo(
        -r * 0.72,
        -r * 0.04
    );


    ctx.quadraticCurveTo(

        -r * 0.98,
        r * 0.06,

        -r * 0.92,
        r * 0.36
    );


    ctx.strokeStyle =
        "#49301f";


    ctx.lineWidth =

        Math.max(

            5,

            r * 0.08
        );


    ctx.stroke();


    /*
        HORSE EYE
    */

    ctx.beginPath();


    ctx.arc(

        r * 0.84,

        -r * 0.62,

        Math.max(
            2,
            r * 0.035
        ),

        0,

        Math.PI * 2
    );


    ctx.fillStyle =
        "#111111";


    ctx.fill();


    /*
        ======================
        KNIGHT ON HORSE
        ======================
    */

    ctx.beginPath();


    ctx.arc(

        -r * 0.02,

        -r * 0.43,

        r * 0.25,

        0,

        Math.PI * 2
    );


    ctx.fillStyle =
        config.knightColor;


    ctx.fill();


    ctx.lineWidth =

        Math.max(

            3,

            r * 0.06
        );


    ctx.strokeStyle =
        "#4b555d";


    ctx.stroke();


    /*
        HELMET
    */

    ctx.beginPath();


    ctx.arc(

        -r * 0.02,

        -r * 0.48,

        r * 0.19,

        Math.PI,

        Math.PI * 2
    );


    ctx.strokeStyle =
        "#89949c";


    ctx.lineWidth =

        Math.max(

            4,

            r * 0.07
        );


    ctx.stroke();


    /*
        RIDER EYES
    */

    ctx.fillStyle =
        "#111111";


    ctx.beginPath();


    ctx.arc(

        -r * 0.09,

        -r * 0.45,

        Math.max(
            2,
            r * 0.025
        ),

        0,

        Math.PI * 2
    );


    ctx.fill();


    ctx.beginPath();


    ctx.arc(

        r * 0.05,

        -r * 0.45,

        Math.max(
            2,
            r * 0.025
        ),

        0,

        Math.PI * 2
    );


    ctx.fill();


    /*
        READY SWORD
    */

    if (
        enemy.swordReady
    ) {

        drawReadySword(

            ctx,

            r * 0.16,

            -r * 0.48,

            r * 0.72,

            0.45
        );
    }


    ctx.restore();
}



const warrior = {

    id:
        "warrior",

    name:
        "Warrior",

    behavior:
        "horse-warrior",


    /*
        =========================
        HORSE
        =========================
    */

    hp:
        10,

    size:
        9,

    speed:
        "mediumFast",


    horseSpeed:
        "mediumFast",


    color:
        "#835735",


    /*
        =========================
        KNIGHT
        =========================
    */

    knightHp:
        8,

    knightSize:
        4,

    knightSpeed:
        "medium",

    knightTracking:
        0.3,

    knightColor:
        "#4f9845",


    dismountDuration:
        0.6,


    swordRefreshInterval:
        12,


    swordFlightDuration:
        0.8,


    reset() {

        clearWarriorRuntime();
    },


    onPlayerDeath() {

        clearWarriorRuntime();
    },


    onLevelWin() {

        clearWarriorRuntime();
    },


    onSpawn(
        enemy,
        api
    ) {

        enemy.phase =
            "mounted";


        enemy.horseEntered =
            false;


        enemy.horseAngle =
            0;


        enemy.horseTurnDirection =

            Math.random() <
            0.5

                ? -1

                : 1;


        enemy.horseTurnSpeed =

            0.45 +

            Math.random() *
            0.35;


        enemy.horseTurnTimer =

            2.5 +

            Math.random() *
            3;


        /*
            Hij heeft bij spawn
            meteen een zwaard.
        */

        enemy.swordReady =
            true;


        enemy.swordCooldown =
            0;


        /*
            Eerst arena in.
        */

        api.aimVelocityAtPlayer(
            enemy
        );


        enemy.horseAngle =

            Math.atan2(
                enemy.vy,
                enemy.vx
            );
    },


    /*
        =========================
        HORSE -> KNIGHT
        =========================
    */

    modifyDamage(
        enemy,
        damage,
        api
    ) {

        const finalDamage =

            Number(
                damage
            ) ||
            0;


        if (
            enemy.phase ===
                "mounted" &&

            finalDamage >=
                enemy.hp
        ) {

            startDismount(

                enemy,

                api,

                this
            );


            /*
                Deze damage heeft het
                paard gedood.

                Niet ook Knight.
            */

            return 0;
        }


        return finalDamage;
    },


    update(
        enemy,
        dt,
        api
    ) {

        /*
            =========================
            DISMOUNT ANIMATION
            =========================
        */

        if (
            enemy.phase ===
            "dismount"
        ) {

            enemy.vx =
                0;

            enemy.vy =
                0;


            enemy.dismountTimer -=
                dt;


            if (
                enemy.dismountTimer <=
                0
            ) {

                finishDismount(

                    enemy,

                    api,

                    this
                );
            }


            return;
        }


        /*
            =========================
            HORSE
            =========================
        */

        if (
            enemy.phase ===
            "mounted"
        ) {

            /*
                Eerst arena in.
            */

            if (
                !enemy.enteredArena
            ) {

                api.moveStraight(
                    enemy,
                    dt
                );


                if (
                    api.isInsideArena(
                        enemy
                    )
                ) {

                    enemy.enteredArena =
                        true;


                    enemy.horseAngle =

                        Math.atan2(
                            enemy.vy,
                            enemy.vx
                        );
                }


                updateSwordSystem(

                    enemy,

                    dt,

                    api,

                    this
                );


                return;
            }


            /*
                Random ronde
                paardenbeweging.
            */

            enemy.horseTurnTimer -=
                dt;


            if (
                enemy.horseTurnTimer <=
                0
            ) {

                enemy.horseTurnDirection =

                    Math.random() <
                    0.5

                        ? -1

                        : 1;


                enemy.horseTurnSpeed =

                    0.35 +

                    Math.random() *
                    0.55;


                enemy.horseTurnTimer =

                    2.5 +

                    Math.random() *
                    3.5;
            }


            enemy.horseAngle +=

                enemy.horseTurnSpeed *

                enemy.horseTurnDirection *

                dt;


            enemy.vx =

                Math.cos(
                    enemy.horseAngle
                ) *

                enemy.speed;


            enemy.vy =

                Math.sin(
                    enemy.horseAngle
                ) *

                enemy.speed;


            api.moveStraight(
                enemy,
                dt
            );


            /*
                Paard kan arena
                nooit verlaten.
            */

            api.keepInsideArena(
                enemy,
                14,
                true
            );


            /*
                Als muur hem bounced,
                nieuwe velocity-angle
                overnemen.
            */

            enemy.horseAngle =

                Math.atan2(
                    enemy.vy,
                    enemy.vx
                );


            updateSwordSystem(

                enemy,

                dt,

                api,

                this
            );


            return;
        }


        /*
            =========================
            KNIGHT ZONDER PAARD
            =========================
        */

        api.moveTowardPlayer(

            enemy,

            dt,

            this.knightTracking
        );


        if (
            enemy.enteredArena
        ) {

            api.keepInsideArena(

                enemy,

                14,

                false
            );
        }


        updateSwordSystem(

            enemy,

            dt,

            api,

            this
        );
    },


    /*
        =========================
        FLYING SWORDS
        =========================
    */

    afterUpdate(
        dt,
        api
    ) {

        for (
            let i =

                warriorSwordThrows
                    .length -
                1;

            i >= 0;

            i--
        ) {

            const projectile =

                warriorSwordThrows[
                    i
                ];


            projectile.elapsed +=
                dt;


            const progress =

                Math.min(

                    1,

                    projectile.elapsed /
                        projectile.duration
                );


            projectile.x =

                projectile.startX +

                (
                    projectile.targetX -
                        projectile.startX
                ) *

                progress;


            projectile.y =

                projectile.startY +

                (
                    projectile.targetY -
                        projectile.startY
                ) *

                progress;


            if (
                progress <
                1
            ) {
                continue;
            }


            spawnWarriorSwordObject(

                projectile,

                api
            );


            if (
                api.playerTouchesCircle(

                    projectile.targetX,

                    projectile.targetY,

                    projectile.targetRadius
                )
            ) {

                api.killPlayer();
            }


            warriorSwordThrows.splice(
                i,
                1
            );


            if (
                api.getPlayer()
                    .alive ===
                false
            ) {
                return;
            }
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        /*
            HORSE
        */

        if (
            enemy.phase ===
            "mounted"
        ) {

            drawHorseForm(

                enemy,

                ctx,

                this,

                1
            );


            return;
        }


        /*
            DISMOUNT
        */

        if (
            enemy.phase ===
            "dismount"
        ) {

            const progress =

                1 -

                Math.max(

                    0,

                    enemy.dismountTimer

                ) /

                this.dismountDuration;


            /*
                Paard vervaagt.
            */

            drawHorseForm(

                enemy,

                ctx,

                this,

                Math.max(

                    0.18,

                    1 -

                    progress *
                        0.82
                )
            );


            /*
                Knight komt omhoog.
            */

            ctx.save();


            const popY =

                enemy.y -

                progress *

                enemy
                    .dismountHorseRadius *

                0.62;


            ctx.beginPath();


            ctx.arc(

                enemy.x,

                popY,

                enemy
                    .dismountHorseRadius *
                    0.23,

                0,

                Math.PI * 2
            );


            ctx.fillStyle =
                this.knightColor;


            ctx.fill();


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "#59636b";


            ctx.stroke();


            ctx.restore();


            return;
        }


        /*
            KNIGHT
        */

        drawKnightForm(

            enemy,

            ctx,

            api,

            this
        );
    },


    /*
        Sword landing warning.
    */

    drawBelow(
        ctx
    ) {

        for (
            const projectile
            of warriorSwordThrows
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(

                projectile.targetX,

                projectile.targetY,

                projectile.targetRadius,

                0,

                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(0,0,0,0.70)";


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "rgba(0,0,0,0.95)";


            ctx.stroke();


            ctx.restore();
        }
    },


    /*
        Flying sword.
    */

    drawGlobal(
        ctx
    ) {

        for (
            const projectile
            of warriorSwordThrows
        ) {

            const progress =

                Math.min(

                    1,

                    projectile.elapsed /
                        projectile.duration
                );


            const arcHeight =

                Math.sin(

                    progress *
                    Math.PI

                ) *

                120;


            const spin =

                progress *

                Math.PI *
                4;


            ctx.save();


            ctx.translate(

                projectile.x,

                projectile.y -
                    arcHeight
            );


            ctx.rotate(
                spin
            );


            /*
                OUTLINE
            */

            ctx.strokeStyle =
                "#505960";


            ctx.lineWidth =
                8;


            ctx.lineCap =
                "round";


            ctx.beginPath();


            ctx.moveTo(
                0,
                11
            );


            ctx.lineTo(
                0,
                -16
            );


            ctx.stroke();


            /*
                BLADE
            */

            ctx.strokeStyle =
                "#dce2e6";


            ctx.lineWidth =
                5;


            ctx.beginPath();


            ctx.moveTo(
                0,
                10
            );


            ctx.lineTo(
                0,
                -16
            );


            ctx.stroke();


            /*
                GUARD
            */

            ctx.strokeStyle =
                "#846a34";


            ctx.lineWidth =
                5;


            ctx.beginPath();


            ctx.moveTo(
                -7,
                8
            );


            ctx.lineTo(
                7,
                8
            );


            ctx.stroke();


            ctx.restore();
        }
    }
};


export default warrior;