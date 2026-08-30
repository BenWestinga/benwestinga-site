const storyButton = document.getElementById("story-button");
const leaveMapButton = document.getElementById("leave-map-button");

const mapGameMenu = document.getElementById("game-menu");
const storyMap = document.getElementById("story-map");

const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d");


const WORLD_WIDTH = 3000;
const WORLD_HEIGHT = 1800;

const player = {
    x: 500,
    y: 500,
    size: 32,
    speed: 4
};

const camera = {
    x: 0,
    y: 0
};

const keys = {};


// Willekeurig pad
const pathPoints = [];

let pathX = 300;
let pathY = 500;

for (let i = 0; i < 25; i++) {

    pathPoints.push({
        x: pathX,
        y: pathY
    });

    pathX += 100 + Math.random() * 100;
    pathY += (Math.random() - 0.5) * 250;

    pathY = Math.max(
        150,
        Math.min(WORLD_HEIGHT - 150, pathY)
    );
}


document.addEventListener("keydown", event => {

    keys[event.key.toLowerCase()] = true;

    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright"]
            .includes(event.key.toLowerCase())
    ) {
        event.preventDefault();
    }
});


document.addEventListener("keyup", event => {
    keys[event.key.toLowerCase()] = false;
});


storyButton.addEventListener("click", () => {

    mapGameMenu.hidden = true;
    storyMap.hidden = false;

    requestAnimationFrame(gameLoop);
});


leaveMapButton.addEventListener("click", () => {

    storyMap.hidden = true;
    mapGameMenu.hidden = false;
});


function updatePlayer() {

    if (keys["w"] || keys["arrowup"]) {
        player.y -= player.speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        player.y += player.speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        player.x -= player.speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        player.x += player.speed;
    }


    player.x = Math.max(
        0,
        Math.min(WORLD_WIDTH, player.x)
    );

    player.y = Math.max(
        0,
        Math.min(WORLD_HEIGHT, player.y)
    );
}


function updateCamera() {

    camera.x =
        player.x - canvas.width / 2;

    camera.y =
        player.y - canvas.height / 2;


    camera.x = Math.max(
        0,
        Math.min(
            WORLD_WIDTH - canvas.width,
            camera.x
        )
    );

    camera.y = Math.max(
        0,
        Math.min(
            WORLD_HEIGHT - canvas.height,
            camera.y
        )
    );
}


function drawWorld() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Achtergrond
    ctx.fillStyle = "#7ec850";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // Pad
    ctx.save();

    ctx.translate(
        -camera.x,
        -camera.y
    );

    ctx.strokeStyle = "#d2b48c";
    ctx.lineWidth = 90;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();

    ctx.moveTo(
        pathPoints[0].x,
        pathPoints[0].y
    );

    for (let i = 1; i < pathPoints.length; i++) {

        ctx.lineTo(
            pathPoints[i].x,
            pathPoints[i].y
        );
    }

    ctx.stroke();


    // Speler
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
}


function gameLoop() {

    if (storyMap.hidden) {
        return;
    }

    updatePlayer();
    updateCamera();
    drawWorld();

    requestAnimationFrame(gameLoop);
}