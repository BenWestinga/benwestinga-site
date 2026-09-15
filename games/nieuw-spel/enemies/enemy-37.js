const GOLEMITE_TYPE =
    "lavaGolemite";


function drawLavaRock(
    enemy,
    ctx,
    api,
    options = {}
) {
    const r = enemy.radius;

    const bodyColor =
        options.bodyColor ||
        "#4b2920";

    const edgeColor =
        options.edgeColor ||
        "#1f1411";

    const crackColor =
        options.crackColor ||
        "#ffb52e";

    const image =
        api.getAssetImage(
            "lava.png"
        );

    ctx.save();

    const gradient =
        ctx.createRadialGradient(
            enemy.x - r * 0.30,
            enemy.y - r * 0.34,
            r * 0.12,
            enemy.x,
            enemy.y,
            r
        );

    gradient.addColorStop(
        0,
        "#86503a"
    );

    gradient.addColorStop(
        0.48,
        bodyColor
    );

    gradient.addColorStop(
        1,
        edgeColor
    );

    ctx.beginPath();

    ctx.arc(
        enemy.x,
        enemy.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = gradient;
    ctx.fill();

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
            r * 0.94,
            0,
            Math.PI * 2
        );

        ctx.clip();

        ctx.globalAlpha =
            options.imageAlpha ??
            0.42;

        ctx.drawImage(
            image,
            enemy.x - r,
            enemy.y - r,
            r * 2,
            r * 2
        );

        ctx.restore();
    }

    ctx.strokeStyle = "#24130f";

    ctx.lineWidth =
        Math.max(
            4,
            r * 0.09
        );

    ctx.beginPath();

    ctx.arc(
        enemy.x,
        enemy.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.stroke();

    ctx.strokeStyle =
        crackColor;

    ctx.lineWidth =
        Math.max(
            2,
            r * 0.052
        );

    ctx.shadowBlur = 8;

    ctx.shadowColor =
        crackColor;

    ctx.beginPath();

    ctx.moveTo(
        enemy.x - r * 0.78,
        enemy.y - r * 0.12
    );

    ctx.lineTo(
        enemy.x - r * 0.30,
        enemy.y + r * 0.02
    );

    ctx.lineTo(
        enemy.x - r * 0.08,
        enemy.y + r * 0.46
    );

    ctx.moveTo(
        enemy.x + r * 0.12,
        enemy.y - r * 0.72
    );

    ctx.lineTo(
        enemy.x + r * 0.02,
        enemy.y - r * 0.26
    );

    ctx.lineTo(
        enemy.x + r * 0.48,
        enemy.y - r * 0.06
    );

    ctx.moveTo(
        enemy.x + r * 0.62,
        enemy.y + r * 0.28
    );

    ctx.lineTo(
        enemy.x + r * 0.22,
        enemy.y + r * 0.34
    );

    ctx.lineTo(
        enemy.x + r * 0.06,
        enemy.y + r * 0.74
    );

    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
}


function drawGolemFace(
    enemy,
    ctx,
    small = false
) {
    const r = enemy.radius;

    const eyeY =
        enemy.y -
        r * 0.10;

    const eyeOffset =
        r * 0.29;

    const eyeRadius =
        Math.max(
            3,
            r *
            (
                small
                    ? 0.09
                    : 0.11
            )
        );

    ctx.save();

    ctx.fillStyle = "#ffe45d";
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff4a00";

    ctx.beginPath();

    ctx.arc(
        enemy.x - eyeOffset,
        eyeY,
        eyeRadius,
        0,
        Math.PI * 2
    );

    ctx.arc(
        enemy.x + eyeOffset,
        eyeY,
        eyeRadius,
        0,
        Math.PI * 2
    );

    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = "#160c09";

    ctx.lineWidth =
        Math.max(
            3,
            r * 0.08
        );

    ctx.lineCap = "round";
    ctx.beginPath();

    ctx.moveTo(
        enemy.x - r * 0.48,
        enemy.y - r * 0.34
    );

    ctx.lineTo(
        enemy.x - r * 0.10,
        enemy.y - r * 0.18
    );

    ctx.moveTo(
        enemy.x + r * 0.48,
        enemy.y - r * 0.34
    );

    ctx.lineTo(
        enemy.x + r * 0.10,
        enemy.y - r * 0.18
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        enemy.x - r * 0.32,
        enemy.y + r * 0.46
    );

    ctx.lineTo(
        enemy.x - r * 0.12,
        enemy.y + r * 0.28
    );

    ctx.lineTo(
        enemy.x + r * 0.12,
        enemy.y + r * 0.28
    );

    ctx.lineTo(
        enemy.x + r * 0.32,
        enemy.y + r * 0.46
    );

    ctx.stroke();
    ctx.restore();
}


