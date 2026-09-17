let nextTwinPairId = 1;


function pointSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {
    const dx =
        x2 - x1;

    const dy =
        y2 - y1;

    const lengthSquared =
        dx * dx +
        dy * dy;

    if (lengthSquared === 0) {
        return Math.hypot(
            px - x1,
            py - y1
        );
    }

    const progress =
        Math.max(
            0,

            Math.min(
                1,

                (
                    (px - x1) * dx +
                    (py - y1) * dy
                ) /
                lengthSquared
            )
        );

    const closestX =
        x1 +
        dx *
        progress;

    const closestY =
        y1 +
        dy *
        progress;

    return Math.hypot(
        px - closestX,
        py - closestY
    );
}


function chooseRandomDirection(enemy) {
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

    enemy.wanderRemaining =
        2.5 +
        Math.random() *
        3;
}


function isTwinEnemy(
    enemy,
    definition
) {
    return (
        enemy &&
        enemy.hp > 0 &&
        enemy.definition?.id ===
            definition.id &&
        enemy.twinPairId != null
    );
}


const fireChainTwins = {
    id: "fire-chain-twins",

    name: "Fire Chain Twins",

    behavior: "linked-bouncing-fire-twins",

    hp: 30,

    size: 4,

    speed: "medium",

    tracking: 0,

    color: "#a43219",

    image: "lava.png",

    spawnSize: 4,

    twinSeparation: 105,

    chainVisualWidth: 14,

    chainHitboxWidth: 7,

    enragedSpeedBonus: 40,

    reset() {
        nextTwinPairId = 1;
    },

    spawn({
        definition,
        position,
        api
    }) {
        const canvas =
            api.getCanvas();

        const pairId =
            nextTwinPairId++;

        const halfSeparation =
            this.twinSeparation /
            2;

        const entersHorizontally =
            position.x < 0 ||
            position.x >
                canvas.width;

        const firstPosition = {
            x: position.x,
            y: position.y
        };

        const secondPosition = {
            x: position.x,
            y: position.y
        };

        if (entersHorizontally) {
            firstPosition.y =
                Math.max(
                    30,

                    Math.min(
                        canvas.height -
                        30,

                        position.y -
                        halfSeparation
                    )
                );

            secondPosition.y =
                Math.max(
                    30,

                    Math.min(
                        canvas.height -
                        30,

                        position.y +
                        halfSeparation
                    )
                );
        } else {
            firstPosition.x =
                Math.max(
                    30,

                    Math.min(
                        canvas.width -
                        30,

                        position.x -
                        halfSeparation
                    )
                );

            secondPosition.x =
                Math.max(
                    30,

                    Math.min(
                        canvas.width -
                        30,

                        position.x +
                        halfSeparation
                    )
                );
        }

        const firstTwin =
            api.createEntity(
                definition,

                firstPosition,

                {
                    twinPairId:
                        pairId,

                    twinRole:
                        "first",

                    chainActive:
                        true,

                    enraged:
                        false
                }
            );

        const secondTwin =
            api.createEntity(
                definition,

                secondPosition,

                {
                    twinPairId:
                        pairId,

                    twinRole:
                        "second",

                    chainActive:
                        true,

                    enraged:
                        false
                }
            );

        firstTwin.partner =
            secondTwin;

        secondTwin.partner =
            firstTwin;

        return [
            firstTwin,
            secondTwin
        ];
    },

    onSpawn(enemy, api) {
        enemy.baseTwinSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseTwinSpeed;

        enemy.wanderRemaining = 0;

        enemy.twinPulse =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(
            enemy
        );

        const angleOffset =
            enemy.twinRole ===
            "first"

                ? -0.20
                : 0.20;

        const currentAngle =
            Math.atan2(
                enemy.vy,
                enemy.vx
            );

        enemy.vx =
            Math.cos(
                currentAngle +
                angleOffset
            ) *
            enemy.speed;

        enemy.vy =
            Math.sin(
                currentAngle +
                angleOffset
            ) *
            enemy.speed;
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.baseTwinSpeed;

        enemy.twinPulse +=
            dt *
            (
                enemy.enraged
                    ? 8
                    : 5
            );

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
        enemy.chainActive =
            false;

        const partner =
            enemy.partner;

        enemy.partner =
            null;

        if (
            !partner ||
            !api.isEnemyAlive(
                partner
            )
        ) {
            return;
        }

        partner.partner =
            null;

        partner.chainActive =
            false;

        if (partner.enraged) {
            return;
        }

        partner.enraged =
            true;

        partner.baseTwinSpeed +=
            this.enragedSpeedBonus;

        partner.speed =
            partner.baseTwinSpeed;

        const velocityLength =
            Math.hypot(
                partner.vx,
                partner.vy
            ) ||
            1;

        partner.vx =
            partner.vx /
            velocityLength *
            partner.speed;

        partner.vy =
            partner.vy /
            velocityLength *
            partner.speed;
    },

    getActivePairs(api) {
        const pairs = [];

        for (
            const enemy of
            api.getEnemies()
        ) {
            if (
                !isTwinEnemy(
                    enemy,
                    this
                ) ||
                enemy.twinRole !==
                    "first" ||
                !enemy.chainActive ||
                !enemy.enteredArena
            ) {
                continue;
            }

            const partner =
                enemy.partner;

            if (
                !isTwinEnemy(
                    partner,
                    this
                ) ||
                !partner.chainActive ||
                !partner.enteredArena ||
                !api.isEnemyAlive(
                    partner
                )
            ) {
                continue;
            }

            pairs.push({
                first: enemy,
                second: partner
            });
        }

        return pairs;
    },

    afterUpdate(dt, api) {
        const player =
            api.getPlayer();

        for (
            const pair of
            this.getActivePairs(api)
        ) {
            const distance =
                pointSegmentDistance(
                    player.x,
                    player.y,

                    pair.first.x,
                    pair.first.y,

                    pair.second.x,
                    pair.second.y
                );

            if (
                distance <=
                player.radius +
                this.chainHitboxWidth /
                2
            ) {
                api.killPlayer();
                return;
            }
        }
    },

    drawBelow(ctx, api) {
        for (
            const pair of
            this.getActivePairs(api)
        ) {
            const pulse =
                0.82 +
                Math.sin(
                    pair.first
                        .twinPulse *
                    1.4
                ) *
                0.12;

            ctx.save();

            ctx.lineCap =
                "round";

            ctx.beginPath();

            ctx.moveTo(
                pair.first.x,
                pair.first.y
            );

            ctx.lineTo(
                pair.second.x,
                pair.second.y
            );

            ctx.strokeStyle =
                "rgba(122,19,7,0.72)";

            ctx.lineWidth =
                this.chainVisualWidth +
                8;

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                pair.first.x,
                pair.first.y
            );

            ctx.lineTo(
                pair.second.x,
                pair.second.y
            );

            ctx.strokeStyle =
                `rgba(255,66,12,${pulse})`;

            ctx.lineWidth =
                this.chainVisualWidth;

            ctx.stroke();

            ctx.beginPath();

            ctx.moveTo(
                pair.first.x,
                pair.first.y
            );

            ctx.lineTo(
                pair.second.x,
                pair.second.y
            );

            ctx.strokeStyle =
                "rgba(255,221,92,0.90)";

            ctx.lineWidth = 3;

            ctx.setLineDash([
                12,
                9
            ]);

            ctx.stroke();

            ctx.restore();
        }
    },

    draw(enemy, ctx, api) {
        const r =
            enemy.radius;

        const firstTwin =
            enemy.twinRole ===
            "first";

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,

                color:
                    enemy.enraged

                        ? "#d92e13"

                        : firstTwin
                            ? "#a43219"
                            : "#c14b19",

                strokeStyle:
                    enemy.enraged
                        ? "#fff070"
                        : "#ff9a32",

                lineWidth:
                    enemy.enraged
                        ? 6
                        : 4
            }
        );

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
                enemy.x,
                enemy.y,
                r * 0.88,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.34;

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
                enemy.twinPulse
            ) *
            0.08;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            r * 0.32 * pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            enemy.enraged
                ? "#fff27a"
                : "#ffb52e";

        ctx.fill();

        ctx.strokeStyle =
            "#35120b";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.08
            );

        ctx.lineCap =
            "round";

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.46,
            enemy.y - r * 0.28
        );

        ctx.lineTo(
            enemy.x - r * 0.10,
            enemy.y - r * 0.12
        );

        ctx.moveTo(
            enemy.x + r * 0.46,
            enemy.y - r * 0.28
        );

        ctx.lineTo(
            enemy.x + r * 0.10,
            enemy.y - r * 0.12
        );

        ctx.moveTo(
            enemy.x - r * 0.28,
            enemy.y + r * 0.46
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + r * 0.26,

            enemy.x + r * 0.28,
            enemy.y + r * 0.46
        );

        ctx.stroke();

        ctx.fillStyle =
            "#fff18a";

        ctx.beginPath();

        ctx.arc(
            enemy.x - r * 0.27,
            enemy.y - r * 0.07,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.arc(
            enemy.x + r * 0.27,
            enemy.y - r * 0.07,
            r * 0.085,
            0,
            Math.PI * 2
        );

        ctx.fill();

        ctx.restore();
    }
};


export default fireChainTwins;