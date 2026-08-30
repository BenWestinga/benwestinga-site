const engineLevelScreen =
    document.getElementById("level-screen");

const engineLevelCanvas =
    document.getElementById("level-canvas");

const engineLevelCtx =
    engineLevelCanvas.getContext("2d");


window.levelActive = false;
window.currentLevel = null;

let nextEnemySpawn = 0;


function resizeLevelCanvas() {

    engineLevelCanvas.width =
        window.innerWidth;

    engineLevelCanvas.height =
        window.innerHeight;
}


window.addEventListener(
    "resize",
    resizeLevelCanvas
);


engineLevelCanvas.addEventListener(
    "pointermove",
    movePlayerToPointer
);


function startLevel(levelData) {

    currentLevel = levelData;
    levelActive = true;

    window.gamePaused = false;

    storyMap.hidden = true;
    engineLevelScreen.hidden = false;

    document.body.classList.add(
        "game-active"
    );

    const menuButton =
        document.getElementById("menu-button");

    menuButton.hidden = false;


    resizeLevelCanvas();

    clearBullets();
    clearEnemies();

    resetPlayer();
    resetShootingTimer();


    nextEnemySpawn =
        performance.now() + 700;


    requestAnimationFrame(
        levelLoop
    );
}


function leaveCurrentLevel() {

    levelActive = false;
    currentLevel = null;

    clearBullets();
    clearEnemies();

    engineLevelScreen.hidden = true;

    storyMap.hidden = false;

    window.gamePaused = false;


    document
        .getElementById("menu-button")
        .hidden = false;


    requestAnimationFrame(
        gameLoop
    );
}


function updateLevel(time) {

    updateAutomaticShooting(time);

    updateBullets();

    updateEnemy1s();


    if (
        currentLevel &&
        currentLevel.enemySpawnInterval
    ) {

        if (
            time >= nextEnemySpawn &&
            enemies.length <
            currentLevel.maxEnemies
        ) {

            spawnEnemy1();

            nextEnemySpawn =
                time +
                currentLevel.enemySpawnInterval;
        }
    }
}


function drawLevel() {

    // Achtergrond
    engineLevelCtx.fillStyle =
        "#eeeeee";

    engineLevelCtx.fillRect(
        0,
        0,
        engineLevelCanvas.width,
        engineLevelCanvas.height
    );


    // MIDDENLIJN
    engineLevelCtx.strokeStyle =
        "rgba(0, 0, 0, 0.55)";

    engineLevelCtx.lineWidth = 4;

    engineLevelCtx.beginPath();

    engineLevelCtx.moveTo(
        engineLevelCanvas.width / 2,
        0
    );

    engineLevelCtx.lineTo(
        engineLevelCanvas.width / 2,
        engineLevelCanvas.height
    );

    engineLevelCtx.stroke();


    // ENEMIES
    drawEnemy1s(
        engineLevelCtx
    );


    // BULLETS
    drawBullets(
        engineLevelCtx
    );


    // PLAYER
    engineLevelCtx.fillStyle =
        "blue";

    engineLevelCtx.beginPath();

    engineLevelCtx.arc(
        levelPlayer.x,
        levelPlayer.y,
        levelPlayer.radius,
        0,
        Math.PI * 2
    );

    engineLevelCtx.fill();
}


function levelLoop(time) {

    if (!levelActive) {
        return;
    }

    if (!window.gamePaused) {
        updateLevel(time);
    }

    drawLevel();

    requestAnimationFrame(
        levelLoop
    );
}