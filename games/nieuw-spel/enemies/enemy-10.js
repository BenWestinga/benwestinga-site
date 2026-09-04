const swordThrows = [];


function clearSwordThrows() {
    swordThrows.length =
        0;
}


const landedSwordDefinition = {
    id: "knight-sword-object",
    name: "Knight Sword",

    behavior: "static-object",

    hp: 3,
    size: 1,

    speed: "ultraSlow",

    color: "#aeb6bd",

    collidesWithPlayer: true,

    draw(enemy, ctx) {
        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        /*
            Blade
        */

        ctx.lineCap =
            "round";

        ctx.strokeStyle =
            "#d8dde2";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.42
            );


        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.48,
            y + r * 0.48
        );

        ctx.lineTo(
            x + r * 0.55,
            y - r * 0.55
        );

        ctx.stroke();


        /*
            Dark edge
        */

        ctx.strokeStyle =
            "#565e66";

        ctx.lineWidth =
            Math.max(
                1.5,
                r * 0.13
            );

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.42,
            y + r * 0.42
        );

        ctx.lineTo(
            x + r * 0.58,
            y - r * 0.58
        );

        ctx.stroke();


        /*
            Guard
        */

        ctx.strokeStyle =
            "#6d5428";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.25
            );

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.52,
            y + r * 0.08
        );

        ctx.lineTo(
            x - r * 0.02,
            y + r * 0.58
        );

        ctx.stroke();


        /*
            Handle
        */

        ctx.strokeStyle =
            "#392819";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.25
            );

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.45,
            y + r * 0.45
        );

        ctx.lineTo(
            x - r * 0.72,
            y + r * 0.72
        );

        ctx.stroke();


        ctx.restore();
    }
};


function throwSword(
    enemy,
    api,
    config
) {
    const player =
        api.getPlayer();


    swordThrows.push({
        startX:
            enemy.x,

        startY:
            enemy.y,

        x:
            enemy.x,

        y:
            enemy.y,

        targetX:
            player.x,

        targetY:
            player.y,

        elapsed:
            0,

        duration:
            config.swordFlightDuration,

        radius:
            config.flyingSwordRadius,

        targetRadius:
            config.swordLandingRadius
    });


    enemy.hasThrownSword =
        true;
}


function spawnLandedSword(
    projectile,
    api
) {
    const sword =
        api.createEntity(

            landedSwordDefinition,

            {
                x:
                    projectile.targetX,

                y:
                    projectile.targetY
            },

            {
                hp:
                    3,

                maxHp:
                    3,

                radius:
                    10,

                speed:
                    0,

                vx:
                    0,

                vy:
                    0,

                collidesWithPlayer:
                    true,

                enteredArena:
                    true,

                alwaysShowHealthBar:
                    false
            }
        );


    api.getEnemies().push(
        sword
    );
}


