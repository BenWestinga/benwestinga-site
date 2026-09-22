const ENEMIES_BY_WORLD = Object.freeze({
    1: Object.freeze([
        "sandGoon",
        "bigsandGoon",
        "sandBomb",
        "sandShooter",
        "sandWorm",
        "sandGuy",
        "sandBall",
        "sandguardianWorm"
    ]),

    2: Object.freeze([
        "grassGoon",
        "knight",
        "camoGoon",
        "shotgunGoon",
        "snake",
        "shielder",
        "snakeQueen",
        "biggrassGoon"
    ]),

    3: Object.freeze([
        "stone",
        "stoneGoon",
        "stoneThrower",
        "insect",
        "stoneRoller",
        "stoner",
        "stoneBurrower"
    ]),

    4: Object.freeze([
        "iceGoon",
        "snowGuy",
        "snowMan",
        "snowball",
        "snowProtector",
        "snowWorm",
        "snowHealer",
        "snowWarrior",
        "icePuller"
    ]),

    5: Object.freeze([
        "lavaGoon",
        "lavaGolem",
        "lavaWizard",
        "plasmaGuy",
        "lavaBurrower",
        "emberHealer",
        "ashPhantom",
        "cinderSplitter",
        "fireChainTwins"
    ])
});


const WORLD_COLORS = Object.freeze({
    1: ["#ffe28a", "#c9892d"],
    2: ["#c8ff8a", "#3f9d3a"],
    3: ["#dedede", "#666a70"],
    4: ["#e8fbff", "#55bde8"],
    5: ["#ffd057", "#e62d12"]
});


function randomItem(list) {
    return list[
        Math.floor(
            Math.random() *
            list.length
        )
    ];
}


function setRandomDirection(
    spawnedEnemies,
    portal,
    angle
) {
    for (
        const spawnedEnemy
        of spawnedEnemies
    ) {
        if (
            !spawnedEnemy ||
            spawnedEnemy === portal
        ) {
            continue;
        }


        const distance =
            portal.radius +
            (
                spawnedEnemy.radius ||
                0
            ) +
            12;


        spawnedEnemy.x =
            portal.x +
            Math.cos(angle) *
            distance;


        spawnedEnemy.y =
            portal.y +
            Math.sin(angle) *
            distance;


        const speed =
            Number(
                spawnedEnemy.speed
            ) || 0;


        spawnedEnemy.vx =
            Math.cos(angle) *
            speed;


        spawnedEnemy.vy =
            Math.sin(angle) *
            speed;


        spawnedEnemy.enteredArena =
            true;
    }
}


