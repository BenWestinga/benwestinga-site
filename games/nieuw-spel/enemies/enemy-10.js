const swordThrows = [];


function clearSwordThrows() {
    swordThrows.length = 0;
}


const landedSwordDefinition = {
    id: "knight-sword-object",
    name: "Knight Sword",

    behavior: "static-object",

    hp: 3,
    size: 1.6,

    speed: "ultraSlow",

    color: "#c4cbd1",

    collidesWithPlayer: true,


    draw(enemy, ctx) {
        const x = enemy.x;
        const y = enemy.y;
        const r = enemy.radius;


        ctx.save();

        ctx.translate(
            x,
            y
        );

        ctx.rotate(
            -Math.PI / 4
        );


        /*
            SWORD BLADE
        */

        ctx.strokeStyle =
            "#525b63";

        ctx.lineWidth =
            Math.max(
                7,
                r * 0.42
            );

        ctx.lineCap =
            "round";


        ctx.beginPath();

        ctx.moveTo(
            0,
            r * 0.55
        );

        ctx.lineTo(
            0,
            -r * 0.90
        );

        ctx.stroke();


        /*
            LIGHT METAL INSIDE
        */

        ctx.strokeStyle =
            "#dce2e6";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.23
            );


        ctx.beginPath();

        ctx.moveTo(
            0,
            r * 0.48
        );

        ctx.lineTo(
            0,
            -r * 0.83
        );

        ctx.stroke();


        /*
            TIP
        */

        ctx.fillStyle =
            "#dce2e6";


        ctx.beginPath();

        ctx.moveTo(
            -r * 0.13,
            -r * 0.74
        );

        ctx.lineTo(
            0,
            -r * 1.05
        );

        ctx.lineTo(
            r * 0.13,
            -r * 0.74
        );

        ctx.closePath();

        ctx.fill();


        /*
            GUARD
        */

        ctx.strokeStyle =
            "#82703e";

        ctx.lineWidth =
            Math.max(
                5,
                r * 0.30
            );


        ctx.beginPath();

        ctx.moveTo(
            -r * 0.42,
            r * 0.42
        );

        ctx.lineTo(
            r * 0.42,
            r * 0.42
        );

        ctx.stroke();


        /*
            HANDLE
        */

        ctx.strokeStyle =
            "#3e2b1f";

        ctx.lineWidth =
            Math.max(
                5,
                r * 0.26
            );


        ctx.beginPath();

        ctx.moveTo(
            0,
            r * 0.42
        );

        ctx.lineTo(
            0,
            r * 0.88
        );

        ctx.stroke();


        /*
            HANDLE END
        */

        ctx.fillStyle =
            "#82703e";


        ctx.beginPath();

        ctx.arc(
            0,
            r * 0.91,
            r * 0.13,
            0,
            Math.PI * 2
        );

        ctx.fill();


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


    /*
        Sword is now gone.

        Start the 20 second
        return timer.
    */

    enemy.hasThrownSword =
        true;

    enemy.swordReturnTimer =
        0;
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
                    14,

                speed:
                    0,

                vx:
                    0,

                vy:
                    0,

                collidesWithPlayer:
                    true,

                enteredArena:
                    true
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

    hp: 9,

    size: 6,

    speed: "medium",

    tracking: 0.3,

    color: "#4e9c48",


    /*
        =========================
        MOVEMENT CYCLE

        10 sec chase
        1 sec straight
        repeat forever
        =========================
    */

    chaseDuration:
        10,

    chaseBreakDuration:
        1,


    /*
        =========================
        SWORD
        =========================
    */

    throwRadius:
        380,

    swordFlightDuration:
        0.8,

    flyingSwordRadius:
        13,

    swordLandingRadius:
        19,

    /*
        After throwing his sword,
        it returns after 20 seconds.
    */

    swordReturnDuration:
        20,


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
        /*
            Starts with a sword.
        */

        enemy.hasThrownSword =
            false;

        enemy.swordReturnTimer =
            0;


        /*
            Movement cycle starts
            with 10 seconds chase.
        */

        enemy.chaseCycleTimer =
            0;
    },


    update(enemy, dt, api) {
        /*
            ==========================================
            MOVEMENT CYCLE
            ==========================================

            0 - 10 sec:
                chase player

            10 - 11 sec:
                do not track player,
                continue straight

            repeat forever.
        */

        enemy.chaseCycleTimer +=
            dt;


        const cycleDuration =
            this.chaseDuration +
            this.chaseBreakDuration;


        const cyclePosition =
            enemy.chaseCycleTimer %
            cycleDuration;


        const isChasing =
            cyclePosition <
            this.chaseDuration;


        if (
            isChasing
        ) {
            /*
                Normal chase.
            */

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );

        } else {
            /*
                For 1 second the Knight
                does NOT change direction
                toward the player.

                He simply continues in
                his current direction.
            */

            api.moveStraight(
                enemy,
                dt
            );
        }


        /*
            ==========================================
            ARENA
            ==========================================
        */

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
            Once inside, Knight
            cannot leave the arena.
        */

        if (
            enemy.enteredArena
        ) {
            api.keepInsideArena(
                enemy
            );
        }


        /*
            ==========================================
            SWORD RETURN TIMER
            ==========================================
        */

        if (
            enemy.hasThrownSword
        ) {
            enemy.swordReturnTimer +=
                dt;


            if (
                enemy.swordReturnTimer >=
                this.swordReturnDuration
            ) {
                /*
                    Sword has returned.
                */

                enemy.hasThrownSword =
                    false;

                enemy.swordReturnTimer =
                    0;
            }
        }


        /*
            ==========================================
            THROW SWORD
            ==========================================
        */

        if (
            !enemy.hasThrownSword
        ) {
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
                progress < 1
            ) {
                continue;
            }


            spawnLandedSword(
                projectile,
                api
            );


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
                api.getPlayer()
                    .alive ===
                false
            ) {
                return;
            }
        }
    },


    draw(enemy, ctx, api) {
        /*
            GREEN BODY
        */

        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    true,

                color:
                    this.color,

                strokeStyle:
                    "#505860",

                lineWidth:
                    Math.max(
                        5,
                        enemy.radius *
                            0.13
                    )
            }
        );


        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        /*
            =====================
            ARMOR
            =====================
        */


        /*
            CHEST PLATE
        */

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.55,
            y + r * 0.05
        );

        ctx.lineTo(
            x - r * 0.40,
            y + r * 0.62
        );

        ctx.quadraticCurveTo(
            x,
            y + r * 0.82,

            x + r * 0.40,
            y + r * 0.62
        );

        ctx.lineTo(
            x + r * 0.55,
            y + r * 0.05
        );

        ctx.quadraticCurveTo(
            x,
            y + r * 0.27,

            x - r * 0.55,
            y + r * 0.05
        );


        ctx.fillStyle =
            "#747e87";

        ctx.fill();


        ctx.lineWidth =
            Math.max(
                3,
                r * 0.08
            );

        ctx.strokeStyle =
            "#40474e";

        ctx.stroke();


        /*
            METAL HIGHLIGHT
        */

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.30,
            y + r * 0.20
        );

        ctx.quadraticCurveTo(
            x,
            y + r * 0.34,

            x + r * 0.30,
            y + r * 0.20
        );


        ctx.strokeStyle =
            "#b9c3ca";

        ctx.lineWidth =
            Math.max(
                2,
                r * 0.05
            );

        ctx.stroke();


        /*
            LEFT SHOULDER
        */

        ctx.beginPath();

        ctx.arc(
            x - r * 0.62,
            y + r * 0.02,
            r * 0.25,
            Math.PI,
            Math.PI * 2
        );


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.10
            );

        ctx.strokeStyle =
            "#737d86";

        ctx.stroke();


        /*
            RIGHT SHOULDER
        */

        ctx.beginPath();

        ctx.arc(
            x + r * 0.62,
            y + r * 0.02,
            r * 0.25,
            Math.PI,
            Math.PI * 2
        );

        ctx.stroke();


        /*
            BOLTS
        */

        ctx.fillStyle =
            "#d5dce1";


        ctx.beginPath();

        ctx.arc(
            x - r * 0.40,
            y + r * 0.20,

            Math.max(
                2,
                r * 0.05
            ),

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x + r * 0.40,
            y + r * 0.20,

            Math.max(
                2,
                r * 0.05
            ),

            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.restore();


        /*
            ==========================
            SWORD IN HAND
            ==========================

            Only draw it when Knight
            currently has a sword.
        */

        if (
            enemy.hasThrownSword
        ) {
            return;
        }


        ctx.save();

        ctx.translate(
            x + r * 0.63,
            y + r * 0.10
        );

        ctx.rotate(
            0.55
        );


        /*
            BLADE
        */

        ctx.strokeStyle =
            "#dce2e6";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.10
            );

        ctx.lineCap =
            "round";


        ctx.beginPath();

        ctx.moveTo(
            0,
            r * 0.22
        );

        ctx.lineTo(
            0,
            -r * 0.65
        );

        ctx.stroke();


        /*
            GUARD
        */

        ctx.strokeStyle =
            "#876e38";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.09
            );


        ctx.beginPath();

        ctx.moveTo(
            -r * 0.15,
            r * 0.19
        );

        ctx.lineTo(
            r * 0.15,
            r * 0.19
        );

        ctx.stroke();


        /*
            HANDLE
        */

        ctx.strokeStyle =
            "#38271d";

        ctx.lineWidth =
            Math.max(
                4,
                r * 0.09
            );


        ctx.beginPath();

        ctx.moveTo(
            0,
            r * 0.19
        );

        ctx.lineTo(
            0,
            r * 0.43
        );

        ctx.stroke();


        ctx.restore();
    },


    drawBelow(ctx) {
        /*
            Landing warning
            for every flying sword.
        */

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
                "rgba(0,0,0,0.72)";

            ctx.fill();


            ctx.lineWidth =
                4;

            ctx.strokeStyle =
                "rgba(0,0,0,0.98)";

            ctx.stroke();


            ctx.restore();
        }
    },


    drawGlobal(ctx) {
        /*
            Flying swords.
        */

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
                120;


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
                FLYING BLADE OUTLINE
            */

            ctx.strokeStyle =
                "#4c555c";

            ctx.lineWidth =
                8;

            ctx.lineCap =
                "round";


            ctx.beginPath();

            ctx.moveTo(
                0,
                11
            );

            ctx.lineTo(
                0,
                -15
            );

            ctx.stroke();


            /*
                METAL BLADE
            */

            ctx.strokeStyle =
                "#dce2e6";

            ctx.lineWidth =
                5;


            ctx.beginPath();

            ctx.moveTo(
                0,
                10
            );

            ctx.lineTo(
                0,
                -15
            );

            ctx.stroke();


            /*
                GUARD
            */

            ctx.strokeStyle =
                "#886d34";

            ctx.lineWidth =
                5;


            ctx.beginPath();

            ctx.moveTo(
                -7,
                8
            );

            ctx.lineTo(
                7,
                8
            );

            ctx.stroke();


            /*
                HANDLE
            */

            ctx.strokeStyle =
                "#39271d";

            ctx.lineWidth =
                5;


            ctx.beginPath();

            ctx.moveTo(
                0,
                8
            );

            ctx.lineTo(
                0,
                16
            );

            ctx.stroke();


            ctx.restore();
        }
    }
};


export default knight;