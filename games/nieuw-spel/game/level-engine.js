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
        slow: 100,
        medium: 180,
        fast: 250
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

        explosions: [],

        spawnEvents: [],

        spawnIndex: 0,

        nextEnemyId: 1,

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


        // DEAD

        if (
            state.status === "dead"
        ) {

            ctx.textAlign =
                "center";

            ctx.font =
                "bold 58px Arial";

            ctx.lineWidth = 8;


            ctx.strokeText(
                "HIT! RESTARTING...",
                canvas.width / 2,
                canvas.height / 2
            );


            ctx.fillStyle =
                "white";


            ctx.fillText(
                "HIT! RESTARTING...",
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


        const enemy = {

            id:
                state.nextEnemyId++,

            type:
                definition.id,

            name:
                definition.name,

            behavior:
                definition.behavior,

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


            /*
                Hoe sterk hij jouw
                beweging volgt.

                Lager = loggere beweging.
            */

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
                0
        };


        // ======================================
        // GRASS GOON
        // ======================================

        if (
            definition.behavior ===
            "straight-through"
        ) {

            /*
                Hij kijkt één keer naar
                de huidige spelerpositie.

                Daarna verandert zijn
                richting nooit meer.
            */

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


        enemy.hp -= damage;


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


        window.LevelCombat.clear();
    }


    // ==========================================
    // ENEMY MOVEMENT
    // ==========================================

    function updateEnemies(dt) {

        for (
            let i =
                state.enemies.length - 1;
            i >= 0;
            i--
        ) {

            const enemy =
                state.enemies[i];


            // ==================================
            // GRASS GOON
            // ==================================

            if (
                enemy.behavior ===
                "straight-through"
            ) {

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


                /*
                    Waar hij eigenlijk
                    naartoe wil bewegen.
                */

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


                /*
                    Dit voorkomt dat enemies
                    100% direct jouw muis volgen.

                    tracking 1 = heel log
                    tracking 2 = behoorlijk log
                    tracking 3 = normaal
                    tracking 5 = sterk
                    tracking 10 = bijna direct
                */

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
            // GRASS GOON LEAVES MAP
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
    // DRAW ENEMIES
    // ==========================================

    function drawEnemies() {

        for (
            const enemy
            of state.enemies
        ) {

            ctx.save();


            ctx.beginPath();


            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                enemy.color;


            ctx.fill();


            ctx.lineWidth =
                2;

            ctx.strokeStyle =
                "rgba(0,0,0,0.7)";

            ctx.stroke();


            // HP BAR

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

            state.statusTimer +=
                dt;


            if (
                state.statusTimer >=
                0.9
            ) {

                resetRuntime();
            }


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


        // COMBAT

        window.LevelCombat.update(

            dt,

            state.enemies,

            damageEnemy
        );


        checkWin();
    }


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


        window.LevelCombat.draw(
            ctx
        );


        drawExplosions();


        window.LevelPlayer.draw(
            ctx
        );


        drawBorders();

        drawHud();
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

            activeConfig =
                config;


            activeContext =
                context;


            window.currentLevel =
                config;


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
                config
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