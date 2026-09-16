const emberShots = [];
const activeEmberShields = new Set();


function chooseRandomDirection(enemy) {
    const angle =
        Math.random() *
        Math.PI *
        2;

    enemy.vx =
        Math.cos(angle) *
        enemy.speed;

    enemy.vy =
        Math.sin(angle) *
        enemy.speed;

    enemy.wanderRemaining =
        2.4 +
        Math.random() *
        2.8;
}


function isProjectileOutside(
    projectile,
    canvas
) {
    const margin =
        projectile.radius +
        35;

    return (
        projectile.x < -margin ||
        projectile.x >
            canvas.width + margin ||
        projectile.y < -margin ||
        projectile.y >
            canvas.height + margin
    );
}


function removeEmberShield(enemy) {
    if (!enemy) {
        return;
    }

    const shieldDefinition =
        enemy.emberShieldDefinition;

    const originalDefinition =
        enemy.emberOriginalDefinition;

    if (
        shieldDefinition &&
        originalDefinition &&
        enemy.definition ===
            shieldDefinition
    ) {
        enemy.definition =
            originalDefinition;
    }

    delete enemy.emberShieldDefinition;
    delete enemy.emberOriginalDefinition;
    delete enemy.emberShieldRemaining;
    delete enemy.emberShieldPulse;

    activeEmberShields.delete(enemy);
}


function clearAllEmberShields() {
    for (
        const enemy of
        [...activeEmberShields]
    ) {
        removeEmberShield(enemy);
    }

    activeEmberShields.clear();
}


