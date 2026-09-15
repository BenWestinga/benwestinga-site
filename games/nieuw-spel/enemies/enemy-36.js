function absorbOverlappingBullets(enemy) {
    const bullets = window.bullets;

    if (!Array.isArray(bullets)) {
        return;
    }

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {
        const bullet = bullets[i];

        if (!bullet) {
            continue;
        }

        const distance =
            Math.hypot(
                bullet.x - enemy.x,
                bullet.y - enemy.y
            );

        if (
            distance <=
            bullet.radius + enemy.radius
        ) {
            bullet.remainingPierce = 0;
            bullets.splice(i, 1);
        }
    }
}


const lavaWave = {
    id: "lava-wave",
    name: "Lava Wave",
    behavior: "horizontal-lava-wave",

    hp: 1,
    size: 18,
    speed: "mediumFast",

    color: "#ff5a0a",
    image: "lava.png",

    modifyDamage(enemy) {
        absorbOverlappingBullets(enemy);
        return 0;
    },

    spawn({
        definition,
        api
    }) {
        const canvas =
            api.getCanvas();

        const radius =
            api.getEnemyRadius(
                definition.size
            );

        const side =
            Math.random() < 0.5
                ? "left"
                : "right";

        const position =
            api.randomSpawnPosition(
                radius,
                {
                    side
                }
            );

        const minimumY =
            radius + 20;

        const maximumY =
            canvas.height -
            radius -
            20;

        position.y =
            maximumY > minimumY
                ? minimumY +
                  Math.random() *
                  (
                      maximumY -
                      minimumY
                  )
                : canvas.height / 2;

        return api.createEntity(
            definition,
            position,
            {
                spawnSide: side,
                collidesWithPlayer: true
            }
        );
    },

    onSpawn(enemy, api) {
        enemy.speed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.vx =
            enemy.spawnSide === "left"
                ? enemy.speed
                : -enemy.speed;

        enemy.vy = 0;

        enemy.waveAnimation =
            Math.random() *
            Math.PI *
            2;
    },

    update(enemy, dt, api) {
        enemy.vx =
            enemy.spawnSide === "left"
                ? enemy.speed
                : -enemy.speed;

        enemy.vy = 0;

        api.moveStraight(enemy, dt);

        enemy.waveAnimation +=
            dt * 5;

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
        }

        if (
            enemy.enteredArena &&
            api.isFullyOutsideArena(enemy)
        ) {
            api.removeEnemy(enemy);
        }
    },

    draw(enemy, ctx, api) {
        const r = enemy.radius;

        const direction =
            enemy.vx >= 0
                ? 1
                : -1;

        const image =
            api.getAssetImage(
                this.image
            );

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        if (direction < 0) {
            ctx.scale(-1, 1);
        }

        const gradient =
            ctx.createLinearGradient(
                -r,
                0,
                r,
                0
            );

        gradient.addColorStop(
            0,
            "#8d1d08"
        );

        gradient.addColorStop(
            0.48,
            "#ff5b08"
        );

        gradient.addColorStop(
            1,
            "#ffd04a"
        );

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.90,
            r * 0.72
        );

        ctx.quadraticCurveTo(
            -r * 0.55,
            r,
            0,
            r * 0.72
        );

        ctx.quadraticCurveTo(
            r * 0.52,
            r * 0.42,
            r * 0.96,
            0
        );

        ctx.quadraticCurveTo(
            r * 0.65,
            -r * 0.72,
            r * 0.12,
            -r * 0.76
        );

        ctx.quadraticCurveTo(
            -r * 0.18,
            -r * 1.04,
            -r * 0.42,
            -r * 0.58
        );

        ctx.quadraticCurveTo(
            -r * 0.68,
            -r * 0.88,
            -r * 0.90,
            -r * 0.34
        );

        ctx.closePath();

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 18;

        ctx.shadowColor =
            "rgba(255,80,5,0.85)";

        ctx.fill();
        ctx.shadowBlur = 0;

        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {
            ctx.save();
            ctx.clip();

            ctx.globalAlpha = 0.48;

            ctx.drawImage(
                image,
                -r,
                -r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        ctx.strokeStyle = "#ffbd45";
        ctx.lineWidth = 5;
        ctx.stroke();

        for (
            let i = 0;
            i < 4;
            i++
        ) {
            const y =
                -r * 0.50 +
                i * r * 0.34;

            const wobble =
                Math.sin(
                    enemy.waveAnimation +
                    i * 1.4
                ) *
                r *
                0.10;

            ctx.beginPath();

            ctx.moveTo(
                -r * 0.62,
                y
            );

            ctx.quadraticCurveTo(
                -r * 0.08,
                y + wobble,
                r * 0.50,
                y - r * 0.08
            );

            ctx.strokeStyle =
                "rgba(255,235,120,0.72)";

            ctx.lineWidth = 3;
            ctx.stroke();
        }

        ctx.restore();
    }
};

export default lavaWave;