const spawner = {
    id: "spawner",

    name: "Spawner",

    behavior:
        "stationary-world-portal",

    hp: 100,

    size: 6,

    speed: 0,

    tracking: 0,

    color: "#9d1717",

    image: "lava.png",

    spawnInterval: 1,


    onSpawn(enemy) {
        enemy.spawnWorld =
            Math.max(
                1,

                Math.min(
                    5,

                    Number(
                        enemy.spawnWorld
                    ) || 1
                )
            );


        enemy.spawnTimer =
            this.spawnInterval;


        enemy.portalAnimation =
            Math.random() *
            Math.PI *
            2;


        enemy.vx = 0;

        enemy.vy = 0;

        enemy.enteredArena = true;
    },


    spawnRandomEnemy(
        enemy,
        api
    ) {
        const world =
            Math.max(
                1,

                Math.min(
                    5,

                    Number(
                        enemy.spawnWorld
                    ) || 1
                )
            );


        const pool =
            ENEMIES_BY_WORLD[
                world
            ];


        if (
            !pool ||
            pool.length === 0
        ) {
            return;
        }


        const typeId =
            randomItem(pool);


        const angle =
            Math.random() *
            Math.PI *
            2;


        /*
            We bewaren welke enemies
            al bestonden.

            Dit is belangrijk voor
            Fire Chain Twins, omdat die
            via zijn custom spawn()
            twee enemies tegelijk maakt.
        */

        const enemiesBeforeSpawn =
            new Set(
                api.getEnemies()
            );


        api.spawnEnemyAt(
            typeId,
            enemy.x,
            enemy.y
        );


        const spawnedEnemies =
            api.getEnemies().filter(
                candidate =>
                    !enemiesBeforeSpawn
                        .has(candidate)
            );


        setRandomDirection(
            spawnedEnemies,
            enemy,
            angle
        );
    },


    update(
        enemy,
        dt,
        api
    ) {
        /*
            De Spawner zelf staat stil.
        */

        enemy.vx = 0;

        enemy.vy = 0;


        enemy.portalAnimation +=
            dt *
            3.8;


        enemy.spawnTimer -=
            dt;


        /*
            Iedere seconde precies
            één willekeurige enemy.
        */

        while (
            enemy.spawnTimer <= 0
        ) {
            this.spawnRandomEnemy(
                enemy,
                api
            );


            enemy.spawnTimer +=
                this.spawnInterval;
        }
    },


    draw(
        enemy,
        ctx
    ) {
        const world =
            Math.max(
                1,

                Math.min(
                    5,

                    Number(
                        enemy.spawnWorld
                    ) || 1
                )
            );


        const colors =
            WORLD_COLORS[
                world
            ];


        const pulse =
            1 +
            Math.sin(
                enemy.portalAnimation
            ) *
            0.08;


        const radius =
            enemy.radius;


        ctx.save();

        ctx.translate(
            enemy.x,
            enemy.y
        );


        /*
            Donkere buitenkant.
        */

        ctx.beginPath();

        ctx.arc(
            0,
            0,
            radius *
            1.18 *
            pulse,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "rgba(20,0,25,0.82)";


        ctx.shadowBlur = 26;

        ctx.shadowColor =
            colors[1];


        ctx.fill();


        ctx.shadowBlur = 0;


        /*
            Drie draaiende portalringen.
        */

        for (
            let ring = 0;
            ring < 3;
            ring++
        ) {
            const direction =
                ring % 2 === 0
                    ? 1
                    : -1;


            ctx.save();


            ctx.rotate(
                enemy.portalAnimation *
                direction *
                (
                    0.45 +
                    ring * 0.16
                )
            );


            ctx.beginPath();


            ctx.arc(
                0,
                0,

                radius *
                (
                    0.94 -
                    ring * 0.19
                ),

                ring * 0.8,

                ring * 0.8 +
                Math.PI * 1.45
            );


            ctx.strokeStyle =
                ring === 0
                    ? colors[0]
                    : colors[1];


            ctx.lineWidth =
                Math.max(
                    3,
                    radius * 0.10
                );


            ctx.lineCap =
                "round";


            ctx.stroke();

            ctx.restore();
        }


        /*
            Lichtgevende kern.
        */

        const core =
            ctx.createRadialGradient(
                -radius * 0.12,
                -radius * 0.14,
                1,

                0,
                0,
                radius * 0.55
            );


        core.addColorStop(
            0,
            "#ffffff"
        );


        core.addColorStop(
            0.25,
            colors[0]
        );


        core.addColorStop(
            1,
            "rgba(20,0,25,0.10)"
        );


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            radius * 0.55,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            core;


        ctx.fill();


        /*
            Wereldnummer.
        */

        ctx.fillStyle =
            "#ffffff";


        ctx.strokeStyle =
            "rgba(0,0,0,0.85)";


        ctx.lineWidth = 4;


        ctx.font =
            `bold ${
                Math.max(
                    15,
                    radius * 0.42
                )
            }px Arial`;


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.strokeText(
            String(world),
            0,
            1
        );


        ctx.fillText(
            String(world),
            0,
            1
        );


        ctx.restore();
    }
};


export {
    ENEMIES_BY_WORLD
};


export default spawner;