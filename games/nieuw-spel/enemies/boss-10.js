import lavaBen from "./boss-09.js";


function pointSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return Math.hypot(px - x1, py - y1);
    }

    const progress = Math.max(
        0,
        Math.min(
            1,
            (
                (px - x1) * dx +
                (py - y1) * dy
            ) /
            lengthSquared
        )
    );

    const closestX = x1 + dx * progress;
    const closestY = y1 + dy * progress;

    return Math.hypot(
        px - closestX,
        py - closestY
    );
}


const finalLavaBen = {
    ...lavaBen,

    id: "final-lava-ben",
    name: "Final LavaBen",
    behavior: "final-lava-ben-boss",

    boss: true,

    hp: 2000,
    size: 10,
    speed: "medium",

    image: "Ben.png",

    attackDuration: 15,
    attackBreakDuration: 4,

    meteorCount: 35,

    /*
        Attack 2: energieballen.
    */

    energyBallCount: 50,
    energyBallSize: 1.5,
    energyBallSpeed: "slow",
    energyBallSpawnDuration: 8,

    /*
        Hogere tijd = langzamer naar
        de boss vliegen.
    */

    energyBallTravelDuration: 6,

    energyBallReleaseDuration: 3,

    /*
        De uitgespuugde ballen gaan
        op 25% van hun normale snelheid.
    */

    energyBallSpeedMultiplier: 0.25,

    /*
        Binnen 100 pixels rondom de
        speler mogen geen ballen spawnen.
    */

    energyBallPlayerSafeRadius: 100,

    lavaBombCount: 10,
    lavaBombSize: 15.5,
    lavaBombTravelDuration: 2.8,
    lavaBombArcHeight: 170,

    shrapnelCount: 8,
    shrapnelSize: 1.5,
    shrapnelSpeed: "medium",

    landingDuration: 1,

    spiralSpeed: 0.6,
    spiralWidth: 18,


    onSpawn(
        enemy,
        api
    ) {
        lavaBen.onSpawn.call(
            this,
            enemy,
            api
        );

        const player =
            api.getPlayer();

        enemy.nextSpawnerHp =
            1900;

        enemy.spawnersCreated =
            0;

        enemy.spiralAngle =
            Math.random() *
            Math.PI *
            2;

        enemy.landing =
            true;

        enemy.landingTimer =
            this.landingDuration;

        enemy.landingMax =
            this.landingDuration;

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

        enemy.vx = 0;
        enemy.vy = 0;

        enemy.enteredArena =
            false;

        enemy.collidesWithPlayer =
            false;
    },


    getSpawnerWorld(
        spawnerNumber
    ) {
        if (
            spawnerNumber <= 4
        ) {
            return 1;
        }

        if (
            spawnerNumber <= 8
        ) {
            return 2;
        }

        if (
            spawnerNumber <= 12
        ) {
            return 3;
        }

        if (
            spawnerNumber <= 16
        ) {
            return 4;
        }

        return 5;
    },


    findSpawnerPosition(
        enemy,
        api
    ) {
        const canvas =
            api.getCanvas();

        const player =
            api.getPlayer();

        const margin =
            85;

        let best = {
            x:
                canvas.width /
                2,

            y:
                canvas.height /
                2
        };

        for (
            let attempt = 0;
            attempt < 40;
            attempt++
        ) {
            const candidate = {
                x:
                    margin +

                    Math.random() *

                    Math.max(
                        1,
                        canvas.width -
                        margin * 2
                    ),

                y:
                    margin +

                    Math.random() *

                    Math.max(
                        1,
                        canvas.height -
                        margin * 2
                    )
            };

            best =
                candidate;

            const awayFromPlayer =
                Math.hypot(
                    candidate.x -
                    player.x,

                    candidate.y -
                    player.y
                ) >= 180;

            const awayFromBoss =
                Math.hypot(
                    candidate.x -
                    enemy.x,

                    candidate.y -
                    enemy.y
                ) >= 150;

            if (
                awayFromPlayer &&
                awayFromBoss
            ) {
                break;
            }
        }

        return best;
    },


    createSpawner(
        enemy,
        api
    ) {
        enemy.spawnersCreated++;

        const world =
            this.getSpawnerWorld(
                enemy.spawnersCreated
            );

        const position =
            this.findSpawnerPosition(
                enemy,
                api
            );

        const spawned =
            api.spawnEnemyAt(
                "spawner",
                position.x,
                position.y
            );

        if (spawned) {
            spawned.spawnWorld =
                world;

            spawned.enteredArena =
                true;
        }
    },


    onDamage(
        enemy,
        damage,
        oldHp,
        api
    ) {
        lavaBen.onDamage.call(
            this,
            enemy,
            damage,
            oldHp,
            api
        );

        /*
            Iedere 100 verloren HP
            verschijnt een Spawner.

            Van 1900 HP tot en met
            100 HP zijn dit er 19.
        */

        while (
            enemy.nextSpawnerHp >=
                100 &&

            oldHp >
                enemy.nextSpawnerHp &&

            enemy.hp <=
                enemy.nextSpawnerHp
        ) {
            this.createSpawner(
                enemy,
                api
            );

            enemy.nextSpawnerHp -=
                100;
        }
    },


    startAttack(
        enemy,
        attackIndex
    ) {
        lavaBen.startAttack.call(
            this,
            enemy,
            attackIndex
        );

        /*
            Attack 3 zijn de draaiende
            lijnen.

            De boss wordt hierbij niet
            stilgezet en blijft bewegen.
        */

        if (
            attackIndex === 3
        ) {
            enemy.spiralAngle =
                Math.random() *
                Math.PI *
                2;

            if (
                Math.hypot(
                    enemy.vx,
                    enemy.vy
                ) < 1
            ) {
                this.chooseMovementDirection(
                    enemy
                );
            }
        }
    },


    finishAttack(enemy) {
        const finishedAttack =
            enemy.activeAttack;

        enemy.attackState =
            "break";

        enemy.attackBreakRemaining =
            this.attackBreakDuration;

        enemy.nextAttack =
            (
                finishedAttack +
                1
            ) %
            4;

        enemy.activeAttack =
            -1;

        enemy.attackElapsed =
            0;

        if (
            finishedAttack === 1 ||
            finishedAttack === 3
        ) {
            this.chooseMovementDirection(
                enemy
            );
        }
    },


    spawnIncomingEnergyBall(
        enemy,
        api
    ) {
        const radius =
            api.getEnemyRadius(
                this.energyBallSize
            );

        const canvas =
            api.getCanvas();

        const player =
            api.getPlayer();

        let x = 0;
        let y = 0;

        /*
            Zoek een spawnplek buiten
            de map en buiten de veilige
            radius van de speler.
        */

        for (
            let attempt = 0;
            attempt < 50;
            attempt++
        ) {
            const edge =
                Math.floor(
                    Math.random() *
                    4
                );

            if (
                edge === 0
            ) {
                x =
                    -radius -
                    1;

                y =
                    Math.random() *
                    canvas.height;

            } else if (
                edge === 1
            ) {
                x =
                    canvas.width +
                    radius +
                    1;

                y =
                    Math.random() *
                    canvas.height;

            } else if (
                edge === 2
            ) {
                x =
                    Math.random() *
                    canvas.width;

                y =
                    -radius -
                    1;

            } else {
                x =
                    Math.random() *
                    canvas.width;

                y =
                    canvas.height +
                    radius +
                    1;
            }

            const playerRadius =
                Number(
                    player.radius
                ) || 0;

            const distanceToPlayer =
                Math.hypot(
                    x -
                    player.x,

                    y -
                    player.y
                );

            if (
                distanceToPlayer >=

                this
                    .energyBallPlayerSafeRadius +

                radius +

                playerRadius
            ) {
                break;
            }
        }

        /*
            Boss 09 bewaart deze ballen
            in zijn eigen interne array.

            Daarom geven we tijdelijk
            onze gekozen positie terug.
        */

        const originalRandomSpawnPosition =
            api.randomSpawnPosition;

        api.randomSpawnPosition =
            () => ({
                x,
                y
            });

        try {
            lavaBen
                .spawnIncomingEnergyBall
                .call(
                    this,
                    enemy,
                    api
                );

        } finally {
            api.randomSpawnPosition =
                originalRandomSpawnPosition;
        }
    },


    spawnOutgoingEnergyBall(
        enemy,
        api,
        index
    ) {
        /*
            Verlaag tijdelijk de snelheid
            waarmee Boss 09 de uitgaande
            bal aanmaakt.
        */

        const originalGetEnemySpeed =
            api.getEnemySpeed;

        api.getEnemySpeed =
            speed =>
                originalGetEnemySpeed(
                    speed
                ) *
                this
                    .energyBallSpeedMultiplier;

        try {
            lavaBen
                .spawnOutgoingEnergyBall
                .call(
                    this,
                    enemy,
                    api,
                    index
                );

        } finally {
            api.getEnemySpeed =
                originalGetEnemySpeed;
        }
    },


    updateAttackCycle(
        enemy,
        dt,
        api
    ) {
        if (
            enemy.attackState ===
            "break"
        ) {
            enemy.attackBreakRemaining -=
                dt;

            if (
                enemy.attackBreakRemaining <=
                0
            ) {
                this.startAttack(
                    enemy,
                    enemy.nextAttack
                );
            }

            return;
        }

        enemy.attackElapsed =
            Math.min(
                this.attackDuration,

                enemy.attackElapsed +
                dt
            );

        if (
            enemy.activeAttack === 0
        ) {
            this.updateMeteorAttack(
                enemy,
                api
            );

        } else if (
            enemy.activeAttack === 1
        ) {
            this.updateEnergyAttack(
                enemy,
                dt,
                api
            );

        } else if (
            enemy.activeAttack === 2
        ) {
            this.updateLavaBombAttack(
                enemy,
                api
            );

        } else if (
            enemy.activeAttack === 3
        ) {
            enemy.spiralAngle +=
                this.spiralSpeed *
                dt;
        }

        if (
            enemy.attackElapsed >=
            this.attackDuration
        ) {
            this.finishAttack(
                enemy
            );
        }
    },


    updateMovement(
        enemy,
        dt,
        api
    ) {
        /*
            Alleen tijdens attack 1,
            de energieballenaanval,
            blijft de boss stilstaan.

            Tijdens de draaiende lijnen
            beweegt hij gewoon door.
        */

        if (
            enemy.attackState ===
                "active" &&

            enemy.activeAttack ===
                1
        ) {
            enemy.vx =
                0;

            enemy.vy =
                0;

            return;
        }

        lavaBen.updateMovement.call(
            this,
            enemy,
            dt,
            api
        );
    },


    update(
        enemy,
        dt,
        api
    ) {
        /*
            Landing aan het begin van
            level 50.
        */

        if (
            enemy.landing
        ) {
            enemy.landingTimer -=
                dt;

            const progress =
                Math.max(
                    0,

                    Math.min(
                        1,

                        1 -

                        enemy.landingTimer /
                        enemy.landingMax
                    )
                );

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

            enemy.bossAnimation +=
                dt *
                4;

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

                this.chooseMovementDirection(
                    enemy
                );
            }

            return;
        }

        lavaBen.update.call(
            this,
            enemy,
            dt,
            api
        );
    },


    getSpiralRays(
        enemy,
        api
    ) {
        const canvas =
            api.getCanvas();

        const length =
            Math.hypot(
                canvas.width,
                canvas.height
            ) *
            1.15;

        return [
            0,
            Math.PI
        ].map(
            offset => {
                const angle =
                    enemy.spiralAngle +
                    offset;

                const inner =
                    enemy.radius *
                    0.82;

                return {
                    x1:
                        enemy.x +
                        Math.cos(angle) *
                        inner,

                    y1:
                        enemy.y +
                        Math.sin(angle) *
                        inner,

                    x2:
                        enemy.x +
                        Math.cos(angle) *
                        length,

                    y2:
                        enemy.y +
                        Math.sin(angle) *
                        length
                };
            }
        );
    },


    beforeUpdate(
        dt,
        api
    ) {
        /*
            Energieballen, lavabommen
            en scherven van Boss 09.
        */

        lavaBen.beforeUpdate.call(
            this,
            dt,
            api
        );

        const boss =
            api.getEnemies().find(
                enemy =>
                    enemy.definition ===
                        this &&

                    enemy.hp > 0 &&

                    !enemy.landing &&

                    enemy.attackState ===
                        "active" &&

                    enemy.activeAttack ===
                        3
            );

        if (!boss) {
            return;
        }

        const player =
            api.getPlayer();

        const playerRadius =
            Number(
                player.radius
            ) || 0;

        /*
            Collision voor beide
            draaiende lijnen.
        */

        for (
            const ray
            of this.getSpiralRays(
                boss,
                api
            )
        ) {
            const distance =
                pointSegmentDistance(
                    player.x,
                    player.y,

                    ray.x1,
                    ray.y1,

                    ray.x2,
                    ray.y2
                );

            if (
                distance <=

                playerRadius +
                this.spiralWidth /
                2
            ) {
                api.killPlayer();

                return;
            }
        }
    },


    drawBelow(
        ctx,
        api
    ) {
        /*
            Lavabomwaarschuwingen van
            Boss 09 blijven werken.
        */

        lavaBen.drawBelow.call(
            this,
            ctx,
            api
        );

        const boss =
            api.getEnemies().find(
                enemy =>
                    enemy.definition ===
                        this &&

                    enemy.hp > 0
            );

        if (!boss) {
            return;
        }

        /*
            Landingwaarschuwing.
        */

        if (
            boss.landing
        ) {
            const progress =
                Math.max(
                    0,

                    Math.min(
                        1,

                        1 -

                        boss.landingTimer /
                        boss.landingMax
                    )
                );

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                boss.landingTargetX,
                boss.landingTargetY,

                boss.radius *
                (
                    1.28 -
                    progress *
                    0.28
                ),

                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255,35,0,${
                    0.10 +
                    progress *
                    0.18
                })`;

            ctx.fill();

            ctx.strokeStyle =
                `rgba(255,205,65,${
                    0.55 +
                    progress *
                    0.45
                })`;

            ctx.lineWidth =
                7;

            ctx.setLineDash([
                14,
                9
            ]);

            ctx.stroke();

            ctx.restore();
        }

        if (
            boss.landing ||

            boss.attackState !==
                "active" ||

            boss.activeAttack !==
                3
        ) {
            return;
        }

        const rays =
            this.getSpiralRays(
                boss,
                api
            );

        ctx.save();

        ctx.lineCap =
            "round";

        for (
            const ray
            of rays
        ) {
            /*
                Donkere buitenrand.
            */

            ctx.beginPath();

            ctx.moveTo(
                ray.x1,
                ray.y1
            );

            ctx.lineTo(
                ray.x2,
                ray.y2
            );

            ctx.strokeStyle =
                "rgba(75,0,0,0.92)";

            ctx.lineWidth =
                this.spiralWidth +
                12;

            ctx.shadowBlur =
                25;

            ctx.shadowColor =
                "#ff2100";

            ctx.stroke();

            /*
                Rode kern.
            */

            ctx.shadowBlur =
                12;

            ctx.beginPath();

            ctx.moveTo(
                ray.x1,
                ray.y1
            );

            ctx.lineTo(
                ray.x2,
                ray.y2
            );

            ctx.strokeStyle =
                "#ff3c08";

            ctx.lineWidth =
                this.spiralWidth;

            ctx.stroke();

            /*
                Gele middenlijn.
            */

            ctx.shadowBlur =
                0;

            ctx.beginPath();

            ctx.moveTo(
                ray.x1,
                ray.y1
            );

            ctx.lineTo(
                ray.x2,
                ray.y2
            );

            ctx.strokeStyle =
                "#ffd45b";

            ctx.lineWidth =
                4;

            ctx.stroke();
        }

        ctx.restore();
    },


    draw(
        enemy,
        ctx,
        api
    ) {
        /*
            Volledige Boss 09-tekening,
            inclusief Ben.png.
        */

        lavaBen.draw.call(
            this,
            enemy,
            ctx,
            api
        );

        /*
            Extra rode tint.
        */

        const pulse =
            0.12 +

            Math.sin(
                enemy.bossAnimation *
                1.7
            ) *

            0.035;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius * 0.90,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            `rgba(170,0,0,${
                pulse
            })`;

        ctx.fill();

        ctx.restore();
    },


    drawHud(
        ctx,
        api,
        definition
    ) {
        const boss =
            api.getEnemies().find(
                enemy =>
                    enemy.definition ===
                        definition &&

                    enemy.enteredArena
            );

        if (!boss) {
            return;
        }

        const canvas =
            api.getCanvas();

        const width =
            Math.min(
                700,

                canvas.width *
                0.68
            );

        const height =
            30;

        const x =
            canvas.width /
            2 -
            width /
            2;

        const y =
            70;

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
            "bold 27px Arial";

        ctx.lineWidth =
            6;

        ctx.strokeStyle =
            "rgba(0,0,0,0.90)";

        ctx.strokeText(
            "FINAL LAVABEN",
            canvas.width / 2,
            y - 23
        );

        ctx.fillStyle =
            "#ff7040";

        ctx.fillText(
            "FINAL LAVABEN",
            canvas.width / 2,
            y - 23
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.86)";

        ctx.fillRect(
            x - 5,
            y - 5,
            width + 10,
            height + 10
        );

        const healthGradient =
            ctx.createLinearGradient(
                x,
                y,
                x + width,
                y
            );

        healthGradient.addColorStop(
            0,
            "#ffbd31"
        );

        healthGradient.addColorStop(
            0.45,
            "#f04417"
        );

        healthGradient.addColorStop(
            1,
            "#9d0710"
        );

        ctx.fillStyle =
            healthGradient;

        ctx.fillRect(
            x,
            y,
            width *
            hpRatio,
            height
        );

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

        ctx.font =
            "bold 15px Arial";

        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            `${
                Math.ceil(
                    boss.hp
                )
            } / ${
                boss.maxHp
            }`,

            canvas.width /
            2,

            y +
            height /
            2
        );

        ctx.restore();
    }
};


export default finalLavaBen;