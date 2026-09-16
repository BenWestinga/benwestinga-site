const lavaPools = [];


function absorbOverlappingBullets(enemy) {
    const bullets = window.bullets;

    if (!Array.isArray(bullets)) {
        return;
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];

        if (!bullet) {
            continue;
        }

        const distance = Math.hypot(
            bullet.x - enemy.x,
            bullet.y - enemy.y
        );

        if (distance <= bullet.radius + enemy.radius) {
            bullet.remainingPierce = 0;
            bullets.splice(i, 1);
        }
    }
}


const meteor = {
    id: "meteor",
    name: "Meteor",
    behavior: "falling-meteor",

    hp: 1,
    size: 17.5,
    speed: 0,

    color: "#3a2118",
    image: "lava.png",

    fallDuration: 2.8,
    fallHeight: 560,
    impactRadius: 95,
    lavaDuration: 10,

    reset() {
        lavaPools.length = 0;
    },

    onPlayerDeath() {
        lavaPools.length = 0;
    },

    onLevelWin() {
        lavaPools.length = 0;
    },

    modifyDamage(enemy) {
        absorbOverlappingBullets(enemy);
        return 0;
    },

    spawn({ definition, api }) {
        const canvas = api.getCanvas();
        const meteorRadius = api.getEnemyRadius(definition.size);

        const padding = Math.max(
            definition.impactRadius + 18,
            meteorRadius + 24
        );

        const availableWidth = Math.max(
            0,
            canvas.width - padding * 2
        );

        const availableHeight = Math.max(
            0,
            canvas.height - padding * 2
        );

        const targetX = availableWidth > 0
            ? padding + Math.random() * availableWidth
            : canvas.width / 2;

        const targetY = availableHeight > 0
            ? padding + Math.random() * availableHeight
            : canvas.height / 2;

        const horizontalOffset =
            (Math.random() < 0.5 ? -1 : 1) *
            (90 + Math.random() * 90);

        return api.createEntity(
            definition,
            {
                x: targetX + horizontalOffset,
                y: targetY - definition.fallHeight
            },
            {
                targetX,
                targetY,

                startX:
                    targetX + horizontalOffset,

                startY:
                    targetY - definition.fallHeight,

                fallRemaining:
                    definition.fallDuration,

                fallMax:
                    definition.fallDuration,

                rotation:
                    Math.random() * Math.PI * 2,

                rotationSpeed:
                    (Math.random() < 0.5 ? -1 : 1) *
                    (2.4 + Math.random() * 1.4),

                collidesWithPlayer: false
            }
        );
    },

    beforeUpdate(dt, api) {
        for (
            let i = lavaPools.length - 1;
            i >= 0;
            i--
        ) {
            const pool = lavaPools[i];

            pool.remaining -= dt;
            pool.pulse += dt * 3.5;

            if (pool.remaining <= 0) {
                lavaPools.splice(i, 1);
                continue;
            }

            if (
                api.playerTouchesCircle(
                    pool.x,
                    pool.y,
                    pool.radius
                )
            ) {
                api.killPlayer();
                return;
            }
        }
    },

    update(enemy, dt, api) {
        enemy.fallRemaining -= dt;

        const progress = Math.max(
            0,
            Math.min(
                1,
                1 -
                enemy.fallRemaining /
                enemy.fallMax
            )
        );

        const eased =
            progress * progress;

        enemy.x =
            enemy.startX +
            (
                enemy.targetX -
                enemy.startX
            ) *
            eased;

        enemy.y =
            enemy.startY +
            (
                enemy.targetY -
                enemy.startY
            ) *
            eased;

        enemy.rotation +=
            enemy.rotationSpeed * dt;

        /*
            Tijdens het vallen heeft de meteoriet
            expres geen botsing met de speler.
        */

        if (enemy.fallRemaining > 0) {
            return;
        }

        lavaPools.push({
            x: enemy.targetX,
            y: enemy.targetY,

            radius:
                this.impactRadius,

            remaining:
                this.lavaDuration,

            maxRemaining:
                this.lavaDuration,

            pulse:
                Math.random() * Math.PI * 2
        });

        api.createExplosion(
            enemy.targetX,
            enemy.targetY,
            this.impactRadius,
            0.32
        );

        /*
            Pas op het moment van landen
            wordt de volledige landingscirkel
            gevaarlijk.
        */

        if (
            api.playerTouchesCircle(
                enemy.targetX,
                enemy.targetY,
                this.impactRadius
            )
        ) {
            api.killPlayer();
        }

        api.removeEnemy(enemy);
    },

    drawBelow(ctx, api) {
        /*
            GELANDE LAVAPLEKKEN

            De kleursterkte neemt niet af.
            Na 10 seconden verdwijnt de plek
            in één keer samen met de hitbox.
        */

        for (const pool of lavaPools) {
            const pulse =
                1 +
                Math.sin(pool.pulse) *
                0.035;

            const radius =
                pool.radius * pulse;

            const gradient =
                ctx.createRadialGradient(
                    pool.x,
                    pool.y,
                    radius * 0.12,

                    pool.x,
                    pool.y,
                    radius
                );

            gradient.addColorStop(
                0,
                "rgba(255,45,24,0.98)"
            );

            gradient.addColorStop(
                0.42,
                "rgba(220,0,0,0.94)"
            );

            gradient.addColorStop(
                1,
                "rgba(72,0,0,0.86)"
            );

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                pool.x,
                pool.y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle =
                "rgba(255,38,20,0.98)";

            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.restore();
        }

        /*
            LANDINGSWAARSCHUWINGEN
        */

        for (const enemy of api.getEnemies()) {
            if (
                !enemy ||
                enemy.hp <= 0 ||
                enemy.definition?.id !== this.id
            ) {
                continue;
            }

            const progress = Math.max(
                0,
                Math.min(
                    1,
                    1 -
                    enemy.fallRemaining /
                    enemy.fallMax
                )
            );

            ctx.save();

            ctx.beginPath();

            ctx.arc(
                enemy.targetX,
                enemy.targetY,
                this.impactRadius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(190,0,0,${
                    0.10 +
                    progress * 0.22
                })`;

            ctx.fill();

            ctx.strokeStyle =
                `rgba(255,38,22,${
                    0.48 +
                    progress * 0.50
                })`;

            ctx.lineWidth = 4;
            ctx.setLineDash([14, 10]);
            ctx.stroke();

            ctx.restore();
        }
    },

    draw(enemy, ctx, api) {
        const progress = Math.max(
            0,
            Math.min(
                1,
                1 -
                enemy.fallRemaining /
                enemy.fallMax
            )
        );

        /*
            De meteoriet begint op 18% grootte
            en groeit naar zijn volledige grootte.
        */

        const visualScale =
            0.18 +
            progress * 0.82;

        const r =
            enemy.radius *
            visualScale;

        ctx.save();

        const trailLength =
            80 +
            (1 - progress) *
            75;

        const trailGradient =
            ctx.createLinearGradient(
                enemy.x,
                enemy.y,

                enemy.x - 36,
                enemy.y - trailLength
            );

        trailGradient.addColorStop(
            0,
            "rgba(255,225,90,0.92)"
        );

        trailGradient.addColorStop(
            0.42,
            "rgba(255,83,10,0.62)"
        );

        trailGradient.addColorStop(
            1,
            "rgba(110,12,5,0)"
        );

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.48,
            enemy.y - r * 0.30
        );

        ctx.lineTo(
            enemy.x - 38,
            enemy.y - trailLength
        );

        ctx.lineTo(
            enemy.x + r * 0.42,
            enemy.y - r * 0.20
        );

        ctx.closePath();

        ctx.fillStyle =
            trailGradient;

        ctx.fill();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(
            enemy.rotation
        );

        const rockGradient =
            ctx.createRadialGradient(
                -r * 0.30,
                -r * 0.34,
                r * 0.08,

                0,
                0,
                r
            );

        rockGradient.addColorStop(
            0,
            "#6f4632"
        );

        rockGradient.addColorStop(
            0.55,
            "#35221d"
        );

        rockGradient.addColorStop(
            1,
            "#160e0c"
        );

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            rockGradient;

        ctx.shadowBlur = 16;
        ctx.shadowColor = "#ff4d0a";
        ctx.fill();
        ctx.shadowBlur = 0;

        const image =
            api.getAssetImage(
                this.image
            );

        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {
            ctx.save();

            ctx.beginPath();

            ctx.arc(
                0,
                0,
                r * 0.93,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha = 0.38;

            ctx.drawImage(
                image,
                -r,
                -r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        ctx.strokeStyle =
            "#ff9f20";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.09
            );

        ctx.beginPath();

        ctx.moveTo(
            -r * 0.62,
            -r * 0.18
        );

        ctx.lineTo(
            -r * 0.12,
            r * 0.03
        );

        ctx.lineTo(
            r * 0.13,
            -r * 0.52
        );

        ctx.moveTo(
            r * 0.08,
            r * 0.70
        );

        ctx.lineTo(
            r * 0.02,
            r * 0.12
        );

        ctx.lineTo(
            r * 0.55,
            r * 0.28
        );

        ctx.stroke();

        ctx.strokeStyle =
            "#9a4c20";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            r,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.restore();
    }
};


export default meteor;