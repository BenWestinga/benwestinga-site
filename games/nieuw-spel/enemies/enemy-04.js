const projectiles = [];

function clearProjectiles() {
    projectiles.length =
        0;
}

function fireProjectile(
    enemy,
    api,
    config
) {
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
        ) || 1;

    projectiles.push({
        x:
            enemy.x,

        y:
            enemy.y,

        vx:
            (
                dx /
                distance
            ) *
            config.projectileSpeed,

        vy:
            (
                dy /
                distance
            ) *
            config.projectileSpeed,

        radius:
            config.projectileRadius,

        color:
            config.projectileColor
    });
}

const sandShooter = {
    id: "sand-shooter",
    name: "Sand Shooter",
    behavior: "sand-shooter",

    hp: 3,
    size: 2,

    shape: "square",

    speed: "verySlow",
    tracking: 0.02,

    color: "#f1d84b",

    shootInterval: 3,

    projectileRadius: 6,
    projectileSpeed: 260,
    projectileColor: "#e32626",

    reset() {
        clearProjectiles();
    },

    onPlayerDeath() {
        clearProjectiles();
    },

    onLevelWin() {
        clearProjectiles();
    },

    onSpawn(enemy, api) {
        enemy.shootTimer =
            0;

        api.aimVelocityAtPlayer(
            enemy
        );
    },

    update(enemy, dt, api) {
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

        enemy.shootTimer +=
            dt;

        while (
            enemy.shootTimer >=
            this.shootInterval
        ) {
            enemy.shootTimer -=
                this.shootInterval;

            fireProjectile(
                enemy,
                api,
                this
            );
        }
    },

    afterUpdate(
        dt,
        api
    ) {
        const canvas =
            api.getCanvas();

        for (
            let i =
                projectiles.length -
                1;

            i >= 0;

            i--
        ) {
            const projectile =
                projectiles[i];

            projectile.x +=
                projectile.vx *
                dt;

            projectile.y +=
                projectile.vy *
                dt;

            if (
                api.playerTouchesCircle(
                    projectile.x,
                    projectile.y,
                    projectile.radius
                )
            ) {
                projectiles.splice(
                    i,
                    1
                );

                api.killPlayer();

                return;
            }

            const margin =
                projectile.radius +
                40;

            if (
                projectile.x <
                    -margin ||

                projectile.x >
                    canvas.width +
                    margin ||

                projectile.y <
                    -margin ||

                projectile.y >
                    canvas.height +
                    margin
            ) {
                projectiles.splice(
                    i,
                    1
                );
            }
        }
    },

    draw(enemy, ctx, api) {
        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    true,

                shape:
                    "square"
            }
        );
    },

    drawGlobal(ctx) {
        for (
            const projectile
            of projectiles
        ) {
            ctx.save();

            ctx.beginPath();

            ctx.arc(
                projectile.x,
                projectile.y,
                projectile.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                projectile.color;

            ctx.fill();

            ctx.lineWidth =
                2;

            ctx.strokeStyle =
                "rgba(80,0,0,0.85)";

            ctx.stroke();

            ctx.restore();
        }
    }
};

export default sandShooter;