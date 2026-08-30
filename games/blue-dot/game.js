const gameScreen =
    document.getElementById("gameScreen");

const playArea =
    document.getElementById("playArea");

const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

const timerElement =
    document.getElementById("timer");

const startScreen =
    document.getElementById("startScreen");

const nameScreen =
    document.getElementById("nameScreen");

const gameOverScreen =
    document.getElementById("gameOverScreen");

const nameInput =
    document.getElementById("nameInput");

const playerNameElement =
    document.getElementById("playerName");

const survivalTimeElement =
    document.getElementById("survivalTime");

const scoreMessage =
    document.getElementById("scoreMessage");

const playButton =
    document.getElementById("playButton");

const startGameButton =
    document.getElementById("startGameButton");

const continueButton =
    document.getElementById("continueButton");

const backFromNameButton =
    document.getElementById("backFromNameButton");

const leaderboardButton =
    document.getElementById("leaderboardButton");

const leaderboardScreen =
    document.getElementById("leaderboardScreen");

const backFromLeaderboardButton =
    document.getElementById("backFromLeaderboardButton");


/* =========================
   GAME
   ========================= */

let width = 0;
let height = 0;

let gameRunning = false;

let animationFrame = null;

let startTime = 0;

let lastSpawn = 0;

let lastShot = 0;


/* =========================
   PLAYER
   ========================= */

const player = {
    x: 0,
    y: 0,
    radius: 11
};


/* =========================
   ENEMIES
   ========================= */

let enemies = [];

const enemyRadius = 16;

const safeSpawnRadius = 150;


/*
    GROTE ENEMY

    10% kans om te spawnen.
    3x groter.
    2x langzamer.
    5 hits nodig.
*/
const bigEnemyChance = 0.10;

const bigEnemyRadius =
    enemyRadius * 3;

const bigEnemyHits = 5;


/*
    BEN AFBEELDING
*/

const benImage =
    new Image();

benImage.src =
    "Ben.png";


/* =========================
   BULLETS
   ========================= */

let bullets = [];

const bulletRadius = 4;

const bulletSpeed = 6;

const shotDelay = 180;


/* =========================
   MOUSE
   ========================= */

let mouseX = 0;
let mouseY = 0;


/* =========================
   RESIZE
   ========================= */

function resizeCanvas() {

    const rect =
        playArea.getBoundingClientRect();

    width = rect.width;
    height = rect.height;

    const dpr =
        window.devicePixelRatio || 1;

    canvas.width =
        Math.round(width * dpr);

    canvas.height =
        Math.round(height * dpr);

    canvas.style.width =
        width + "px";

    canvas.style.height =
        height + "px";

    ctx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
    );

    player.x = clamp(
        player.x,
        player.radius,
        width - player.radius
    );

    player.y = clamp(
        player.y,
        player.radius,
        height - player.radius
    );

    for (const enemy of enemies) {

        enemy.x = clamp(
            enemy.x,
            enemy.radius,
            width - enemy.radius
        );

        enemy.y = clamp(
            enemy.y,
            enemy.radius,
            height - enemy.radius
        );
    }
}


window.addEventListener(
    "resize",
    resizeCanvas
);


/* =========================
   CLAMP
   ========================= */

function clamp(value, min, max) {

    return Math.max(
        min,
        Math.min(max, value)
    );
}


/* =========================
   MOUSE
   ========================= */

canvas.addEventListener(
    "mousemove",
    function(event) {

        const rect =
            canvas.getBoundingClientRect();

        mouseX =
            event.clientX - rect.left;

        mouseY =
            event.clientY - rect.top;

        player.x = clamp(
            mouseX,
            player.radius,
            width - player.radius
        );

        player.y = clamp(
            mouseY,
            player.radius,
            height - player.radius
        );
    }
);


/* =========================
   SPAWN RATE
   ========================= */

function getSpawnRate(time) {

    const seconds =
        (time - startTime) /
        1000;

    /*
        0 sec   = 1.0 sec
        20 sec  = 0.8 sec
        40 sec  = 0.6 sec
        60 sec  = 0.4 sec
        80 sec  = 0.2 sec
        100 sec = 0.1 sec
    */

    return Math.max(
        100,
        1000 - seconds * 9
    );
}


