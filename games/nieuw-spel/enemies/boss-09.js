const incomingEnergyBalls = [];
const outgoingEnergyBalls = [];
const lavaBombs = [];
const lavaShrapnel = [];


function clearRuntimeObjects() {
    incomingEnergyBalls.length = 0;
    outgoingEnergyBalls.length = 0;
    lavaBombs.length = 0;
    lavaShrapnel.length = 0;
}


function isProjectileOutside(
    projectile,
    canvas
) {
    const margin =
        projectile.radius + 100;

    return (
        projectile.x < -margin ||
        projectile.x >
            canvas.width + margin ||
        projectile.y < -margin ||
        projectile.y >
            canvas.height + margin
    );
}


function drawEnergyBall(
    ctx,
    ball,
    outgoing = false
) {
    const r = ball.radius;

    ctx.save();

    const gradient =
        ctx.createRadialGradient(
            ball.x - r * 0.28,
            ball.y - r * 0.30,
            r * 0.08,
            ball.x,
            ball.y,
            r
        );

    gradient.addColorStop(
        0,
        "#fff3a1"
    );

    gradient.addColorStop(
        0.40,
        "#ffad2b"
    );

    gradient.addColorStop(
        0.76,
        "#f04412"
    );

    gradient.addColorStop(
        1,
        "#8d1609"
    );

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        r,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = gradient;

    ctx.shadowBlur =
        outgoing
            ? 15
            : 10;

    ctx.shadowColor =
        outgoing
            ? "#ff2f00"
            : "#ff8a18";

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle =
        outgoing
            ? "#fff0a1"
            : "#ffcf68";

    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
}


const lavaBen = {
    id: "lava-ben",
    name: "LavaBen",
    behavior: "lava-ben-boss",

    boss: true,

    hp: 1000,
    size: 8,
    speed: "medium",

    image: "ben.png",

    hideWorldHealthBar: true,
    alwaysShowHealthBar: true,
    hideLevelTitleWhenActive: true,

    attackDuration: 15,
    attackBreakDuration: 8,

    meteorEnemy: "meteor",
    meteorCount: 30,

    energyBallCount: 40,
    energyBallSize: 1.5,
    energyBallSpeed: "fast",
    energyBallSpawnDuration: 8,
    energyBallTravelDuration: 3,
    energyBallReleaseDuration: 3,

    lavaBombCount: 10,
    lavaBombSize: 15.5,
    lavaBombTravelDuration: 2.8,
    lavaBombArcHeight: 170,

    shrapnelCount: 8,
    shrapnelSize: 1.5,
    shrapnelSpeed: "medium",

    reset() {
        clearRuntimeObjects();
    },

    onPlayerDeath() {
        clearRuntimeObjects();
    },

    onLevelWin() {
        clearRuntimeObjects();
    },

    onDeath(enemy, api) {
        clearRuntimeObjects();

        api.completeLevelNow({
            clearEnemies: true,
            stopSpawns: true,
            clearExplosions: true
        });
    },

    onSpawn(enemy, api) {
        enemy.baseLavaBenSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.speed =
            enemy.baseLavaBenSpeed;

        enemy.ragePhase = 0;
        enemy.redness = 0;

        enemy.attackState = "break";

        enemy.attackBreakRemaining =
            this.attackBreakDuration;

        enemy.activeAttack = -1;
        enemy.nextAttack = 0;
        enemy.attackElapsed = 0;

        enemy.meteorsSpawned = 0;

        enemy.energyBallsSpawned = 0;
        enemy.energyBallsAbsorbed = 0;
        enemy.energyBallsReleased = 0;
        enemy.energyReleaseStarted = false;
        enemy.energyReleaseElapsed = 0;
        enemy.energyReleaseBaseAngle = 0;

        enemy.lavaBombsThrown = 0;

        enemy.bossAnimation =
            Math.random() *
            Math.PI *
            2;

        api.aimVelocityAtPlayer(enemy);
    },

    applyRagePhase(enemy, api) {
        const lostHp =
            Math.max(
                0,
                enemy.maxHp -
                enemy.hp
            );

        const phase =
            Math.min(
                4,
                Math.floor(
                    (
                        lostHp +
                        0.0001
                    ) /
                    200
                )
            );

        if (
            phase ===
            enemy.ragePhase
        ) {
            return;
        }

        enemy.ragePhase = phase;
        enemy.redness = phase;

        enemy.size =
            this.size +
            phase;

        enemy.radius =
            api.getEnemyRadius(
                enemy.size
            );

        enemy.speed =
            enemy.baseLavaBenSpeed +
            phase *
            20;

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            );

        if (velocityLength > 0) {
            enemy.vx =
                enemy.vx /
                velocityLength *
                enemy.speed;

            enemy.vy =
                enemy.vy /
                velocityLength *
                enemy.speed;
        }
    },

    onDamage(
        enemy,
        damage,
        oldHp,
        api
    ) {
        this.applyRagePhase(
            enemy,
            api
        );
    },

    chooseMovementDirection(enemy) {
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

    startAttack(
        enemy,
        attackIndex
    ) {
        enemy.attackState = "active";
        enemy.activeAttack = attackIndex;
        enemy.attackElapsed = 0;

        if (attackIndex === 0) {
            enemy.meteorsSpawned = 0;
        }

        if (attackIndex === 1) {
            enemy.vx = 0;
            enemy.vy = 0;

            enemy.energyBallsSpawned = 0;
            enemy.energyBallsAbsorbed = 0;
            enemy.energyBallsReleased = 0;

            enemy.energyReleaseStarted =
                false;

            enemy.energyReleaseElapsed = 0;

            enemy.energyReleaseBaseAngle =
                Math.random() *
                Math.PI *
                2;
        }

        if (attackIndex === 2) {
            enemy.lavaBombsThrown = 0;
        }
    },

    finishAttack(enemy) {
        const finishedAttack =
            enemy.activeAttack;

        enemy.attackState = "break";

        enemy.attackBreakRemaining =
            this.attackBreakDuration;

        enemy.nextAttack =
            (
                finishedAttack +
                1
            ) %
            3;

        enemy.activeAttack = -1;
        enemy.attackElapsed = 0;

        if (finishedAttack === 1) {
            this.chooseMovementDirection(
                enemy
            );
        }
    },

    updateMeteorAttack(
        enemy,
        api
    ) {
        const targetCount =
            Math.min(
                this.meteorCount,

                Math.floor(
                    enemy.attackElapsed /
                    this.attackDuration *
                    this.meteorCount +
                    0.0001
                )
            );

        while (
            enemy.meteorsSpawned <
            targetCount
        ) {
            api.spawnEnemy(
                this.meteorEnemy
            );

            enemy.meteorsSpawned++;
        }
    },

    spawnIncomingEnergyBall(
        enemy,
        api
    ) {
        const radius =
            api.getEnemyRadius(
                this.energyBallSize
            );

        const position =
            api.randomSpawnPosition(
                radius
            );

        incomingEnergyBalls.push({
            owner: enemy,

            x: position.x,
            y: position.y,

            startX: position.x,
            startY: position.y,

            targetX: enemy.x,
            targetY: enemy.y,

            radius,

            remaining:
                this.energyBallTravelDuration,

            maxRemaining:
                this.energyBallTravelDuration
        });
    },

    spawnOutgoingEnergyBall(
        enemy,
        api,
        index
    ) {
        const radius =
            api.getEnemyRadius(
                this.energyBallSize
            );

        const speed =
            api.getEnemySpeed(
                this.energyBallSpeed
            );

        const angle =
            enemy
                .energyReleaseBaseAngle +
            index *
            Math.PI *
            2 /
            this.energyBallCount;

        const spawnDistance =
            enemy.radius +
            radius +
            5;

        outgoingEnergyBalls.push({
            x:
                enemy.x +
                Math.cos(angle) *
                spawnDistance,

            y:
                enemy.y +
                Math.sin(angle) *
                spawnDistance,

            vx:
                Math.cos(angle) *
                speed,

            vy:
                Math.sin(angle) *
                speed,

            radius
        });
    },

    updateEnergyAttack(
        enemy,
        dt,
        api
    ) {
        const targetSpawnCount =
            Math.min(
                this.energyBallCount,

                Math.floor(
                    enemy.attackElapsed /
                    this
                        .energyBallSpawnDuration *
                    this.energyBallCount +
                    0.0001
                )
            );

        while (
            enemy.energyBallsSpawned <
            targetSpawnCount
        ) {
            this.spawnIncomingEnergyBall(
                enemy,
                api
            );

            enemy.energyBallsSpawned++;
        }

        if (
            !enemy
                .energyReleaseStarted &&

            enemy.energyBallsSpawned >=
                this.energyBallCount &&

            enemy.energyBallsAbsorbed >=
                this.energyBallCount
        ) {
            enemy.energyReleaseStarted =
                true;

            enemy.energyReleaseElapsed =
                0;
        }

        if (
            !enemy.energyReleaseStarted
        ) {
            return;
        }

        enemy.energyReleaseElapsed +=
            dt;

        const targetReleaseCount =
            Math.min(
                this.energyBallCount,

                Math.floor(
                    enemy
                        .energyReleaseElapsed /
                    this
                        .energyBallReleaseDuration *
                    this.energyBallCount +
                    0.0001
                )
            );

        while (
            enemy.energyBallsReleased <
            targetReleaseCount
        ) {
            this.spawnOutgoingEnergyBall(
                enemy,
                api,
                enemy.energyBallsReleased
            );

            enemy.energyBallsReleased++;
        }
    },

    spawnLavaBomb(enemy, api) {
        const player =
            api.getPlayer();

        const radius =
            api.getEnemyRadius(
                this.lavaBombSize
            );

        lavaBombs.push({
            x: enemy.x,
            y: enemy.y,

            startX: enemy.x,
            startY: enemy.y,

            targetX: player.x,
            targetY: player.y,

            radius,

            remaining:
                this.lavaBombTravelDuration,

            maxRemaining:
                this.lavaBombTravelDuration,

            arcHeight:
                this.lavaBombArcHeight,

            rotation:
                Math.random() *
                Math.PI *
                2,

            rotationSpeed:
                (
                    Math.random() < 0.5
                        ? -1
                        : 1
                ) *
                3.8
        });
    },

    updateLavaBombAttack(
        enemy,
        api
    ) {
        const targetCount =
            Math.min(
                this.lavaBombCount,

                Math.floor(
                    enemy.attackElapsed /
                    this.attackDuration *
                    this.lavaBombCount +
                    0.0001
                )
            );

        while (
            enemy.lavaBombsThrown <
            targetCount
        ) {
            this.spawnLavaBomb(
                enemy,
                api
            );

            enemy.lavaBombsThrown++;
        }
    },

    updateAttackCycle(
        enemy,
        dt,
        api
    ) {
        if (
            enemy.attackState ===
            "break"
        ) {
            enemy.attackBreakRemaining -=
                dt;

            if (
                enemy
                    .attackBreakRemaining <=
                0
            ) {
                this.startAttack(
                    enemy,
                    enemy.nextAttack
                );
            }

            return;
        }

        enemy.attackElapsed =
            Math.min(
                this.attackDuration,

                enemy.attackElapsed +
                dt
            );

        if (
            enemy.activeAttack === 0
        ) {
            this.updateMeteorAttack(
                enemy,
                api
            );
        }

        if (
            enemy.activeAttack === 1
        ) {
            this.updateEnergyAttack(
                enemy,
                dt,
                api
            );
        }

        if (
            enemy.activeAttack === 2
        ) {
            this.updateLavaBombAttack(
                enemy,
                api
            );
        }

        if (
            enemy.attackElapsed >=
            this.attackDuration
        ) {
            this.finishAttack(enemy);
        }
    },

    updateMovement(
        enemy,
        dt,
        api
    ) {
        if (
            enemy.attackState ===
                "active" &&

            enemy.activeAttack === 1
        ) {
            enemy.vx = 0;
            enemy.vy = 0;

            return;
        }

        const velocityLength =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;

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

    update(enemy, dt, api) {
        this.applyRagePhase(
            enemy,
            api
        );

        this.updateMovement(
            enemy,
            dt,
            api
        );

        enemy.bossAnimation +=
            dt *
            4;

        if (!enemy.enteredArena) {
            return;
        }

        this.updateAttackCycle(
            enemy,
            dt,
            api
        );
    },

    createShrapnel(x, y, api) {
        const radius =
            api.getEnemyRadius(
                this.shrapnelSize
            );

        const speed =
            api.getEnemySpeed(
                this.shrapnelSpeed
            );

        for (
            let i = 0;
            i < this.shrapnelCount;
            i++
        ) {
            const angle =
                i *
                Math.PI *
                2 /
                this.shrapnelCount;

            lavaShrapnel.push({
                x:
                    x +
                    Math.cos(angle) *
                    (
                        radius +
                        8
                    ),

                y:
                    y +
                    Math.sin(angle) *
                    (
                        radius +
                        8
                    ),

                vx:
                    Math.cos(angle) *
                    speed,

                vy:
                    Math.sin(angle) *
                    speed,

                angle,
                radius
            });
        }
    },

    beforeUpdate(dt, api) {
        const canvas =
            api.getCanvas();

        for (
            let i =
                incomingEnergyBalls.length -
                1;

            i >= 0;

            i--
        ) {
            const ball =
                incomingEnergyBalls[i];

            if (
                !ball.owner ||
                !api.isEnemyAlive(
                    ball.owner
                )
            ) {
                incomingEnergyBalls.splice(
                    i,
                    1
                );

                continue;
            }

            ball.remaining -= dt;

            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,

                        1 -
                        ball.remaining /
                        ball.maxRemaining
                    )
                );

            const eased =
                1 -
                Math.pow(
                    1 - progress,
                    2
                );

            ball.x =
                ball.startX +
                (
                    ball.targetX -
                    ball.startX
                ) *
                eased;

            ball.y =
                ball.startY +
                (
                    ball.targetY -
                    ball.startY
                ) *
                eased;

            if (
                api.playerTouchesCircle(
                    ball.x,
                    ball.y,
                    ball.radius
                )
            ) {
                api.killPlayer();
                return;
            }

            if (
                ball.remaining <= 0
            ) {
                ball.owner
                    .energyBallsAbsorbed++;

                incomingEnergyBalls.splice(
                    i,
                    1
                );
            }
        }

        for (
            let i =
                outgoingEnergyBalls.length -
                1;

            i >= 0;

            i--
        ) {
            const ball =
                outgoingEnergyBalls[i];

            ball.x +=
                ball.vx *
                dt;

            ball.y +=
                ball.vy *
                dt;

            if (
                api.playerTouchesCircle(
                    ball.x,
                    ball.y,
                    ball.radius
                )
            ) {
                api.killPlayer();
                return;
            }

            if (
                isProjectileOutside(
                    ball,
                    canvas
                )
            ) {
                outgoingEnergyBalls.splice(
                    i,
                    1
                );
            }
        }

        for (
            let i =
                lavaBombs.length - 1;

            i >= 0;

            i--
        ) {
            const bomb =
                lavaBombs[i];

            bomb.remaining -= dt;

            bomb.rotation +=
                bomb.rotationSpeed *
                dt;

            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,

                        1 -
                        bomb.remaining /
                        bomb.maxRemaining
                    )
                );

            bomb.x =
                bomb.startX +
                (
                    bomb.targetX -
                    bomb.startX
                ) *
                progress;

            const linearY =
                bomb.startY +
                (
                    bomb.targetY -
                    bomb.startY
                ) *
                progress;

            bomb.y =
                linearY -
                Math.sin(
                    progress *
                    Math.PI
                ) *
                bomb.arcHeight;

            if (
                api.playerTouchesCircle(
                    bomb.x,
                    bomb.y,
                    bomb.radius
                )
            ) {
                api.killPlayer();
                return;
            }

            if (
                bomb.remaining <= 0
            ) {
                lavaBombs.splice(
                    i,
                    1
                );

                api.createExplosion(
                    bomb.targetX,
                    bomb.targetY,
                    bomb.radius,
                    0.34
                );

                this.createShrapnel(
                    bomb.targetX,
                    bomb.targetY,
                    api
                );
            }
        }

        for (
            let i =
                lavaShrapnel.length - 1;

            i >= 0;

            i--
        ) {
            const shard =
                lavaShrapnel[i];

            shard.x +=
                shard.vx *
                dt;

            shard.y +=
                shard.vy *
                dt;

            if (
                api.playerTouchesCircle(
                    shard.x,
                    shard.y,
                    shard.radius
                )
            ) {
                api.killPlayer();
                return;
            }

            if (
                isProjectileOutside(
                    shard,
                    canvas
                )
            ) {
                lavaShrapnel.splice(
                    i,
                    1
                );
            }
        }
    },

    drawBelow(ctx) {
        for (
            const bomb
            of lavaBombs
        ) {
            const progress =
                Math.max(
                    0,
                    Math.min(
                        1,

                        1 -
                        bomb.remaining /
                        bomb.maxRemaining
                    )
                );

            ctx.save();
            ctx.beginPath();

            ctx.arc(
                bomb.targetX,
                bomb.targetY,
                bomb.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                `rgba(255,80,10,${
                    0.08 +
                    progress *
                    0.12
                })`;

            ctx.fill();

            ctx.strokeStyle =
                `rgba(255,184,58,${
                    0.48 +
                    progress *
                    0.46
                })`;

            ctx.lineWidth = 4;

            ctx.setLineDash([
                12,
                9
            ]);

            ctx.stroke();
            ctx.restore();
        }
    },

    drawGlobal(ctx) {
        for (
            const ball
            of incomingEnergyBalls
        ) {
            drawEnergyBall(
                ctx,
                ball,
                false
            );
        }

        for (
            const ball
            of outgoingEnergyBalls
        ) {
            drawEnergyBall(
                ctx,
                ball,
                true
            );
        }

        for (
            const bomb
            of lavaBombs
        ) {
            const r =
                bomb.radius;

            ctx.save();

            ctx.translate(
                bomb.x,
                bomb.y
            );

            ctx.rotate(
                bomb.rotation
            );

            const gradient =
                ctx.createRadialGradient(
                    -r * 0.28,
                    -r * 0.30,
                    r * 0.08,
                    0,
                    0,
                    r
                );

            gradient.addColorStop(
                0,
                "#ffdc68"
            );

            gradient.addColorStop(
                0.38,
                "#f26a18"
            );

            gradient.addColorStop(
                0.74,
                "#602018"
            );

            gradient.addColorStop(
                1,
                "#190d0c"
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
                gradient;

            ctx.shadowBlur = 15;
            ctx.shadowColor = "#ff4a00";
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#ff9d2d";

            ctx.lineWidth =
                Math.max(
                    3,
                    r * 0.06
                );

            ctx.stroke();

            ctx.strokeStyle = "#ffd55d";

            ctx.lineWidth =
                Math.max(
                    2,
                    r * 0.04
                );

            ctx.beginPath();

            ctx.moveTo(
                -r * 0.58,
                -r * 0.18
            );

            ctx.lineTo(
                -r * 0.12,
                r * 0.05
            );

            ctx.lineTo(
                r * 0.12,
                -r * 0.50
            );

            ctx.moveTo(
                r * 0.12,
                r * 0.67
            );

            ctx.lineTo(
                r * 0.02,
                r * 0.10
            );

            ctx.lineTo(
                r * 0.54,
                r * 0.25
            );

            ctx.stroke();
            ctx.restore();
        }

        for (
            const shard
            of lavaShrapnel
        ) {
            const r =
                shard.radius;

            ctx.save();

            ctx.translate(
                shard.x,
                shard.y
            );

            ctx.rotate(
                shard.angle
            );

            ctx.beginPath();

            ctx.moveTo(
                r,
                0
            );

            ctx.lineTo(
                -r * 0.65,
                -r * 0.55
            );

            ctx.lineTo(
                -r * 0.38,
                0
            );

            ctx.lineTo(
                -r * 0.65,
                r * 0.55
            );

            ctx.closePath();

            ctx.fillStyle = "#ff7218";
            ctx.shadowBlur = 10;
            ctx.shadowColor = "#ff3300";
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.strokeStyle = "#ffd05c";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    },

    draw(enemy, ctx, api) {
        const r =
            enemy.radius;

        const absorbing =
            enemy.attackState ===
                "active" &&

            enemy.activeAttack ===
                1;

        const shakeX =
            absorbing
                ? Math.sin(
                    enemy.bossAnimation *
                    13
                ) *
                4
                : 0;

        const shakeY =
            absorbing
                ? Math.cos(
                    enemy.bossAnimation *
                    11
                ) *
                4
                : 0;

        const x =
            enemy.x +
            shakeX;

        const y =
            enemy.y +
            shakeY;

        ctx.save();

        const gradient =
            ctx.createRadialGradient(
                x - r * 0.28,
                y - r * 0.32,
                r * 0.10,
                x,
                y,
                r
            );

        gradient.addColorStop(
            0,
            "#ffb243"
        );

        gradient.addColorStop(
            0.48,
            "#df501b"
        );

        gradient.addColorStop(
            1,
            "#64180e"
        );

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            r,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = gradient;

        ctx.shadowBlur =
            14 +
            enemy.ragePhase *
            3;

        ctx.shadowColor = "#ff3a00";
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
                x,
                y,
                r * 0.91,
                0,
                Math.PI * 2
            );

            ctx.clip();
            ctx.globalAlpha = 0.74;

            ctx.drawImage(
                image,
                x - r,
                y - r,
                r * 2,
                r * 2
            );

            ctx.fillStyle =
                `rgba(255,82,8,${
                    0.18 +
                    enemy.ragePhase *
                    0.045
                })`;

            ctx.fillRect(
                x - r,
                y - r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            r,
            0,
            Math.PI * 2
        );

        ctx.strokeStyle =
            enemy.ragePhase >= 3
                ? "#ff4220"
                : "#ff9c32";

        ctx.lineWidth = 6;
        ctx.stroke();

        if (absorbing) {
            const pulse =
                1 +
                Math.sin(
                    enemy.bossAnimation *
                    3
                ) *
                0.05;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                r * 1.16 * pulse,
                0,
                Math.PI * 2
            );

            ctx.strokeStyle =
                "rgba(255,205,78,0.78)";

            ctx.lineWidth = 5;
            ctx.shadowBlur = 14;
            ctx.shadowColor = "#ff5b00";
            ctx.stroke();
        }

        ctx.restore();
    },

    drawHud(
        ctx,
        api,
        definition
    ) {
        const boss =
            api.getEnemies()
                .find(
                    enemy =>
                        enemy.definition ===
                            definition &&

                        enemy.enteredArena
                );

        if (!boss) {
            return;
        }

        const canvas =
            api.getCanvas();

        const width =
            Math.min(
                620,
                canvas.width *
                0.62
            );

        const height = 26;

        const x =
            canvas.width /
            2 -
            width /
            2;

        const y = 68;

        const hpRatio =
            Math.max(
                0,
                Math.min(
                    1,
                    boss.hp /
                    boss.maxHp
                )
            );

        ctx.save();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 24px Arial";
        ctx.lineWidth = 5;

        ctx.strokeStyle =
            "rgba(0,0,0,0.82)";

        ctx.strokeText(
            "LAVABEN",
            canvas.width / 2,
            y - 21
        );

        ctx.fillStyle = "#ffb15a";

        ctx.fillText(
            "LAVABEN",
            canvas.width / 2,
            y - 21
        );

        ctx.fillStyle =
            "rgba(0,0,0,0.80)";

        ctx.fillRect(
            x - 4,
            y - 4,
            width + 8,
            height + 8
        );

        const healthGradient =
            ctx.createLinearGradient(
                x,
                y,
                x + width,
                y
            );

        healthGradient.addColorStop(
            0,
            "#ff9b28"
        );

        healthGradient.addColorStop(
            1,
            "#d83218"
        );

        ctx.fillStyle =
            healthGradient;

        ctx.fillRect(
            x,
            y,
            width * hpRatio,
            height
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            x,
            y,
            width,
            height
        );

        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#ffffff";

        ctx.fillText(
            `${Math.ceil(
                boss.hp
            )} / ${boss.maxHp}`,

            canvas.width / 2,

            y +
            height /
            2
        );

        ctx.restore();
    }
};


export default lavaBen;