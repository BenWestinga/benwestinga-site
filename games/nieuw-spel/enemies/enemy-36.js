function circleTouchesWave(
    enemy,
    x,
    y,
    radius,
    heightMultiplier
) {
    const horizontalRadius =
        enemy.radius +
        radius;

    const verticalRadius =
        enemy.radius *
        heightMultiplier +
        radius;

    const normalizedX =
        (x - enemy.x) /
        horizontalRadius;

    const normalizedY =
        (y - enemy.y) /
        verticalRadius;

    return (
        normalizedX * normalizedX +
        normalizedY * normalizedY <=
        1
    );
}


function absorbOverlappingBullets(
    enemy,
    heightMultiplier
) {
    const bullets =
        window.bullets;

    if (!Array.isArray(bullets)) {
        return;
    }

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {
        const bullet =
            bullets[i];

        if (!bullet) {
            continue;
        }

        if (
            circleTouchesWave(
                enemy,
                bullet.x,
                bullet.y,
                bullet.radius,
                heightMultiplier
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

    /*
        De golf is nu 2.5 keer hoger
        in plaats van 2.5 keer breder.
    */

    heightMultiplier: 2.5,

    color: "#ff5a0a",

    modifyDamage(enemy) {
        absorbOverlappingBullets(
            enemy,
            this.heightMultiplier
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

        const halfHeight =
            radius *
            definition.heightMultiplier;

        const side =
            Math.random() < 0.5
                ? "left"
                : "right";

        const position =
            api.randomSpawnPosition(
                radius,
                { side }
            );

        const minimumY =
            halfHeight + 20;

        const maximumY =
            canvas.height -
            halfHeight -
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

        api.moveStraight(
            enemy,
            dt
        );

        absorbOverlappingBullets(
            enemy,
            this.heightMultiplier
        );

        const player =
            api.getPlayer();

        if (
            circleTouchesWave(
                enemy,
                player.x,
                player.y,
                player.radius,
                this.heightMultiplier
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

    draw(enemy, ctx) {
        const r =
            enemy.radius;

        const direction =
            enemy.vx >= 0
                ? 1
                : -1;

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        /*
            Horizontaal spiegelen voor
            de bewegingsrichting.

            Verticaal 2.5 keer uitrekken.
        */

        ctx.scale(
            direction < 0 ? -1 : 1,
            this.heightMultiplier
        );

        /*
            Eén eenvoudige gradient.
            Geen lava.png, clipping of
            zware shadows meer.
        */

        const gradient =
            ctx.createLinearGradient(
                -r,
                0,
                r,
                0
            );

        gradient.addColorStop(
            0,
            "#8c1708"
        );

        gradient.addColorStop(
            0.62,
            "#ee3b08"
        );

        gradient.addColorStop(
            1,
            "#ff8b20"
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

        ctx.fillStyle =
            gradient;

        ctx.fill();

        ctx.strokeStyle =
            "#ff9d36";

        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
    }
};


export default lavaWave;