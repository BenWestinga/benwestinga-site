const storyButton =
    document.getElementById("story-button");

const mapGameMenu =
    document.getElementById("game-menu");

const storyMap =
    document.getElementById("story-map");

const canvas =
    document.getElementById("map-canvas");

const ctx =
    canvas.getContext("2d");


// ===============================
// CANVAS
// ===============================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


// ===============================
// WORLD
// ===============================

const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 1800;


// ===============================
// MAP PLAYER
// ===============================

const player = {
    x: 500,
    y: 500,
    size: 32,
    speed: 4
};


// ===============================
// CAMERA
// ===============================

const camera = {
    x: 0,
    y: 0
};


// ===============================
// LEVEL 1 LOCATION
// ===============================

const level1 = {
    x: 900,
    y: 500,
    radius: 70
};


// ===============================
// KEYS
// ===============================

const keys = {};


// ===============================
// TEMPORARY PATH
// ===============================

const pathPoints = [];

let pathX = 300;
let pathY = 500;


for (let i = 0; i < 25; i++) {

    pathPoints.push({
        x: pathX,
        y: pathY
    });

    pathX +=
        100 +
        Math.random() * 100;

    pathY +=
        (Math.random() - 0.5) *
        250;


    pathY = Math.max(
        150,
        Math.min(
            WORLD_HEIGHT - 150,
            pathY
        )
    );
}


// ===============================
// KEYBOARD
// ===============================

document.addEventListener(
    "keydown",
    event => {

        const key =
            event.key.toLowerCase();


        keys[key] = true;


        if (
            [
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright"
            ].includes(key)
        ) {
            event.preventDefault();
        }


        // LEVEL 1 ENTER
        if (
            event.key === "Enter" &&
            !storyMap.hidden &&
            !window.gamePaused &&
            isPlayerOnLevel1()
        ) {

            keys["enter"] = false;

            startLevel1();
        }
    }
);


document.addEventListener(
    "keyup",
    event => {

        keys[
            event.key.toLowerCase()
        ] = false;
    }
);


// ===============================
// START STORY MODE
// ===============================

storyButton.addEventListener(
    "click",
    async () => {

        mapGameMenu.hidden = true;
        storyMap.hidden = false;

        window.gamePaused = false;


        // Geen scrollbars tijdens Story Mode
        document.body.classList.add(
            "game-active"
        );


        // ☰ knop tonen
        document
            .getElementById("menu-button")
            .hidden = false;


        // Fullscreen
        if (!document.fullscreenElement) {

            try {

                await document.documentElement
                    .requestFullscreen();

            } catch {
                console.log(
                    "Fullscreen could not be started."
                );
            }
        }


        resizeCanvas();

        requestAnimationFrame(
            gameLoop
        );
    }
);


// ===============================
// LEVEL CHECK
// ===============================

function isPlayerOnLevel1() {

    const dx =
        player.x - level1.x;

    const dy =
        player.y - level1.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    return (
        distance <
        level1.radius
    );
}


// ===============================
// MOVE MAP PLAYER
// ===============================

function updatePlayer() {

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        player.y -= player.speed;
    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        player.y += player.speed;
    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        player.x -= player.speed;
    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        player.x += player.speed;
    }


    // WORLD BORDERS
    player.x = Math.max(
        player.size / 2,
        Math.min(
            WORLD_WIDTH -
                player.size / 2,
            player.x
        )
    );


    player.y = Math.max(
        player.size / 2,
        Math.min(
            WORLD_HEIGHT -
                player.size / 2,
            player.y
        )
    );
}


// ===============================
// CAMERA
// ===============================

function updateCamera() {

    camera.x =
        player.x -
        canvas.width / 2;

    camera.y =
        player.y -
        canvas.height / 2;


    camera.x = Math.max(
        0,
        Math.min(
            Math.max(
                0,
                WORLD_WIDTH -
                    canvas.width
            ),
            camera.x
        )
    );


    camera.y = Math.max(
        0,
        Math.min(
            Math.max(
                0,
                WORLD_HEIGHT -
                    canvas.height
            ),
            camera.y
        )
    );
}


// ===============================
// DRAW MAP
// ===============================

function drawWorld() {

    // GRASS
    ctx.fillStyle = "#7ec850";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.save();


    // CAMERA
    ctx.translate(
        -camera.x,
        -camera.y
    );


    // ===========================
    // PATH
    // ===========================

    ctx.strokeStyle = "#d2b48c";
    ctx.lineWidth = 90;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    ctx.beginPath();

    ctx.moveTo(
        pathPoints[0].x,
        pathPoints[0].y
    );


    for (
        let i = 1;
        i < pathPoints.length;
        i++
    ) {

        ctx.lineTo(
            pathPoints[i].x,
            pathPoints[i].y
        );
    }


    ctx.stroke();


    // ===========================
    // LEVEL 1 PLATEAU
    // ===========================

    const onLevel =
        isPlayerOnLevel1();


    ctx.fillStyle =
        onLevel
            ? "#555"
            : "#777";


    ctx.beginPath();

    ctx.arc(
        level1.x,
        level1.y,
        level1.radius,
        0,
        Math.PI * 2
    );

    ctx.fill();


    // LEVEL NUMBER
    ctx.fillStyle = "white";

    ctx.font =
        "bold 40px Arial";

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        "1",
        level1.x,
        level1.y
    );


    // ===========================
    // MAP PLAYER
    // ===========================

    ctx.fillStyle = "blue";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();


    ctx.restore();


    // ===========================
    // LEVEL INFORMATION
    // ===========================

    if (onLevel) {

        ctx.fillStyle =
            "rgba(0, 0, 0, 0.65)";


        ctx.fillRect(
            canvas.width / 2 - 180,
            canvas.height - 130,
            360,
            90
        );


        ctx.fillStyle = "white";

        ctx.textAlign = "center";


        ctx.font =
            "bold 25px Arial";


        ctx.fillText(
            "LEVEL 1",
            canvas.width / 2,
            canvas.height - 95
        );


        ctx.font =
            "18px Arial";


        ctx.fillText(
            "Press ENTER to play",
            canvas.width / 2,
            canvas.height - 65
        );
    }
}


// ===============================
// MAP LOOP
// ===============================

function gameLoop() {

    // Stop map-loop wanneer we
    // bijvoorbeeld een level ingaan.
    if (storyMap.hidden) {
        return;
    }


    // Pauze = speler niet bewegen
    if (!window.gamePaused) {
        updatePlayer();
    }


    updateCamera();

    drawWorld();


    requestAnimationFrame(
        gameLoop
    );
}