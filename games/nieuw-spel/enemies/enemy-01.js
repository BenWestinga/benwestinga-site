window.enemies = [];

function spawnEnemy1() {
    const canvas = document.getElementById("level-canvas");

    const margin = 80;

    let x;
    let y;

    const side = Math.floor(Math.random() * 4);

    if (side === 0) {
        // links
        x = -margin;
        y = Math.random() * canvas.height;
    }

    if (side === 1) {
        // rechts
        x = canvas.width + margin;
        y = Math.random() * canvas.height;
    }

    if (side === 2) {
        // boven
        x = Math.random() * canvas.width;
        y = -margin;
    }

    if (side === 3) {
        // onder
        x = Math.random() * canvas.width;
        y = canvas.height + margin;
    }

    enemies.push({
        type: "enemy-01",

        x,
        y,

        radius: 14,
        speed: 1.8
    });
}


function updateEnemy1s() {

    for (let i = enemies.length - 1; i >= 0; i--) {

        const enemy = enemies[i];

        const dx = levelPlayer.x - enemy.x;
        const dy = levelPlayer.y - enemy.y;

        const distance = Math.sqrt(
            dx * dx + dy * dy
        );

        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }


        // BULLET COLLISION
        for (let b = bullets.length - 1; b >= 0; b--) {

            const bullet = bullets[b];

            const bx = bullet.x - enemy.x;
            const by = bullet.y - enemy.y;

            const bulletDistance = Math.sqrt(
                bx * bx + by * by
            );

            if (
                bulletDistance <
                enemy.radius + bullet.radius
            ) {
                enemies.splice(i, 1);
                bullets.splice(b, 1);

                break;
            }
        }
    }
}


function drawEnemy1s(ctx) {

    ctx.fillStyle = "red";

    for (const enemy of enemies) {

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            enemy.radius,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }
}


function clearEnemies() {
    enemies.length = 0;
}