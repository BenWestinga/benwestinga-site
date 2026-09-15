const fireballs = [];


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

    enemy.wanderTimer =
        2.8 +
        Math.random() *
        3.2;
}


const lavaWizard = {
    id: "lava-wizard",
    name: "Lava Wizard",
    behavior: "shielded-fireball-wizard",

    hp: 60,
    size: 5,
    speed: "mediumSlow",
    tracking: 1,

    color: "#8f2716",
    image: "lava.png",

    approachDuration: 2,

    firstBurstDelay: 3,
    burstShots: 3,
    burstInterval: 1.5,
    burstCooldown: 7,

    fireballSpeed: 300,
    fireballRadius: 19,
    explosionRadius: 105,
    fireballLifetime: 8,

    shieldDuration: 3,
    shieldRecharge: 17,

    reset() {
        fireballs.length = 0;
    },

    onPlayerDeath() {
        fireballs.length = 0;
    },

    onLevelWin() {
        fireballs.length = 0;
    },

    modifyDamage(
        enemy,
        damage
    ) {
        if (enemy.shieldActive) {
            return 0;
        }

        if (
            (
                enemy
                    .shieldCooldownRemaining ||
                0
            ) <= 0
        ) {
            enemy.shieldActive = true;

            enemy.shieldRemaining =
                this.shieldDuration;

            enemy.vx = 0;
            enemy.vy = 0;

            return 0;
        }

        return damage;
    },

    onSpawn(enemy, api) {
        enemy.baseWizardSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseWizardSpeed;

        enemy.approachRemaining =
            this.approachDuration;

        enemy.wanderTimer = 0;
        enemy.wanderingStarted = false;

        enemy.attackActivated = false;

        enemy.attackTimer =
            this.firstBurstDelay;

        enemy.burstShotsFired = 0;
        enemy.castFlash = 0;

        enemy.shieldActive = false;
        enemy.shieldRemaining = 0;
        enemy.shieldCooldownRemaining = 0;

        enemy.shieldPulse =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(enemy);
    },

    fireFireball(enemy, api) {
        const player =
            api.getPlayer();

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;

        const distance =
            Math.hypot(dx, dy) ||
            1;

        const angle =
            Math.atan2(dy, dx);

        const spawnDistance =
            enemy.radius +
            this.fireballRadius +
            8;

        fireballs.push({
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
                this.fireballSpeed,

            vy:
                dy /
                distance *
                this.fireballSpeed,

            radius:
                this.fireballRadius,

            explosionRadius:
                this.explosionRadius,

            remaining:
                this.fireballLifetime,

            rotation:
                Math.random() *
                Math.PI *
                2,

            rotationSpeed: 5.2
        });

        enemy.castFlash = 0.24;
    },

    beforeUpdate(dt, api) {
        const canvas =
            api.getCanvas();

        const border = 14;

        for (
            let i =
                fireballs.length - 1;

            i >= 0;

            i--
        ) {
            const fireball =
                fireballs[i];

            fireball.x +=
                fireball.vx * dt;

            fireball.y +=
                fireball.vy * dt;

            fireball.rotation +=
                fireball.rotationSpeed *
                dt;

            fireball.remaining -= dt;

            if (
                api.playerTouchesCircle(
                    fireball.x,
                    fireball.y,
                    fireball.radius
                )
            ) {
                fireballs.splice(i, 1);
                api.killPlayer();
                return;
            }

            const hitWall =
                fireball.x -
                    fireball.radius <=
                    border ||

                fireball.x +
                    fireball.radius >=
                    canvas.width -
                    border ||

                fireball.y -
                    fireball.radius <=
                    border ||

                fireball.y +
                    fireball.radius >=
                    canvas.height -
                    border;

            if (hitWall) {
                fireballs.splice(i, 1);

                api.createExplosion(
                    Math.max(
                        border +
                            fireball.radius,

                        Math.min(
                            canvas.width -
                                border -
                                fireball.radius,

                            fireball.x
                        )
                    ),

                    Math.max(
                        border +
                            fireball.radius,

                        Math.min(
                            canvas.height -
                                border -
                                fireball.radius,

                            fireball.y
                        )
                    ),

                    fireball.explosionRadius,
                    0.38
                );

                continue;
            }

            if (
                fireball.remaining <= 0
            ) {
                fireballs.splice(i, 1);
            }
        }
    },

    updateMovement(
        enemy,
        dt,
        api
    ) {
        if (
            enemy.approachRemaining > 0
        ) {
            enemy.approachRemaining -=
                dt;

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );

            return;
        }

        if (!enemy.enteredArena) {
            api.moveStraight(enemy, dt);
            return;
        }

        if (
            !enemy.wanderingStarted ||
            enemy.wanderTimer <= 0
        ) {
            enemy.wanderingStarted = true;

            chooseRandomDirection(
                enemy
            );
        }

        enemy.wanderTimer -= dt;

        api.moveStraight(enemy, dt);

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    updateAttack(
        enemy,
        dt,
        api
    ) {
        if (!enemy.attackActivated) {
            return;
        }

        enemy.attackTimer -= dt;

        if (enemy.attackTimer > 0) {
            return;
        }

        this.fireFireball(
            enemy,
            api
        );

        enemy.burstShotsFired++;

        if (
            enemy.burstShotsFired <
            this.burstShots
        ) {
            enemy.attackTimer +=
                this.burstInterval;
        } else {
            enemy.burstShotsFired = 0;

            enemy.attackTimer +=
                this.burstCooldown;
        }
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.baseWizardSpeed;

        enemy.shieldPulse +=
            dt * 5;

        if (enemy.castFlash > 0) {
            enemy.castFlash -= dt;
        }

        if (enemy.shieldActive) {
            enemy.shieldRemaining -= dt;
            enemy.vx = 0;
            enemy.vy = 0;

            if (
                enemy.shieldRemaining <= 0
            ) {
                enemy.shieldActive = false;
                enemy.shieldRemaining = 0;

                enemy.shieldCooldownRemaining =
                    this.shieldRecharge;

                enemy.wanderingStarted = false;

                if (!enemy.enteredArena) {
                    api.aimVelocityAtPlayer(
                        enemy
                    );
                }
            }

            return;
        }

        if (
            enemy
                .shieldCooldownRemaining >
            0
        ) {
            enemy.shieldCooldownRemaining =
                Math.max(
                    0,

                    enemy
                        .shieldCooldownRemaining -
                    dt
                );
        }

        this.updateMovement(
            enemy,
            dt,
            api
        );

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
            enemy.attackActivated = true;

            enemy.attackTimer =
                this.firstBurstDelay;
        }

        if (enemy.enteredArena) {
            api.keepInsideArena(
                enemy,
                14,
                true
            );

            if (!enemy.attackActivated) {
                enemy.attackActivated = true;

                enemy.attackTimer =
                    this.firstBurstDelay;
            }
        }

        this.updateAttack(
            enemy,
            dt,
            api
        );
    },

    drawGlobal(ctx) {
        for (
            const fireball
            of fireballs
        ) {
            ctx.save();

            ctx.translate(
                fireball.x,
                fireball.y
            );

            ctx.rotate(
                fireball.rotation
            );

            const r =
                fireball.radius;

            const gradient =
                ctx.createRadialGradient(
                    -r * 0.28,
                    -r * 0.30,
                    r * 0.08,
                    0,
                    0,
                    r
                );

            gradient.addColorStop(
                0,
                "#fff4a6"
            );

            gradient.addColorStop(
                0.38,
                "#ffbd31"
            );

            gradient.addColorStop(
                0.72,
                "#ff4b08"
            );

            gradient.addColorStop(
                1,
                "#7d1208"
            );

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                r,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = gradient;
            ctx.shadowBlur = 18;
            ctx.shadowColor = "#ff4d00";
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#ffe56f";
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.strokeStyle =
                "rgba(255,245,175,0.75)";

            ctx.lineWidth = 2;
            ctx.beginPath();

            ctx.arc(
                0,
                0,
                r * 0.58,
                -0.9,
                0.9
            );

            ctx.stroke();
            ctx.restore();
        }
    },

    draw(enemy, ctx, api) {
        const r = enemy.radius;

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,
                color: "#8e2618",
                strokeStyle: "#ff8a2a",
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
            ctx.globalAlpha = 0.48;

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

        const hatGradient =
            ctx.createLinearGradient(
                enemy.x,
                enemy.y - r * 1.25,
                enemy.x,
                enemy.y
            );

        hatGradient.addColorStop(
            0,
            "#211016"
        );

        hatGradient.addColorStop(
            0.55,
            "#701c18"
        );

        hatGradient.addColorStop(
            1,
            "#dc3a12"
        );

        ctx.beginPath();

        ctx.moveTo(
            enemy.x,
            enemy.y - r * 1.28
        );

        ctx.lineTo(
            enemy.x - r * 0.55,
            enemy.y - r * 0.24
        );

        ctx.lineTo(
            enemy.x + r * 0.55,
            enemy.y - r * 0.24
        );

        ctx.closePath();
        ctx.fillStyle = hatGradient;
        ctx.fill();

        ctx.strokeStyle = "#ff9b32";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();

        ctx.ellipse(
            enemy.x,
            enemy.y - r * 0.22,
            r * 0.72,
            r * 0.15,
            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#7b1e18";
        ctx.fill();
        ctx.stroke();

        const player =
            api.getPlayer();

        const wandAngle =
            Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(wandAngle);

        ctx.fillStyle = "#4a2117";

        ctx.fillRect(
            r * 0.18,
            -r * 0.07,
            r * 0.90,
            r * 0.14
        );

        ctx.beginPath();

        ctx.arc(
            r * 1.10,
            0,
            r * 0.14,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            enemy.castFlash > 0
                ? "#fff59a"
                : "#ff6d15";

        ctx.shadowBlur =
            enemy.castFlash > 0
                ? 18
                : 8;

        ctx.shadowColor = "#ff4d00";
        ctx.fill();
        ctx.restore();

        ctx.save();

        ctx.fillStyle = "#ffe45a";
        ctx.shadowBlur = 9;
        ctx.shadowColor = "#ff3200";

        ctx.beginPath();

        ctx.arc(
            enemy.x - r * 0.27,
            enemy.y - r * 0.03,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + r * 0.27,
            enemy.y - r * 0.03,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = "#1b0b09";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.085
            );

        ctx.lineCap = "round";
        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.45,
            enemy.y - r * 0.28
        );

        ctx.lineTo(
            enemy.x - r * 0.08,
            enemy.y - r * 0.12
        );

        ctx.moveTo(
            enemy.x + r * 0.45,
            enemy.y - r * 0.28
        );

        ctx.lineTo(
            enemy.x + r * 0.08,
            enemy.y - r * 0.12
        );

        ctx.moveTo(
            enemy.x - r * 0.27,
            enemy.y + r * 0.43
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + r * 0.20,
            enemy.x + r * 0.27,
            enemy.y + r * 0.43
        );

        ctx.stroke();
        ctx.restore();

        if (enemy.shieldActive) {
            const pulse =
                1 +
                Math.sin(
                    enemy.shieldPulse
                ) *
                0.04;

            ctx.save();
            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                r * 1.34 * pulse,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(255,111,22,0.10)";

            ctx.fill();

            ctx.strokeStyle =
                "rgba(255,218,92,0.94)";

            ctx.lineWidth = 6;
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#ff5a0a";
            ctx.stroke();

            ctx.restore();
        }
    }
};

export default lavaWizard;