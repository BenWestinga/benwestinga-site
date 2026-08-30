const bullets = [];


/*
    Later komen deze gegevens uit:
    - gekozen wapen
    - upgrades
    - account progressie

    Dus NIET uit level-01.js.
*/

function shootBullet() {

    if (!levelActive || gamePaused) {
        return;
    }

    const middle = levelCanvas.width / 2;

    let direction;


    // Speler links -> schiet rechts
    if (levelPlayer.x < middle) {
        direction = 1;
    }

    // Speler rechts -> schiet links
    else if (levelPlayer.x > middle) {
        direction = -1;
    }

    else {
        return;
    }


    bullets.push({
        x: levelPlayer.x,
        y: levelPlayer.y,

        direction: direction
    });
}


function updateBullets() {

    for (let i = bullets.length - 1; i >= 0; i--) {

        const bullet = bullets[i];

        /*
            Tijdelijke beweging.

            Later wordt dit:
            bullet.x += weapon.bulletSpeed * bullet.direction
        */

        bullet.x += 10 * bullet.direction;


        if (
            bullet.x < -100 ||
            bullet.x > levelCanvas.width + 100
        ) {
            bullets.splice(i, 1);
        }
    }
}


function clearBullets() {
    bullets.length = 0;
}