/* =========================
   SPAWN ENEMY
   ========================= */

function spawnEnemy() {

    /*
        10% kans op grote enemy.
    */

    const isBig =
        Math.random() <
        bigEnemyChance;


    const radius =
        isBig
            ? bigEnemyRadius
            : enemyRadius;


    let x;
    let y;

    let valid = false;


    for (
        let attempt = 0;
        attempt < 100;
        attempt++
    ) {

        x =
            radius +
            Math.random() *
            (
                width -
                radius * 2
            );

        y =
            radius +
            Math.random() *
            (
                height -
                radius * 2
            );


        const dx =
            x -
            player.x;

        const dy =
            y -
            player.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        /*
            Kleine enemy:
            exact dezelfde spawn-afstand
            als vroeger.

            Grote enemy:
            iets meer ruimte omdat
            hij veel groter is.
        */

        const requiredDistance =
            isBig
                ? safeSpawnRadius +
                  radius
                : safeSpawnRadius;


        if (
            distance >=
            requiredDistance
        ) {

            valid = true;

            break;
        }
    }


    if (!valid) {
        return;
    }


    const angle =
        Math.random() *
        Math.PI *
        2;


    /*
        Kleine enemy:
        EXACT dezelfde snelheid
        als eerst.

        Grote enemy:
        precies 2x langzamer.
    */

    const speed =
        isBig
            ? 0.75 +
              Math.random() * 0.75

            : 1.5 +
              Math.random() * 1.5;


    enemies.push({

        x: x,

        y: y,

        radius: radius,


        vx:
            Math.cos(angle) *
            speed,

        vy:
            Math.sin(angle) *
            speed,


        speed: speed,

        isBig: isBig,


        hp:
            isBig
                ? bigEnemyHits
                : 1
    });
}


/* =========================
   UPDATE ENEMIES
   ========================= */

function updateEnemies() {

    for (const enemy of enemies) {


        /*
            ALLEEN GROTE ENEMY
            VOLGT DE RODE SPELER.
        */

        if (enemy.isBig) {

            const dx =
                player.x -
                enemy.x;

            const dy =
                player.y -
                enemy.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (distance > 0) {

                /*
                    Gewenste richting
                    naar speler.
                */

                const targetVx =
                    (
                        dx /
                        distance
                    ) *
                    enemy.speed;

                const targetVy =
                    (
                        dy /
                        distance
                    ) *
                    enemy.speed;


                /*
                    Niet direct omdraaien.

                    Hierdoor kan de grote
                    enemy nog zichtbaar
                    tegen de muur bouncen.
                */

                const steering =
                    0.08;


                enemy.vx +=
                    (
                        targetVx -
                        enemy.vx
                    ) *
                    steering;

                enemy.vy +=
                    (
                        targetVy -
                        enemy.vy
                    ) *
                    steering;


                /*
                    Snelheid gelijk houden.
                */

                const currentSpeed =
                    Math.sqrt(
                        enemy.vx *
                        enemy.vx +
                        enemy.vy *
                        enemy.vy
                    );


                if (currentSpeed > 0) {

                    enemy.vx =
                        (
                            enemy.vx /
                            currentSpeed
                        ) *
                        enemy.speed;

                    enemy.vy =
                        (
                            enemy.vy /
                            currentSpeed
                        ) *
                        enemy.speed;
                }
            }
        }


        /*
            BEWEGING

            Kleine enemy:
            zelfde als eerst.

            Grote enemy:
            gebruikt bovenstaande
            volg-richting.
        */

        enemy.x +=
            enemy.vx;

        enemy.y +=
            enemy.vy;


        /*
            LINKER MUUR
        */

        if (
            enemy.x -
            enemy.radius <= 0
        ) {

            enemy.x =
                enemy.radius;

            enemy.vx =
                Math.abs(
                    enemy.vx
                );
        }


        /*
            RECHTER MUUR
        */

        if (
            enemy.x +
            enemy.radius >=
            width
        ) {

            enemy.x =
                width -
                enemy.radius;

            enemy.vx =
                -Math.abs(
                    enemy.vx
                );
        }


        /*
            BOVENKANT
        */

        if (
            enemy.y -
            enemy.radius <= 0
        ) {

            enemy.y =
                enemy.radius;

            enemy.vy =
                Math.abs(
                    enemy.vy
                );
        }


        /*
            ONDERKANT
        */

        if (
            enemy.y +
            enemy.radius >=
            height
        ) {

            enemy.y =
                height -
                enemy.radius;

            enemy.vy =
                -Math.abs(
                    enemy.vy
                );
        }
    }
}


