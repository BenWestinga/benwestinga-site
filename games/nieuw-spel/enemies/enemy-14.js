let nextShielderGroupId = 1;


function normalizeAngle(angle) {

    while (
        angle >
        Math.PI
    ) {
        angle -=
            Math.PI *
            2;
    }


    while (
        angle <
        -Math.PI
    ) {
        angle +=
            Math.PI *
            2;
    }


    return angle;
}


function updateShieldPosition(
    body,
    shield
) {

    if (
        !body ||
        !shield
    ) {
        return;
    }


    const distance =

        body.radius +

        shield.radius *
        0.78;


    shield.x =

        body.x +

        Math.cos(
            body.shieldAngle
        ) *

        distance;


    shield.y =

        body.y +

        Math.sin(
            body.shieldAngle
        ) *

        distance;


    shield.shieldAngle =
        body.shieldAngle;


    shield.vx =
        body.vx;

    shield.vy =
        body.vy;
}



const shielderShield = {

    id:
        "shielder-shield",

    name:
        "Shielder Shield",

    behavior:
        "shielder-shield",


    hp:
        40,

    size:
        3.2,

    speed:
        "ultraSlow",


    color:
        "#7b8791",


    collidesWithPlayer:
        true,


    onDeath(
        enemy
    ) {

        if (
            enemy.owner &&

            enemy.owner.shield ===
            enemy
        ) {

            enemy.owner.shield =
                null;
        }
    },


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
            enemy.shieldAngle ||
            0
        );


        /*
            SHIELD BODY
        */

        ctx.beginPath();


        ctx.moveTo(
            -r * 0.20,
            -r * 0.92
        );


        ctx.quadraticCurveTo(
            r * 0.62,
            -r * 0.72,

            r * 0.58,
            0
        );


        ctx.quadraticCurveTo(
            r * 0.42,
            r * 0.72,

            -r * 0.20,
            r * 0.92
        );


        ctx.quadraticCurveTo(
            -r * 0.48,
            0,

            -r * 0.20,
            -r * 0.92
        );


        ctx.closePath();


        ctx.fillStyle =
            "#68747e";


        ctx.fill();


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.16
            );


        ctx.strokeStyle =
            "#353d44";


        ctx.stroke();


        /*
            METAL HIGHLIGHT
        */

        ctx.beginPath();


        ctx.moveTo(
            0,
            -r * 0.66
        );


        ctx.quadraticCurveTo(
            r * 0.28,
            0,

            0,
            r * 0.66
        );


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.07
            );


        ctx.strokeStyle =
            "#b9c3cb";


        ctx.stroke();


        /*
            MIDDLE BOLT
        */

        ctx.beginPath();


        ctx.arc(
            r * 0.10,
            0,
            r * 0.18,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#c7d0d6";


        ctx.fill();


        ctx.strokeStyle =
            "#4e5961";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.06
            );


        ctx.stroke();


        ctx.restore();
    }
};



