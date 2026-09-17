const CINDER_TYPE = "cinder";


function chooseRandomDirection(enemy) {
    const angle = Math.random() * Math.PI * 2;

    enemy.vx = Math.cos(angle) * enemy.speed;
    enemy.vy = Math.sin(angle) * enemy.speed;

    enemy.wanderRemaining =
        2.8 + Math.random() * 3.2;
}


function drawCinderBody(
    enemy,
    ctx,
    api,
    small = false
) {
    const r = enemy.radius;

    api.drawDefaultEnemy(enemy, {
        face: false,

        color:
            small
                ? "#d84517"
                : "#832b18",

        strokeStyle:
            small
                ? "#ffd052"
                : "#ff8a27",

        lineWidth:
            small ? 3 : 5
    });

    const image =
        api.getAssetImage(
            "lava.png"
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

        ctx.globalAlpha =
            small ? 0.25 : 0.42;

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
        1 +
        Math.sin(
            enemy.cinderPulse
        ) *
        0.08;

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        enemy.x,
        enemy.y,

        r *
        (
            small
                ? 0.32
                : 0.27
        ) *
        pulse,

        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffce45";

    ctx.fill();

    ctx.strokeStyle =
        "#ff5a12";

    ctx.lineWidth =
        Math.max(
            2,
            r * 0.07
        );

    ctx.beginPath();

    for (let i = 0; i < 6; i++) {
        const angle =
            i *
            Math.PI *
            2 /
            6;

        ctx.moveTo(
            enemy.x +
            Math.cos(angle) *
            r *
            0.28,

            enemy.y +
            Math.sin(angle) *
            r *
            0.28
        );

        ctx.lineTo(
            enemy.x +
            Math.cos(angle) *
            r *
            0.78,

            enemy.y +
            Math.sin(angle) *
            r *
            0.78
        );
    }

    ctx.stroke();

    ctx.fillStyle =
        "#fff17b";

    ctx.beginPath();

    ctx.arc(
        enemy.x - r * 0.27,
        enemy.y - r * 0.18,
        r * 0.085,
        0,
        Math.PI * 2
    );

    ctx.arc(
        enemy.x + r * 0.27,
        enemy.y - r * 0.18,
        r * 0.085,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
        "#32120c";

    ctx.lineWidth =
        Math.max(
            2,
            r * 0.08
        );

    ctx.lineCap =
        "round";

    ctx.beginPath();

    ctx.moveTo(
        enemy.x - r * 0.25,
        enemy.y + r * 0.42
    );

    ctx.lineTo(
        enemy.x + r * 0.25,
        enemy.y + r * 0.42
    );

    ctx.stroke();

    ctx.restore();
}


const cinder = {
    id: "cinder",

    name: "Cinder",

    behavior: "small-bouncing-cinder",

    hp: 5,

    size: 1.5,

    speed: "veryFast",

    tracking: 0,

    color: "#d84517",

    image: "lava.png",

    onSpawn(enemy, api) {
        enemy.baseCinderSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseCinderSpeed;

        enemy.cinderPulse =
            Math.random() *
            Math.PI *
            2;

        if (
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) <
            0.001
        ) {
            chooseRandomDirection(
                enemy
            );
        }

        enemy.enteredArena =
            api.isInsideArena(
                enemy
            );
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.baseCinderSpeed;

        enemy.cinderPulse +=
            dt * 8;

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) ||
            1;

        enemy.vx =
            enemy.vx /
            velocityLength *
            enemy.speed;

        enemy.vy =
            enemy.vy /
            velocityLength *
            enemy.speed;

        api.moveStraight(
            enemy,
            dt
        );

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena =
                true;
        }

        if (enemy.enteredArena) {
            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }
    },

    draw(enemy, ctx, api) {
        drawCinderBody(
            enemy,
            ctx,
            api,
            true
        );
    }
};


const cinderSplitter = {
    id: "cinder-splitter",

    name: "Cinder Splitter",

    behavior: "splitting-bouncing-cinder",

    hp: 45,

    size: 5,

    speed: "medium",

    tracking: 0,

    color: "#832b18",

    image: "lava.png",

    splitCount: 6,

    onSpawn(enemy, api) {
        enemy.baseSplitterSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseSplitterSpeed;

        enemy.cinderPulse =
            Math.random() *
            Math.PI *
            2;

        enemy.wanderRemaining = 0;

        api.aimVelocityAtPlayer(
            enemy
        );
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.baseSplitterSpeed;

        enemy.cinderPulse +=
            dt * 4;

        if (!enemy.enteredArena) {
            api.moveStraight(
                enemy,
                dt
            );

            if (
                api.isInsideArena(
                    enemy
                )
            ) {
                enemy.enteredArena =
                    true;

                chooseRandomDirection(
                    enemy
                );

                api.keepInsideArena(
                    enemy,
                    14,
                    true
                );
            }

            return;
        }

        enemy.wanderRemaining -=
            dt;

        if (
            enemy.wanderRemaining <= 0
        ) {
            chooseRandomDirection(
                enemy
            );
        }

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) ||
            1;

        enemy.vx =
            enemy.vx /
            velocityLength *
            enemy.speed;

        enemy.vy =
            enemy.vy /
            velocityLength *
            enemy.speed;

        api.moveStraight(
            enemy,
            dt
        );

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    onDeath(enemy, api) {
        const canvas =
            api.getCanvas();

        const childRadius =
            api.getEnemyRadius(
                cinder.size
            );

        const margin =
            childRadius + 16;

        const baseAngle =
            Math.random() *
            Math.PI *
            2;

        for (
            let i = 0;
            i < this.splitCount;
            i++
        ) {
            const angle =
                baseAngle +
                i *
                Math.PI *
                2 /
                this.splitCount;

            const spawnDistance =
                enemy.radius *
                0.62;

            const x =
                Math.max(
                    margin,

                    Math.min(
                        canvas.width -
                        margin,

                        enemy.x +
                        Math.cos(angle) *
                        spawnDistance
                    )
                );

            const y =
                Math.max(
                    margin,

                    Math.min(
                        canvas.height -
                        margin,

                        enemy.y +
                        Math.sin(angle) *
                        spawnDistance
                    )
                );

            const child =
                api.spawnEnemyAt(
                    CINDER_TYPE,
                    x,
                    y
                );

            if (!child) {
                continue;
            }

            child.enteredArena =
                true;

            child.vx =
                Math.cos(angle) *
                child.speed;

            child.vy =
                Math.sin(angle) *
                child.speed;
        }
    },

    draw(enemy, ctx, api) {
        drawCinderBody(
            enemy,
            ctx,
            api,
            false
        );
    }
};


export { cinder };

export default cinderSplitter;