const knight = {
    id: "knight",
    name: "Knight",

    behavior: "knight-chase",

    hp: 8,
    size: 2,

    speed: "medium",
    tracking: 0.3,

    color: "#4f9845",

    throwRadius: 260,

    swordFlightDuration: 0.75,

    flyingSwordRadius: 9,

    swordLandingRadius: 14,


    reset() {
        clearSwordThrows();
    },


    onPlayerDeath() {
        clearSwordThrows();
    },


    onLevelWin() {
        clearSwordThrows();
    },


    onSpawn(enemy) {
        enemy.hasThrownSword =
            false;
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


        /*
            Tracking enemy:
            eenmaal binnen = binnen blijven.
        */

        if (
            enemy.enteredArena
        ) {
            api.keepInsideArena(
                enemy
            );
        }


        /*
            Zwaard slechts één keer gooien.
        */

        if (
            enemy.hasThrownSword
        ) {
            return;
        }


        const player =
            api.getPlayer();


        const distance =
            Math.hypot(
                player.x -
                    enemy.x,

                player.y -
                    enemy.y
            );


        if (
            distance <=
            this.throwRadius
        ) {
            throwSword(
                enemy,
                api,
                this
            );
        }
    },


    afterUpdate(dt, api) {
        for (
            let i =
                swordThrows.length - 1;

            i >= 0;

            i--
        ) {
            const projectile =
                swordThrows[i];


            projectile.elapsed +=
                dt;


            const progress =
                Math.min(
                    1,

                    projectile.elapsed /
                        projectile.duration
                );


            projectile.x =
                projectile.startX +

                (
                    projectile.targetX -
                    projectile.startX
                ) *

                progress;


            projectile.y =
                projectile.startY +

                (
                    projectile.targetY -
                    projectile.startY
                ) *

                progress;


            if (
                progress <
                1
            ) {
                continue;
            }


            /*
                Zwaard landt.
            */

            spawnLandedSword(
                projectile,
                api
            );


            /*
                Als speler precies op
                landing staat -> dood.
            */

            if (
                api.playerTouchesCircle(
                    projectile.targetX,
                    projectile.targetY,
                    projectile.targetRadius
                )
            ) {
                api.killPlayer();
            }


            swordThrows.splice(
                i,
                1
            );


            if (
                api.getPlayer().alive ===
                false
            ) {
                return;
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
            Zwaard zichtbaar zolang
            Knight hem nog heeft.
        */

        if (
            enemy.hasThrownSword
        ) {
            return;
        }


        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        /*
            Klein zwaard aan rechterkant.
        */

        ctx.strokeStyle =
            "#d3d9de";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.16
            );

        ctx.lineCap =
            "round";


        ctx.beginPath();

        ctx.moveTo(
            x + r * 0.33,
            y + r * 0.25
        );

        ctx.lineTo(
            x + r * 0.82,
            y - r * 0.55
        );

        ctx.stroke();


        ctx.strokeStyle =
            "#5e4927";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.18
            );


        ctx.beginPath();

        ctx.moveTo(
            x + r * 0.25,
            y + r * 0.18
        );

        ctx.lineTo(
            x + r * 0.50,
            y + r * 0.40
        );

        ctx.stroke();


        ctx.restore();
    },


    /*
        Zwarte landingscirkel
        ONDER enemies.
    */

    drawBelow(ctx) {
        for (
            const projectile
            of swordThrows
        ) {
            ctx.save();


            ctx.beginPath();

            ctx.arc(
                projectile.targetX,
                projectile.targetY,
                projectile.targetRadius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(0,0,0,0.70)";

            ctx.fill();


            ctx.lineWidth =
                3;

            ctx.strokeStyle =
                "rgba(0,0,0,0.95)";

            ctx.stroke();


            ctx.restore();
        }
    },


    /*
        Vliegend zwaard.
    */

    drawGlobal(ctx) {
        for (
            const projectile
            of swordThrows
        ) {
            const progress =
                Math.min(
                    1,

                    projectile.elapsed /
                        projectile.duration
                );


            const arcHeight =
                Math.sin(
                    progress *
                    Math.PI
                ) *
                90;


            const drawX =
                projectile.x;

            const drawY =
                projectile.y -
                arcHeight;


            const spin =
                progress *
                Math.PI *
                4;


            ctx.save();


            ctx.translate(
                drawX,
                drawY
            );

            ctx.rotate(
                spin
            );


            /*
                Blade
            */

            ctx.strokeStyle =
                "#dce1e5";

            ctx.lineWidth =
                5;

            ctx.lineCap =
                "round";


            ctx.beginPath();

            ctx.moveTo(
                -8,
                8
            );

            ctx.lineTo(
                8,
                -8
            );

            ctx.stroke();


            /*
                Guard
            */

            ctx.strokeStyle =
                "#765d30";

            ctx.lineWidth =
                4;


            ctx.beginPath();

            ctx.moveTo(
                -7,
                2
            );

            ctx.lineTo(
                -2,
                7
            );

            ctx.stroke();


            ctx.restore();
        }
    }
};


export default knight;