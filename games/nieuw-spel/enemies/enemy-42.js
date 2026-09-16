function clamp(
    value,
    minimum,
    maximum
) {
    return Math.max(
        minimum,
        Math.min(
            maximum,
            value
        )
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
        2.2 +
        Math.random() *
        2.8;
}


const ashPhantom = {
    id: "ash-phantom",

    name: "Ash Phantom",

    behavior: "vanishing-dash-phantom",

    hp: 40,

    size: 4,

    speed: "fast",

    color: "#33292a",

    image: "lava.png",

    attackCooldown: 7,

    hiddenDuration: 1.5,

    aimLockDuration: 0.45,

    reappearMinDistance: 165,

    reappearMaxDistance: 225,

    dashSpeed: "extremelyFast",

    dashDuration: 1.1,

    recoveryDuration: 1,

    recoveryDamageMultiplier: 1.5,

    modifyDamage(enemy, damage) {
        if (
            enemy.phantomState ===
            "hidden"
        ) {
            return 0;
        }

        if (
            enemy.phantomState ===
            "recovery"
        ) {
            return (
                damage *
                this.recoveryDamageMultiplier
            );
        }

        return damage;
    },

    onSpawn(enemy, api) {
        enemy.basePhantomSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.phantomDashSpeed =
            api.getEnemySpeed(
                this.dashSpeed
            );

        enemy.speed =
            enemy.basePhantomSpeed;

        enemy.phantomState =
            "normal";

        enemy.stateRemaining = 0;

        enemy.attackRemaining =
            this.attackCooldown;

        enemy.attackActivated =
            false;

        enemy.reappearX =
            enemy.x;

        enemy.reappearY =
            enemy.y;

        enemy.lockedTargetX =
            api.getPlayer().x;

        enemy.lockedTargetY =
            api.getPlayer().y;

        enemy.targetLocked =
            false;

        enemy.wanderRemaining = 0;

        enemy.phantomPulse =
            Math.random() *
            Math.PI *
            2;

        enemy.collidesWithPlayer =
            true;

        api.aimVelocityAtPlayer(
            enemy
        );
    },

    chooseReappearPosition(
        enemy,
        api
    ) {
        const canvas =
            api.getCanvas();

        const player =
            api.getPlayer();

        const margin =
            enemy.radius +
            24;

        let chosenX =
            canvas.width / 2;

        let chosenY =
            canvas.height / 2;

        let foundSafePosition =
            false;

        for (
            let attempt = 0;
            attempt < 12;
            attempt++
        ) {
            const angle =
                Math.random() *
                Math.PI *
                2;

            const distance =
                this.reappearMinDistance +
                Math.random() *
                (
                    this.reappearMaxDistance -
                    this.reappearMinDistance
                );

            const candidateX =
                clamp(
                    player.x +
                    Math.cos(angle) *
                    distance,

                    margin,

                    canvas.width -
                    margin
                );

            const candidateY =
                clamp(
                    player.y +
                    Math.sin(angle) *
                    distance,

                    margin,

                    canvas.height -
                    margin
                );

            const playerDistance =
                Math.hypot(
                    candidateX -
                    player.x,

                    candidateY -
                    player.y
                );

            chosenX =
                candidateX;

            chosenY =
                candidateY;

            if (
                playerDistance >=
                enemy.radius +
                player.radius +
                65
            ) {
                foundSafePosition =
                    true;

                break;
            }
        }

        if (!foundSafePosition) {
            const directionX =
                player.x <
                canvas.width / 2
                    ? 1
                    : -1;

            const directionY =
                player.y <
                canvas.height / 2
                    ? 1
                    : -1;

            chosenX =
                clamp(
                    player.x +
                    directionX *
                    this.reappearMinDistance,

                    margin,

                    canvas.width -
                    margin
                );

            chosenY =
                clamp(
                    player.y +
                    directionY *
                    this.reappearMinDistance,

                    margin,

                    canvas.height -
                    margin
                );
        }

        enemy.reappearX =
            chosenX;

        enemy.reappearY =
            chosenY;
    },

    beginHiddenPhase(
        enemy,
        api
    ) {
        const player =
            api.getPlayer();

        enemy.phantomState =
            "hidden";

        enemy.stateRemaining =
            this.hiddenDuration;

        enemy.collidesWithPlayer =
            false;

        enemy.targetLocked =
            false;

        enemy.vx = 0;
        enemy.vy = 0;

        enemy.lockedTargetX =
            player.x;

        enemy.lockedTargetY =
            player.y;

        this.chooseReappearPosition(
            enemy,
            api
        );
    },

    beginDash(enemy, api) {
        const player =
            api.getPlayer();

        if (!enemy.targetLocked) {
            enemy.lockedTargetX =
                player.x;

            enemy.lockedTargetY =
                player.y;

            enemy.targetLocked =
                true;
        }

        enemy.x =
            enemy.reappearX;

        enemy.y =
            enemy.reappearY;

        enemy.phantomState =
            "dashing";

        enemy.stateRemaining =
            this.dashDuration;

        enemy.collidesWithPlayer =
            true;

        enemy.speed =
            enemy.phantomDashSpeed;

        const dx =
            enemy.lockedTargetX -
            enemy.x;

        const dy =
            enemy.lockedTargetY -
            enemy.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) ||
            1;

        enemy.vx =
            dx /
            distance *
            enemy.speed;

        enemy.vy =
            dy /
            distance *
            enemy.speed;

        api.keepInsideArena(
            enemy,
            14,
            true
        );
    },

    beginRecovery(enemy) {
        enemy.phantomState =
            "recovery";

        enemy.stateRemaining =
            this.recoveryDuration;

        enemy.collidesWithPlayer =
            true;

        enemy.vx = 0;
        enemy.vy = 0;
    },

    returnToNormal(enemy) {
        enemy.phantomState =
            "normal";

        enemy.stateRemaining = 0;

        enemy.attackRemaining =
            this.attackCooldown;

        enemy.collidesWithPlayer =
            true;

        enemy.speed =
            enemy.basePhantomSpeed;

        enemy.targetLocked =
            false;

        chooseRandomDirection(
            enemy
        );
    },

    updateNormal(
        enemy,
        dt,
        api
    ) {
        enemy.speed =
            enemy.basePhantomSpeed;

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

        enemy.attackRemaining -=
            dt;

        if (
            enemy.attackRemaining <= 0
        ) {
            this.beginHiddenPhase(
                enemy,
                api
            );
        }
    },

    updateHidden(
        enemy,
        dt,
        api
    ) {
        const player =
            api.getPlayer();

        enemy.stateRemaining -=
            dt;

        if (
            enemy.stateRemaining >
            this.aimLockDuration
        ) {
            enemy.lockedTargetX =
                player.x;

            enemy.lockedTargetY =
                player.y;
        } else if (
            !enemy.targetLocked
        ) {
            enemy.lockedTargetX =
                player.x;

            enemy.lockedTargetY =
                player.y;

            enemy.targetLocked =
                true;
        }

        if (
            enemy.stateRemaining <= 0
        ) {
            this.beginDash(
                enemy,
                api
            );
        }
    },

    updateDash(
        enemy,
        dt,
        api
    ) {
        enemy.speed =
            enemy.phantomDashSpeed;

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

        enemy.stateRemaining -=
            dt;

        if (
            enemy.stateRemaining <= 0
        ) {
            this.beginRecovery(
                enemy
            );
        }
    },

    updateRecovery(
        enemy,
        dt,
        api
    ) {
        enemy.vx = 0;
        enemy.vy = 0;

        enemy.stateRemaining -=
            dt;

        api.keepInsideArena(
            enemy,
            14,
            true
        );

        if (
            enemy.stateRemaining <= 0
        ) {
            this.returnToNormal(
                enemy
            );
        }
    },

    update(enemy, dt, api) {
        enemy.phantomPulse +=
            dt * 6;

        if (!enemy.enteredArena) {
            enemy.speed =
                enemy.basePhantomSpeed;

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

                enemy.attackActivated =
                    true;

                enemy.attackRemaining =
                    this.attackCooldown;

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

        if (!enemy.attackActivated) {
            enemy.attackActivated =
                true;

            enemy.attackRemaining =
                this.attackCooldown;
        }

        if (
            enemy.phantomState ===
            "hidden"
        ) {
            this.updateHidden(
                enemy,
                dt,
                api
            );

            return;
        }

        if (
            enemy.phantomState ===
            "dashing"
        ) {
            this.updateDash(
                enemy,
                dt,
                api
            );

            return;
        }

        if (
            enemy.phantomState ===
            "recovery"
        ) {
            this.updateRecovery(
                enemy,
                dt,
                api
            );

            return;
        }

        this.updateNormal(
            enemy,
            dt,
            api
        );
    },

    drawHidden(enemy, ctx) {
        const progress =
            Math.max(
                0,
                Math.min(
                    1,

                    1 -
                    enemy.stateRemaining /
                    this.hiddenDuration
                )
            );

        const warningPulse =
            1 +
            Math.sin(
                enemy.phantomPulse
            ) *
            0.08;

        ctx.save();

        for (
            let i = 0;
            i < 4;
            i++
        ) {
            const angle =
                enemy.phantomPulse *
                0.18 +
                i *
                Math.PI *
                0.5;

            const distance =
                enemy.radius *
                (
                    0.30 +
                    progress *
                    0.30
                );

            ctx.beginPath();

            ctx.arc(
                enemy.reappearX +
                Math.cos(angle) *
                distance,

                enemy.reappearY +
                Math.sin(angle) *
                distance,

                enemy.radius *
                (
                    0.25 +
                    i *
                    0.035
                ),

                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(48,38,42,${
                    0.20 +
                    progress *
                    0.12
                })`;

            ctx.fill();
        }

        ctx.beginPath();

        ctx.arc(
            enemy.reappearX,
            enemy.reappearY,

            enemy.radius *
            0.82 *
            warningPulse,

            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            `rgba(255,55,28,${
                0.35 +
                progress *
                0.58
            })`;

        ctx.lineWidth = 4;

        ctx.setLineDash([
            9,
            7
        ]);

        ctx.stroke();

        if (
            enemy.stateRemaining <=
            0.65
        ) {
            ctx.beginPath();

            ctx.moveTo(
                enemy.reappearX,
                enemy.reappearY
            );

            ctx.lineTo(
                enemy.lockedTargetX,
                enemy.lockedTargetY
            );

            ctx.strokeStyle =
                enemy.targetLocked

                    ? "rgba(255,55,30,0.90)"

                    : "rgba(255,135,55,0.58)";

            ctx.lineWidth = 3;

            ctx.setLineDash([
                10,
                8
            ]);

            ctx.stroke();
        }

        ctx.restore();
    },

    draw(enemy, ctx, api) {
        if (
            enemy.phantomState ===
            "hidden"
        ) {
            this.drawHidden(
                enemy,
                ctx
            );

            return;
        }

        const r =
            enemy.radius;

        const dashing =
            enemy.phantomState ===
            "dashing";

        const recovering =
            enemy.phantomState ===
            "recovery";

        if (dashing) {
            const speedLength =
                Math.hypot(
                    enemy.vx,
                    enemy.vy
                ) ||
                1;

            const directionX =
                enemy.vx /
                speedLength;

            const directionY =
                enemy.vy /
                speedLength;

            ctx.save();

            ctx.beginPath();

            ctx.moveTo(
                enemy.x -
                directionX *
                r *
                2.5,

                enemy.y -
                directionY *
                r *
                2.5
            );

            ctx.lineTo(
                enemy.x,
                enemy.y
            );

            ctx.strokeStyle =
                "rgba(255,63,28,0.42)";

            ctx.lineWidth =
                r * 0.72;

            ctx.lineCap =
                "round";

            ctx.stroke();

            ctx.restore();
        }

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,

                color:
                    recovering
                        ? "#74413b"
                        : "#342a2c",

                strokeStyle:
                    recovering
                        ? "#ffad62"
                        : "#e64b32",

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

            ctx.globalAlpha =
                recovering
                    ? 0.20
                    : 0.28;

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
                enemy.phantomPulse
            ) *
            0.07;

        ctx.save();

        ctx.strokeStyle =
            recovering

                ? "rgba(255,196,120,0.82)"

                : "rgba(255,55,28,0.65)";

        ctx.lineWidth = 3;

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            r * 0.72 * pulse,
            0,
            Math.PI * 2
        );

        ctx.stroke();

        ctx.fillStyle =
            recovering
                ? "#fff0b0"
                : "#ff4228";

        ctx.shadowBlur = 10;

        ctx.shadowColor =
            "#ff2600";

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.48,
            enemy.y - r * 0.22
        );

        ctx.lineTo(
            enemy.x - r * 0.10,
            enemy.y - r * 0.08
        );

        ctx.lineTo(
            enemy.x - r * 0.42,
            enemy.y + r * 0.03
        );

        ctx.closePath();

        ctx.moveTo(
            enemy.x + r * 0.48,
            enemy.y - r * 0.22
        );

        ctx.lineTo(
            enemy.x + r * 0.10,
            enemy.y - r * 0.08
        );

        ctx.lineTo(
            enemy.x + r * 0.42,
            enemy.y + r * 0.03
        );

        ctx.closePath();

        ctx.fill();

        ctx.shadowBlur = 0;

        ctx.strokeStyle =
            "#140d0e";

        ctx.lineWidth = 4;

        ctx.beginPath();

        ctx.moveTo(
            enemy.x - r * 0.34,
            enemy.y + r * 0.42
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
            enemy.x + r * 0.34,
            enemy.y + r * 0.42
        );

        ctx.stroke();

        ctx.restore();
    }
};


export default ashPhantom;