const shielder = {

    id:
        "shielder",

    name:
        "Shielder",

    behavior:
        "shield-charge",


    hp:
        8,

    size:
        5,

    speed:
        "slow",


    color:
        "#4f9548",


    shieldHp:
        40,

    shieldSize:
        3.2,


    /*
        Shield draait expres
        heel langzaam.
    */

    shieldTurnSpeed:
        0.42,


    wallWaitDuration:
        1,


    spawn({

        definition,

        position,

        api

    }) {

        const groupId =

            `shielder-${nextShielderGroupId++}`;


        const body =

            api.createEntity(

                definition,

                position,

                {

                    groupId,

                    isShielderBody:
                        true,

                    movementState:
                        "moving",

                    wallWaitTimer:
                        0,

                    shieldAngle:
                        0
                }
            );


        /*
            Bij spawn rechtstreeks
            op speler af.
        */

        api.aimVelocityAtPlayer(
            body
        );


        body.shieldAngle =

            Math.atan2(

                api.getPlayer().y -
                    body.y,

                api.getPlayer().x -
                    body.x
            );


        const shield =

            api.createEntity(

                shielderShield,

                position,

                {

                    type:
                        "shielder-shield",

                    name:
                        "Shielder Shield",

                    groupId,

                    owner:
                        body,

                    hp:
                        definition.shieldHp,

                    maxHp:
                        definition.shieldHp,

                    radius:

                        api.getEnemyRadius(
                            definition.shieldSize
                        ),

                    speed:
                        0,

                    vx:
                        0,

                    vy:
                        0,

                    collidesWithPlayer:
                        true,

                    enteredArena:
                        false,

                    shieldAngle:
                        body.shieldAngle
                }
            );


        body.shield =
            shield;


        updateShieldPosition(
            body,
            shield
        );


        /*
            Shield komt als laatste
            in enemies array.

            Daardoor wordt hij bij
            bullet collisions eerst
            gecontroleerd.
        */

        return [
            body,
            shield
        ];
    },


    update(
        enemy,
        dt,
        api
    ) {

        if (
            !enemy.isShielderBody
        ) {
            return;
        }


        const shield =
            enemy.shield;


        /*
            =========================
            SHIELD RICHTING
            =========================
        */

        if (
            shield &&

            api.isEnemyAlive(
                shield
            )
        ) {

            const player =
                api.getPlayer();


            const wantedAngle =

                Math.atan2(

                    player.y -
                        enemy.y,

                    player.x -
                        enemy.x
                );


            const difference =

                normalizeAngle(

                    wantedAngle -

                    enemy.shieldAngle
                );


            const maxTurn =

                this.shieldTurnSpeed *
                dt;


            enemy.shieldAngle +=

                Math.max(

                    -maxTurn,

                    Math.min(
                        maxTurn,
                        difference
                    )
                );
        }


        /*
            =========================
            ARENA BINNENKOMEN
            =========================
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
            }


            if (
                shield &&

                api.isEnemyAlive(
                    shield
                )
            ) {

                shield.enteredArena =
                    enemy.enteredArena;


                updateShieldPosition(
                    enemy,
                    shield
                );
            }


            return;
        }


        /*
            =========================
            1 SECOND WAIT
            =========================
        */

        if (
            enemy.movementState ===
            "waiting"
        ) {

            enemy.wallWaitTimer -=
                dt;


            enemy.vx =
                0;

            enemy.vy =
                0;


            if (
                enemy.wallWaitTimer <=
                0
            ) {

                enemy.movementState =
                    "moving";


                /*
                    Opnieuw één keer
                    richten op player.
                */

                api.aimVelocityAtPlayer(
                    enemy
                );
            }


            if (
                shield &&

                api.isEnemyAlive(
                    shield
                )
            ) {

                updateShieldPosition(
                    enemy,
                    shield
                );
            }


            return;
        }


        /*
            RECHTDOOR
        */

        api.moveStraight(
            enemy,
            dt
        );


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
            1 seconde wachten.
        */

        if (
            hitWall
        ) {

            enemy.movementState =
                "waiting";


            enemy.wallWaitTimer =
                this.wallWaitDuration;


            enemy.vx =
                0;

            enemy.vy =
                0;
        }


        if (
            shield &&

            api.isEnemyAlive(
                shield
            )
        ) {

            updateShieldPosition(
                enemy,
                shield
            );
        }
    },


    onDeath(
        enemy,
        api
    ) {

        /*
            Body dood =
            shield ook verwijderen.
        */

        if (
            !enemy.isShielderBody
        ) {
            return;
        }


        if (
            enemy.shield &&

            api.isEnemyAlive(
                enemy.shield
            )
        ) {

            api.removeEnemy(
                enemy.shield
            );
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        if (
            !enemy.isShielderBody
        ) {
            return;
        }


        api.drawDefaultEnemy(

            enemy,

            {

                face:
                    true,

                color:
                    this.color,

                strokeStyle:
                    "#465059",

                lineWidth:

                    Math.max(
                        5,
                        enemy.radius *
                            0.15
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
            ARMOR CHEST
        */

        ctx.beginPath();


        ctx.moveTo(
            x - r * 0.58,
            y + r * 0.02
        );


        ctx.lineTo(
            x - r * 0.42,
            y + r * 0.62
        );


        ctx.quadraticCurveTo(
            x,
            y + r * 0.82,

            x + r * 0.42,
            y + r * 0.62
        );


        ctx.lineTo(
            x + r * 0.58,
            y + r * 0.02
        );


        ctx.quadraticCurveTo(
            x,
            y + r * 0.32,

            x - r * 0.58,
            y + r * 0.02
        );


        ctx.fillStyle =
            "#747e87";


        ctx.fill();


        ctx.strokeStyle =
            "#3d454d";


        ctx.lineWidth =
            Math.max(
                3,
                r * 0.08
            );


        ctx.stroke();


        /*
            SHOULDERS
        */

        ctx.strokeStyle =
            "#8c969e";


        ctx.lineWidth =
            Math.max(
                5,
                r * 0.13
            );


        ctx.beginPath();


        ctx.arc(
            x - r * 0.62,
            y,
            r * 0.24,
            Math.PI,
            Math.PI * 2
        );


        ctx.stroke();


        ctx.beginPath();


        ctx.arc(
            x + r * 0.62,
            y,
            r * 0.24,
            Math.PI,
            Math.PI * 2
        );


        ctx.stroke();


        /*
            HIGHLIGHT
        */

        ctx.beginPath();


        ctx.moveTo(
            x - r * 0.28,
            y + r * 0.20
        );


        ctx.quadraticCurveTo(
            x,
            y + r * 0.34,

            x + r * 0.28,
            y + r * 0.20
        );


        ctx.strokeStyle =
            "#c4ccd2";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.05
            );


        ctx.stroke();


        ctx.restore();
    }
};


export default shielder;