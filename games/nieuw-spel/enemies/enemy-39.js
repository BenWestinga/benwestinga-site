function normalizeAngle(angle) {
    while (angle > Math.PI) {
        angle -= Math.PI * 2;
    }

    while (angle < -Math.PI) {
        angle += Math.PI * 2;
    }

    return angle;
}


function turnToward(
    currentAngle,
    wantedAngle,
    maxTurn
) {
    const difference =
        normalizeAngle(
            wantedAngle -
            currentAngle
        );

    return (
        currentAngle +
        Math.max(
            -maxTurn,
            Math.min(
                maxTurn,
                difference
            )
        )
    );
}


function pointSegmentDistance(
    px,
    py,
    x1,
    y1,
    x2,
    y2
) {
    const dx = x2 - x1;
    const dy = y2 - y1;

    const lengthSquared =
        dx * dx +
        dy * dy;

    if (lengthSquared === 0) {
        return Math.hypot(
            px - x1,
            py - y1
        );
    }

    const t =
        Math.max(
            0,
            Math.min(
                1,
                (
                    (
                        px - x1
                    ) *
                    dx +
                    (
                        py - y1
                    ) *
                    dy
                ) /
                lengthSquared
            )
        );

    const closestX =
        x1 +
        dx *
        t;

    const closestY =
        y1 +
        dy *
        t;

    return Math.hypot(
        px - closestX,
        py - closestY
    );
}


function getRayEnd(
    x,
    y,
    angle,
    canvas
) {
    const dx =
        Math.cos(angle);

    const dy =
        Math.sin(angle);

    const distances = [];

    if (dx > 0.0001) {
        distances.push(
            (
                canvas.width -
                14 -
                x
            ) /
            dx
        );
    } else if (dx < -0.0001) {
        distances.push(
            (
                14 -
                x
            ) /
            dx
        );
    }

    if (dy > 0.0001) {
        distances.push(
            (
                canvas.height -
                14 -
                y
            ) /
            dy
        );
    } else if (dy < -0.0001) {
        distances.push(
            (
                14 -
                y
            ) /
            dy
        );
    }

    const positiveDistances =
        distances.filter(
            distance =>
                distance >= 0
        );

    const distance =
        positiveDistances.length > 0
            ? Math.min(
                ...positiveDistances
            )
            : 0;

    return {
        x:
            x +
            dx *
            distance,

        y:
            y +
            dy *
            distance
    };
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

    enemy.wanderTimer =
        2.8 +
        Math.random() *
        3.2;
}


