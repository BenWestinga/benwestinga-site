const lavaGoon = {
    id: "lava-goon",
    name: "Lava Goon",
    behavior: "bouncing-lava-goon",

    hp: 10,
    size: 2,
    speed: "medium",

    color: "#ff6a1a",
    image: "lava.png",

    onSpawn(enemy, api) {
        enemy.baseLavaSpeed =
            api.getEnemySpeed(this.speed);

        enemy.speed =
            enemy.baseLavaSpeed;

        enemy.glowPulse =
            Math.random() * Math.PI * 2;

        api.aimVelocityAtPlayer(enemy);
    },

    update(enemy, dt, api) {
        const velocityLength =
            Math.hypot(enemy.vx, enemy.vy) || 1;

        enemy.speed =
            enemy.baseLavaSpeed;

        enemy.vx =
            enemy.vx / velocityLength * enemy.speed;

        enemy.vy =
            enemy.vy / velocityLength * enemy.speed;

        api.moveStraight(enemy, dt);

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
        }

        if (enemy.enteredArena) {
            api.keepInsideArena(enemy, 14, true);
        }

        enemy.glowPulse += dt * 4;
    },

    draw(enemy, ctx, api) {
        const r = enemy.radius;

        api.drawDefaultEnemy(enemy, {
            face: false,
            color: "#ff6a1a",
            strokeStyle: "#ffbd52",
            lineWidth: 3
        });

        const image =
            api.getAssetImage(this.image);

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
            ctx.globalAlpha = 0.72;

            ctx.drawImage(
                image,
                enemy.x - r,
                enemy.y - r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        const pulse =
            0.55 +
            Math.sin(enemy.glowPulse) * 0.15;

        ctx.save();

        ctx.strokeStyle =
            `rgba(255,225,95,${pulse})`;

        ctx.lineWidth =
            Math.max(2, r * 0.07);

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.55,
            enemy.y + r * 0.28
        );

        ctx.lineTo(
            enemy.x - r * 0.12,
            enemy.y + r * 0.06
        );

        ctx.lineTo(
            enemy.x + r * 0.16,
            enemy.y + r * 0.40
        );

        ctx.lineTo(
            enemy.x + r * 0.52,
            enemy.y + r * 0.18
        );

        ctx.stroke();
        ctx.restore();

        api.drawEnemyFace(enemy);
    }
};

export default lavaGoon;