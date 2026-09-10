let nextWarriorId =
    1;


const bombs =
    [];


function normalizeAngle(
    angle
) {

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


const snowWarriorShield = {

    id:
        "snow-warrior-shield",

    name:
        "Snow Warrior Shield",

    behavior:
        "snow-warrior-shield",

    hp:
        40,

    size:
        3.2,

    speed:
        0,

    collidesWithPlayer:
        true,

    color:
        "#c8f4ff",


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
            enemy.shieldAngle || 0
        );


        ctx.beginPath();


        ctx.moveTo(
            -r * 0.20,
            -r * 0.92
        );


        ctx.quadraticCurveTo(
            r * 0.67,
            -r * 0.70,

            r * 0.60,
            0
        );


        ctx.quadraticCurveTo(
            r * 0.48,
            r * 0.76,

            -r * 0.20,
            r * 0.92
        );


        ctx.quadraticCurveTo(
            -r * 0.52,
            0,

            -r * 0.20,
            -r * 0.92
        );


        ctx.closePath();


        const gradient =
            ctx.createLinearGradient(
                -r,
                0,
                r,
                0
            );


        gradient.addColorStop(
            0,
            "#74bed8"
        );


        gradient.addColorStop(
            0.5,
            "#e7fbff"
        );


        gradient.addColorStop(
            1,
            "#6bb7d3"
        );


        ctx.fillStyle =
            gradient;


        ctx.fill();


        ctx.strokeStyle =
            "#396f8a";


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.14
            );


        ctx.stroke();


        /*
            IJskristal in shield.
        */

        ctx.beginPath();

        ctx.moveTo(
            r * 0.08,
            -r * 0.55
        );

        ctx.lineTo(
            r * 0.08,
            r * 0.55
        );


        ctx.moveTo(
            -r * 0.22,
            0
        );

        ctx.lineTo(
            r * 0.38,
            0
        );


        ctx.strokeStyle =
            "#ffffff";


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.06
            );


        ctx.stroke();


        ctx.restore();
    }
};


