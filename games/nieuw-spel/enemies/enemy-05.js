const worms =
    new Map();

let nextWormId =
    1;

function clearWorms() {
    worms.clear();

    nextWormId =
        1;
}

const sandWorm = {
    id: "sand-worm",
    name: "Sand Worm",
    behavior: "sand-worm",

    spawnSize: 3,

    speed: "medium",

    segmentCount: 4,

    partHp: 4,

    headSize: 3,
    segmentSize: 2.3,

    headColor: "#c7a92f",
    segmentColor: "#d8bc3c",

    bodyOverlap: 4,

    chaseDuration: 6,
    chaseTracking: 0.4,

    wanderDuration: 2,

    turnSpeed: 0.75,

    reset() {
        clearWorms();
    },

    spawn({
        definition,
        position,
        api
    }) {
        const wormId =
            nextWormId++;

        const speed =
            api.getEnemySpeed(
                definition.speed
            );

        const headRadius =
            api.getEnemyRadius(
                definition.headSize
            );

        const segmentRadius =
            api.getEnemyRadius(
                definition.segmentSize
            );

        const player =
            api.getPlayer();

        const angle =
            Math.atan2(
                player.y -
                    position.y,

                player.x -
                    position.x
            );

        const worm = {
            id:
                wormId,

            parts:
                [],

            speed,

            angle,

            modeTime:
                0,

            wanderDirection:
                Math.random() <
                0.5
                    ? -1
                    : 1
        };

        const totalParts =
            1 +
            definition.segmentCount;

        for (
            let i = 0;
            i < totalParts;
            i++
        ) {
            const isHead =
                i === 0;

            const radius =
                isHead
                    ? headRadius
                    : segmentRadius;

            const spacing =
                headRadius +
                segmentRadius -
                definition.bodyOverlap;

            const part =
                api.createEntity(
                    definition,

                    {
                        x:
                            position.x -
                            Math.cos(
                                angle
                            ) *
                            spacing *
                            i,

                        y:
                            position.y -
                            Math.sin(
                                angle
                            ) *
                            spacing *
                            i
                    },

                    {
                        hp:
                            definition.partHp,

                        maxHp:
                            definition.partHp,

                        radius,

                        speed,

                        tracking:
                            definition
                                .chaseTracking,

                        color:
                            isHead
                                ? definition
                                    .headColor
                                : definition
                                    .segmentColor,

                        isWormPart:
                            true,

                        isWormHead:
                            isHead,

                        wormId,

                        headRadius,

                        segmentRadius,

                        headColor:
                            definition
                                .headColor,

                        segmentColor:
                            definition
                                .segmentColor,

                        vx:
                            Math.cos(
                                angle
                            ) *
                            speed,

                        vy:
                            Math.sin(
                                angle
                            ) *
                            speed
                    }
                );

            worm.parts.push(
                part
            );
        }

        worms.set(
            wormId,
            worm
        );

        return worm.parts;
    },

    beforeUpdate(
        dt,
        api
    ) {
        const config =
            this;

        for (
            const worm
            of worms.values()
        ) {
            if (
                worm.parts.length ===
                0
            ) {
                continue;
            }

            const head =
                worm.parts[0];

            head.isWormHead =
                true;

            const cycleLength =
                config.chaseDuration +
                config.wanderDuration;

            const previousMode =
                worm.modeTime <
                config.chaseDuration
                    ? "chase"
                    : "wander";

            worm.modeTime +=
                dt;

            if (
                worm.modeTime >=
                cycleLength
            ) {
                worm.modeTime %=
                    cycleLength;
            }

            const mode =
                worm.modeTime <
                config.chaseDuration
                    ? "chase"
                    : "wander";

            if (
                previousMode ===
                    "chase" &&

                mode ===
                    "wander"
            ) {
                worm.wanderDirection =
                    Math.random() <
                    0.5
                        ? -1
                        : 1;

                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );
            }

            if (
                mode ===
                "chase"
            ) {
                const player =
                    api.getPlayer();

                const dx =
                    player.x -
                    head.x;

                const dy =
                    player.y -
                    head.y;

                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;

                const desiredVx =
                    (
                        dx /
                        distance
                    ) *
                    worm.speed;

                const desiredVy =
                    (
                        dy /
                        distance
                    ) *
                    worm.speed;

                const steering =
                    1 -
                    Math.exp(
                        -config
                            .chaseTracking *
                        dt
                    );

                head.vx +=
                    (
                        desiredVx -
                        head.vx
                    ) *
                    steering;

                head.vy +=
                    (
                        desiredVy -
                        head.vy
                    ) *
                    steering;

                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );
            } else {
                worm.angle +=
                    config.turnSpeed *
                    worm.wanderDirection *
                    dt;

                head.vx =
                    Math.cos(
                        worm.angle
                    ) *
                    worm.speed;

                head.vy =
                    Math.sin(
                        worm.angle
                    ) *
                    worm.speed;
            }

            head.x +=
                head.vx *
                dt;

            head.y +=
                head.vy *
                dt;

            for (
                let i = 1;
                i <
                    worm.parts.length;
                i++
            ) {
                const previous =
                    worm.parts[
                        i - 1
                    ];

                const part =
                    worm.parts[i];

                part.isWormHead =
                    false;

                part.radius =
                    part.segmentRadius;

                part.color =
                    part.segmentColor;

                const dx =
                    part.x -
                    previous.x;

                const dy =
                    part.y -
                    previous.y;

                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;

                const wantedDistance =
                    Math.max(
                        2,

                        previous.radius +
                        part.radius -
                        config.bodyOverlap
                    );

                part.x =
                    previous.x +
                    (
                        dx /
                        distance
                    ) *
                    wantedDistance;

                part.y =
                    previous.y +
                    (
                        dy /
                        distance
                    ) *
                    wantedDistance;

                part.vx =
                    head.vx;

                part.vy =
                    head.vy;
            }
        }
    },

    update() {
    },

    onDeath(enemy) {
        const worm =
            worms.get(
                enemy.wormId
            );

        if (!worm) {
            return;
        }

        const index =
            worm.parts
                .indexOf(
                    enemy
                );

        if (
            index === -1
        ) {
            return;
        }

        worm.parts.splice(
            index,
            1
        );

        if (
            worm.parts.length ===
            0
        ) {
            worms.delete(
                enemy.wormId
            );

            return;
        }

        if (
            index === 0
        ) {
            const newHead =
                worm.parts[0];

            newHead.isWormHead =
                true;

            newHead.radius =
                newHead.headRadius;

            newHead.color =
                newHead.headColor;

            newHead.vx =
                Math.cos(
                    worm.angle
                ) *
                worm.speed;

            newHead.vy =
                Math.sin(
                    worm.angle
                ) *
                worm.speed;
        }
    },

    draw(enemy, ctx, api) {
        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    enemy
                        .isWormHead
            }
        );
    }
};

export default sandWorm;