/* =========================
   SHOOT
   ========================= */

function shoot(time) {

    if (
        time - lastShot <
        shotDelay
    ) {

        return;
    }


    lastShot =
        time;


    const direction =
        player.x <
        width / 2
            ? 1
            : -1;


    bullets.push({

        x:
            player.x,

        y:
            player.y,

        vx:
            direction *
            bulletSpeed,

        radius:
            bulletRadius
    });
}


/* =========================
   UPDATE BULLETS
   ========================= */

function updateBullets() {

    for (
        let i =
            bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet =
            bullets[i];


        bullet.x +=
            bullet.vx;


        if (
            bullet.x <
                -bullet.radius ||

            bullet.x >
                width +
                bullet.radius
        ) {

            bullets.splice(
                i,
                1
            );
        }
    }
}


/* =========================
   COLLISIONS
   ========================= */

function checkCollisions() {

    /*
        KOGEL → ENEMY
    */

    for (
        let i =
            enemies.length - 1;
        i >= 0;
        i--
    ) {

        const enemy =
            enemies[i];


        for (
            let j =
                bullets.length - 1;
            j >= 0;
            j--
        ) {

            const bullet =
                bullets[j];


            const dx =
                bullet.x -
                enemy.x;

            const dy =
                bullet.y -
                enemy.y;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            if (
                distance <=
                bullet.radius +
                enemy.radius
            ) {

                /*
                    Enemy geraakt.
                */

                enemy.hp--;


                /*
                    Kogel verwijderen.
                */

                bullets.splice(
                    j,
                    1
                );


                /*
                    Kleine enemy:
                    hp = 1

                    Grote enemy:
                    hp = 5
                */

                if (
                    enemy.hp <= 0
                ) {

                    enemies.splice(
                        i,
                        1
                    );
                }


                break;
            }
        }
    }


    /*
        SPELER → ENEMY
    */

    for (
        const enemy
        of enemies
    ) {

        const dx =
            player.x -
            enemy.x;

        const dy =
            player.y -
            enemy.y;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance <=
            player.radius +
            enemy.radius
        ) {

            endGame();

            return;
        }
    }
}


/* =========================
   DRAW
   ========================= */

function draw() {

    /*
        ACHTERGROND
    */

    ctx.fillStyle =
        "white";

    ctx.fillRect(
        0,
        0,
        width,
        height
    );


    /*
        MIDDENLIJN
    */

    ctx.beginPath();

    ctx.moveTo(
        width / 2,
        0
    );

    ctx.lineTo(
        width / 2,
        height
    );

    ctx.strokeStyle =
        "rgba(0, 0, 0, 0.22)";

    ctx.lineWidth =
        2;

    ctx.stroke();


    /*
        SPELER
    */

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "red";

    ctx.fill();


    /*
        ENEMIES

        ALLE enemies gebruiken
        Ben.png.

        Grootte wordt automatisch
        bepaald door enemy.radius.
    */

    for (
        const enemy
        of enemies
    ) {

        /*
            Als Ben.png geladen is.
        */

        if (
            benImage.complete &&
            benImage.naturalWidth > 0
        ) {

            ctx.save();


            /*
                Cirkel maken.

                Hierdoor blijft de enemy
                rond zoals de oude bal.
            */

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius,
                0,
                Math.PI * 2
            );

            ctx.clip();


            /*
                PNG tekenen.
            */

            ctx.drawImage(
                benImage,

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius * 2,

                enemy.radius * 2
            );


            ctx.restore();
        }

        else {

            /*
                Als Ben.png niet gevonden
                wordt, blijft hij blauw.

                Zo crasht de game niet.
            */

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                enemy.radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "blue";

            ctx.fill();
        }
    }


    /*
        KOGELS
    */

    for (
        const bullet
        of bullets
    ) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "black";

        ctx.fill();
    }
}


