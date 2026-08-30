const levelScreen =
    document.getElementById("level-screen");

const levelCanvas =
    document.getElementById("level-canvas");

const levelCtx =
    levelCanvas.getContext("2d");


let levelActive = false;
let currentLevel = null;


function resizeLevelCanvas() {

    levelCanvas.width = window.innerWidth;
    levelCanvas.height = window.innerHeight;
}


window.addEventListener(
    "resize",
    resizeLevelCanvas
);


levelCanvas.addEventListener(
    "pointermove",
    movePlayerToPointer
);


// Voor nu klik/tap om een schot te testen
levelCanvas.addEventListener(
    "pointerdown",
    () => {
        shootBullet();
    }
);


function startLevel(levelData) {

    currentLevel = levelData;

    storyMap.hidden = true;
    levelScreen.hidden = false;

    levelActive = true;
    gamePaused = false;
    menuButton.hidden = false;

    resizeLevelCanvas();
    resetPlayer();
    clearBullets();

    requestAnimationFrame(levelLoop);
}


function leaveCurrentLevel() {

    levelActive = false;
    currentLevel = null;

    clearBullets();

    levelScreen.hidden = true;
    storyMap.hidden = false;

    requestAnimationFrame(gameLoop);
}


function drawLevel() {

    // Voorlopige achtergrond
    levelCtx.fillStyle = "#eeeeee";

    levelCtx.fillRect(
        0,
        0,
        levelCanvas.width,
        levelCanvas.height
    );


    // MIDDENLIJN
    levelCtx.strokeStyle =
        "rgba(0, 0, 0, 0.25)";

    levelCtx.lineWidth = 3;

    levelCtx.beginPath();

    levelCtx.moveTo(
        levelCanvas.width / 2,
        0
    );

    levelCtx.lineTo(
        levelCanvas.width / 2,
        levelCanvas.height
    );

    levelCtx.stroke();


    // BULLETS
    levelCtx.fillStyle = "black";

    for (const bullet of bullets) {

        levelCtx.beginPath();

        levelCtx.arc(
            bullet.x,
            bullet.y,
            6,
            0,
            Math.PI * 2
        );

        levelCtx.fill();
    }


    // PLAYER
    levelCtx.fillStyle = "blue";

    levelCtx.beginPath();

    levelCtx.arc(
        levelPlayer.x,
        levelPlayer.y,
        levelPlayer.radius,
        0,
        Math.PI * 2
    );

    levelCtx.fill();
}


function levelLoop() {

    if (!levelActive) {
        return;
    }

    if (!gamePaused) {
        updateBullets();
    }

    drawLevel();

    requestAnimationFrame(levelLoop);
}