const emberHealer = {
    id: "ember-healer",

    name: "Ember Healer",

    behavior: "fleeing-lava-support",

    hp: 30,

    size: 3,

    speed: "fast",

    color: "#b83b1d",

    image: "lava.png",

    fleeDistance: 260,

    fleeSteering: 3.5,

    healRadius: 320,

    healAmount: 10,

    healInterval: 3,

    firstHealDelay: 1.5,

    shieldRadius: 340,

    shieldDuration: 4,

    shieldDamageReduction: 0.5,

    shieldInterval: 12,

    firstShieldDelay: 6,

    emberShotInterval: 6,

    firstShotDelay: 3,

    emberShotSpeed: "slow",

    emberShotRadius: 15,

    emberShotLifetime: 8,

    reset() {
        emberShots.length = 0;
        clearAllEmberShields();
    },

    onPlayerDeath() {
        emberShots.length = 0;
        clearAllEmberShields();
    },

    onLevelWin() {
        emberShots.length = 0;
        clearAllEmberShields();
    },

    onSpawn(enemy, api) {
        enemy.baseHealerSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseHealerSpeed;

        enemy.wanderRemaining = 0;
        enemy.attackActivated = false;

        enemy.healRemaining =
            this.firstHealDelay;

        enemy.shieldRemaining =
            this.firstShieldDelay;

        enemy.shotRemaining =
            this.firstShotDelay;

        enemy.healBeamRemaining = 0;
        enemy.healBeamTarget = null;
        enemy.castFlash = 0;

        enemy.healerPulse =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(enemy);
    },

    findMostWoundedAlly(
        enemy,
        api
    ) {
        let bestTarget = null;
        let bestMissingRatio = 0;

        for (
            const candidate of
            api.getEnemies()
        ) {
            if (
                !candidate ||
                candidate === enemy ||
                candidate.hp <= 0 ||
                candidate.definition?.boss ===
                    true ||
                candidate.maxHp <= 1
            ) {
                continue;
            }

            const distance =
                Math.hypot(
                    candidate.x -
                        enemy.x,

                    candidate.y -
                        enemy.y
                );

            if (
                distance >
                this.healRadius
            ) {
                continue;
            }

            const missingHp =
                Math.max(
                    0,

                    candidate.maxHp -
                    candidate.hp
                );

            const missingRatio =
                missingHp /
                candidate.maxHp;

            if (
                missingRatio >
                bestMissingRatio
            ) {
                bestMissingRatio =
                    missingRatio;

                bestTarget =
                    candidate;
            }
        }

        return bestTarget;
    },

    healAlly(enemy, api) {
        const target =
            this.findMostWoundedAlly(
                enemy,
                api
            );

        if (!target) {
            return;
        }

        target.hp =
            Math.min(
                target.maxHp,

                target.hp +
                this.healAmount
            );

        enemy.healBeamTarget =
            target;

        enemy.healBeamRemaining =
            0.48;

        enemy.castFlash =
            0.30;
    },

    findShieldTarget(
        enemy,
        api
    ) {
        let bestTarget = null;
        let bestDistance = Infinity;

        for (
            const candidate of
            api.getEnemies()
        ) {
            if (
                !candidate ||
                candidate === enemy ||
                candidate.hp <= 0 ||
                candidate.definition?.boss ===
                    true ||
                candidate.maxHp <= 1 ||
                candidate
                    .emberShieldRemaining > 0
            ) {
                continue;
            }

            const distance =
                Math.hypot(
                    candidate.x -
                        enemy.x,

                    candidate.y -
                        enemy.y
                );

            if (
                distance <=
                    this.shieldRadius &&
                distance <
                    bestDistance
            ) {
                bestTarget =
                    candidate;

                bestDistance =
                    distance;
            }
        }

        return bestTarget;
    },

    shieldAlly(enemy, api) {
        const target =
            this.findShieldTarget(
                enemy,
                api
            );

        if (!target) {
            return;
        }

        const originalDefinition =
            target.definition;

        const originalModifyDamage =
            originalDefinition
                ?.modifyDamage;

        const reduction =
            this.shieldDamageReduction;

        const shieldDefinition = {
            ...originalDefinition,

            modifyDamage(
                shieldedEnemy,
                damage,
                damageApi
            ) {
                let finalDamage =
                    Number(damage) ||
                    0;

                if (
                    typeof originalModifyDamage ===
                    "function"
                ) {
                    finalDamage =
                        Number(
                            originalModifyDamage.call(
                                originalDefinition,

                                shieldedEnemy,

                                finalDamage,

                                damageApi
                            )
                        ) ||
                        0;
                }

                return (
                    finalDamage *
                    (1 - reduction)
                );
            }
        };

        target.emberOriginalDefinition =
            originalDefinition;

        target.emberShieldDefinition =
            shieldDefinition;

        target.emberShieldRemaining =
            this.shieldDuration;

        target.emberShieldPulse =
            Math.random() *
            Math.PI *
            2;

        target.definition =
            shieldDefinition;

        activeEmberShields.add(
            target
        );

        enemy.healBeamTarget =
            target;

        enemy.healBeamRemaining =
            0.55;

        enemy.castFlash =
            0.36;
    },

    shootEmber(enemy, api) {
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
            ) ||
            1;

        const speed =
            api.getEnemySpeed(
                this.emberShotSpeed
            );

        const angle =
            Math.atan2(
                dy,
                dx
            );

        const spawnDistance =
            enemy.radius +
            this.emberShotRadius +
            7;

        emberShots.push({
            x:
                enemy.x +
                Math.cos(angle) *
                spawnDistance,

            y:
                enemy.y +
                Math.sin(angle) *
                spawnDistance,

            vx:
                dx /
                distance *
                speed,

            vy:
                dy /
                distance *
                speed,

            radius:
                this.emberShotRadius,

            remaining:
                this.emberShotLifetime,

            pulse:
                Math.random() *
                Math.PI *
                2
        });

        enemy.castFlash =
            0.24;
    },

    updateActiveShields(
        dt,
        api
    ) {
        for (
            const target of
            [...activeEmberShields]
        ) {
            if (
                !api.isEnemyAlive(
                    target
                )
            ) {
                activeEmberShields.delete(
                    target
                );

                continue;
            }

            target.emberShieldRemaining -=
                dt;

            target.emberShieldPulse +=
                dt * 5;

            if (
                target
                    .emberShieldRemaining <=
                0
            ) {
                removeEmberShield(
                    target
                );
            }
        }
    },

    updateEmberShots(
        dt,
        api
    ) {
        const canvas =
            api.getCanvas();

        for (
            let i =
                emberShots.length - 1;

            i >= 0;
            i--
        ) {
            const shot =
                emberShots[i];

            shot.x +=
                shot.vx *
                dt;

            shot.y +=
                shot.vy *
                dt;

            shot.remaining -=
                dt;

            shot.pulse +=
                dt * 7;

            if (
                api.playerTouchesCircle(
                    shot.x,
                    shot.y,
                    shot.radius
                )
            ) {
                emberShots.splice(
                    i,
                    1
                );

                api.killPlayer();
                return;
            }

            if (
                shot.remaining <= 0 ||
                isProjectileOutside(
                    shot,
                    canvas
                )
            ) {
                emberShots.splice(
                    i,
                    1
                );
            }
        }
    },

    beforeUpdate(dt, api) {
        this.updateActiveShields(
            dt,
            api
        );

        this.updateEmberShots(
            dt,
            api
        );
    },

    updateMovement(
        enemy,
        dt,
        api
    ) {
        const player =
            api.getPlayer();

        const awayX =
            enemy.x -
            player.x;

        const awayY =
            enemy.y -
            player.y;

        const distance =
            Math.hypot(
                awayX,
                awayY
            );

        enemy.speed =
            enemy.baseHealerSpeed;

        if (
            distance <
            this.fleeDistance
        ) {
            const safeDistance =
                distance ||
                1;

            const desiredVx =
                awayX /
                safeDistance *
                enemy.speed;

            const desiredVy =
                awayY /
                safeDistance *
                enemy.speed;

            const steering =
                1 -
                Math.exp(
                    -this.fleeSteering *
                    dt
                );

            enemy.vx +=
                (
                    desiredVx -
                    enemy.vx
                ) *
                steering;

            enemy.vy +=
                (
                    desiredVy -
                    enemy.vy
                ) *
                steering;
        } else {
            enemy.wanderRemaining -=
                dt;

            if (
                enemy.wanderRemaining <=
                0
            ) {
                chooseRandomDirection(
                    enemy
                );
            }
        }

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) ||
            1;

        enemy.vx =
            enemy.vx /
            velocityLength *
            enemy.speed;

        enemy.vy =
            enemy.vy /
            velocityLength *
            enemy.speed;

        api.moveStraight(
            enemy,
            dt
        );

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    updateAbilities(
        enemy,
        dt,
        api
    ) {
        enemy.healRemaining -=
            dt;

        enemy.shieldRemaining -=
            dt;

        enemy.shotRemaining -=
            dt;

        if (
            enemy.healRemaining <= 0
        ) {
            this.healAlly(
                enemy,
                api
            );

            enemy.healRemaining +=
                this.healInterval;
        }

        if (
            enemy.shieldRemaining <= 0
        ) {
            this.shieldAlly(
                enemy,
                api
            );

            enemy.shieldRemaining +=
                this.shieldInterval;
        }

        if (
            enemy.shotRemaining <= 0
        ) {
            this.shootEmber(
                enemy,
                api
            );

            enemy.shotRemaining +=
                this.emberShotInterval;
        }
    },

    update(enemy, dt, api) {
        enemy.healerPulse +=
            dt * 4;

        if (enemy.castFlash > 0) {
            enemy.castFlash =
                Math.max(
                    0,
                    enemy.castFlash - dt
                );
        }

        if (
            enemy.healBeamRemaining > 0
        ) {
            enemy.healBeamRemaining =
                Math.max(
                    0,

                    enemy.healBeamRemaining -
                    dt
                );
        }

        if (!enemy.enteredArena) {
            enemy.speed =
                enemy.baseHealerSpeed;

            api.moveStraight(
                enemy,
                dt
            );

            if (
                api.isInsideArena(
                    enemy
                )
            ) {
                enemy.enteredArena = true;
                enemy.attackActivated = true;

                chooseRandomDirection(
                    enemy
                );

                api.keepInsideArena(
                    enemy,
                    14,
                    true
                );
            }

            return;
        }

        if (!enemy.attackActivated) {
            enemy.attackActivated = true;

            enemy.healRemaining =
                this.firstHealDelay;

            enemy.shieldRemaining =
                this.firstShieldDelay;

            enemy.shotRemaining =
                this.firstShotDelay;
        }

        this.updateMovement(
            enemy,
            dt,
            api
        );

        this.updateAbilities(
            enemy,
            dt,
            api
        );
    },

    drawGlobal(ctx, api) {
        for (
            const target of
            activeEmberShields
        ) {
            if (
                !api.isEnemyAlive(
                    target
                )
            ) {
                continue;
            }

            const pulse =
                1 +
                Math.sin(
                    target.emberShieldPulse
                ) *
                0.045;

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                target.x,
                target.y,

                target.radius *
                1.28 *
                pulse,

                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(255,45,12,0.08)";

            ctx.fill();

            ctx.strokeStyle =
                "rgba(255,82,28,0.92)";

            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.restore();
        }

        for (
            const shot of
            emberShots
        ) {
            const r =
                shot.radius *
                (
                    1 +
                    Math.sin(
                        shot.pulse
                    ) *
                    0.08
                );

            const gradient =
                ctx.createRadialGradient(
                    shot.x - r * 0.28,
                    shot.y - r * 0.30,
                    r * 0.08,

                    shot.x,
                    shot.y,
                    r
                );

            gradient.addColorStop(
                0,
                "#fff1a0"
            );

            gradient.addColorStop(
                0.42,
                "#ff8e20"
            );

            gradient.addColorStop(
                1,
                "#a91e0b"
            );

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                shot.x,
                shot.y,
                r,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                gradient;

            ctx.fill();

            ctx.strokeStyle =
                "#ffd35a";

            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    },

    draw(enemy, ctx, api) {
        const r =
            enemy.radius;

        if (
            enemy.healBeamRemaining > 0 &&
            enemy.healBeamTarget &&
            api.isEnemyAlive(
                enemy.healBeamTarget
            )
        ) {
            const target =
                enemy.healBeamTarget;

            ctx.save();

            ctx.beginPath();

            ctx.moveTo(
                enemy.x,
                enemy.y
            );

            ctx.lineTo(
                target.x,
                target.y
            );

            ctx.strokeStyle =
                target
                    .emberShieldRemaining > 0

                    ? "rgba(255,72,24,0.88)"

                    : "rgba(255,205,74,0.88)";

            ctx.lineWidth = 5;

            ctx.setLineDash([
                10,
                7
            ]);

            ctx.stroke();

            ctx.restore();
        }

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,
                color: "#a9361c",
                strokeStyle: "#ff9d32",
                lineWidth: 4
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
                r * 0.88,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.34;

            ctx.drawImage(
                image,

                enemy.x - r,
                enemy.y - r,

                r * 2,
                r * 2
            );

            ctx.restore();
        }

        const flamePulse =
            1 +
            Math.sin(
                enemy.healerPulse
            ) *
            0.08;

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y - r * 0.58
        );

        ctx.beginPath();

        ctx.moveTo(
            0,
            -r *
            0.64 *
            flamePulse
        );

        ctx.quadraticCurveTo(
            -r * 0.42,
            -r * 0.10,

            -r * 0.20,
            r * 0.26
        );

        ctx.quadraticCurveTo(
            0,
            r * 0.48,

            r * 0.20,
            r * 0.26
        );

        ctx.quadraticCurveTo(
            r * 0.42,
            -r * 0.10,

            0,
            -r *
            0.64 *
            flamePulse
        );

        ctx.closePath();

        ctx.fillStyle =
            enemy.castFlash > 0
                ? "#fff49a"
                : "#ff7b1b";

        ctx.fill();

        ctx.strokeStyle =
            "#ffd052";

        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();

        ctx.save();

        ctx.strokeStyle =
            "#ffe36a";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.12
            );

        ctx.lineCap =
            "round";

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.30,
            enemy.y + r * 0.08
        );

        ctx.lineTo(
            enemy.x + r * 0.30,
            enemy.y + r * 0.08
        );

        ctx.moveTo(
            enemy.x,
            enemy.y - r * 0.22
        );

        ctx.lineTo(
            enemy.x,
            enemy.y + r * 0.38
        );

        ctx.stroke();

        ctx.fillStyle =
            "#fff1a0";

        ctx.beginPath();

        ctx.arc(
            enemy.x - r * 0.28,
            enemy.y - r * 0.20,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + r * 0.28,
            enemy.y - r * 0.20,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle =
            "#28100c";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.32,
            enemy.y + r * 0.52
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + r * 0.30,

            enemy.x + r * 0.32,
            enemy.y + r * 0.52
        );

        ctx.stroke();

        ctx.restore();
    }
};


export default emberHealer;