const lavaGolemite = {
    id: "lava-golemite",
    name: "Lava Golemite",
    behavior: "bouncing-lava-golemite",

    hp: 40,
    size: 4,
    speed: "fast",
    tracking: 0,

    color: "#6e3525",
    image: "lava.png",

    onSpawn(enemy, api) {
        enemy.baseGolemiteSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseGolemiteSpeed;

        enemy.enteredArena =
            api.isInsideArena(enemy);

        const angle =
            Math.random() *
            Math.PI *
            2;

        enemy.vx =
            Math.cos(angle) *
            enemy.speed;

        enemy.vy =
            Math.sin(angle) *
            enemy.speed;
    },

    update(enemy, dt, api) {
        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;

        enemy.speed =
            enemy.baseGolemiteSpeed;

        enemy.vx =
            enemy.vx /
            velocityLength *
            enemy.speed;

        enemy.vy =
            enemy.vy /
            velocityLength *
            enemy.speed;

        api.moveStraight(enemy, dt);

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
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
        drawLavaRock(
            enemy,
            ctx,
            api,
            {
                bodyColor: "#5d3024",
                edgeColor: "#21120f",
                crackColor: "#ff9d22",
                imageAlpha: 0.38
            }
        );

        drawGolemFace(
            enemy,
            ctx,
            true
        );
    }
};


const lavaGolem = {
    id: "lava-golem",
    name: "Lava Golem",
    behavior: "chasing-lava-golem",

    hp: 150,
    size: 10,
    speed: "medium",
    tracking: 1,

    color: "#4a251c",
    image: "lava.png",

    onSpawn(enemy, api) {
        enemy.baseGolemSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseGolemSpeed;

        enemy.bodyPulse =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(enemy);
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.baseGolemSpeed;

        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
        }

        if (enemy.enteredArena) {
            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }

        enemy.bodyPulse +=
            dt * 2.2;
    },

    onDeath(enemy, api) {
        const canvas =
            api.getCanvas();

        const childRadius =
            api.getEnemyRadius(
                lavaGolemite.size
            );

        const baseAngle =
            Math.random() *
            Math.PI *
            2;

        for (
            let i = 0;
            i < 3;
            i++
        ) {
            const angle =
                baseAngle +
                i *
                Math.PI *
                2 /
                3;

            const spawnDistance =
                enemy.radius * 0.58;

            const x =
                Math.max(
                    childRadius + 14,
                    Math.min(
                        canvas.width -
                            childRadius -
                            14,

                        enemy.x +
                            Math.cos(angle) *
                            spawnDistance
                    )
                );

            const y =
                Math.max(
                    childRadius + 14,
                    Math.min(
                        canvas.height -
                            childRadius -
                            14,

                        enemy.y +
                            Math.sin(angle) *
                            spawnDistance
                    )
                );

            const child =
                api.spawnEnemyAt(
                    GOLEMITE_TYPE,
                    x,
                    y
                );

            if (!child) {
                continue;
            }

            child.enteredArena = true;

            child.vx =
                Math.cos(angle) *
                child.speed;

            child.vy =
                Math.sin(angle) *
                child.speed;
        }
    },

    draw(enemy, ctx, api) {
        const r = enemy.radius;

        ctx.save();
        ctx.fillStyle = "#2a1712";
        ctx.beginPath();

        ctx.arc(
            enemy.x - r * 0.78,
            enemy.y + r * 0.08,
            r * 0.36,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + r * 0.78,
            enemy.y + r * 0.08,
            r * 0.36,
            0,
            Math.PI * 2
        );

        ctx.fill();
        ctx.restore();

        drawLavaRock(
            enemy,
            ctx,
            api,
            {
                bodyColor: "#4b281f",
                edgeColor: "#190e0c",
                crackColor: "#ffc13d",
                imageAlpha: 0.46
            }
        );

        const pulse =
            0.40 +
            Math.sin(
                enemy.bodyPulse
            ) *
            0.08;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            r * 0.72,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            `rgba(255,91,8,${pulse})`;

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.055
            );

        ctx.stroke();
        ctx.restore();

        drawGolemFace(
            enemy,
            ctx,
            false
        );
    }
};


export {
    lavaGolemite
};

export default lavaGolem;