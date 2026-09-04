const shotgunProjectiles =
    [];


function clearShotgunProjectiles() {
    shotgunProjectiles.length =
        0;
}


function fireShotgun(
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


    const baseAngle =
        Math.atan2(
            dy,
            dx
        );


    const spreadAngles = [
        -30,
        -15,
        0,
        15,
        30
    ];


    for (
        const degrees
        of spreadAngles
    ) {
        const angle =
            baseAngle +

            degrees *
                Math.PI /
                180;


        shotgunProjectiles.push({
            x:
                enemy.x,

            y:
                enemy.y,

            vx:
                Math.cos(
                    angle
                ) *
                config.projectileSpeed,

            vy:
                Math.sin(
                    angle
                ) *
                config.projectileSpeed,

            radius:
                config.projectileRadius,

            color:
                config.projectileColor
        });
    }
}


const shotgunGoon = {
    id: "shotgun-goon",
    name: "Shotgun Goon",

    behavior: "shotgun-goon",

    hp: 5,
    size: 2,

    speed: "ultraSlow",

    tracking: 0.02,

    color: "#487f3d",

    shootInterval: 8,

    projectileRadius: 6,

    projectileSpeed: 180,

    projectileColor: "#7b442c",


    reset() {
        clearShotgunProjectiles();
    },


    onPlayerDeath() {
        clearShotgunProjectiles();
    },


    onLevelWin() {
        clearShotgunProjectiles();
    },


    onSpawn(enemy) {
        enemy.shootTimer =
            0;
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


            fireShotgun(
                enemy,
                api,
                this
            );
        }
    },


    afterUpdate(dt, api) {
        const canvas =
            api.getCanvas();


        for (
            let i =
                shotgunProjectiles.length -
                1;

            i >= 0;

            i--
        ) {
            const projectile =
                shotgunProjectiles[i];


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
                shotgunProjectiles.splice(
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
                shotgunProjectiles.splice(
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
                    true
            }
        );


        /*
            Simpele dubbele shotgun
            onderaan/rechts.
        */

        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        ctx.lineCap =
            "round";


        /*
            Twee barrels.
        */

        ctx.strokeStyle =
            "#454b50";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.13
            );


        ctx.beginPath();

        ctx.moveTo(
            x + r * 0.20,
            y + r * 0.24
        );

        ctx.lineTo(
            x + r * 0.78,
            y + r * 0.05
        );


        ctx.moveTo(
            x + r * 0.18,
            y + r * 0.35
        );

        ctx.lineTo(
            x + r * 0.78,
            y + r * 0.16
        );


        ctx.stroke();


        /*
            Houten deel.
        */

        ctx.strokeStyle =
            "#714823";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.18
            );


        ctx.beginPath();

        ctx.moveTo(
            x + r * 0.18,
            y + r * 0.29
        );

        ctx.lineTo(
            x - r * 0.15,
            y + r * 0.48
        );

        ctx.stroke();


        ctx.restore();
    },


    drawGlobal(ctx) {
        for (
            const projectile
            of shotgunProjectiles
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
                "rgba(50,20,10,0.85)";

            ctx.stroke();


            ctx.restore();
        }
    }
};


export default shotgunGoon;