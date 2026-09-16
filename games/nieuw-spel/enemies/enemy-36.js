function circleTouchesWave(
    enemy,
    x,
    y,
    radius,
    widthMultiplier
) {
    const horizontalRadius =
        enemy.radius * widthMultiplier + radius;

    const verticalRadius =
        enemy.radius + radius;

    const normalizedX =
        (x - enemy.x) / horizontalRadius;

    const normalizedY =
        (y - enemy.y) / verticalRadius;

    return (
        normalizedX * normalizedX +
        normalizedY * normalizedY <=
        1
    );
}


function absorbOverlappingBullets(
    enemy,
    widthMultiplier
) {
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

        if (
            circleTouchesWave(
                enemy,
                bullet.x,
                bullet.y,
                bullet.radius,
                widthMultiplier
            )
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

    widthMultiplier: 2.5,

    color: "#ff5a0a",
    image: "lava.png",

    modifyDamage(enemy) {
        absorbOverlappingBullets(
            enemy,
            this.widthMultiplier
        );

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

        const halfWidth =
            radius *
            definition.widthMultiplier;

        const side =
            Math.random() < 0.5
                ? "left"
                : "right";

        const position =
            api.randomSpawnPosition(
                halfWidth,
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
                collidesWithPlayer: false
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
    },

    update(enemy, dt, api) {
        enemy.vx =
            enemy.spawnSide === "left"
                ? enemy.speed
                : -enemy.speed;

        enemy.vy = 0;

        api.moveStraight(enemy, dt);

        absorbOverlappingBullets(
            enemy,
            this.widthMultiplier
        );

        const player =
            api.getPlayer();

        if (
            circleTouchesWave(
                enemy,
                player.x,
                player.y,
                player.radius,
                this.widthMultiplier
            )
        ) {
            api.killPlayer();
            return;
        }

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

        ctx.scale(
            direction < 0
                ? -this.widthMultiplier
                : this.widthMultiplier,
            1
        );

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

        ctx.restore();
    }
};

export default lavaWave;