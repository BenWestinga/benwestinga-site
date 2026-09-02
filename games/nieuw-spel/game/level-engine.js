(() => {

    const levelScreen =
        document.getElementById(
            "level-screen"
        );

    const canvas =
        document.getElementById(
            "level-canvas"
        );

    const ctx =
        canvas.getContext("2d");


    // ==========================================
    // ENEMY SPEEDS
    // ==========================================

    const ENEMY_SPEEDS = {

        ultraSlow: 50,

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

    const ENEMY_SIZE_BASE =
        10;

    const ENEMY_SIZE_STEP =
        4;


    let animationFrame =
        null;

    let activeContext =
        null;

    let activeConfig =
        null;

    let backgroundImage =
        null;

    let backgroundLoaded =
        false;

    let lastFrameTime =
        0;


    const assetImageCache =
        new Map();


    const state = {

        elapsedMs:
            0,

        status:
            "idle",

        statusTimer:
            0,

        enemies:
            [],

        enemyProjectiles:
            [],

        bossThrows:
            [],

        worms:
            [],

        explosions:
            [],

        spawnEvents:
            [],

        spawnIndex:
            0,

        nextEnemyId:
            1,

        nextWormId:
            1,

        completionSent:
            false
    };


    window.levelActive =
        false;

    window.currentLevel =
        null;


    // ==========================================
    // CANVAS / FULLSCREEN
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

            window.LevelPlayer
                .clamp();
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

        if (
            levelNumber <= 10
        ) {

            return {

                image:
                    "sand.png",

                color:
                    "#d8c18b",

                alpha:
                    0.58
            };
        }


        if (
            levelNumber <= 20
        ) {

            return {

                image:
                    "grass.png",

                color:
                    "#6f9f4d",

                alpha:
                    0.58
            };
        }


        if (
            levelNumber <= 30
        ) {

            return {

                image:
                    "mountain.png",

                color:
                    "#777777",

                alpha:
                    0.58
            };
        }


        if (
            levelNumber <= 40
        ) {

            return {

                image:
                    "snow.png",

                color:
                    "#dce8ed",

                alpha:
                    0.58
            };
        }


        return {

            image:
                "lava.png",

            color:
                "#9b3827",

            alpha:
                0.58
        };
    }


    async function loadBackground(
        config
    ) {

        backgroundImage =
            null;

        backgroundLoaded =
            false;


        if (
            !config
                ?.background
                ?.image
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


                image.src =
                    url;
            }
        );
    }


    function drawBackground() {

        const background =
            activeConfig
                ?.background ||
            {};


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
                background.alpha ??
                0.58;


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

        const border =
            14;


        ctx.save();


        ctx.strokeStyle =
            "rgba(20,20,20,0.95)";

        ctx.lineWidth =
            border;


        ctx.strokeRect(
            border / 2,
            border / 2,
            canvas.width -
                border,
            canvas.height -
                border
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.85)";

        ctx.lineWidth =
            3;


        ctx.strokeRect(
            border,
            border,
            canvas.width -
                border * 2,
            canvas.height -
                border * 2
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

        ctx.lineWidth =
            4;


        ctx.setLineDash([
            18,
            18
        ]);


        ctx.stroke();

        ctx.restore();
    }


    function isInsideArena(
        enemy
    ) {

        return (

            enemy.x >= 0 &&

            enemy.x <=
                canvas.width &&

            enemy.y >= 0 &&

            enemy.y <=
                canvas.height
        );
    }


    function isFullyOutsideArena(
        enemy
    ) {

        const margin =
            enemy.radius +
            120;


        return (

            enemy.x <
                -margin ||

            enemy.x >
                canvas.width +
                margin ||

            enemy.y <
                -margin ||

            enemy.y >
                canvas.height +
                margin
        );
    }


    // ==========================================
    // HUD
    // ==========================================

    function drawHud() {

        if (
            !activeConfig
        ) {
            return;
        }


        ctx.save();


        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 28px Arial";

        ctx.lineWidth =
            6;

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


        ctx.lineWidth =
            4;


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
            activeConfig
                .startDelayMs ||
            0;


        if (

            state.status ===
                "playing" &&

            state.elapsedMs <
                delayMs
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

            ctx.lineWidth =
                8;


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
            state.status ===
            "won"
        ) {

            ctx.textAlign =
                "center";

            ctx.font =
                "bold 58px Arial";

            ctx.lineWidth =
                8;


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
    // HELPERS
    // ==========================================

    function getEnemyRadius(
        size
    ) {

        return (

            ENEMY_SIZE_BASE +

            size *
            ENEMY_SIZE_STEP
        );
    }


    function getEnemySpeed(
        speed
    ) {

        if (
            typeof speed ===
            "number"
        ) {

            return speed;
        }


        return (

            ENEMY_SPEEDS[
                speed
            ] ||

            ENEMY_SPEEDS
                .medium
        );
    }


    function getAssetImage(
        source
    ) {

        if (
            !source
        ) {
            return null;
        }


        if (
            assetImageCache
                .has(
                    source
                )
        ) {

            return assetImageCache
                .get(
                    source
                );
        }


        const image =
            new Image();


        image.src =
            new URL(
                source,
                window.location.href
            ).href;


        assetImageCache.set(
            source,
            image
        );


        return image;
    }


    function randomSpawnPosition(
        radius
    ) {

        const margin =
            Math.max(

                90,

                radius *
                2 +
                30
            );


        const side =
            Math.floor(
                Math.random() *
                4
            );


        if (
            side === 0
        ) {

            return {

                x:
                    -margin,

                y:
                    Math.random() *
                    canvas.height
            };
        }


        if (
            side === 1
        ) {

            return {

                x:
                    canvas.width +
                    margin,

                y:
                    Math.random() *
                    canvas.height
            };
        }


        if (
            side === 2
        ) {

            return {

                x:
                    Math.random() *
                    canvas.width,

                y:
                    -margin
            };
        }


        return {

            x:
                Math.random() *
                canvas.width,

            y:
                canvas.height +
                margin
        };
    }


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
            startSeconds *
            1000;


        const durationMs =
            durationSeconds *
            1000;


        const slotSize =
            durationMs /
            count;


        const times =
            [];


        for (
            let i = 0;
            i < count;
            i++
        ) {

            times.push(

                startMs +

                i *
                slotSize +

                Math.random() *
                slotSize
            );
        }


        return times;
    }


    function buildSpawnEvents() {

        const events =
            [];


        for (
            const group
            of activeConfig
                .spawnGroups ||
            []
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
            (
                a,
                b
            ) =>
                a.timeMs -
                b.timeMs
        );


        return events;
    }


    function removeEnemyById(
        id
    ) {

        const index =
            state.enemies
                .findIndex(

                    enemy =>
                        enemy.id ===
                        id
                );


        if (
            index !== -1
        ) {

            state.enemies
                .splice(
                    index,
                    1
                );
        }
    }


    function moveChasingEnemy(
        enemy,
        dt
    ) {

        const dx =
            window
                .levelPlayer
                .x -
            enemy.x;


        const dy =
            window
                .levelPlayer
                .y -
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
            enemy.vx *
            dt;


        enemy.y +=
            enemy.vy *
            dt;
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

            parts:
                [],

            speed:
                getEnemySpeed(
                    definition.speed
                ),

            chaseDuration:
                definition
                    .chaseDuration ??
                3,

            wanderDuration:
                definition
                    .wanderDuration ??
                3,

            chaseTracking:
                definition
                    .chaseTracking ??
                0.4,

            turnSpeed:
                definition
                    .turnSpeed ??
                0.75,

            bodyOverlap:
                definition
                    .bodyOverlap ??
                4,

            modeTime:
                0,

            wanderDirection:
                Math.random() <
                0.5
                    ? -1
                    : 1,

            angle:
                Math.atan2(

                    window
                        .levelPlayer
                        .y -
                    position.y,

                    window
                        .levelPlayer
                        .x -
                    position.x
                )
        };


        const partHp =
            definition.partHp ??
            4;


        const totalParts =
            1 +
            (
                definition
                    .segmentCount ??
                4
            );


        const headRadius =
            getEnemyRadius(

                definition
                    .headSize ??
                3
            );


        const segmentRadius =
            getEnemyRadius(

                definition
                    .segmentSize ??
                2.3
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
                            definition
                                .headColor ||
                            "#c7a92f"
                        )
                        : (
                            definition
                                .segmentColor ||
                            "#d8bc3c"
                        ),


                headColor:
                    definition
                        .headColor ||
                    "#c7a92f",

                segmentColor:
                    definition
                        .segmentColor ||
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

                hasBeenDamaged:
                    false,

                enteredArena:
                    false,

                explosionRadius:
                    0,

                explosionDuration:
                    0
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
            state.worms
                .find(

                    item =>
                        item.id ===
                        enemy.wormId
                );


        removeEnemyById(
            enemy.id
        );


        if (
            !worm
        ) {
            return;
        }


        const partIndex =
            worm.parts
                .findIndex(

                    part =>
                        part.id ===
                        enemy.id
                );


        if (
            partIndex === -1
        ) {
            return;
        }


        worm.parts.splice(
            partIndex,
            1
        );


        if (
            worm.parts.length ===
            0
        ) {

            const wormIndex =
                state.worms
                    .findIndex(

                        item =>
                            item.id ===
                            worm.id
                    );


            if (
                wormIndex !== -1
            ) {

                state.worms
                    .splice(
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


    function updateSandWorms(
        dt
    ) {

        for (
            const worm
            of state.worms
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

                const dx =
                    window
                        .levelPlayer
                        .x -
                    head.x;


                const dy =
                    window
                        .levelPlayer
                        .y -
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

                        -worm
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
                head.vx *
                dt;


            head.y +=
                head.vy *
                dt;


            for (
                let i = 1;
                i < worm.parts.length;
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

                        worm.bodyOverlap
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
    }


    // ==========================================
    // SAND-BEN
    // ==========================================

    function keepBossInsideArena(
        boss
    ) {

        const margin =
            boss.radius +
            14;


        if (
            boss.x <
            margin
        ) {

            boss.x =
                margin;

            boss.vx =
                Math.abs(
                    boss.vx
                );
        }


        if (
            boss.x >
            canvas.width -
            margin
        ) {

            boss.x =
                canvas.width -
                margin;

            boss.vx =
                -Math.abs(
                    boss.vx
                );
        }


        if (
            boss.y <
            margin
        ) {

            boss.y =
                margin;

            boss.vy =
                Math.abs(
                    boss.vy
                );
        }


        if (
            boss.y >
            canvas.height -
            margin
        ) {

            boss.y =
                canvas.height -
                margin;

            boss.vy =
                -Math.abs(
                    boss.vy
                );
        }
    }


    function startBossFight(
        boss
    ) {

        if (
            boss.bossFightStarted
        ) {
            return;
        }


        boss.bossFightStarted =
            true;

        boss.bossCycleTime =
            0;

        boss.bossPhase =
            -1;

        boss.bossFirstAttack =
            null;

        boss.bossAttackId =
            0;

        boss.bossAttackElapsed =
            0;

        boss.minionTimer =
            0;

        boss.bossChargeState =
            "idle";

        boss.bossFlash =
            false;
    }


    function chooseBossAttack(
        boss,
        slot
    ) {

        const threshold =

            boss.attackSystem
                ?.lowHealthThreshold ??

            75;


        // <= 75 HP:
        // 1, 2 of 3 volledig random.

        if (
            boss.hp <=
            threshold
        ) {

            return (

                1 +

                Math.floor(
                    Math.random() *
                    3
                )
            );
        }


        // Boven 75 HP:
        // eerste slot = random 1/2.
        // tweede slot = de andere.

        if (
            slot === 1
        ) {

            const attack =

                Math.random() <
                0.5

                    ? 1

                    : 2;


            boss.bossFirstAttack =
                attack;


            return attack;
        }


        return (

            boss.bossFirstAttack ===
            1

                ? 2

                : 1
        );
    }


    // ==========================================
    // BOSS ATTACK 1
    // ==========================================

    function fireBossRock(
        boss
    ) {

        const attack =
            boss.attack1 ||
            {};


        const dx =
            window
                .levelPlayer
                .x -
            boss.x;


        const dy =
            window
                .levelPlayer
                .y -
            boss.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const speed =

            attack
                .projectileSpeed ??

            300;


        state.enemyProjectiles
            .push({

                kind:
                    "boss-rock",

                x:
                    boss.x,

                y:
                    boss.y,

                vx:
                    (
                        dx /
                        distance
                    ) *
                    speed,

                vy:
                    (
                        dy /
                        distance
                    ) *
                    speed,

                radius:
                    getEnemyRadius(

                        attack
                            .projectileSize ??

                        2
                    ),

                color:
                    attack
                        .projectileColor ||

                    boss.color ||

                    "#e0bd38",

                image:
                    attack
                        .projectileImage ||

                    "Rock.png",

                bounceCount:
                    0,

                maxBounces:
                    attack
                        .maxBounces ??
                    2
            });
    }


    function startBossAttack(
        boss,
        attackId
    ) {

        boss.bossAttackId =
            attackId;

        boss.bossAttackElapsed =
            0;

        boss.bossFlash =
            false;


        if (
            attackId === 1
        ) {

            boss.bossAttackShots =
                0;

            boss.bossNextShotTime =
                0;
        }


        if (
            attackId === 2
        ) {

            boss.bossChargeCount =
                0;

            boss.bossNextChargeTime =
                0;

            boss.bossChargeState =
                "idle";

            boss.bossChargeTimer =
                0;
        }


        if (
            attackId === 3
        ) {

            boss.bossThrowDone =
                false;
        }
    }


    function endBossAttack(
        boss
    ) {

        boss.bossAttackId =
            0;

        boss.bossAttackElapsed =
            0;

        boss.bossFlash =
            false;

        boss.bossChargeState =
            "idle";

        boss.bossChargeTimer =
            0;
    }


    // ==========================================
    // BOSS ATTACK 2
    // ==========================================

    function startBossChargeWarning(
        boss
    ) {

        boss.bossChargeState =
            "warning";

        boss.bossChargeTimer =
            0;

        boss.vx =
            0;

        boss.vy =
            0;
    }


    function updateBossCharge(
        boss,
        dt
    ) {

        const attack =
            boss.attack2 ||
            {};


        // 2 seconden stil + 2x geel knipperen

        if (
            boss.bossChargeState ===
            "warning"
        ) {

            boss.bossChargeTimer +=
                dt;


            const warningDuration =

                attack
                    .warningDuration ??

                2;


            const flashes =

                attack
                    .warningFlashes ??

                2;


            const flashPart =

                warningDuration /

                Math.max(
                    1,
                    flashes * 2
                );


            boss.bossFlash =

                (
                    Math.floor(

                        boss.bossChargeTimer /

                        flashPart
                    ) %

                    2
                ) === 0;


            if (
                boss.bossChargeTimer >=
                warningDuration
            ) {

                boss.bossFlash =
                    false;


                const dx =
                    window
                        .levelPlayer
                        .x -
                    boss.x;


                const dy =
                    window
                        .levelPlayer
                        .y -
                    boss.y;


                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                const speed =

                    attack
                        .dashSpeed ??

                    700;


                boss.vx =
                    (
                        dx /
                        distance
                    ) *
                    speed;


                boss.vy =
                    (
                        dy /
                        distance
                    ) *
                    speed;


                boss.bossChargeState =
                    "dash";

                boss.bossChargeTimer =
                    0;
            }


            return true;
        }


        // Rechte dash richting de
        // positie waarop hij mikte.

        if (
            boss.bossChargeState ===
            "dash"
        ) {

            boss.x +=
                boss.vx *
                dt;


            boss.y +=
                boss.vy *
                dt;


            const margin =
                boss.radius +
                14;


            let hitWall =
                false;


            if (
                boss.x <=
                margin
            ) {

                boss.x =
                    margin;

                hitWall =
                    true;
            }


            if (
                boss.x >=
                canvas.width -
                margin
            ) {

                boss.x =
                    canvas.width -
                    margin;

                hitWall =
                    true;
            }


            if (
                boss.y <=
                margin
            ) {

                boss.y =
                    margin;

                hitWall =
                    true;
            }


            if (
                boss.y >=
                canvas.height -
                margin
            ) {

                boss.y =
                    canvas.height -
                    margin;

                hitWall =
                    true;
            }


            if (
                hitWall
            ) {

                boss.vx =
                    0;

                boss.vy =
                    0;

                boss.bossChargeState =
                    "wall-pause";

                boss.bossChargeTimer =
                    0;
            }


            return true;
        }


        // Na muur 1 seconde stil.

        if (
            boss.bossChargeState ===
            "wall-pause"
        ) {

            boss.bossChargeTimer +=
                dt;

            boss.vx =
                0;

            boss.vy =
                0;


            if (
                boss.bossChargeTimer >=

                (
                    attack
                        .wallPause ??

                    1
                )
            ) {

                boss.bossChargeState =
                    "idle";

                boss.bossChargeTimer =
                    0;
            }


            return true;
        }


        return false;
    }


    // ==========================================
    // BOSS ATTACK 3
    // ==========================================

    function launchBossWormBall(
        boss
    ) {

        const attack =
            boss.attack3 ||
            {};


        const targetX =
            window
                .levelPlayer
                .x;


        const targetY =
            window
                .levelPlayer
                .y;


        state.bossThrows.push({

            x:
                boss.x,

            y:
                boss.y,

            startX:
                boss.x,

            startY:
                boss.y,

            targetX,

            targetY,

            elapsed:
                0,

            duration:
                attack
                    .flightDuration ??
                1.25,

            radius:
                getEnemyRadius(

                    attack
                        .projectileSize ??

                    5
                ),

            color:
                attack
                    .projectileColor ||

                boss.color ||

                "#e0bd38",

            targetColor:
                attack
                    .targetColor ||

                "rgba(0,0,0,0.60)",

            targetOutline:
                attack
                    .targetOutline ||

                "#000000",

            targetRadius:
                attack
                    .targetRadius ??
                46,

            spawnEnemy:
                attack
                    .spawnEnemy ||

                "sandWorm"
        });
    }


    function updateBossAttackLogic(
        boss,
        dt
    ) {

        if (
            boss.bossAttackId ===
            0
        ) {
            return;
        }


        boss.bossAttackElapsed +=
            dt;


        // ATTACK 1

        if (
            boss.bossAttackId ===
            1
        ) {

            const attack =
                boss.attack1 ||
                {};


            const shots =
                attack.shots ??
                6;


            const duration =
                attack.duration ??
                15;


            const spacing =
                duration /
                Math.max(
                    1,
                    shots
                );


            while (

                boss.bossAttackShots <
                    shots &&

                boss.bossAttackElapsed >=
                    boss.bossNextShotTime
            ) {

                fireBossRock(
                    boss
                );


                boss.bossAttackShots++;


                boss.bossNextShotTime =

                    boss.bossAttackShots *

                    spacing;
            }
        }


        // ATTACK 2

        if (
            boss.bossAttackId ===
            2
        ) {

            const attack =
                boss.attack2 ||
                {};


            const charges =
                attack.charges ??
                2;


            const duration =
                attack.duration ??
                15;


            const spacing =
                duration /
                Math.max(
                    1,
                    charges
                );


            if (

                boss.bossChargeState ===
                    "idle" &&

                boss.bossChargeCount <
                    charges &&

                boss.bossAttackElapsed >=
                    boss.bossNextChargeTime
            ) {

                startBossChargeWarning(
                    boss
                );


                boss.bossChargeCount++;


                boss.bossNextChargeTime =

                    boss.bossChargeCount *

                    spacing;
            }
        }


        // ATTACK 3

        if (
            boss.bossAttackId ===
            3
        ) {

            const attack =
                boss.attack3 ||
                {};


            const warningDuration =

                attack
                    .warningDuration ??

                2;


            if (

                !boss.bossThrowDone &&

                boss.bossAttackElapsed >=
                    warningDuration
            ) {

                boss.bossThrowDone =
                    true;


                launchBossWormBall(
                    boss
                );
            }
        }
    }


    function updateBossCycle(
        boss,
        dt
    ) {

        const cycleDuration =

            boss.attackSystem
                ?.cycleDuration ??

            60;


        const phaseDuration =

            boss.attackSystem
                ?.phaseDuration ??

            15;


        boss.bossCycleTime +=
            dt;


        if (
            boss.bossCycleTime >=
            cycleDuration
        ) {

            boss.bossCycleTime %=
                cycleDuration;


            boss.bossPhase =
                -1;


            boss.bossFirstAttack =
                null;


            endBossAttack(
                boss
            );
        }


        const phase =
            Math.min(

                3,

                Math.floor(

                    boss.bossCycleTime /

                    phaseDuration
                )
            );


        if (
            phase !==
            boss.bossPhase
        ) {

            boss.bossPhase =
                phase;


            // 0 - 15 = rust
            // 15 - 30 = attack

            if (
                phase === 1
            ) {

                startBossAttack(

                    boss,

                    chooseBossAttack(
                        boss,
                        1
                    )
                );

            // 30 - 45 = rust
            // 45 - 60 = attack

            } else if (
                phase === 3
            ) {

                startBossAttack(

                    boss,

                    chooseBossAttack(
                        boss,
                        2
                    )
                );

            } else {

                endBossAttack(
                    boss
                );
            }
        }


        updateBossAttackLogic(
            boss,
            dt
        );
    }


    function updateBossMinions(
        boss,
        dt
    ) {

        if (

            !boss.minionEnemy ||

            boss.minionInterval <=
            0
        ) {
            return;
        }


        boss.minionTimer +=
            dt;


        while (
            boss.minionTimer >=
            boss.minionInterval
        ) {

            boss.minionTimer -=
                boss.minionInterval;


            spawnEnemy(
                boss.minionEnemy
            );
        }
    }


    function updateSandBoss(
        boss,
        dt
    ) {

        // Eerst de arena in lopen.

        if (
            !boss.enteredArena
        ) {

            moveChasingEnemy(
                boss,
                dt
            );


            if (
                isInsideArena(
                    boss
                )
            ) {

                boss.enteredArena =
                    true;


                keepBossInsideArena(
                    boss
                );


                startBossFight(
                    boss
                );
            }


            return;
        }


        startBossFight(
            boss
        );


        // Iedere seconde een Sand Goon.

        updateBossMinions(
            boss,
            dt
        );


        updateBossCycle(
            boss,
            dt
        );


        // Charge attack bestuurt
        // zijn movement zelf.

        if (

            boss.bossAttackId ===
                2 &&

            updateBossCharge(
                boss,
                dt
            )
        ) {

            return;
        }


        // Voor attack 3:
        // eerste 2 seconden stil.

        if (

            boss.bossAttackId ===
                3 &&

            !boss.bossThrowDone
        ) {

            boss.vx =
                0;

            boss.vy =
                0;


            keepBossInsideArena(
                boss
            );


            return;
        }


        // Gewone oneindige chase.

        moveChasingEnemy(
            boss,
            dt
        );


        keepBossInsideArena(
            boss
        );
    }


    function updateBossThrows(
        dt
    ) {

        for (
            let i =
                state.bossThrows.length -
                1;
            i >= 0;
            i--
        ) {

            const projectile =
                state.bossThrows[i];


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


            // Alleen de landing is dodelijk.

            if (

                state.status ===
                    "playing" &&

                window.LevelPlayer
                    .touchesCircle(

                        projectile.targetX,

                        projectile.targetY,

                        projectile.targetRadius
                    )
            ) {

                killPlayer();
            }


            // Sand Worm op landingsplek.

            const wormDefinition =

                activeConfig
                    ?.enemyTypes
                    ?.[
                        projectile
                            .spawnEnemy
                    ];


            if (

                wormDefinition &&

                wormDefinition
                    .behavior ===
                    "sand-worm"
            ) {

                spawnSandWorm(

                    wormDefinition,

                    {

                        x:
                            projectile
                                .targetX,

                        y:
                            projectile
                                .targetY
                    }
                );
            }


            state.bossThrows.splice(
                i,
                1
            );
        }
    }


    // ==========================================
    // ENEMY PROJECTILES
    // ==========================================

    function shootEnemyProjectile(
        enemy
    ) {

        const dx =
            window
                .levelPlayer
                .x -
            enemy.x;


        const dy =
            window
                .levelPlayer
                .y -
            enemy.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        const speed =
            enemy.projectileSpeed ||
            260;


        state.enemyProjectiles
            .push({

                kind:
                    "shooter",

                x:
                    enemy.x,

                y:
                    enemy.y,

                vx:
                    (
                        dx /
                        distance
                    ) *
                    speed,

                vy:
                    (
                        dy /
                        distance
                    ) *
                    speed,

                radius:
                    enemy
                        .projectileRadius ||
                    6,

                color:
                    enemy
                        .projectileColor ||
                    "#e32626"
            });
    }


    function updateEnemyProjectiles(
        dt
    ) {

        for (
            let i =
                state
                    .enemyProjectiles
                    .length -
                1;

            i >= 0;

            i--
        ) {

            const projectile =
                state.enemyProjectiles[
                    i
                ];


            projectile.x +=
                projectile.vx *
                dt;


            projectile.y +=
                projectile.vy *
                dt;


            // HIT PLAYER

            if (
                window.LevelPlayer
                    .touchesCircle(

                        projectile.x,

                        projectile.y,

                        projectile.radius
                    )
            ) {

                state.enemyProjectiles
                    .splice(
                        i,
                        1
                    );


                killPlayer();

                return;
            }


            // ==================================
            // BOSS ROCK
            // ==================================

            if (
                projectile.kind ===
                "boss-rock"
            ) {

                const margin =
                    projectile.radius +
                    14;


                let hitWall =
                    false;


                if (
                    projectile.x <=
                    margin
                ) {

                    projectile.x =
                        margin;

                    projectile.vx =
                        Math.abs(
                            projectile.vx
                        );

                    hitWall =
                        true;
                }


                if (
                    projectile.x >=
                    canvas.width -
                    margin
                ) {

                    projectile.x =
                        canvas.width -
                        margin;

                    projectile.vx =
                        -Math.abs(
                            projectile.vx
                        );

                    hitWall =
                        true;
                }


                if (
                    projectile.y <=
                    margin
                ) {

                    projectile.y =
                        margin;

                    projectile.vy =
                        Math.abs(
                            projectile.vy
                        );

                    hitWall =
                        true;
                }


                if (
                    projectile.y >=
                    canvas.height -
                    margin
                ) {

                    projectile.y =
                        canvas.height -
                        margin;

                    projectile.vy =
                        -Math.abs(
                            projectile.vy
                        );

                    hitWall =
                        true;
                }


                if (
                    hitWall
                ) {

                    // Twee keer bouncen.
                    // Bij derde muurcontact weg.

                    if (

                        projectile
                            .bounceCount >=

                        projectile
                            .maxBounces
                    ) {

                        state
                            .enemyProjectiles
                            .splice(
                                i,
                                1
                            );


                        continue;
                    }


                    projectile
                        .bounceCount++;
                }


                continue;
            }


            // Normale shooter bullet.

            const margin =
                projectile.radius +
                40;


            if (

                projectile.x <
                    -margin ||

                projectile.x >
                    canvas.width +
                    margin ||

                projectile.y <
                    -margin ||

                projectile.y >
                    canvas.height +
                    margin
            ) {

                state.enemyProjectiles
                    .splice(
                        i,
                        1
                    );
            }
        }
    }


    // ==========================================
    // SPAWN ENEMY
    // ==========================================

    function spawnEnemy(
        typeId
    ) {

        const definition =
            activeConfig
                .enemyTypes
                ?.[
                    typeId
                ];


        if (
            !definition
        ) {

            console.warn(
                "Unknown enemy type:",
                typeId
            );

            return;
        }


        const radius =
            getEnemyRadius(
                definition.size ||
                1
            );


        const position =
            randomSpawnPosition(
                radius
            );


        // WORM

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
                definition.tracking ??
                3,


            vx:
                0,

            vy:
                0,


            hp:
                definition.hp,

            maxHp:
                definition.hp,


            // Healthbar pas zichtbaar
            // na eerste damage.

            hasBeenDamaged:
                false,


            // ==================================
            // BOSS DATA
            // ==================================

            isBoss:
                definition.boss ===
                true,

            image:
                definition.image ||
                null,

            borderColor:
                definition
                    .borderColor ||
                "#ffffff",

            borderWidth:
                definition
                    .borderWidth ||
                2,

            stayInsideArena:
                definition
                    .stayInsideArena ===
                true,

            minionEnemy:
                definition
                    .minionEnemy ||
                null,

            minionInterval:
                definition
                    .minionInterval ||
                0,

            minionTimer:
                0,

            attackSystem:
                definition
                    .attackSystem ||
                null,

            attack1:
                definition.attack1 ||
                null,

            attack2:
                definition.attack2 ||
                null,

            attack3:
                definition.attack3 ||
                null,

            bossFightStarted:
                false,

            bossCycleTime:
                0,

            bossPhase:
                -1,

            bossFirstAttack:
                null,

            bossAttackId:
                0,

            bossAttackElapsed:
                0,

            bossChargeState:
                "idle",

            bossFlash:
                false,


            enteredArena:
                false,


            explosionRadius:
                definition
                    .explosionRadius ||
                0,

            explosionDuration:
                definition
                    .explosionDuration ||
                0,


            shootInterval:
                definition
                    .shootInterval ||
                0,

            shootTimer:
                0,

            projectileRadius:
                definition
                    .projectileRadius ||
                6,

            projectileSpeed:
                definition
                    .projectileSpeed ||
                260,

            projectileColor:
                definition
                    .projectileColor ||
                "#e32626"
        };


        // STRAIGHT THROUGH

        if (
            definition.behavior ===
            "straight-through"
        ) {

            const dx =
                window
                    .levelPlayer
                    .x -
                enemy.x;


            const dy =
                window
                    .levelPlayer
                    .y -
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


        // SHOOTER
        // Geeft hem direct een
        // start velocity.

        if (
            definition.behavior ===
            "sand-shooter"
        ) {

            const dx =
                window
                    .levelPlayer
                    .x -
                enemy.x;


            const dy =
                window
                    .levelPlayer
                    .y -
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


        state.enemies.push(
            enemy
        );
    }


    function processSpawns() {

        while (

            state.spawnIndex <
                state
                    .spawnEvents
                    .length &&

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

            state.status ===
                "playing" &&

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
    // DAMAGE
    // ==========================================

    function defeatBoss() {

        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        // Boss dood =
        // alles dood +
        // toekomstige waves stoppen +
        // direct winnen.

        state.enemies.length =
            0;

        state.worms.length =
            0;

        state.enemyProjectiles.length =
            0;

        state.bossThrows.length =
            0;

        state.explosions.length =
            0;


        state.spawnIndex =
            state.spawnEvents.length;


        window.LevelCombat.clear();


        winLevel();
    }


    function killEnemy(
        enemy
    ) {

        if (
            enemy.isBoss
        ) {

            defeatBoss();

            return;
        }


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

            enemy.explosionRadius >
                0
        ) {

            createExplosion(

                enemy.x,

                enemy.y,

                enemy.explosionRadius,

                enemy
                    .explosionDuration ||
                0.1
            );
        }
    }


    function damageEnemy(
        enemy,
        damage
    ) {

        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        enemy.hasBeenDamaged =
            true;


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


    function killPlayer() {

        if (
            state.status !==
            "playing"
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

        state.bossThrows.length =
            0;


        window.LevelCombat.clear();
    }


    // ==========================================
    // ENEMY MOVEMENT
    // ==========================================

    function updateEnemies(
        dt
    ) {

        updateSandWorms(
            dt
        );


        for (
            let i =
                state.enemies.length -
                1;

            i >= 0;

            i--
        ) {

            const enemy =
                state.enemies[i];


            // WORM

            if (
                enemy.isWormPart
            ) {

                // updateSandWorms()
                // doet movement.

            // BOSS

            } else if (
                enemy.isBoss
            ) {

                updateSandBoss(
                    enemy,
                    dt
                );

            // STRAIGHT

            } else if (
                enemy.behavior ===
                "straight-through"
            ) {

                enemy.x +=
                    enemy.vx *
                    dt;


                enemy.y +=
                    enemy.vy *
                    dt;

            // CHASING ENEMIES

            } else {

                moveChasingEnemy(
                    enemy,
                    dt
                );
            }


            // ==================================
            // SAND SHOOTER
            // ==================================

            if (

                enemy.behavior ===
                    "sand-shooter" &&

                enemy.shootInterval >
                    0
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
            // SHOOTER STAYS INSIDE
            // ==================================

            if (

                enemy.behavior ===
                    "sand-shooter" &&

                enemy.enteredArena
            ) {

                const margin =
                    enemy.radius +
                    14;


                if (
                    enemy.x <
                    margin
                ) {

                    enemy.x =
                        margin;

                    enemy.vx =
                        Math.abs(
                            enemy.vx
                        );
                }


                if (
                    enemy.x >
                    canvas.width -
                    margin
                ) {

                    enemy.x =
                        canvas.width -
                        margin;

                    enemy.vx =
                        -Math.abs(
                            enemy.vx
                        );
                }


                if (
                    enemy.y <
                    margin
                ) {

                    enemy.y =
                        margin;

                    enemy.vy =
                        Math.abs(
                            enemy.vy
                        );
                }


                if (
                    enemy.y >
                    canvas.height -
                    margin
                ) {

                    enemy.y =
                        canvas.height -
                        margin;

                    enemy.vy =
                        -Math.abs(
                            enemy.vy
                        );
                }
            }


            // ==================================
            // STRAIGHT ENEMY LEAVES
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

                        enemy
                            .explosionDuration ||
                        0.1
                    );
                }


                killPlayer();

                return;
            }
        }
    }


    function updateExplosions(
        dt
    ) {

        for (
            let i =
                state.explosions.length -
                1;

            i >= 0;

            i--
        ) {

            const explosion =
                state.explosions[i];


            explosion.remaining -=
                dt;


            if (

                state.status ===
                    "playing" &&

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
                explosion.remaining <=
                0
            ) {

                state.explosions.splice(
                    i,
                    1
                );
            }
        }
    }


    // ==========================================
    // DRAW FACE
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


        const eyeOffsetX =
            r *
            0.28;


        const eyeY =
            y -
            r *
            0.08;


        const eyeRadius =
            Math.max(

                2,

                r *
                0.09
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


        ctx.strokeStyle =
            "#111111";


        ctx.lineWidth =
            Math.max(

                2.5,

                r *
                0.10
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
    // DRAW BOSS
    // ==========================================

    function drawBossBody(
        enemy
    ) {

        const image =
            getAssetImage(
                enemy.image
            );


        ctx.save();


        // Boss is altijd cirkelvormig.

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.clip();


        if (

            image &&

            image.complete &&

            image.naturalWidth >
                0
        ) {

            ctx.drawImage(

                image,

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius *
                    2,

                enemy.radius *
                    2
            );


            // Ben.png geel tinten.

            ctx.globalCompositeOperation =
                "source-atop";


            ctx.globalAlpha =
                0.58;


            ctx.fillStyle =
                enemy.color;


            ctx.fillRect(

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius *
                    2,

                enemy.radius *
                    2
            );


            ctx.globalCompositeOperation =
                "source-over";


            ctx.globalAlpha =
                1;

        } else {

            // Fallback zolang afbeelding
            // nog niet geladen is.

            ctx.fillStyle =
                enemy.color;


            ctx.fillRect(

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius *
                    2,

                enemy.radius *
                    2
            );
        }


        // Geel knipperen bij charge.

        if (
            enemy.bossFlash
        ) {

            ctx.fillStyle =
                "rgba(255,235,70,0.72)";


            ctx.fillRect(

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius *
                    2,

                enemy.radius *
                    2
            );
        }


        ctx.restore();


        // Witte rand zoals speler.

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );


        ctx.lineWidth =
            enemy.borderWidth ||
            4;


        ctx.strokeStyle =
            enemy.borderColor ||
            "#ffffff";


        ctx.stroke();

        ctx.restore();
    }


    // ==========================================
    // NORMAL HEALTH BARS
    // ==========================================

    function drawEnemyHealthBar(
        enemy
    ) {

        // Boss krijgt eigen grote balk.

        if (
            enemy.isBoss
        ) {
            return;
        }


        // Nog nooit geraakt:
        // geen balk.

        if (
            !enemy.hasBeenDamaged
        ) {
            return;
        }


        const barWidth =
            enemy.radius *
            2;


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
                barWidth /
                2,

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
                barWidth /
                2,

            enemy.y -
                enemy.radius -
                11,

            barWidth *
                hpRatio,

            barHeight
        );
    }


    function drawEnemies() {

        for (
            const enemy
            of state.enemies
        ) {

            ctx.save();


            if (
                enemy.isBoss
            ) {

                drawBossBody(
                    enemy
                );

            } else {

                ctx.beginPath();


                // SHOOTER = SQUARE

                if (
                    enemy.shape ===
                    "square"
                ) {

                    ctx.rect(

                        enemy.x -
                            enemy.radius,

                        enemy.y -
                            enemy.radius,

                        enemy.radius *
                            2,

                        enemy.radius *
                            2
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


                // Worm:
                // alleen head gezicht.

                if (

                    !enemy.isWormPart ||

                    enemy.isWormHead
                ) {

                    drawEnemyFace(
                        enemy
                    );
                }
            }


            drawEnemyHealthBar(
                enemy
            );


            ctx.restore();
        }
    }


    // ==========================================
    // BOSS HEALTH BAR
    // ==========================================

    function drawBossHealthBar() {

        const boss =
            state.enemies.find(

                enemy =>

                    enemy.isBoss &&

                    enemy.enteredArena
            );


        if (
            !boss
        ) {
            return;
        }


        const width =
            Math.min(

                560,

                canvas.width *
                0.58
            );


        const height =
            24;


        const x =
            canvas.width /
            2 -
            width /
            2;


        const y =
            88;


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


        // NAAM

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 22px Arial";

        ctx.lineWidth =
            5;

        ctx.strokeStyle =
            "rgba(0,0,0,0.75)";


        ctx.strokeText(
            boss.name ||
                "Sand-Ben",
            canvas.width / 2,
            y - 17
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            boss.name ||
                "Sand-Ben",
            canvas.width / 2,
            y - 17
        );


        // DOORZICHTIGE ACHTERGROND

        ctx.fillStyle =
            "rgba(0,0,0,0.52)";


        ctx.fillRect(
            x,
            y,
            width,
            height
        );


        // GROENE HP

        ctx.fillStyle =
            "#35c759";


        ctx.fillRect(
            x,
            y,
            width *
                hpRatio,
            height
        );


        // WITTE RAND

        ctx.lineWidth =
            3;

        ctx.strokeStyle =
            "rgba(255,255,255,0.88)";


        ctx.strokeRect(
            x,
            y,
            width,
            height
        );


        // HP TEKST

        const hpText =
            `${Math.max(
                0,
                Math.ceil(
                    boss.hp
                )
            )} / ${boss.maxHp}`;


        ctx.font =
            "bold 14px Arial";

        ctx.lineWidth =
            3;

        ctx.strokeStyle =
            "rgba(0,0,0,0.85)";


        ctx.strokeText(
            hpText,
            canvas.width / 2,
            y +
                height /
                2
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            hpText,
            canvas.width / 2,
            y +
                height /
                2
        );


        ctx.restore();
    }


    // ==========================================
    // DRAW ENEMY PROJECTILES
    // ==========================================

    function drawEnemyProjectiles() {

        for (
            const projectile
            of state.enemyProjectiles
        ) {

            ctx.save();


            // BOSS ROCK

            if (
                projectile.kind ===
                "boss-rock"
            ) {

                const image =
                    getAssetImage(
                        projectile.image
                    );


                ctx.beginPath();


                ctx.arc(
                    projectile.x,
                    projectile.y,
                    projectile.radius,
                    0,
                    Math.PI * 2
                );


                ctx.clip();


                if (

                    image &&

                    image.complete &&

                    image.naturalWidth >
                        0
                ) {

                    ctx.drawImage(

                        image,

                        projectile.x -
                            projectile.radius,

                        projectile.y -
                            projectile.radius,

                        projectile.radius *
                            2,

                        projectile.radius *
                            2
                    );


                    ctx.globalCompositeOperation =
                        "source-atop";


                    ctx.globalAlpha =
                        0.55;


                    ctx.fillStyle =
                        projectile.color;


                    ctx.fillRect(

                        projectile.x -
                            projectile.radius,

                        projectile.y -
                            projectile.radius,

                        projectile.radius *
                            2,

                        projectile.radius *
                            2
                    );


                    ctx.globalCompositeOperation =
                        "source-over";


                    ctx.globalAlpha =
                        1;

                } else {

                    ctx.fillStyle =
                        projectile.color;


                    ctx.fillRect(

                        projectile.x -
                            projectile.radius,

                        projectile.y -
                            projectile.radius,

                        projectile.radius *
                            2,

                        projectile.radius *
                            2
                    );
                }


                ctx.restore();


                ctx.save();

                ctx.beginPath();

                ctx.arc(
                    projectile.x,
                    projectile.y,
                    projectile.radius,
                    0,
                    Math.PI * 2
                );


                ctx.lineWidth =
                    2;

                ctx.strokeStyle =
                    "rgba(90,65,0,0.95)";


                ctx.stroke();

                ctx.restore();


                continue;
            }


            // SHOOTER BULLET

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
    // ATTACK 3 TARGET
    // ==========================================

    function drawBossTargets() {

        for (
            const projectile
            of state.bossThrows
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
                projectile.targetColor;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                projectile.targetOutline;


            ctx.stroke();


            ctx.restore();
        }
    }


    function drawBossThrows() {

        for (
            const projectile
            of state.bossThrows
        ) {

            const progress =
                Math.min(

                    1,

                    projectile.elapsed /
                    projectile.duration
                );


            // Visueel alsof hij
            // door de lucht wordt gegooid.

            const arcHeight =
                Math.sin(

                    progress *
                    Math.PI
                ) *
                120;


            const drawY =
                projectile.y -
                arcHeight;


            ctx.save();

            ctx.beginPath();


            ctx.arc(
                projectile.x,
                drawY,
                projectile.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                projectile.color;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                "rgba(255,255,255,0.9)";


            ctx.stroke();


            ctx.restore();
        }
    }


    // ==========================================
    // EXPLOSIONS DRAW
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
    // WIN
    // ==========================================

    function checkWin() {

        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        const allSpawnsFinished =

            state.spawnIndex >=

            state.spawnEvents.length;


        if (

            allSpawnsFinished &&

            state.enemies.length ===
                0 &&

            state.explosions.length ===
                0
        ) {

            // Projectiles blokkeren
            // level complete niet.

            state.enemyProjectiles.length =
                0;

            state.bossThrows.length =
                0;


            winLevel();
        }
    }


    function winLevel() {

        if (
            state.status !==
            "playing"
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

        state.bossThrows.length =
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
    // RESET
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

        state.bossThrows.length =
            0;

        state.worms.length =
            0;

        state.explosions.length =
            0;


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

    function updateLevel(
        dt
    ) {

        updateExplosions(
            dt
        );


        if (
            state.status ===
            "dead"
        ) {
            return;
        }


        if (
            state.status ===
            "won"
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
            dt *
            1000;


        const delayMs =
            activeConfig
                .startDelayMs ||
            0;


        if (
            state.elapsedMs <
            delayMs
        ) {
            return;
        }


        // WAVES

        processSpawns();


        // ENEMIES / BOSS

        updateEnemies(
            dt
        );


        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        // RED BULLETS +
        // BOSS ROCKS

        updateEnemyProjectiles(
            dt
        );


        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        // BOSS WORM THROW

        updateBossThrows(
            dt
        );


        if (
            state.status !==
            "playing"
        ) {
            return;
        }


        // PLAYER SHOOTING

        window.LevelCombat.update(

            dt,

            state.enemies,

            damageEnemy
        );


        checkWin();
    }


    // ==========================================
    // GAME OVER
    // ==========================================

    function getGameOverButton() {

        return {

            width:
                240,

            height:
                65,

            x:
                canvas.width /
                2 -
                120,

            y:
                canvas.height /
                2 +
                55
        };
    }


    function drawGameOver() {

        if (
            state.status !==
            "dead"
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
            canvas.height / 2 -
                45
        );


        ctx.fillStyle =
            "white";


        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            canvas.height / 2 -
                45
        );


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
                button.height /
                2
        );


        ctx.restore();
    }


    function handleGameOverClick(
        event
    ) {

        if (
            state.status !==
            "dead"
        ) {
            return;
        }


        const rect =
            canvas
                .getBoundingClientRect();


        const x =
            (
                event.clientX -
                rect.left
            ) *
            (
                canvas.width /
                rect.width
            );


        const y =
            (
                event.clientY -
                rect.top
            ) *
            (
                canvas.height /
                rect.height
            );


        const button =
            getGameOverButton();


        const insideButton =

            x >=
                button.x &&

            x <=
                button.x +
                button.width &&

            y >=
                button.y &&

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
    // DRAW
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


        // Zwarte landingscirkel
        // onder alles.

        drawBossTargets();


        drawEnemies();


        drawEnemyProjectiles();


        drawBossThrows();


        window.LevelCombat.draw(
            ctx
        );


        drawExplosions();


        window.LevelPlayer.draw(
            ctx
        );


        drawBorders();


        drawHud();


        drawBossHealthBar();


        drawGameOver();
    }


    // ==========================================
    // LOOP
    // ==========================================

    function levelLoop(
        time
    ) {

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

                    ...(
                        config.background ||
                        {}
                    )
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


            await window
                .LevelCombat
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


        state.bossThrows.length =
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