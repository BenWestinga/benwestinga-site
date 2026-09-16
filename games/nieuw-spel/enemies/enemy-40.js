const burrowShards = [];


function chooseRandomDirection(enemy) {
    const angle = Math.random() * Math.PI * 2;

    enemy.vx = Math.cos(angle) * enemy.speed;
    enemy.vy = Math.sin(angle) * enemy.speed;
}


function isOutsideArena(projectile, canvas) {
    const margin = projectile.radius + 30;

    return (
        projectile.x < -margin ||
        projectile.x > canvas.width + margin ||
        projectile.y < -margin ||
        projectile.y > canvas.height + margin
    );
}


const lavaBurrower = {
    id: "lava-burrower",
    name: "Lava Burrower",
    behavior: "burrowing-lava-hunter",

    hp: 35,
    size: 4,
    speed: "mediumSlow",
    tracking: 1.35,

    color: "#6f291b",
    image: "lava.png",

    visibleDuration: 5,
    burrowDuration: 2.5,
    lockDuration: 0.7,
    burrowSpeed: "fast",
    burrowTracking: 3.6,

    eruptionRadius: 95,
    eruptionDuration: 0.38,

    shardCount: 8,
    shardSize: 1.5,
    shardSpeed: "medium",
    shardLifetime: 7,

    reset() {
        burrowShards.length = 0;
    },

    onPlayerDeath() {
        burrowShards.length = 0;
    },

    onLevelWin() {
        burrowShards.length = 0;
    },

    modifyDamage(enemy, damage) {
        if (enemy.burrowState === "underground") {
            return 0;
        }

        return damage;
    },

    onSpawn(enemy, api) {
        enemy.baseBurrowerSpeed =
            api.getEnemySpeed(this.speed);

        enemy.undergroundSpeed =
            api.getEnemySpeed(this.burrowSpeed);

        enemy.speed =
            enemy.baseBurrowerSpeed;

        enemy.burrowState = "visible";
        enemy.visibleRemaining =
            this.visibleDuration;

        enemy.burrowRemaining = 0;
        enemy.targetLocked = false;

        enemy.attackActivated = false;
        enemy.collidesWithPlayer = true;

        enemy.crackPulse =
            Math.random() * Math.PI * 2;

        enemy.eruptionFlash = 0;

        api.aimVelocityAtPlayer(enemy);
    },

    beginBurrow(enemy, api) {
        enemy.burrowState =
            "underground";

        enemy.burrowRemaining =
            this.burrowDuration;

        enemy.targetLocked = false;
        enemy.collidesWithPlayer = false;
        enemy.speed = enemy.undergroundSpeed;

        api.aimVelocityAtPlayer(
            enemy,
            enemy.undergroundSpeed
        );
    },

    createEruptionShards(enemy, api) {
        const radius =
            api.getEnemyRadius(
                this.shardSize
            );

        const speed =
            api.getEnemySpeed(
                this.shardSpeed
            );

        const baseAngle =
            Math.random() * Math.PI * 2;

        for (
            let i = 0;
            i < this.shardCount;
            i++
        ) {
            const angle =
                baseAngle +
                i *
                Math.PI *
                2 /
                this.shardCount;

            const spawnDistance =
                enemy.radius +
                radius +
                7;

            burrowShards.push({
                x:
                    enemy.x +
                    Math.cos(angle) *
                    spawnDistance,

                y:
                    enemy.y +
                    Math.sin(angle) *
                    spawnDistance,

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                radius,
                angle,

                remaining:
                    this.shardLifetime
            });
        }
    },

    emerge(enemy, api) {
        enemy.burrowState =
            "visible";

        enemy.visibleRemaining =
            this.visibleDuration;

        enemy.burrowRemaining = 0;
        enemy.targetLocked = false;
        enemy.collidesWithPlayer = true;
        enemy.speed = enemy.baseBurrowerSpeed;
        enemy.eruptionFlash = 0.35;

        api.createExplosion(
            enemy.x,
            enemy.y,
            this.eruptionRadius,
            this.eruptionDuration
        );

        this.createEruptionShards(
            enemy,
            api
        );

        chooseRandomDirection(enemy);

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    beforeUpdate(dt, api) {
        const canvas =
            api.getCanvas();

        for (
            let i = burrowShards.length - 1;
            i >= 0;
            i--
        ) {
            const shard =
                burrowShards[i];

            shard.x += shard.vx * dt;
            shard.y += shard.vy * dt;
            shard.remaining -= dt;

            if (
                api.playerTouchesCircle(
                    shard.x,
                    shard.y,
                    shard.radius
                )
            ) {
                burrowShards.splice(i, 1);
                api.killPlayer();
                return;
            }

            if (
                shard.remaining <= 0 ||
                isOutsideArena(
                    shard,
                    canvas
                )
            ) {
                burrowShards.splice(i, 1);
            }
        }
    },

    updateVisible(enemy, dt, api) {
        enemy.speed =
            enemy.baseBurrowerSpeed;

        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );

        api.keepInsideArena(
            enemy,
            14,
            true
        );

        enemy.visibleRemaining -= dt;

        if (
            enemy.visibleRemaining <= 0
        ) {
            this.beginBurrow(
                enemy,
                api
            );
        }
    },

    updateUnderground(enemy, dt, api) {
        enemy.burrowRemaining -= dt;

        if (
            enemy.burrowRemaining >
            this.lockDuration
        ) {
            enemy.speed =
                enemy.undergroundSpeed;

            api.moveTowardPlayer(
                enemy,
                dt,
                this.burrowTracking
            );
        } else {
            enemy.targetLocked = true;
            enemy.vx = 0;
            enemy.vy = 0;
        }

        api.keepInsideArena(
            enemy,
            14,
            true
        );

        if (
            enemy.burrowRemaining <= 0
        ) {
            this.emerge(
                enemy,
                api
            );
        }
    },

    update(enemy, dt, api) {
        enemy.crackPulse += dt * 6;

        if (enemy.eruptionFlash > 0) {
            enemy.eruptionFlash =
                Math.max(
                    0,
                    enemy.eruptionFlash - dt
                );
        }

        if (!enemy.enteredArena) {
            enemy.speed =
                enemy.baseBurrowerSpeed;

            api.moveStraight(
                enemy,
                dt
            );

            if (
                api.isInsideArena(enemy)
            ) {
                enemy.enteredArena = true;
                enemy.attackActivated = true;

                enemy.visibleRemaining =
                    this.visibleDuration;

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

            enemy.visibleRemaining =
                this.visibleDuration;
        }

        if (
            enemy.burrowState ===
            "underground"
        ) {
            this.updateUnderground(
                enemy,
                dt,
                api
            );

            return;
        }

        this.updateVisible(
            enemy,
            dt,
            api
        );
    },

    drawGlobal(ctx) {
        for (
            const shard of
            burrowShards
        ) {
            const r =
                shard.radius;

            ctx.save();

            ctx.translate(
                shard.x,
                shard.y
            );

            ctx.rotate(
                shard.angle
            );

            ctx.beginPath();

            ctx.moveTo(
                r,
                0
            );

            ctx.lineTo(
                -r * 0.65,
                -r * 0.58
            );

            ctx.lineTo(
                -r * 0.35,
                0
            );

            ctx.lineTo(
                -r * 0.65,
                r * 0.58
            );

            ctx.closePath();

            ctx.fillStyle =
                "#ff5a13";

            ctx.fill();

            ctx.strokeStyle =
                "#ffd05b";

            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    },

    drawUnderground(enemy, ctx) {
        const locking =
            enemy.burrowRemaining <=
            this.lockDuration;

        const lockProgress =
            locking

                ? Math.max(
                    0,
                    Math.min(
                        1,

                        1 -
                        enemy.burrowRemaining /
                        this.lockDuration
                    )
                )

                : 0;

        const pulse =
            1 +
            Math.sin(
                enemy.crackPulse
            ) *
            0.08;

        ctx.save();

        if (locking) {
            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                this.eruptionRadius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(190,0,0,${
                    0.10 +
                    lockProgress *
                    0.20
                })`;

            ctx.fill();

            ctx.strokeStyle =
                `rgba(255,56,20,${
                    0.58 +
                    lockProgress *
                    0.40
                })`;

            ctx.lineWidth = 4;

            ctx.setLineDash([
                12,
                9
            ]);

            ctx.stroke();

            ctx.setLineDash([]);
        }

        const crackRadius =
            enemy.radius *
            0.72 *
            pulse;

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(
            enemy.crackPulse *
            0.12
        );

        ctx.strokeStyle =
            locking
                ? "#ff3218"
                : "#ff7a20";

        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        ctx.beginPath();

        ctx.moveTo(
            -crackRadius,
            0
        );

        ctx.lineTo(
            -crackRadius * 0.32,
            crackRadius * 0.18
        );

        ctx.lineTo(
            0,
            -crackRadius * 0.30
        );

        ctx.lineTo(
            crackRadius * 0.36,
            crackRadius * 0.16
        );

        ctx.lineTo(
            crackRadius,
            -crackRadius * 0.08
        );

        ctx.moveTo(
            -crackRadius * 0.18,
            crackRadius * 0.12
        );

        ctx.lineTo(
            -crackRadius * 0.38,
            crackRadius * 0.65
        );

        ctx.moveTo(
            crackRadius * 0.30,
            0
        );

        ctx.lineTo(
            crackRadius * 0.52,
            -crackRadius * 0.58
        );

        ctx.stroke();

        ctx.restore();
    },

    draw(enemy, ctx, api) {
        if (
            enemy.burrowState ===
            "underground"
        ) {
            this.drawUnderground(
                enemy,
                ctx
            );

            return;
        }

        const r =
            enemy.radius;

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,
                color: "#64271c",
                strokeStyle: "#ff7b24",
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

            ctx.globalAlpha = 0.38;

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

        ctx.fillStyle =
            "#2b1712";

        ctx.strokeStyle =
            "#ff9b32";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.72,
            enemy.y + r * 0.10
        );

        ctx.lineTo(
            enemy.x - r * 1.08,
            enemy.y + r * 0.46
        );

        ctx.lineTo(
            enemy.x - r * 0.54,
            enemy.y + r * 0.40
        );

        ctx.closePath();

        ctx.moveTo(
            enemy.x + r * 0.72,
            enemy.y + r * 0.10
        );

        ctx.lineTo(
            enemy.x + r * 1.08,
            enemy.y + r * 0.46
        );

        ctx.lineTo(
            enemy.x + r * 0.54,
            enemy.y + r * 0.40
        );

        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        ctx.fillStyle =
            "#ffe45c";

        ctx.shadowBlur = 9;

        ctx.shadowColor =
            "#ff3b00";

        ctx.beginPath();

        ctx.ellipse(
            enemy.x - r * 0.28,
            enemy.y - r * 0.10,
            r * 0.12,
            r * 0.08,
            -0.25,
            0,
            Math.PI * 2
        );

        ctx.ellipse(
            enemy.x + r * 0.28,
            enemy.y - r * 0.10,
            r * 0.12,
            r * 0.08,
            0.25,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "#1b0c09";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.30,
            enemy.y + r * 0.40
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + r * 0.24,

            enemy.x + r * 0.30,
            enemy.y + r * 0.40
        );

        ctx.stroke();

        ctx.restore();
    }
};


export default lavaBurrower;