window.bullets = [];


// Alleen tijdelijke testwaarden.
// Later komen deze uit het gekozen wapen + upgrades.
const TEST_BULLET_SPEED = 12;
const TEST_FIRE_INTERVAL = 250;

let lastShotTime = 0;


function shootBullet() {

    if (
        !window.levelActive ||
        window.gamePaused
    ) {
        return;
    }

    const canvas =
        document.getElementById("level-canvas");

    const middle =
        canvas.width / 2;

    let direction;


    // Links staan = rechts schieten
    if (levelPlayer.x < middle) {
        direction = 1;
    }

    // Rechts staan = links schieten
    else if (levelPlayer.x > middle) {
        direction = -1;
    }

    else {
        return;
    }


    bullets.push({
        x: levelPlayer.x,
        y: levelPlayer.y,

        radius: 6,

        vx:
            TEST_BULLET_SPEED *
            direction
    });
}


function updateAutomaticShooting(time) {

    if (
        time - lastShotTime <
        TEST_FIRE_INTERVAL
    ) {
        return;
    }

    shootBullet();

    lastShotTime = time;
}


function updateBullets() {

    const canvas =
        document.getElementById("level-canvas");

    for (
        let i = bullets.length - 1;
        i >= 0;
        i--
    ) {

        const bullet = bullets[i];

        bullet.x += bullet.vx;


        if (
            bullet.x < -100 ||
            bullet.x > canvas.width + 100
        ) {
            bullets.splice(i, 1);
        }
    }
}


function drawBullets(ctx) {

    ctx.fillStyle = "black";

    for (const bullet of bullets) {

        ctx.beginPath();

        ctx.arc(
            bullet.x,
            bullet.y,
            bullet.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


function clearBullets() {
    bullets.length = 0;
}


function resetShootingTimer() {
    lastShotTime = performance.now();
}