const plasmaGuy = {
    id: "plasma-guy",
    name: "Plasma Guy",
    behavior: "tracking-plasma-beam",

    hp: 50,
    size: 5,
    speed: "mediumSlow",
    tracking: 1,

    color: "#57236f",
    image: "lava.png",

    approachDuration: 2,

    firstAttackDelay: 5,
    chargeDuration: 3,
    chargeFollowDuration: 2,
    beamDuration: 7,
    attackCooldown: 8,

    chargeTurnSpeed: 2.4,
    firingTurnSpeed: 0.19,
    beamWidth: 24,

    onSpawn(enemy, api) {
        enemy.basePlasmaSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.basePlasmaSpeed;

        enemy.approachRemaining =
            this.approachDuration;

        enemy.wanderTimer = 0;
        enemy.wanderingStarted = false;

        enemy.attackActivated = false;
        enemy.attackState = "waiting";

        enemy.attackTimer =
            this.firstAttackDelay;

        enemy.chargeRemaining = 0;
        enemy.chargeLocked = false;
        enemy.lockedTargetX = 0;
        enemy.lockedTargetY = 0;
        enemy.beamRemaining = 0;

        enemy.beamAngle =
            Math.atan2(
                api.getPlayer().y -
                    enemy.y,

                api.getPlayer().x -
                    enemy.x
            );

        enemy.plasmaPulse =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(enemy);
    },

    updateMovement(
        enemy,
        dt,
        api
    ) {
        if (
            enemy.approachRemaining > 0
        ) {
            enemy.approachRemaining -=
                dt;

            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );

            return;
        }

        if (!enemy.enteredArena) {
            api.moveStraight(enemy, dt);
            return;
        }

        if (
            !enemy.wanderingStarted ||
            enemy.wanderTimer <= 0
        ) {
            enemy.wanderingStarted = true;

            chooseRandomDirection(
                enemy
            );
        }

        enemy.wanderTimer -= dt;

        api.moveStraight(enemy, dt);

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    beginCharge(enemy, api) {
        const player =
            api.getPlayer();

        enemy.attackState =
            "charging";

        enemy.chargeRemaining =
            this.chargeDuration;

        enemy.chargeLocked = false;

        enemy.beamAngle =
            Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );
    },

    updateCharge(
        enemy,
        dt,
        api
    ) {
        const player =
            api.getPlayer();

        const elapsed =
            this.chargeDuration -
            enemy.chargeRemaining;

        if (
            elapsed <
            this.chargeFollowDuration
        ) {
            const wantedAngle =
                Math.atan2(
                    player.y - enemy.y,
                    player.x - enemy.x
                );

            enemy.beamAngle =
                turnToward(
                    enemy.beamAngle,
                    wantedAngle,
                    this.chargeTurnSpeed *
                        dt
                );
        } else if (
            !enemy.chargeLocked
        ) {
            enemy.chargeLocked = true;

            enemy.lockedTargetX =
                player.x;

            enemy.lockedTargetY =
                player.y;
        }

        if (enemy.chargeLocked) {
            enemy.beamAngle =
                Math.atan2(
                    enemy.lockedTargetY -
                        enemy.y,

                    enemy.lockedTargetX -
                        enemy.x
                );
        }

        enemy.chargeRemaining -= dt;

        if (
            enemy.chargeRemaining <= 0
        ) {
            enemy.attackState =
                "firing";

            enemy.beamRemaining =
                this.beamDuration;

            enemy.vx = 0;
            enemy.vy = 0;
        }
    },

    updateFiringBeam(
        enemy,
        dt,
        api
    ) {
        const player =
            api.getPlayer();

        const wantedAngle =
            Math.atan2(
                player.y - enemy.y,
                player.x - enemy.x
            );

        enemy.beamAngle =
            turnToward(
                enemy.beamAngle,
                wantedAngle,
                this.firingTurnSpeed *
                    dt
            );

        enemy.vx = 0;
        enemy.vy = 0;

        enemy.beamRemaining -= dt;

        const canvas =
            api.getCanvas();

        const directionX =
            Math.cos(
                enemy.beamAngle
            );

        const directionY =
            Math.sin(
                enemy.beamAngle
            );

        const startX =
            enemy.x +
            directionX *
            enemy.radius *
            0.72;

        const startY =
            enemy.y +
            directionY *
            enemy.radius *
            0.72;

        const end =
            getRayEnd(
                startX,
                startY,
                enemy.beamAngle,
                canvas
            );

        const distance =
            pointSegmentDistance(
                player.x,
                player.y,
                startX,
                startY,
                end.x,
                end.y
            );

        if (
            distance <=
            player.radius +
            this.beamWidth /
            2
        ) {
            api.killPlayer();
            return;
        }

        if (
            enemy.beamRemaining <= 0
        ) {
            enemy.attackState =
                "waiting";

            enemy.attackTimer =
                this.attackCooldown;

            enemy.wanderingStarted =
                false;
        }
    },

    updateAttack(
        enemy,
        dt,
        api
    ) {
        if (!enemy.attackActivated) {
            return;
        }

        if (
            enemy.attackState ===
            "waiting"
        ) {
            enemy.attackTimer -= dt;

            if (
                enemy.attackTimer <= 0
            ) {
                this.beginCharge(
                    enemy,
                    api
                );
            }

            return;
        }

        if (
            enemy.attackState ===
            "charging"
        ) {
            this.updateCharge(
                enemy,
                dt,
                api
            );

            return;
        }

        if (
            enemy.attackState ===
            "firing"
        ) {
            this.updateFiringBeam(
                enemy,
                dt,
                api
            );
        }
    },

    update(enemy, dt, api) {
        enemy.speed =
            enemy.basePlasmaSpeed;

        enemy.plasmaPulse +=
            dt * 5;

        if (
            enemy.attackState !==
            "firing"
        ) {
            this.updateMovement(
                enemy,
                dt,
                api
            );
        }

        if (
            !enemy.enteredArena &&
            api.isInsideArena(enemy)
        ) {
            enemy.enteredArena = true;
            enemy.attackActivated = true;

            enemy.attackTimer =
                this.firstAttackDelay;
        }

        if (enemy.enteredArena) {
            api.keepInsideArena(
                enemy,
                14,
                true
            );

            if (!enemy.attackActivated) {
                enemy.attackActivated = true;

                enemy.attackTimer =
                    this.firstAttackDelay;
            }
        }

        this.updateAttack(
            enemy,
            dt,
            api
        );
    },

    drawBeam(
        enemy,
        ctx,
        api
    ) {
        if (
            enemy.attackState !==
                "charging" &&

            enemy.attackState !==
                "firing"
        ) {
            return;
        }

        const canvas =
            api.getCanvas();

        const directionX =
            Math.cos(
                enemy.beamAngle
            );

        const directionY =
            Math.sin(
                enemy.beamAngle
            );

        const startX =
            enemy.x +
            directionX *
            enemy.radius *
            0.72;

        const startY =
            enemy.y +
            directionY *
            enemy.radius *
            0.72;

        const end =
            getRayEnd(
                startX,
                startY,
                enemy.beamAngle,
                canvas
            );

        ctx.save();
        ctx.lineCap = "round";

        if (
            enemy.attackState ===
            "charging"
        ) {
            const chargeProgress =
                Math.max(
                    0,
                    Math.min(
                        1,
                        1 -
                        enemy.chargeRemaining /
                        this.chargeDuration
                    )
                );

            const pulse =
                0.35 +
                Math.sin(
                    enemy.plasmaPulse *
                    2
                ) *
                0.12;

            ctx.beginPath();

            ctx.moveTo(
                startX,
                startY
            );

            ctx.lineTo(
                end.x,
                end.y
            );

            ctx.strokeStyle =
                enemy.chargeLocked
                    ? `rgba(255,95,235,${
                        0.72 +
                        chargeProgress *
                        0.20
                    })`
                    : `rgba(97,225,255,${
                        pulse +
                        chargeProgress *
                        0.28
                    })`;

            ctx.lineWidth =
                3 +
                chargeProgress *
                4;

            ctx.setLineDash(
                enemy.chargeLocked
                    ? [12, 7]
                    : [7, 10]
            );

            ctx.stroke();
            ctx.restore();

            return;
        }

        ctx.beginPath();

        ctx.moveTo(
            startX,
            startY
        );

        ctx.lineTo(
            end.x,
            end.y
        );

        ctx.strokeStyle =
            "rgba(99,17,142,0.86)";

        ctx.lineWidth =
            this.beamWidth + 14;

        ctx.shadowBlur = 20;
        ctx.shadowColor = "#d829ff";
        ctx.stroke();

        ctx.shadowBlur = 12;
        ctx.strokeStyle = "#f24cff";

        ctx.lineWidth =
            this.beamWidth;

        ctx.stroke();

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "rgba(220,252,255,0.96)";

        ctx.lineWidth =
            Math.max(
                4,
                this.beamWidth *
                0.25
            );

        ctx.stroke();
        ctx.restore();
    },

    draw(enemy, ctx, api) {
        const r = enemy.radius;

        this.drawBeam(
            enemy,
            ctx,
            api
        );

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,
                color: "#55246f",
                strokeStyle: "#ef63ff",
                lineWidth: 4
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
            ctx.globalAlpha = 0.28;

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
                enemy.plasmaPulse
            ) *
            0.08;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y + r * 0.28,
            r * 0.24 * pulse,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = "#f05cff";
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#d326ff";
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#dffcff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();

        const gunAngle =
            enemy.attackState ===
                "charging" ||

            enemy.attackState ===
                "firing"

                ? enemy.beamAngle

                : Math.atan2(
                    api.getPlayer().y -
                        enemy.y,

                    api.getPlayer().x -
                        enemy.x
                );

        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );

        ctx.rotate(gunAngle);
        ctx.fillStyle = "#332142";

        ctx.fillRect(
            r * 0.18,
            -r * 0.18,
            r * 1.02,
            r * 0.36
        );

        ctx.strokeStyle = "#d267f0";
        ctx.lineWidth = 3;

        ctx.strokeRect(
            r * 0.18,
            -r * 0.18,
            r * 1.02,
            r * 0.36
        );

        ctx.beginPath();

        ctx.arc(
            r * 1.18,
            0,
            r * 0.20,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            enemy.attackState ===
                "firing"

                ? "#f8d5ff"
                : "#c64be4";

        ctx.shadowBlur =
            enemy.attackState ===
                "waiting"

                ? 6
                : 18;

        ctx.shadowColor = "#e72cff";
        ctx.fill();

        ctx.restore();

        ctx.save();

        ctx.fillStyle = "#bdf8ff";
        ctx.beginPath();

        ctx.roundRect(
            enemy.x - r * 0.44,
            enemy.y - r * 0.24,
            r * 0.88,
            r * 0.23,
            r * 0.10
        );

        ctx.fill();

        ctx.strokeStyle = "#321542";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = "#1c0b25";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.085
            );

        ctx.lineCap = "round";
        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.30,
            enemy.y + r * 0.50
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y + r * 0.24,
            enemy.x + r * 0.30,
            enemy.y + r * 0.50
        );

        ctx.stroke();
        ctx.restore();
    }
};

export default plasmaGuy;