const snowWarrior = {

    id: "snow-warrior",

    name: "Snow Warrior",

    behavior:
        "shield-bomber",

    hp: 30,

    size: 5,

    speed:
        "medium",

    tracking:
        0.75,

    image:
        "snow.png",

    shieldHp:
        40,

    shieldSize:
        3.2,

    shieldTurnSpeed:
        0.42,

    bombCooldown:
        6,

    bombFlightDuration:
        1,

    bombRadius:
        72,


    reset() {

        bombs.length =
            0;


        nextWarriorId =
            1;
    },


    onPlayerDeath() {

        bombs.length =
            0;
    },


    onLevelWin() {

        bombs.length =
            0;
    },


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


    spawn({
        definition,
        position,
        api
    }) {

        const warriorId =
            nextWarriorId++;


        const body =
            api.createEntity(

                definition,

                position,

                {
                    warriorId,

                    isSnowWarriorBody:
                        true,

                    shieldAngle:
                        0
                }
            );


        const player =
            api.getPlayer();


        body.shieldAngle =
            Math.atan2(

                player.y -
                    body.y,

                player.x -
                    body.x
            );


        const shield =
            api.createEntity(

                snowWarriorShield,

                position,

                {
                    type:
                        "snow-warrior-shield",

                    name:
                        "Snow Warrior Shield",

                    owner:
                        body,

                    warriorId,

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

                    shieldAngle:
                        body.shieldAngle,

                    collidesWithPlayer:
                        true
                }
            );


        body.shield =
            shield;


        updateShieldPosition(
            body,
            shield
        );


        /*
            Shield als laatste:
            jouw combat-engine loopt enemies
            achterstevoren af, dus shield
            wordt voor body geraakt.
        */

        return [
            body,
            shield
        ];
    },


    onSpawn(
        enemy,
        api
    ) {

        if (
            !enemy.isSnowWarriorBody
        ) {

            return;
        }


        enemy.baseWarriorSpeed =
            api.getEnemySpeed(
                this.speed
            );


        enemy.bombTimer =
            this.bombCooldown;


        enemy.gunRecoil =
            0;


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseWarriorSpeed *
            multiplier;


        api.aimVelocityAtPlayer(
            enemy
        );
    },


    createBomb(
        enemy,
        api
    ) {

        const player =
            api.getPlayer();


        bombs.push({

            ownerId:
                enemy.id,

            startX:
                enemy.x,

            startY:
                enemy.y,

            targetX:
                player.x,

            targetY:
                player.y,

            remaining:
                this.bombFlightDuration,

            maxRemaining:
                this.bombFlightDuration,

            radius:
                this.bombRadius,

            landed:
                false
        });


        enemy.gunRecoil =
            0.28;
    },


    beforeUpdate(
        dt,
        api
    ) {

        for (
            let i =
                bombs.length - 1;

            i >= 0;

            i--
        ) {

            const bomb =
                bombs[i];


            bomb.remaining -=
                dt;


            if (
                bomb.remaining >
                0
            ) {

                continue;
            }


            /*
                Landing.
            */

            api.createExplosion(

                bomb.targetX,
                bomb.targetY,

                bomb.radius,

                0.24
            );


            bombs.splice(
                i,
                1
            );
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        if (
            !enemy.isSnowWarriorBody
        ) {

            return;
        }


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseWarriorSpeed *
            multiplier;


        /*
            Shield langzaam naar player.
        */

        const shield =
            enemy.shield;


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
            Warrior volgt de speler.
        */

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


        /*
            Iedere 6 seconden bom.
        */

        enemy.bombTimer -=
            dt;


        if (
            enemy.bombTimer <= 0 &&
            enemy.enteredArena
        ) {

            enemy.bombTimer +=
                this.bombCooldown;


            this.createBomb(
                enemy,
                api
            );
        }


        if (
            enemy.gunRecoil > 0
        ) {

            enemy.gunRecoil -=
                dt;
        }
    },


    onDeath(
        enemy,
        api
    ) {

        if (
            !enemy.isSnowWarriorBody
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


    drawGlobal(
        ctx
    ) {

        for (
            const bomb
            of bombs
        ) {

            const progress =
                1 -
                bomb.remaining /
                bomb.maxRemaining;


            /*
                Zwart landingsrondje.
            */

            ctx.save();


            ctx.beginPath();

            ctx.arc(
                bomb.targetX,
                bomb.targetY,
                bomb.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(0,0,0,0.18)";


            ctx.fill();


            ctx.strokeStyle =
                "rgba(0,0,0,0.85)";


            ctx.lineWidth =
                4;


            ctx.stroke();


            /*
                Door de lucht vliegende bom.
            */

            const x =
                bomb.startX +
                (
                    bomb.targetX -
                    bomb.startX
                ) *
                progress;


            const linearY =
                bomb.startY +
                (
                    bomb.targetY -
                    bomb.startY
                ) *
                progress;


            const arcHeight =
                Math.sin(
                    progress *
                    Math.PI
                ) *
                120;


            const y =
                linearY -
                arcHeight;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                12,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#1b2b32";


            ctx.fill();


            ctx.strokeStyle =
                "#d7f8ff";


            ctx.lineWidth =
                3;


            ctx.stroke();


            ctx.restore();
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        if (
            !enemy.isSnowWarriorBody
        ) {

            return;
        }


        api.drawDefaultEnemy(
            enemy,
            {
                face: false,

                color:
                    "#cceff7",

                strokeStyle:
                    "#47788c",

                lineWidth:
                    5
            }
        );


        const r =
            enemy.radius;


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
                r * 0.88,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.65;


            ctx.drawImage(
                image,

                enemy.x - r,
                enemy.y - r,

                r * 2,
                r * 2
            );


            ctx.restore();
        }


        /*
            IJS ARMOUR.
        */

        ctx.save();


        ctx.fillStyle =
            "#7ebfd4";


        ctx.beginPath();


        ctx.moveTo(
            enemy.x -
                r * 0.62,

            enemy.y +
                r * 0.05
        );


        ctx.lineTo(
            enemy.x -
                r * 0.42,

            enemy.y +
                r * 0.70
        );


        ctx.lineTo(
            enemy.x +
                r * 0.42,

            enemy.y +
                r * 0.70
        );


        ctx.lineTo(
            enemy.x +
                r * 0.62,

            enemy.y +
                r * 0.05
        );


        ctx.closePath();

        ctx.fill();


        ctx.strokeStyle =
            "#e2faff";


        ctx.lineWidth =
            3;

        ctx.stroke();


        /*
            SNOW GUN.

            Alleen visueel.
        */

        const player =
            api.getPlayer();


        const gunAngle =
            Math.atan2(

                player.y -
                    enemy.y,

                player.x -
                    enemy.x
            );


        const recoil =
            enemy.gunRecoil > 0

                ? 7
                : 0;


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            gunAngle
        );


        ctx.fillStyle =
            "#d6f8ff";


        ctx.fillRect(
            r * 0.18 -
                recoil,

            -r * 0.12,

            r * 0.95,

            r * 0.24
        );


        ctx.strokeStyle =
            "#467d92";


        ctx.lineWidth =
            3;


        ctx.strokeRect(
            r * 0.18 -
                recoil,

            -r * 0.12,

            r * 0.95,

            r * 0.24
        );


        ctx.restore();


        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowWarrior;