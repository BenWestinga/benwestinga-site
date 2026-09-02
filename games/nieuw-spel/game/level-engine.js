(() => {
    const levelScreen =
        document.getElementById("level-screen");

    const canvas =
        document.getElementById("level-canvas");

    const ctx =
        canvas.getContext("2d");


    // ==========================================
    // ENEMY SPEEDS
    // ==========================================

    const ENEMY_SPEEDS = {
        verySlow: 70,
        slow: 100,
        mediumSlow: 140,
        medium: 180,
        mediumFast: 215,
        fast: 250,
        veryFast: 300
    };


    // ==========================================
    // ENEMY SIZES
    // ==========================================

    const ENEMY_SIZE_BASE = 10;
    const ENEMY_SIZE_STEP = 4;


    let animationFrame = null;

    let activeContext = null;
    let activeConfig = null;

    let backgroundImage = null;
    let backgroundLoaded = false;

    let lastFrameTime = 0;


    const state = {

        elapsedMs: 0,

        status: "idle",

        statusTimer: 0,

        enemies: [],

        enemyProjectiles: [],

        worms: [],

        explosions: [],

        spawnEvents: [],

        spawnIndex: 0,

        nextEnemyId: 1,

        nextWormId: 1,

        completionSent: false
    };


    window.levelActive = false;
    window.currentLevel = null;


    // ==========================================
    // RESIZE
    // ==========================================

    function resizeLevelCanvas() {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;


        if (
            window.levelActive &&
            window.LevelPlayer
        ) {

            window.LevelPlayer.clamp();
        }
    }


    window.addEventListener(
        "resize",
        resizeLevelCanvas
    );


    document.addEventListener(
        "fullscreenchange",
        resizeLevelCanvas
    );


    // ==========================================
    // FULLSCREEN
    // ==========================================

    async function makeFullscreen() {

        if (
            document.fullscreenElement
        ) {
            return;
        }


        try {

            await document
                .documentElement
                .requestFullscreen();

        } catch (error) {

            console.log(
                "Fullscreen could not be started.",
                error
            );
        }
    }


    // ==========================================
    // BACKGROUND
    // ==========================================

    function getDefaultLevelBackground(
        levelNumber
    ) {

        if (levelNumber <= 10) {

            return {
                image: "sand.png",
                color: "#d8c18b",
                alpha: 0.58
            };
        }


        if (levelNumber <= 20) {

            return {
                image: "grass.png",
                color: "#6f9f4d",
                alpha: 0.58
            };
        }


        if (levelNumber <= 30) {

            return {
                image: "mountain.png",
                color: "#777777",
                alpha: 0.58
            };
        }


        if (levelNumber <= 40) {

            return {
                image: "snow.png",
                color: "#dce8ed",
                alpha: 0.58
            };
        }


        return {
            image: "lava.png",
            color: "#9b3827",
            alpha: 0.58
        };
    }


    async function loadBackground(config) {

        backgroundImage = null;
        backgroundLoaded = false;


        if (
            !config?.background?.image
        ) {
            return;
        }


        const image =
            new Image();


        const url =
            new URL(
                config.background.image,
                window.location.href
            ).href;


        await new Promise(
            resolve => {

                image.onload =
                    () => {

                        backgroundImage =
                            image;

                        backgroundLoaded =
                            true;

                        resolve();
                    };


                image.onerror =
                    () => {

                        console.warn(
                            "Level background could not be loaded:",
                            url
                        );

                        resolve();
                    };


                image.src = url;
            }
        );
    }


    function drawBackground() {

        const background =
            activeConfig?.background || {};


        ctx.fillStyle =
            background.color ||
            "#d8c18b";


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        if (
            backgroundLoaded &&
            backgroundImage
        ) {

            ctx.save();


            ctx.globalAlpha =
                background.alpha ?? 0.58;


            ctx.drawImage(
                backgroundImage,
                0,
                0,
                canvas.width,
                canvas.height
            );


            ctx.restore();
        }
    }


    // ==========================================
    // ARENA
    // ==========================================

    function drawBorders() {

        const border = 14;


        ctx.save();


        ctx.strokeStyle =
            "rgba(20,20,20,0.95)";

        ctx.lineWidth =
            border;


        ctx.strokeRect(
            border / 2,
            border / 2,
            canvas.width - border,
            canvas.height - border
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.85)";

        ctx.lineWidth = 3;


        ctx.strokeRect(
            border,
            border,
            canvas.width - border * 2,
            canvas.height - border * 2
        );


        ctx.restore();
    }


    function drawCenterLine() {

        ctx.save();


        ctx.beginPath();


        ctx.moveTo(
            canvas.width / 2,
            14
        );


        ctx.lineTo(
            canvas.width / 2,
            canvas.height - 14
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.45)";

        ctx.lineWidth = 4;


        ctx.setLineDash([
            18,
            18
        ]);


        ctx.stroke();

        ctx.restore();
    }


    // ==========================================
    // HUD
    // ==========================================

    function drawHud() {

        if (!activeConfig) {
            return;
        }


        ctx.save();


        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font =
            "bold 28px Arial";

        ctx.lineWidth = 6;

        ctx.strokeStyle =
            "rgba(0,0,0,0.75)";


        const title =
            `LEVEL ${activeConfig.number}`;


        ctx.strokeText(
            title,
            canvas.width / 2,
            48
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            title,
            canvas.width / 2,
            48
        );


        // TIMER

        ctx.font =
            "bold 18px Arial";

        ctx.textAlign =
            "left";


        const seconds =
            (
                state.elapsedMs /
                1000
            ).toFixed(1);


        ctx.lineWidth = 4;


        ctx.strokeText(
            `${seconds}s`,
            28,
            42
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            `${seconds}s`,
            28,
            42
        );


        // START DELAY

        const delayMs =
            activeConfig.startDelayMs ||
            0;


        if (
            state.status === "playing" &&
            state.elapsedMs < delayMs
        ) {

            const remaining =
                Math.max(
                    1,
                    Math.ceil(
                        (
                            delayMs -
                            state.elapsedMs
                        ) /
                        1000
                    )
                );


            ctx.textAlign =
                "center";

            ctx.font =
                "bold 54px Arial";

            ctx.lineWidth = 8;


            ctx.strokeText(
                `GET READY ${remaining}`,
                canvas.width / 2,
                canvas.height / 2
            );


            ctx.fillStyle =
                "white";


            ctx.fillText(
                `GET READY ${remaining}`,
                canvas.width / 2,
                canvas.height / 2
            );
        }


        // WIN

        if (
            state.status === "won"
        ) {

            ctx.textAlign =
                "center";

            ctx.font =
                "bold 58px Arial";

            ctx.lineWidth = 8;


            ctx.strokeText(
                "LEVEL COMPLETE!",
                canvas.width / 2,
                canvas.height / 2
            );


            ctx.fillStyle =
                "white";


            ctx.fillText(
                "LEVEL COMPLETE!",
                canvas.width / 2,
                canvas.height / 2
            );
        }


        ctx.restore();
    }


    // ==========================================
    // ENEMY HELPERS
    // ==========================================

    function getEnemyRadius(size) {

        return (
            ENEMY_SIZE_BASE +
            size *
            ENEMY_SIZE_STEP
        );
    }


    function getEnemySpeed(speed) {

        if (
            typeof speed === "number"
        ) {
            return speed;
        }


        return (
            ENEMY_SPEEDS[speed] ||
            ENEMY_SPEEDS.medium
        );
    }


    // ==========================================
    // RANDOM SPAWN TIMES
    // ==========================================

    function createJitteredTimes(
        count,
        startSeconds,
        durationSeconds
    ) {

        if (
            count <= 0
        ) {
            return [];
        }


        const startMs =
            startSeconds * 1000;


        const durationMs =
            durationSeconds * 1000;


        const slotSize =
            durationMs / count;


        const times = [];


        for (
            let i = 0;
            i < count;
            i++
        ) {

            times.push(

                startMs +

                i * slotSize +

                Math.random() *
                slotSize
            );
        }


        return times;
    }


    function buildSpawnEvents() {

        const events = [];


        for (
            const group
            of activeConfig.spawnGroups || []
        ) {

            const times =
                createJitteredTimes(

                    group.count,

                    group.start,

                    group.duration
                );


            for (
                const timeMs
                of times
            ) {

                events.push({

                    timeMs,

                    enemyType:
                        group.enemy
                });
            }
        }


        events.sort(
            (a, b) =>
                a.timeMs -
                b.timeMs
        );


        return events;
    }


    // ==========================================
    // RANDOM SPAWN POSITION
    // ==========================================

    function randomSpawnPosition(radius) {

        const margin =
            Math.max(
                90,
                radius * 2 + 30
            );


        const side =
            Math.floor(
                Math.random() * 4
            );


        // LEFT

        if (side === 0) {

            return {

                x: -margin,

                y:
                    Math.random() *
                    canvas.height
            };
        }


        // RIGHT

        if (side === 1) {

            return {

                x:
                    canvas.width +
                    margin,

                y:
                    Math.random() *
                    canvas.height
            };
        }


        // TOP

        if (side === 2) {

            return {

                x:
                    Math.random() *
                    canvas.width,

                y:
                    -margin
            };
        }


        // BOTTOM

        return {

            x:
                Math.random() *
                canvas.width,

            y:
                canvas.height +
                margin
        };
    }


    // ==========================================
    // SAND WORM
    // ==========================================

    function spawnSandWorm(
        definition,
        position
    ) {

        const worm = {

            id:
                state.nextWormId++,

            parts: [],

            speed:
                getEnemySpeed(
                    definition.speed
                ),

            chaseDuration:
                definition.chaseDuration ?? 3,

            wanderDuration:
                definition.wanderDuration ?? 3,

            chaseTracking:
                definition.chaseTracking ?? 0.4,

            turnSpeed:
                definition.turnSpeed ?? 0.75,

            bodyOverlap:
                definition.bodyOverlap ?? 4,

            modeTime: 0,

            wanderDirection:
                Math.random() < 0.5
                    ? -1
                    : 1,

            angle:
                Math.atan2(
                    window.levelPlayer.y -
                        position.y,
                    window.levelPlayer.x -
                        position.x
                )
        };


        const partHp =
            definition.partHp ?? 4;


        const totalParts =
            1 +
            (definition.segmentCount ?? 4);


        const headRadius =
            getEnemyRadius(
                definition.headSize ?? 3
            );


        const segmentRadius =
            getEnemyRadius(
                definition.segmentSize ?? 2.3
            );


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
                worm.bodyOverlap;


            const part = {

                id:
                    state.nextEnemyId++,

                type:
                    definition.id,

                name:
                    definition.name,

                behavior:
                    "sand-worm-part",

                isWormPart:
                    true,

                isWormHead:
                    isHead,

                wormId:
                    worm.id,

                color:
                    isHead
                        ? (
                            definition.headColor ||
                            "#c7a92f"
                        )
                        : (
                            definition.segmentColor ||
                            "#d8bc3c"
                        ),

                headColor:
                    definition.headColor ||
                    "#c7a92f",

                segmentColor:
                    definition.segmentColor ||
                    "#d8bc3c",

                headRadius,

                segmentRadius,

                x:
                    position.x -
                    Math.cos(
                        worm.angle
                    ) *
                    spacing *
                    i,

                y:
                    position.y -
                    Math.sin(
                        worm.angle
                    ) *
                    spacing *
                    i,

                radius,

                speed:
                    worm.speed,

                tracking:
                    worm.chaseTracking,

                vx:
                    Math.cos(
                        worm.angle
                    ) *
                    worm.speed,

                vy:
                    Math.sin(
                        worm.angle
                    ) *
                    worm.speed,

                hp:
                    partHp,

                maxHp:
                    partHp,

                enteredArena:
                    false,

                explosionRadius: 0,

                explosionDuration: 0
            };


            worm.parts.push(
                part
            );


            state.enemies.push(
                part
            );
        }


        state.worms.push(
            worm
        );
    }


    function removeSandWormPart(
        enemy
    ) {

        const worm =
            state.worms.find(
                item =>
                    item.id ===
                    enemy.wormId
            );


        removeEnemyById(
            enemy.id
        );


        if (!worm) {
            return;
        }


        const partIndex =
            worm.parts.findIndex(
                part =>
                    part.id ===
                    enemy.id
            );


        if (partIndex === -1) {
            return;
        }


        worm.parts.splice(
            partIndex,
            1
        );


        if (
            worm.parts.length === 0
        ) {

            const wormIndex =
                state.worms.findIndex(
                    item =>
                        item.id ===
                        worm.id
                );


            if (
                wormIndex !== -1
            ) {

                state.worms.splice(
                    wormIndex,
                    1
                );
            }


            return;
        }


        if (
            partIndex === 0
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
    }


    function updateSandWorms(dt) {

        for (
            const worm
            of state.worms
        ) {

            if (
                worm.parts.length === 0
            ) {
                continue;
            }


            const head =
                worm.parts[0];


            head.isWormHead =
                true;


            const cycleLength =
                worm.chaseDuration +
                worm.wanderDuration;


            const previousMode =
                worm.modeTime <
                worm.chaseDuration
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
                worm.chaseDuration
                    ? "chase"
                    : "wander";


            if (
                previousMode === "chase" &&
                mode === "wander"
            ) {

                worm.wanderDirection =
                    Math.random() < 0.5
                        ? -1
                        : 1;


                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );
            }


            if (
                mode === "chase"
            ) {

                const dx =
                    window.levelPlayer.x -
                    head.x;


                const dy =
                    window.levelPlayer.y -
                    head.y;


                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                const desiredVx =
                    dx /
                    distance *
                    worm.speed;


                const desiredVy =
                    dy /
                    distance *
                    worm.speed;


                const steering =
                    1 -
                    Math.exp(
                        -worm.chaseTracking *
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
                    worm.turnSpeed *
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
                head.vx * dt;


            head.y +=
                head.vy * dt;


            for (
                let i = 1;
                i < worm.parts.length;
                i++
            ) {

                const previous =
                    worm.parts[i - 1];


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
                        worm.bodyOverlap
                    );


                part.x =
                    previous.x +
                    dx /
                    distance *
                    wantedDistance;


                part.y =
                    previous.y +
                    dy /
                    distance *
                    wantedDistance;


                part.vx =
                    head.vx;


                part.vy =
                    head.vy;
            }
        }
    }


    // ==========================================
    // ENEMY PROJECTILES
    // ==========================================

    function shootEnemyProjectile(
        enemy
    ) {

        const dx =
            window.levelPlayer.x -
            enemy.x;


        const dy =
            window.levelPlayer.y -
            enemy.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const speed =
            enemy.projectileSpeed ||
            260;


        state.enemyProjectiles.push({

            x:
                enemy.x,

            y:
                enemy.y,

            vx:
                dx /
                distance *
                speed,

            vy:
                dy /
                distance *
                speed,

            radius:
                enemy.projectileRadius ||
                6,

            color:
                enemy.projectileColor ||
                "#e32626"
        });
    }


    function updateEnemyProjectiles(dt) {

        for (
            let i =
                state.enemyProjectiles.length - 1;
            i >= 0;
            i--
        ) {

            const projectile =
                state.enemyProjectiles[i];


            projectile.x +=
                projectile.vx * dt;


            projectile.y +=
                projectile.vy * dt;


            if (
                window.LevelPlayer
                    .touchesCircle(
                        projectile.x,
                        projectile.y,
                        projectile.radius
                    )
            ) {

                state.enemyProjectiles.splice(
                    i,
                    1
                );


                killPlayer();

                return;
            }


            const margin =
                projectile.radius +
                40;


            if (
                projectile.x < -margin ||

                projectile.x >
                    canvas.width +
                    margin ||

                projectile.y < -margin ||

                projectile.y >
                    canvas.height +
                    margin
            ) {

                state.enemyProjectiles.splice(
                    i,
                    1
                );
            }
        }
    }


    function drawEnemyProjectiles() {

        for (
            const projectile
            of state.enemyProjectiles
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(
                projectile.x,
                projectile.y,
                projectile.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                projectile.color;


            ctx.fill();


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "rgba(80,0,0,0.85)";


            ctx.stroke();


            ctx.restore();
        }
    }


    // ==========================================
    // SPAWN ENEMY
    // ==========================================

    function spawnEnemy(typeId) {

        const definition =
            activeConfig
                .enemyTypes?.[
                    typeId
                ];


        if (!definition) {

            console.warn(
                "Unknown enemy type:",
                typeId
            );


            return;
        }


        const radius =
            getEnemyRadius(
                definition.size || 1
            );


        const position =
            randomSpawnPosition(
                radius
            );


        if (
            definition.behavior ===
            "sand-worm"
        ) {

            spawnSandWorm(
                definition,
                position
            );


            return;
        }


        const enemy = {

            id:
                state.nextEnemyId++,

            type:
                definition.id,

            name:
                definition.name,

            behavior:
                definition.behavior,

            shape:
                definition.shape ||
                "circle",

            color:
                definition.color ||
                "#d73535",

            x:
                position.x,

            y:
                position.y,

            radius,

            speed:
                getEnemySpeed(
                    definition.speed
                ),

            tracking:
                definition.tracking ?? 3,

            vx: 0,

            vy: 0,

            hp:
                definition.hp,

            maxHp:
                definition.hp,

            enteredArena:
                false,

            explosionRadius:
                definition.explosionRadius ||
                0,

            explosionDuration:
                definition.explosionDuration ||
                0,

            shootInterval:
                definition.shootInterval ||
                0,

            shootTimer:
                0,

            projectileRadius:
                definition.projectileRadius ||
                6,

            projectileSpeed:
                definition.projectileSpeed ||
                260,

            projectileColor:
                definition.projectileColor ||
                "#e32626"
        };


        // ======================================
        // STRAIGHT-THROUGH ENEMY
        // ======================================

        if (
            definition.behavior ===
            "straight-through"
        ) {

            const dx =
                window.levelPlayer.x -
                enemy.x;


            const dy =
                window.levelPlayer.y -
                enemy.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                ) || 1;


            enemy.vx =
                (
                    dx /
                    distance
                ) *
                enemy.speed;


            enemy.vy =
                (
                    dy /
                    distance
                ) *
                enemy.speed;
        }


        // ======================================
        // SAND SHOOTER
        // ======================================

        if (
            definition.behavior ===
            "sand-shooter"
        ) {

            const dx =
                window.levelPlayer.x -
                enemy.x;


            const dy =
                window.levelPlayer.y -
                enemy.y;


            const distance =
                Math.hypot(
                    dx,
                    dy
                ) || 1;


            enemy.vx =
                dx /
                distance *
                enemy.speed;


            enemy.vy =
                dy /
                distance *
                enemy.speed;
        }


        state.enemies.push(
            enemy
        );
    }


    function processSpawns() {

        while (

            state.spawnIndex <
                state.spawnEvents.length &&

            state
                .spawnEvents[
                    state.spawnIndex
                ]
                .timeMs <=
                state.elapsedMs

        ) {

            spawnEnemy(

                state
                    .spawnEvents[
                        state.spawnIndex
                    ]
                    .enemyType
            );


            state.spawnIndex++;
        }
    }


    // ==========================================
    // ARENA CHECKS
    // ==========================================

    function isInsideArena(enemy) {

        return (

            enemy.x >= 0 &&

            enemy.x <=
                canvas.width &&

            enemy.y >= 0 &&

            enemy.y <=
                canvas.height

        );
    }


    function isFullyOutsideArena(enemy) {

        const margin =
            enemy.radius + 120;


        return (

            enemy.x < -margin ||

            enemy.x >
                canvas.width +
                margin ||

            enemy.y < -margin ||

            enemy.y >
                canvas.height +
                margin

        );
    }


    // ==========================================
    // REMOVE ENEMY
    // ==========================================

    function removeEnemyById(id) {

        const index =
            state.enemies
                .findIndex(
                    enemy =>
                        enemy.id === id
                );


        if (
            index !== -1
        ) {

            state.enemies.splice(
                index,
                1
            );
        }
    }


    // ==========================================
    // EXPLOSIONS
    // ==========================================

    function createExplosion(
        x,
        y,
        radius,
        duration
    ) {

        state.explosions.push({

            x,
            y,
            radius,

            remaining:
                duration
        });


        if (
            state.status === "playing" &&

            window.LevelPlayer
                .touchesCircle(
                    x,
                    y,
                    radius
                )
        ) {

            killPlayer();
        }
    }


    // ==========================================
    // ENEMY DAMAGE
    // ==========================================

    function killEnemy(enemy) {

        if (
            enemy.isWormPart
        ) {

            removeSandWormPart(
                enemy
            );


            return;
        }


        removeEnemyById(
            enemy.id
        );


        if (
            enemy.behavior ===
                "bomb-chase" &&

            enemy.explosionRadius > 0
        ) {

            createExplosion(

                enemy.x,

                enemy.y,

                enemy.explosionRadius,

                enemy.explosionDuration ||
                0.1
            );
        }
    }


    function damageEnemy(
        enemy,
        damage
    ) {

        if (
            state.status !== "playing"
        ) {
            return;
        }


        enemy.hp -=
            damage;


        if (
            enemy.hp <= 0
        ) {

            killEnemy(
                enemy
            );
        }
    }


    // ==========================================
    // PLAYER DEATH
    // ==========================================

    function killPlayer() {

        if (
            state.status !== "playing"
        ) {
            return;
        }


        state.status =
            "dead";


        state.statusTimer =
            0;


        window.levelPlayer.alive =
            false;


        state.enemyProjectiles.length =
            0;


        window.LevelCombat.clear();
    }


    // ==========================================
    // ENEMY MOVEMENT
    // ==========================================

    function updateEnemies(dt) {

        updateSandWorms(
            dt
        );


        for (
            let i =
                state.enemies.length - 1;
            i >= 0;
            i--
        ) {

            const enemy =
                state.enemies[i];


            // ==================================
            // WORM PART
            // ==================================

            if (
                enemy.isWormPart
            ) {

                /*
                    Wormdelen worden allemaal
                    centraal bewogen door
                    updateSandWorms().
                */

            } else if (
                enemy.behavior ===
                "straight-through"
            ) {

                // ==================================
                // STRAIGHT THROUGH
                // ==================================

                enemy.x +=
                    enemy.vx * dt;


                enemy.y +=
                    enemy.vy * dt;

            } else {

                // ==================================
                // CHASING ENEMIES
                // ==================================

                const dx =
                    window.levelPlayer.x -
                    enemy.x;


                const dy =
                    window.levelPlayer.y -
                    enemy.y;


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
                    enemy.speed;


                const desiredVy =
                    (
                        dy /
                        distance
                    ) *
                    enemy.speed;


                const steering =
                    1 -
                    Math.exp(
                        -enemy.tracking *
                        dt
                    );


                enemy.vx +=
                    (
                        desiredVx -
                        enemy.vx
                    ) *
                    steering;


                enemy.vy +=
                    (
                        desiredVy -
                        enemy.vy
                    ) *
                    steering;


                enemy.x +=
                    enemy.vx * dt;


                enemy.y +=
                    enemy.vy * dt;
            }


            // ==================================
            // SAND SHOOTER SHOOTING
            // ==================================

            if (
                enemy.behavior ===
                    "sand-shooter" &&

                enemy.shootInterval > 0
            ) {

                enemy.shootTimer +=
                    dt;


                if (
                    enemy.shootTimer >=
                    enemy.shootInterval
                ) {

                    enemy.shootTimer %=
                        enemy.shootInterval;


                    shootEnemyProjectile(
                        enemy
                    );
                }
            }


            // ==================================
            // ENTERED ARENA
            // ==================================

            if (
                isInsideArena(
                    enemy
                )
            ) {

                enemy.enteredArena =
                    true;
            }


            // ==================================
            // STRAIGHT ENEMY LEAVES MAP
            // ==================================

            if (
                enemy.behavior ===
                    "straight-through" &&

                enemy.enteredArena &&

                isFullyOutsideArena(
                    enemy
                )
            ) {

                state.enemies.splice(
                    i,
                    1
                );


                continue;
            }


            // ==================================
            // PLAYER COLLISION
            // ==================================

            if (
                window.LevelPlayer
                    .touchesCircle(
                        enemy.x,
                        enemy.y,
                        enemy.radius
                    )
            ) {

                if (
                    enemy.behavior ===
                        "bomb-chase" &&

                    enemy.explosionRadius >
                        0
                ) {

                    createExplosion(

                        enemy.x,

                        enemy.y,

                        enemy.explosionRadius,

                        enemy.explosionDuration ||
                        0.1
                    );
                }


                killPlayer();


                return;
            }
        }
    }


    // ==========================================
    // UPDATE EXPLOSIONS
    // ==========================================

    function updateExplosions(dt) {

        for (
            let i =
                state.explosions.length - 1;
            i >= 0;
            i--
        ) {

            const explosion =
                state.explosions[i];


            explosion.remaining -=
                dt;


            if (
                state.status === "playing" &&

                window.LevelPlayer
                    .touchesCircle(
                        explosion.x,
                        explosion.y,
                        explosion.radius
                    )
            ) {

                killPlayer();
            }


            if (
                explosion.remaining <= 0
            ) {

                state.explosions.splice(
                    i,
                    1
                );
            }
        }
    }


    // ==========================================
    // DRAW ENEMY FACE
    // ==========================================

    function drawEnemyFace(
        enemy
    ) {

        const x =
            enemy.x;


        const y =
            enemy.y;


        const r =
            enemy.radius;


        ctx.save();


        ctx.lineCap =
            "round";


        ctx.lineJoin =
            "round";


        // OGEN

        const eyeOffsetX =
            r * 0.28;


        const eyeY =
            y -
            r * 0.08;


        const eyeRadius =
            Math.max(
                2,
                r * 0.09
            );


        ctx.fillStyle =
            "#111111";


        ctx.beginPath();

        ctx.arc(
            x - eyeOffsetX,
            eyeY,
            eyeRadius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            x + eyeOffsetX,
            eyeY,
            eyeRadius,
            0,
            Math.PI * 2
        );

        ctx.fill();


        // BOZE WENKBRAUWEN

        ctx.strokeStyle =
            "#111111";


        ctx.lineWidth =
            Math.max(
                2.5,
                r * 0.10
            );


        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.48,
            y - r * 0.34
        );

        ctx.lineTo(
            x - r * 0.10,
            y - r * 0.18
        );

        ctx.stroke();


        ctx.beginPath();

        ctx.moveTo(
            x + r * 0.48,
            y - r * 0.34
        );

        ctx.lineTo(
            x + r * 0.10,
            y - r * 0.18
        );

        ctx.stroke();


        // BOZE MOND

        ctx.beginPath();

        ctx.moveTo(
            x - r * 0.32,
            y + r * 0.42
        );


        ctx.quadraticCurveTo(
            x,
            y + r * 0.16,
            x + r * 0.32,
            y + r * 0.42
        );


        ctx.stroke();


        ctx.restore();
    }


    // ==========================================
    // DRAW ENEMIES
    // ==========================================

    function drawEnemies() {

        for (
            const enemy
            of state.enemies
        ) {

            ctx.save();


            ctx.beginPath();


            // SAND SHOOTER = VIERKANT

            if (
                enemy.shape ===
                "square"
            ) {

                ctx.rect(

                    enemy.x -
                        enemy.radius,

                    enemy.y -
                        enemy.radius,

                    enemy.radius * 2,

                    enemy.radius * 2
                );

            } else {

                ctx.arc(
                    enemy.x,
                    enemy.y,
                    enemy.radius,
                    0,
                    Math.PI * 2
                );
            }


            ctx.fillStyle =
                enemy.color;


            ctx.fill();


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "rgba(0,0,0,0.7)";


            ctx.stroke();


            /*
                Normale enemies:
                gezicht tekenen.

                Worm:
                alleen het hoofd krijgt
                een gezicht.
            */

            if (
                !enemy.isWormPart ||
                enemy.isWormHead
            ) {

                drawEnemyFace(
                    enemy
                );
            }


            // ==================================
            // HP BAR
            // ==================================

            const barWidth =
                enemy.radius * 2;


            const barHeight =
                5;


            const hpRatio =
                Math.max(
                    0,
                    enemy.hp /
                    enemy.maxHp
                );


            ctx.fillStyle =
                "rgba(0,0,0,0.65)";


            ctx.fillRect(

                enemy.x -
                    barWidth / 2,

                enemy.y -
                    enemy.radius -
                    11,

                barWidth,

                barHeight
            );


            ctx.fillStyle =
                "white";


            ctx.fillRect(

                enemy.x -
                    barWidth / 2,

                enemy.y -
                    enemy.radius -
                    11,

                barWidth *
                    hpRatio,

                barHeight
            );


            ctx.restore();
        }
    }


    // ==========================================
    // DRAW EXPLOSIONS
    // ==========================================

    function drawExplosions() {

        for (
            const explosion
            of state.explosions
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(
                explosion.x,
                explosion.y,
                explosion.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(255,120,20,0.45)";


            ctx.fill();


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "rgba(255,230,100,0.9)";


            ctx.stroke();


            ctx.restore();
        }
    }


    // ==========================================
    // WIN CHECK
    // ==========================================

    function checkWin() {

        if (
            state.status !== "playing"
        ) {
            return;
        }


        const allSpawnsFinished =
            state.spawnIndex >=
            state.spawnEvents.length;


        if (

            allSpawnsFinished &&

            state.enemies.length === 0 &&

            state.explosions.length === 0

        ) {

            // Oude enemy-projectiles mogen
            // het winnen niet tegenhouden.

            state.enemyProjectiles.length =
                0;


            winLevel();
        }
    }

    // ==========================================
    // WIN LEVEL
    // ==========================================

    function winLevel() {

        if (
            state.status !== "playing"
        ) {
            return;
        }


        state.status =
            "won";


        state.statusTimer =
            0;


        window.LevelCombat.clear();


        state.enemyProjectiles.length =
            0;


        if (
            !state.completionSent
        ) {

            state.completionSent =
                true;


            if (
                activeContext
                    ?.completeLevel
            ) {

                activeContext
                    .completeLevel();

            } else if (
                window
                    .completeStoryLevel
            ) {

                window
                    .completeStoryLevel(
                        activeConfig.number
                    );
            }
        }
    }


    // ==========================================
    // RESET LEVEL
    // ==========================================

    function resetRuntime() {

        state.elapsedMs =
            0;


        state.status =
            "playing";


        state.statusTimer =
            0;


        state.enemies.length =
            0;


        state.enemyProjectiles.length =
            0;


        state.worms.length =
            0;


        state.explosions.length =
            0;


        /*
            Spawnmomenten worden iedere
            poging opnieuw random gemaakt.
        */

        state.spawnEvents =
            buildSpawnEvents();


        state.spawnIndex =
            0;


        state.nextEnemyId =
            1;


        state.nextWormId =
            1;


        window.LevelPlayer.reset();


        window.LevelCombat.reset();
    }


    // ==========================================
    // UPDATE LEVEL
    // ==========================================

    function updateLevel(dt) {

        updateExplosions(
            dt
        );


        // DEAD

        if (
            state.status === "dead"
        ) {
            return;
        }


        // WON

        if (
            state.status === "won"
        ) {

            state.statusTimer +=
                dt;


            if (
                state.statusTimer >=
                1.2
            ) {

                returnToStoryMap();
            }


            return;
        }


        state.elapsedMs +=
            dt * 1000;


        // ======================================
        // FIRST 5 SECONDS
        // ======================================

        const delayMs =
            activeConfig.startDelayMs ||
            0;


        if (
            state.elapsedMs <
            delayMs
        ) {
            return;
        }


        // SPAWNS

        processSpawns();


        // ENEMIES

        updateEnemies(
            dt
        );


        if (
            state.status !== "playing"
        ) {
            return;
        }


        // ENEMY PROJECTILES

        updateEnemyProjectiles(
            dt
        );


        if (
            state.status !== "playing"
        ) {
            return;
        }


        // PLAYER COMBAT

        window.LevelCombat.update(

            dt,

            state.enemies,

            damageEnemy
        );


        checkWin();
    }


    // ==========================================
    // GAME OVER SCREEN
    // ==========================================

    function getGameOverButton() {

        return {

            width:
                240,

            height:
                65,

            x:
                canvas.width / 2 -
                120,

            y:
                canvas.height / 2 +
                55
        };
    }


    function drawGameOver() {

        if (
            state.status !== "dead"
        ) {
            return;
        }


        ctx.save();


        ctx.fillStyle =
            "rgba(0, 0, 0, 0.72)";


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        // GAME OVER

        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.font =
            "bold 72px Arial";


        ctx.lineWidth =
            9;


        ctx.strokeStyle =
            "black";


        ctx.strokeText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 - 45
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 - 45
        );


        // CONTINUE BUTTON

        const button =
            getGameOverButton();


        ctx.fillStyle =
            "rgba(255,255,255,0.95)";


        ctx.fillRect(
            button.x,
            button.y,
            button.width,
            button.height
        );


        ctx.strokeStyle =
            "black";


        ctx.lineWidth =
            4;


        ctx.strokeRect(
            button.x,
            button.y,
            button.width,
            button.height
        );


        ctx.fillStyle =
            "black";


        ctx.font =
            "bold 26px Arial";


        ctx.fillText(
            "CONTINUE",
            canvas.width / 2,
            button.y +
                button.height / 2
        );


        ctx.restore();
    }


    function handleGameOverClick(event) {

        if (
            state.status !== "dead"
        ) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        const x =
            (event.clientX - rect.left) *
            (canvas.width / rect.width);


        const y =
            (event.clientY - rect.top) *
            (canvas.height / rect.height);


        const button =
            getGameOverButton();


        const insideButton =

            x >= button.x &&

            x <=
                button.x +
                button.width &&

            y >= button.y &&

            y <=
                button.y +
                button.height;


        if (
            !insideButton
        ) {
            return;
        }


        event.preventDefault();


        returnToStoryMap();
    }


    canvas.addEventListener(
        "pointerdown",
        handleGameOverClick
    );


    // ==========================================
    // DRAW LEVEL
    // ==========================================

    function drawLevel() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        drawBackground();


        drawCenterLine();


        drawEnemies();


        drawEnemyProjectiles();


        window.LevelCombat.draw(
            ctx
        );


        drawExplosions();


        window.LevelPlayer
            .draw(ctx);


        drawBorders();


        drawHud();


        drawGameOver();
    }


    // ==========================================
    // GAME LOOP
    // ==========================================

    function levelLoop(time) {

        if (
            !window.levelActive
        ) {

            animationFrame =
                null;


            return;
        }


        if (
            !lastFrameTime
        ) {

            lastFrameTime =
                time;
        }


        const dt =
            Math.min(

                (
                    time -
                    lastFrameTime
                ) /
                1000,

                0.05
            );


        lastFrameTime =
            time;


        if (
            !window.gamePaused
        ) {

            updateLevel(
                dt
            );
        }


        drawLevel();


        animationFrame =
            requestAnimationFrame(
                levelLoop
            );
    }


    // ==========================================
    // START LEVEL
    // ==========================================

    window.startStoryLevel =
        async function(
            config,
            context = {}
        ) {

            const defaultBackground =
                getDefaultLevelBackground(
                    config.number
                );


            activeConfig = {

                ...config,

                background: {

                    ...defaultBackground,

                    ...(config.background || {})
                }
            };


            activeContext =
                context;


            window.currentLevel =
                activeConfig;


            window.levelActive =
                true;


            window.gamePaused =
                false;


            state.completionSent =
                false;


            if (
                context.hideMap
            ) {

                context.hideMap();
            }


            levelScreen.hidden =
                false;


            window.LevelPlayer
                .bindControls();


            await makeFullscreen();


            resizeLevelCanvas();


            await loadBackground(
                activeConfig
            );


            const selectedWeapon =

                context.selectedWeapon ||

                window
                    .StoryProgress
                    ?.getSelectedWeapon
                    ?.() ||

                "pistol";


            const combatModifiers =

                context.combatModifiers ||

                window
                    .StoryProgress
                    ?.getCombatModifiers
                    ?.() ||

                {};


            await window.LevelCombat
                .configure(

                    selectedWeapon,

                    combatModifiers
                );


            resetRuntime();


            lastFrameTime =
                0;


            if (
                !animationFrame
            ) {

                animationFrame =
                    requestAnimationFrame(
                        levelLoop
                    );
            }
        };


    // ==========================================
    // RETURN TO MAP
    // ==========================================

    function returnToStoryMap() {

        window.levelActive =
            false;


        window.gamePaused =
            false;


        window.currentLevel =
            null;


        state.status =
            "idle";


        state.enemies.length =
            0;


        state.enemyProjectiles.length =
            0;


        state.worms.length =
            0;


        state.explosions.length =
            0;


        state.spawnEvents.length =
            0;


        state.spawnIndex =
            0;


        window.LevelCombat.clear();


        levelScreen.hidden =
            true;


        if (
            animationFrame
        ) {

            cancelAnimationFrame(
                animationFrame
            );


            animationFrame =
                null;
        }


        if (
            activeContext
                ?.returnToMap
        ) {

            activeContext
                .returnToMap();
        }


        activeContext =
            null;


        activeConfig =
            null;


        lastFrameTime =
            0;
    }


    window.returnToStoryMap =
        returnToStoryMap;


    window.leaveCurrentLevel =
        returnToStoryMap;


    window.LevelEngine = {

        killPlayer,

        getState:
            () => state
    };

})();