/* =========================
   TIMER
   ========================= */

function updateTimer(time) {

    const elapsed =
        (
            time -
            startTime
        ) /
        1000;


    timerElement.textContent =
        elapsed.toFixed(2);
}


/* =========================
   GAME LOOP
   ========================= */

function gameLoop(time) {

    if (
        !gameRunning
    ) {

        return;
    }


    updateTimer(
        time
    );


    const spawnRate =
        getSpawnRate(
            time
        );


    if (
        time -
        lastSpawn >=
        spawnRate
    ) {

        spawnEnemy();

        lastSpawn =
            time;
    }


    shoot(
        time
    );


    updateEnemies();

    updateBullets();

    checkCollisions();


    if (
        !gameRunning
    ) {

        return;
    }


    draw();


    animationFrame =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================
   START GAME
   ========================= */

function startGame() {

    const name =
        nameInput.value.trim();


    if (!name) {

        nameInput.focus();

        return;
    }


    startScreen.style.display =
        "none";


    nameScreen.classList.add(
        "hidden"
    );


    gameOverScreen.classList.add(
        "hidden"
    );


    gameScreen.style.display =
        "block";


    resizeCanvas();


    enemies = [];

    bullets = [];


    player.x =
        width / 2;

    player.y =
        height / 2;


    mouseX =
        player.x;

    mouseY =
        player.y;


    startTime =
        performance.now();


    lastSpawn =
        startTime;

    lastShot =
        startTime;


    timerElement.textContent =
        "0.00";


    gameRunning =
        true;


    cancelAnimationFrame(
        animationFrame
    );


    animationFrame =
        requestAnimationFrame(
            gameLoop
        );
}


/* =========================
   GAME OVER
   ========================= */

async function endGame() {

    if (
        !gameRunning
    ) {

        return;
    }


    const endTime =
        performance.now();


    const elapsed =
        (
            endTime -
            startTime
        ) /
        1000;


    gameRunning =
        false;


    cancelAnimationFrame(
        animationFrame
    );


    enemies = [];

    bullets = [];


    playerNameElement.textContent =
        nameInput.value.trim();


    survivalTimeElement.textContent =
        elapsed.toFixed(2);


    timerElement.textContent =
        elapsed.toFixed(2);


    gameScreen.style.display =
        "none";


    gameOverScreen.classList.remove(
        "hidden"
    );


    /*
        SCORE NAAR SERVER
    */

    const result =
        await submitScore(
            nameInput.value.trim(),
            elapsed
        );


    if (result) {

        scoreMessage.textContent =
            result.message ||
            "";
    }
}


/* =========================
   BUTTONS
   ========================= */

playButton.addEventListener(
    "click",
    function() {

        startScreen.style.display =
            "none";


        nameScreen.classList.remove(
            "hidden"
        );


        nameInput.value =
            "";


        nameInput.focus();
    }
);


startGameButton.addEventListener(
    "click",
    startGame
);


nameInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter"
        ) {

            startGame();
        }
    }
);


backFromNameButton.addEventListener(
    "click",
    function() {

        nameScreen.classList.add(
            "hidden"
        );


        startScreen.style.display =
            "flex";
    }
);


continueButton.addEventListener(
    "click",
    function() {

        gameOverScreen.classList.add(
            "hidden"
        );


        startScreen.style.display =
            "flex";
    }
);


leaderboardButton.addEventListener(
    "click",
    async function() {

        startScreen.style.display =
            "none";


        leaderboardScreen.classList.remove(
            "hidden"
        );


        await loadLeaderboard();
    }
);


backFromLeaderboardButton.addEventListener(
    "click",
    function() {

        leaderboardScreen.classList.add(
            "hidden"
        );


        startScreen.style.display =
            "flex";
    }
);