(() => {
    const levelScreen = document.getElementById("level-screen");
    const canvas = document.getElementById("level-canvas");
    const ctx = canvas.getContext("2d");

    const ENEMY_SPEEDS = {
        ultraSlow: 50,
        verySlow: 70,
        slow: 100,
        mediumSlow: 140,
        medium: 180,
        mediumFast: 215,
        fast: 250,
        veryFast: 300,
        extremelyFast: 400
    };

    const ENEMY_SIZE_BASE = 10;
    const ENEMY_SIZE_STEP = 4;

    let animationFrame = null;
    let activeContext = null;
    let activeConfig = null;
    let backgroundImage = null;
    let backgroundLoaded = false;
    let lastFrameTime = 0;

    const assetImageCache = new Map();

    const state = {
        elapsedMs: 0,
        status: "idle",
        statusTimer: 0,
        enemies: [],
        explosions: [],
        spawnEvents: [],
        spawnIndex: 0,
        nextEnemyId: 1,
        completionSent: false,
        pendingLevelWin: null
    };

    window.levelActive = false;
    window.currentLevel = null;

    function resizeLevelCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        if (window.levelActive && window.LevelPlayer) {
            window.LevelPlayer.clamp();
        }
    }

    window.addEventListener("resize", resizeLevelCanvas);
    document.addEventListener("fullscreenchange", resizeLevelCanvas);

    async function makeFullscreen() {
        if (document.fullscreenElement) return;

        try {
            await document.documentElement.requestFullscreen();
        } catch (error) {
            console.log(
                "Fullscreen could not be started.",
                error
            );
        }
    }

    function getDefaultLevelBackground(levelNumber) {
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

        if (!config?.background?.image) {
            return;
        }

        const image =
            new Image();

        const url =
            new URL(
                config.background.image,
                window.location.href
            ).href;

        await new Promise(resolve => {
            image.onload = () => {
                backgroundImage = image;
                backgroundLoaded = true;
                resolve();
            };

            image.onerror = () => {
                console.warn(
                    "Level background could not be loaded:",
                    url
                );

                resolve();
            };

            image.src = url;
        });
    }

    function drawBackground() {
        const background =
            activeConfig?.background ||
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
            canvas.width - border,
            canvas.height - border
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.85)";

        ctx.lineWidth =
            3;

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

        ctx.lineWidth =
            4;

        ctx.setLineDash([
            18,
            18
        ]);

        ctx.stroke();

        ctx.restore();
    }

    function drawHud() {
        if (!activeConfig) {
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

        const hideLevelTitle =
            state.enemies.some(
                enemy =>
                    enemy &&
                    enemy.hp > 0 &&
                    enemy.enteredArena &&
                    enemy.definition
                        ?.hideLevelTitleWhenActive ===
                        true
            );


        if (
            !hideLevelTitle
        ) {
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
        }

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

    function getEnemyRadius(size) {
        return (
            ENEMY_SIZE_BASE +
            size *
            ENEMY_SIZE_STEP
        );
    }

    function getEnemySpeed(speed) {
        if (
            typeof speed ===
            "number"
        ) {
            return speed;
        }

        return (
            ENEMY_SPEEDS[speed] ||
            ENEMY_SPEEDS.medium
        );
    }

    function getAssetImage(source) {
        if (!source) {
            return null;
        }

        if (
            assetImageCache.has(
                source
            )
        ) {
            return assetImageCache.get(
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

    function randomSpawnPosition(radius) {
        const margin =
            Math.max(
                90,
                radius * 2 + 30
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

    function keepInsideArena(
        enemy,
        extraMargin = 14,
        bounce = true
    ) {
        const margin =
            enemy.radius +
            extraMargin;

        if (
            enemy.x <
            margin
        ) {
            enemy.x =
                margin;

            if (bounce) {
                enemy.vx =
                    Math.abs(
                        enemy.vx
                    );
            }
        }

        if (
            enemy.x >
            canvas.width -
            margin
        ) {
            enemy.x =
                canvas.width -
                margin;

            if (bounce) {
                enemy.vx =
                    -Math.abs(
                        enemy.vx
                    );
            }
        }

        if (
            enemy.y <
            margin
        ) {
            enemy.y =
                margin;

            if (bounce) {
                enemy.vy =
                    Math.abs(
                        enemy.vy
                    );
            }
        }

        if (
            enemy.y >
            canvas.height -
            margin
        ) {
            enemy.y =
                canvas.height -
                margin;

            if (bounce) {
                enemy.vy =
                    -Math.abs(
                        enemy.vy
                    );
            }
        }
    }

    function aimVelocityAtPlayer(
        enemy,
        speed = enemy.speed
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
            speed;

        enemy.vy =
            (
                dy /
                distance
            ) *
            speed;
    }

    function moveStraight(
        enemy,
        dt
    ) {
        enemy.x +=
            enemy.vx *
            dt;

        enemy.y +=
            enemy.vy *
            dt;
    }

    function moveTowardPlayer(
        enemy,
        dt,
        tracking =
            enemy.tracking
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
                -(tracking ?? 3) *
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

    function playerTouchesCircle(
        x,
        y,
        radius
    ) {
        return window.LevelPlayer
            .touchesCircle(
                x,
                y,
                radius
            );
    }

    function getActiveDefinitions() {
        if (
            !activeConfig
                ?.enemyTypes
        ) {
            return [];
        }

        return [
            ...new Set(
                Object.values(
                    activeConfig.enemyTypes
                ).filter(Boolean)
            )
        ];
    }

    function callDefinitionHook(
        hookName,
        ...args
    ) {
        for (
            const definition
            of getActiveDefinitions()
        ) {
            const hook =
                definition?.[
                    hookName
                ];

            if (
                typeof hook ===
                "function"
            ) {
                hook.call(
                    definition,
                    ...args,
                    enemyApi,
                    definition
                );
            }
        }
    }

    function createEnemyEntity(
        definition,
        position,
        overrides = {}
    ) {
        const size =
            overrides.size ??
            definition.size ??
            1;

        const hp =
            overrides.hp ??
            definition.hp ??
            1;

        return {
            ...overrides,

            id:
                state.nextEnemyId++,

            definition,

            type:
                overrides.type ??
                definition.id,

            name:
                overrides.name ??
                definition.name ??
                definition.id,

            behavior:
                overrides.behavior ??
                definition.behavior ??
                "custom",

            shape:
                overrides.shape ??
                definition.shape ??
                "circle",

            color:
                overrides.color ??
                definition.color ??
                "#d73535",

            size,

            x:
                overrides.x ??
                position.x,

            y:
                overrides.y ??
                position.y,

            radius:
                overrides.radius ??
                getEnemyRadius(
                    size
                ),

            speed:
                getEnemySpeed(
                    overrides.speed ??
                    definition.speed
                ),

            tracking:
                overrides.tracking ??
                definition.tracking ??
                3,

            vx:
                overrides.vx ??
                0,

            vy:
                overrides.vy ??
                0,

            hp,

            maxHp:
                overrides.maxHp ??
                hp,

            hasBeenDamaged:
                overrides
                    .hasBeenDamaged ??
                false,

            enteredArena:
                overrides
                    .enteredArena ??
                false,

            collidesWithPlayer:
                overrides
                    .collidesWithPlayer ??
                definition
                    .collidesWithPlayer ??
                true,

            hideWorldHealthBar:
                overrides
                    .hideWorldHealthBar ??
                definition
                    .hideWorldHealthBar ??
                false,

            alwaysShowHealthBar:
                overrides
                    .alwaysShowHealthBar ??
                definition
                    .alwaysShowHealthBar ??
                false,

            isBoss:
                overrides.isBoss ??
                definition.boss ===
                    true
        };
    }

    function addEnemyEntities(
        entities,
        definition
    ) {
        const list =
            Array.isArray(
                entities
            )
                ? entities
                : [
                    entities
                ];

        for (
            const enemy
            of list
        ) {
            if (!enemy) {
                continue;
            }

            if (
                !state.enemies
                    .includes(
                        enemy
                    )
            ) {
                state.enemies.push(
                    enemy
                );
            }

            if (
                typeof definition
                    .onSpawn ===
                "function"
            ) {
                definition.onSpawn(
                    enemy,
                    enemyApi
                );
            }
        }

        return list;
    }

    function spawnEnemy(
        typeId,
        exactPosition =
            null
    ) {
        const definition =
            activeConfig
                ?.enemyTypes
                ?.[typeId];

        if (!definition) {
            console.warn(
                "Unknown enemy type:",
                typeId
            );

            return null;
        }

        const spawnSize =
            definition.spawnSize ??
            definition.size ??
            1;

        const position =
            exactPosition
                ? {
                    x:
                        exactPosition.x,

                    y:
                        exactPosition.y
                }
                : randomSpawnPosition(
                    getEnemyRadius(
                        spawnSize
                    )
                );

        if (
            typeof definition
                .spawn ===
            "function"
        ) {
            const result =
                definition.spawn({
                    definition,
                    position,
                    typeId,
                    api:
                        enemyApi
                });

            const added =
                addEnemyEntities(
                    result || [],
                    definition
                );

            return (
                added[0] ||
                null
            );
        }

        const enemy =
            createEnemyEntity(
                definition,
                position
            );

        addEnemyEntities(
            enemy,
            definition
        );

        return enemy;
    }

    function removeEnemy(enemy) {
        if (!enemy) {
            return;
        }

        const index =
            state.enemies
                .indexOf(
                    enemy
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

    function isEnemyAlive(enemy) {
        return state.enemies
            .includes(
                enemy
            );
    }

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
            playerTouchesCircle(
                x,
                y,
                radius
            )
        ) {
            killPlayer();
        }
    }

    function completeLevelNow(
        options = {}
    ) {
        if (
            state.status !==
            "playing"
        ) {
            return;
        }

        state.pendingLevelWin = {
            clearEnemies:
                options
                    .clearEnemies !==
                false,

            stopSpawns:
                options
                    .stopSpawns !==
                false,

            clearExplosions:
                options
                    .clearExplosions !==
                false
        };
    }

    function applyPendingLevelWin() {
        if (
            !state.pendingLevelWin ||
            state.status !==
                "playing"
        ) {
            return false;
        }

        const options =
            state.pendingLevelWin;

        state.pendingLevelWin =
            null;

        if (
            options.clearEnemies
        ) {
            state.enemies.length =
                0;
        }

        if (
            options.stopSpawns
        ) {
            state.spawnIndex =
                state.spawnEvents
                    .length;
        }

        if (
            options.clearExplosions
        ) {
            state.explosions.length =
                0;
        }

        window.LevelCombat.clear();

        winLevel();

        return true;
    }

    function killEnemy(enemy) {
        if (
            !enemy ||
            !isEnemyAlive(
                enemy
            )
        ) {
            return;
        }

        const definition =
            enemy.definition;

        removeEnemy(
            enemy
        );

        if (
            typeof definition
                ?.onDeath ===
            "function"
        ) {
            definition.onDeath(
                enemy,
                enemyApi
            );
        }
    }

    function damageEnemy(
        enemy,
        damage
    ) {
        if (
            state.status !==
                "playing" ||
            !enemy ||
            !isEnemyAlive(
                enemy
            )
        ) {
            return;
        }

        let finalDamage =
            Number(
                damage
            ) || 0;

        const definition =
            enemy.definition;

        if (
            typeof definition
                ?.modifyDamage ===
            "function"
        ) {
            finalDamage =
                Number(
                    definition
                        .modifyDamage(
                            enemy,
                            finalDamage,
                            enemyApi
                        )
                ) || 0;
        }

        if (
            finalDamage <= 0
        ) {
            return;
        }

        enemy.hasBeenDamaged =
            true;

        const oldHp =
            enemy.hp;

        enemy.hp -=
            finalDamage;

        if (
            typeof definition
                ?.onDamage ===
            "function"
        ) {
            definition.onDamage(
                enemy,
                finalDamage,
                oldHp,
                enemyApi
            );
        }

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

        state.pendingLevelWin =
            null;

        window.levelPlayer.alive =
            false;

        window.LevelCombat.clear();

        callDefinitionHook(
            "onPlayerDeath"
        );
    }

    function drawEnemyFace(enemy) {
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

    function drawDefaultEnemy(
        enemy,
        options = {}
    ) {
        const face =
            options.face !==
            false;

        const shape =
            options.shape ||
            enemy.shape ||
            "circle";

        ctx.save();

        ctx.beginPath();

        if (
            shape ===
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
            options.color ||
            enemy.color;

        ctx.fill();

        ctx.lineWidth =
            options.lineWidth ??
            2;

        ctx.strokeStyle =
            options.strokeStyle ||
            "rgba(0,0,0,0.7)";

        ctx.stroke();

        ctx.restore();

        if (face) {
            drawEnemyFace(
                enemy
            );
        }
    }

    function drawEnemyHealthBar(
        enemy
    ) {
        if (
            enemy.hideWorldHealthBar
        ) {
            return;
        }

        if (
            !enemy.hasBeenDamaged &&
            !enemy.alwaysShowHealthBar
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
                Math.min(
                    1,
                    enemy.hp /
                    enemy.maxHp
                )
            );

        ctx.save();

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

        ctx.restore();
    }

    const enemyApi = {
        getPlayer:
            () =>
                window.levelPlayer,

        getCanvas:
            () =>
                canvas,

        getEnemies:
            () =>
                state.enemies,

        getEnemyRadius,

        getEnemySpeed,

        getAssetImage,

        randomSpawnPosition,

        isInsideArena,

        isFullyOutsideArena,

        keepInsideArena,

        aimVelocityAtPlayer,

        moveStraight,

        moveTowardPlayer,

        playerTouchesCircle,

        createEntity:
            createEnemyEntity,

        spawnEnemy:
            typeId =>
                spawnEnemy(
                    typeId
                ),

        spawnEnemyAt:
            (
                typeId,
                x,
                y
            ) =>
                spawnEnemy(
                    typeId,
                    {
                        x,
                        y
                    }
                ),

        removeEnemy,

        isEnemyAlive,

        createExplosion,

        killPlayer,

        completeLevelNow,

        clearPlayerBullets:
            () =>
                window
                    .LevelCombat
                    .clear(),

        drawDefaultEnemy,

        drawEnemyFace
    };

    function createFormationPositions(
        formation,
        enemyType
    ) {

        const definition =
            activeConfig
                ?.enemyTypes
                ?.[enemyType];


        const radius =
            getEnemyRadius(
                definition?.spawnSize ??
                definition?.size ??
                1
            );


        const margin =
            Math.max(
                90,
                radius * 2 + 30
            );


        const spacing =
            Number(
                formation.spacing
            ) || 70;


        const side =
            formation.side ||
            "left";


        const type =
            formation.type ||
            "row";


        const positions =
            [];


        function centeredStart(
            totalSize,
            arenaSize
        ) {

            return (
                arenaSize / 2 -
                totalSize / 2
            );
        }


        if (
            type ===
            "row"
        ) {

            const count =
                Math.max(
                    1,
                    Number(
                        formation.count
                    ) || 5
                );


            const totalWidth =
                (
                    count - 1
                ) *
                spacing;


            const startX =
                centeredStart(
                    totalWidth,
                    canvas.width
                );


            const y =
                side === "bottom"
                    ? canvas.height + margin
                    : -margin;


            for (
                let i = 0;
                i < count;
                i++
            ) {

                positions.push({

                    x:
                        startX +
                        i * spacing,

                    y
                });
            }


            return positions;
        }


        if (
            type ===
            "column"
        ) {

            const count =
                Math.max(
                    1,
                    Number(
                        formation.count
                    ) || 5
                );


            const totalHeight =
                (
                    count - 1
                ) *
                spacing;


            const startY =
                centeredStart(
                    totalHeight,
                    canvas.height
                );


            const x =
                side === "right"
                    ? canvas.width + margin
                    : -margin;


            for (
                let i = 0;
                i < count;
                i++
            ) {

                positions.push({

                    x,

                    y:
                        startY +
                        i * spacing
                });
            }


            return positions;
        }


        if (
            type ===
            "grid"
        ) {

            const rows =
                Math.max(
                    1,
                    Number(
                        formation.rows
                    ) || 5
                );


            const columns =
                Math.max(
                    1,
                    Number(
                        formation.columns
                    ) || 5
                );


            const totalWidth =
                (
                    columns - 1
                ) *
                spacing;


            const totalHeight =
                (
                    rows - 1
                ) *
                spacing;


            if (
                side === "left" ||
                side === "right"
            ) {

                const startY =
                    centeredStart(
                        totalHeight,
                        canvas.height
                    );


                for (
                    let column = 0;
                    column < columns;
                    column++
                ) {

                    for (
                        let row = 0;
                        row < rows;
                        row++
                    ) {

                        positions.push({

                            x:
                                side === "left"

                                    ? (
                                        -margin -
                                        column *
                                        spacing
                                    )

                                    : (
                                        canvas.width +
                                        margin +
                                        column *
                                        spacing
                                    ),

                            y:
                                startY +
                                row *
                                spacing
                        });
                    }
                }

            } else {

                const startX =
                    centeredStart(
                        totalWidth,
                        canvas.width
                    );


                for (
                    let row = 0;
                    row < rows;
                    row++
                ) {

                    for (
                        let column = 0;
                        column < columns;
                        column++
                    ) {

                        positions.push({

                            x:
                                startX +
                                column *
                                spacing,

                            y:
                                side === "bottom"

                                    ? (
                                        canvas.height +
                                        margin +
                                        row *
                                        spacing
                                    )

                                    : (
                                        -margin -
                                        row *
                                        spacing
                                    )
                        });
                    }
                }
            }


            return positions;
        }


        return positions;
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

            if (
                group.formation
            ) {

                const positions =
                    createFormationPositions(

                        group.formation,

                        group.enemy
                    );


                const startMs =
                    (
                        Number(
                            group.start
                        ) || 0
                    ) *
                    1000;


                for (
                    const position
                    of positions
                ) {

                    events.push({

                        timeMs:
                            startMs,

                        enemyType:
                            group.enemy,

                        position
                    });
                }


                continue;
            }


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
                        group.enemy,

                    position:
                        null
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

    function processSpawns() {
        while (
            state.spawnIndex <
                state.spawnEvents
                    .length &&

            state.spawnEvents[
                state.spawnIndex
            ].timeMs <=
                state.elapsedMs
        ) {
            const spawnEvent =
            state.spawnEvents[
                state.spawnIndex
            ];


        spawnEnemy(

            spawnEvent.enemyType,

            spawnEvent.position ||
                null
        );

            state.spawnIndex++;
        }
    }

    function updateExplosions(dt) {
        for (
            let i =
                state.explosions
                    .length -
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

                playerTouchesCircle(
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
                state.explosions
                    .splice(
                        i,
                        1
                    );
            }
        }
    }

    function isUpgradeFrozen(
        enemy
    ) {

        return (
            window
                .UpgradeEffects
                ?.isEnemyFrozen
                ?.(enemy) ===
            true
        );
    }


    function captureFrozenEnemyMotion() {

        const snapshots =
            new Map();


        for (
            const enemy
            of state.enemies
        ) {

            if (
                !isUpgradeFrozen(
                    enemy
                )
            ) {

                continue;
            }


            snapshots.set(

                enemy,

                {
                    x:
                        enemy.x,

                    y:
                        enemy.y,

                    vx:
                        enemy.vx,

                    vy:
                        enemy.vy
                }
            );
        }


        return snapshots;
    }


    function restoreFrozenEnemyMotion(
        snapshots
    ) {

        for (
            const [
                enemy,
                snapshot
            ]
            of snapshots
        ) {

            if (

                !isEnemyAlive(
                    enemy
                ) ||

                !isUpgradeFrozen(
                    enemy
                )
            ) {

                continue;
            }


            enemy.x =
                snapshot.x;


            enemy.y =
                snapshot.y;


            enemy.vx =
                snapshot.vx;

            enemy.vy =
                snapshot.vy;
        }
    }


    function updateEnemies(dt) {

        const frozenBeforeUpdate =
            captureFrozenEnemyMotion();


        callDefinitionHook(
            "beforeUpdate",
            dt
        );


        restoreFrozenEnemyMotion(
            frozenBeforeUpdate
        );


        if (
            state.status !==
            "playing"
        ) {

            return;
        }


        const snapshot =
            [
                ...state.enemies
            ];


        for (
            const enemy
            of snapshot
        ) {

            if (
                !isEnemyAlive(
                    enemy
                )
            ) {

                continue;
            }


            const definition =
                enemy.definition;


            if (
                isUpgradeFrozen(
                    enemy
                )
            ) {

            } else if (
                typeof definition
                    ?.update ===
                "function"
            ) {

                definition.update(

                    enemy,

                    dt,

                    enemyApi
                );
            }


            if (
                state.status !==
                "playing"
            ) {

                return;
            }


            if (
                !isEnemyAlive(
                    enemy
                )
            ) {

                continue;
            }


            if (
                isInsideArena(
                    enemy
                )
            ) {

                enemy.enteredArena =
                    true;
            }


            if (

                enemy
                    .collidesWithPlayer &&

                playerTouchesCircle(

                    enemy.x,

                    enemy.y,

                    enemy.radius
                )
            ) {

                let handled =
                    false;


                if (
                    typeof definition
                        ?.onPlayerCollision ===
                    "function"
                ) {

                    handled =

                        definition
                            .onPlayerCollision(

                                enemy,

                                enemyApi
                            ) ===

                        true;
                }


                if (!handled) {

                    killPlayer();
                }


                if (
                    state.status !==
                    "playing"
                ) {

                    return;
                }
            }
        }


        const frozenAfterUpdate =
            captureFrozenEnemyMotion();


        callDefinitionHook(
            "afterUpdate",
            dt
        );


        restoreFrozenEnemyMotion(
            frozenAfterUpdate
        );
    }

    function drawEnemies() {
        for (
            const enemy
            of state.enemies
        ) {
            const definition =
                enemy.definition;

            if (
                typeof definition
                    ?.draw ===
                "function"
            ) {
                definition.draw(
                    enemy,
                    ctx,
                    enemyApi
                );
            } else {
                drawDefaultEnemy(
                    enemy
                );
            }

            drawEnemyHealthBar(
                enemy
            );
        }
    }

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

        state.pendingLevelWin =
            null;

        window.LevelCombat.clear();

        callDefinitionHook(
            "onLevelWin"
        );

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

    function resetRuntime() {
        callDefinitionHook(
            "reset"
        );

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

        state.spawnEvents =
            buildSpawnEvents();

        state.spawnIndex =
            0;

        state.nextEnemyId =
            1;

        state.completionSent =
            false;

        state.pendingLevelWin =
            null;

        window.LevelPlayer.reset();

        window.LevelCombat.reset();
    }

    function updateLevel(dt) {
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
            activeConfig.startDelayMs ||
            0;

        if (
            state.elapsedMs <
            delayMs
        ) {
            return;
        }

        processSpawns();

        updateEnemies(
            dt
        );

        if (
            state.status !==
            "playing"
        ) {
            return;
        }

        if (
            applyPendingLevelWin()
        ) {
            return;
        }

        window.LevelCombat.update(
            dt,
            state.enemies,
            damageEnemy
        );

        if (
            applyPendingLevelWin()
        ) {
            return;
        }

        checkWin();
    }

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

    function drawLevel() {
        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        drawBackground();

        drawCenterLine();

        callDefinitionHook(
            "drawBelow",
            ctx
        );

        drawEnemies();

        callDefinitionHook(
            "drawGlobal",
            ctx
        );

        window.LevelCombat.draw(
            ctx
        );

        drawExplosions();

        window.LevelPlayer.draw(
            ctx
        );

        drawBorders();

        drawHud();

        callDefinitionHook(
            "drawHud",
            ctx
        );

        drawGameOver();
    }

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

    function returnToStoryMap() {
        window.levelActive =
            false;

        window.gamePaused =
            false;

        window.currentLevel =
            null;

        callDefinitionHook(
            "reset"
        );

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

        state.pendingLevelWin =
            null;

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
            () =>
                state
    };
})();