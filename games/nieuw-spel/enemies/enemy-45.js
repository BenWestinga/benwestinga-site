const deathSequences = [];


/*
    Alle normale bewegende enemies uit wereld 1 t/m 5.

    Niet opgenomen:
    - bosses;
    - meteor, lavaWave en snowstorm;
    - lavaGolemite en cinder;
    - de Spawner zelf.
*/

const RANDOM_ENEMIES = Object.freeze([
    "sandGoon",
    "bigsandGoon",
    "sandBomb",
    "sandShooter",
    "sandWorm",
    "sandGuy",
    "sandBall",
    "sandguardianWorm",

    "grassGoon",
    "knight",
    "camoGoon",
    "shotgunGoon",
    "snake",
    "shielder",
    "snakeQueen",
    "biggrassGoon",

    "stone",
    "stoneGoon",
    "stoneThrower",
    "insect",
    "stoneRoller",
    "stoner",
    "stoneBurrower",

    "iceGoon",
    "snowGuy",
    "snowMan",
    "snowball",
    "snowProtector",
    "snowWorm",
    "snowHealer",
    "snowWarrior",
    "icePuller",

    "lavaGoon",
    "lavaGolem",
    "lavaWizard",
    "plasmaGuy",
    "lavaBurrower",
    "emberHealer",
    "ashPhantom",
    "cinderSplitter",
    "fireChainTwins"
]);


/*
    Speciale outlines voor enemies
    die uit meerdere delen bestaan.

    Alle andere enemies gebruiken
    automatisch één ronde outline.
*/

const PREVIEW_CONFIGS = Object.freeze({
    sandWorm: Object.freeze({
        preview: "worm",
        previewRadius: 13,
        previewParts: 4
    }),

    sandguardianWorm: Object.freeze({
        preview: "worm",
        previewRadius: 15,
        previewParts: 5
    }),

    snake: Object.freeze({
        preview: "worm",
        previewRadius: 11,
        previewParts: 5
    }),

    snakeQueen: Object.freeze({
        preview: "worm",
        previewRadius: 15,
        previewParts: 6
    }),

    snowWorm: Object.freeze({
        preview: "worm",
        previewRadius: 13,
        previewParts: 4
    }),

    fireChainTwins: Object.freeze({
        preview: "worm",
        previewRadius: 15,
        previewParts: 2
    })
});


const DEFAULT_PREVIEW = Object.freeze({
    preview: "circle",
    previewRadius: 14,
    previewParts: 1
});


const SPAWNER_STYLE = Object.freeze({
    main: "#9b55e8",
    light: "#f0c9ff",
    dark: "#42146e",
    glow: "rgba(178,80,255,0.88)"
});


/*
    Exact vijf willekeurige enemies
    per kapotte Spawner.
*/

const RANDOM_ENEMIES_ON_DEATH = 5;


const SHAKE_DURATION = 0.5;

const PREVIEW_DURATION = 1;

const SPAWN_STAGGER_DURATION = 0.5;

const MIN_SPAWN_DISTANCE = 90;

const MAX_SPAWN_DISTANCE = 185;


function clearDeathSequences() {
    deathSequences.length = 0;
}


function clamp(
    value,
    minimum,
    maximum
) {
    return Math.max(
        minimum,

        Math.min(
            maximum,
            value
        )
    );
}


function findBoss(api) {
    return (
        api.getEnemies().find(
            enemy =>
                enemy &&
                enemy.hp > 0 &&
                (
                    enemy.definition?.id ===
                        "final-lava-ben" ||

                    enemy.definition?.boss ===
                        true ||

                    enemy.isBoss ===
                        true
                )
        ) ||
        null
    );
}


function buildSpawnList() {
    const list = [];


    /*
        Iedere keuze is los willekeurig.

        Hierdoor kunnen er ook twee
        dezelfde enemies verschijnen.
    */

    for (
        let index = 0;
        index < RANDOM_ENEMIES_ON_DEATH;
        index++
    ) {
        const enemy =
            RANDOM_ENEMIES[
                Math.floor(
                    Math.random() *
                    RANDOM_ENEMIES.length
                )
            ];


        const preview =
            PREVIEW_CONFIGS[enemy] ||
            DEFAULT_PREVIEW;


        list.push({
            enemy,

            preview:
                preview.preview,

            previewRadius:
                preview.previewRadius,

            previewParts:
                preview.previewParts
        });
    }


    return list;
}


function createSpawnEntries(
    portalX,
    portalY,
    api
) {
    const canvas =
        api.getCanvas();


    const spawnList =
        buildSpawnList();


    const entries = [];


    const margin =
        35;


    for (
        let index = 0;
        index < spawnList.length;
        index++
    ) {
        const item =
            spawnList[index];


        let position =
            null;


        /*
            Kies een willekeurige plek
            rondom de kapotte Spawner.

            De enemies staan dus niet
            allemaal exact op dezelfde plek.
        */

        for (
            let attempt = 0;
            attempt < 35;
            attempt++
        ) {
            const angle =
                Math.random() *
                Math.PI *
                2;


            const distance =
                MIN_SPAWN_DISTANCE +

                Math.random() *

                (
                    MAX_SPAWN_DISTANCE -
                    MIN_SPAWN_DISTANCE
                );


            const candidate = {
                x:
                    clamp(
                        portalX +
                        Math.cos(angle) *
                        distance,

                        margin,

                        canvas.width -
                        margin
                    ),

                y:
                    clamp(
                        portalY +
                        Math.sin(angle) *
                        distance,

                        margin,

                        canvas.height -
                        margin
                    ),

                angle:
                    Math.random() *
                    Math.PI *
                    2
            };


            const enoughSpace =
                entries.every(
                    entry =>
                        Math.hypot(
                            candidate.x -
                            entry.x,

                            candidate.y -
                            entry.y
                        ) >= 32
                );


            position =
                candidate;


            if (enoughSpace) {
                break;
            }
        }


        const spawnProgress =
            spawnList.length <= 1

                ? 0

                : index /
                    (
                        spawnList.length -
                        1
                    );


        entries.push({
            ...item,

            x:
                position.x,

            y:
                position.y,

            angle:
                position.angle,

            spawned:
                false,

            /*
                Eerst één seconde de
                rode outline tonen.

                Daarna worden de vijf
                enemies over 0.5 seconde
                verdeeld gespawned.
            */

            spawnAt:
                PREVIEW_DURATION +

                spawnProgress *
                SPAWN_STAGGER_DURATION
        });
    }


    return entries;
}


function giveRandomDirection(
    spawnedEnemies,
    direction
) {
    for (
        const enemy
        of spawnedEnemies
    ) {
        if (!enemy) {
            continue;
        }


        const speed =
            Number(
                enemy.speed
            ) || 0;


        enemy.vx =
            Math.cos(direction) *
            speed;


        enemy.vy =
            Math.sin(direction) *
            speed;


        enemy.enteredArena =
            true;
    }
}


function spawnEntry(
    entry,
    api
) {
    /*
        Bewaar welke enemies er al waren.

        Daardoor werkt dit ook met
        custom spawns zoals Fire Chain
        Twins, die twee enemies maakt.
    */

    const enemiesBeforeSpawn =
        new Set(
            api.getEnemies()
        );


    api.spawnEnemyAt(
        entry.enemy,
        entry.x,
        entry.y
    );


    const spawnedEnemies =
        api.getEnemies().filter(
            enemy =>
                !enemiesBeforeSpawn
                    .has(enemy)
        );


    giveRandomDirection(
        spawnedEnemies,

        Math.random() *
        Math.PI *
        2
    );


    entry.spawned =
        true;
}


function drawCirclePreview(
    ctx,
    entry,
    alpha
) {
    ctx.save();


    ctx.beginPath();


    ctx.arc(
        entry.x,
        entry.y,
        entry.previewRadius,
        0,
        Math.PI * 2
    );


    ctx.strokeStyle =
        `rgba(255,30,30,${
            alpha
        })`;


    ctx.lineWidth =
        4;


    ctx.shadowBlur =
        10;


    ctx.shadowColor =
        "#ff0000";


    ctx.stroke();


    ctx.restore();
}


function drawWormPreview(
    ctx,
    entry,
    alpha
) {
    const parts =
        Math.max(
            1,
            entry.previewParts || 4
        );


    const spacing =
        entry.previewRadius *
        1.35;


    const startOffset =
        -(
            (
                parts -
                1
            ) *
            spacing
        ) /
        2;


    ctx.save();


    ctx.strokeStyle =
        `rgba(255,30,30,${
            alpha
        })`;


    ctx.lineWidth =
        4;


    ctx.shadowBlur =
        10;


    ctx.shadowColor =
        "#ff0000";


    for (
        let part = 0;
        part < parts;
        part++
    ) {
        const offset =
            startOffset +
            part *
            spacing;


        const partX =
            entry.x +
            Math.cos(
                entry.angle
            ) *
            offset;


        const partY =
            entry.y +
            Math.sin(
                entry.angle
            ) *
            offset;


        const partRadius =
            part ===
                parts - 1

                ? entry.previewRadius *
                    1.08

                : entry.previewRadius;


        ctx.beginPath();


        ctx.arc(
            partX,
            partY,
            partRadius,
            0,
            Math.PI * 2
        );


        ctx.stroke();
    }


    ctx.restore();
}


function drawSpawnPreview(
    ctx,
    entry,
    sequenceTime
) {
    if (
        entry.spawned
    ) {
        return;
    }


    const remaining =
        Math.max(
            0,

            entry.spawnAt -
            sequenceTime
        );


    const pulse =
        0.72 +

        Math.sin(
            performance.now() *
            0.018 +
            entry.x
        ) *

        0.22;


    const alpha =
        pulse *

        clamp(
            remaining /
            0.18,

            0,
            1
        );


    if (
        entry.preview ===
        "worm"
    ) {
        drawWormPreview(
            ctx,
            entry,
            alpha
        );

    } else {
        drawCirclePreview(
            ctx,
            entry,
            alpha
        );
    }
}


function drawDestroyedPortal(
    ctx,
    sequence
) {
    if (
        sequence.time >
        SHAKE_DURATION
    ) {
        return;
    }


    const progress =
        clamp(
            sequence.time /
            SHAKE_DURATION,

            0,
            1
        );


    const shakeStrength =
        (
            1 -
            progress
        ) *
        9;


    const shakeX =
        Math.sin(
            sequence.time *
            95
        ) *
        shakeStrength;


    const shakeY =
        Math.cos(
            sequence.time *
            81
        ) *
        shakeStrength;


    const style =
        SPAWNER_STYLE;


    const radius =
        sequence.radius;


    ctx.save();


    ctx.translate(
        sequence.x +
        shakeX,

        sequence.y +
        shakeY
    );


    ctx.globalAlpha =
        1 -
        progress *
        0.68;


    ctx.beginPath();


    ctx.arc(
        0,
        0,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        style.dark;


    ctx.shadowBlur =
        24;


    ctx.shadowColor =
        style.main;


    ctx.fill();


    ctx.shadowBlur =
        0;


    ctx.strokeStyle =
        style.light;


    ctx.lineWidth =
        5;


    /*
        Barsten tijdens het trillen.
    */

    for (
        let crack = 0;
        crack < 6;
        crack++
    ) {
        const angle =
            crack *
            Math.PI *
            2 /
            6 +

            sequence.time *
            2;


        ctx.beginPath();


        ctx.moveTo(
            Math.cos(angle) *
            radius *
            0.18,

            Math.sin(angle) *
            radius *
            0.18
        );


        ctx.lineTo(
            Math.cos(
                angle +
                0.18
            ) *
            radius *
            0.58,

            Math.sin(
                angle +
                0.18
            ) *
            radius *
            0.58
        );


        ctx.lineTo(
            Math.cos(angle) *
            radius *
            0.94,

            Math.sin(angle) *
            radius *
            0.94
        );


        ctx.stroke();
    }


    ctx.restore();
}


const spawner = {
    id:
        "spawner",


    name:
        "Spawner",


    behavior:
        "stationary-healing-death-spawner",


    hp:
        150,


    size:
        6,


    speed:
        0,


    tracking:
        0,


    color:
        "#9b55e8",


    image:
        "lava.png",


    /*
        Iedere levende Spawner healt
        de boss met 2 HP per seconde.
    */

    healAmount:
        2,


    healInterval:
        1,


    reset() {
        clearDeathSequences();
    },


    onPlayerDeath() {
        clearDeathSequences();
    },


    onLevelWin() {
        clearDeathSequences();
    },


    onSpawn(enemy) {
        enemy.healTimer =
            this.healInterval;


        enemy.portalAnimation =
            Math.random() *
            Math.PI *
            2;


        enemy.healPulse =
            0;


        enemy.vx =
            0;


        enemy.vy =
            0;


        enemy.enteredArena =
            true;
    },


    update(
        enemy,
        dt,
        api
    ) {
        /*
            De Spawner staat stil.
        */

        enemy.vx =
            0;


        enemy.vy =
            0;


        enemy.portalAnimation +=
            dt *
            3.8;


        enemy.healPulse =
            Math.max(
                0,

                enemy.healPulse -
                dt
            );


        const boss =
            findBoss(api);


        if (!boss) {
            enemy.healTimer =
                this.healInterval;


            return;
        }


        enemy.healTimer -=
            dt;


        while (
            enemy.healTimer <=
            0
        ) {
            if (
                boss.hp <
                boss.maxHp
            ) {
                boss.hp =
                    Math.min(
                        boss.maxHp,

                        boss.hp +
                        this.healAmount
                    );


                enemy.healPulse =
                    0.30;
            }


            enemy.healTimer +=
                this.healInterval;
        }
    },


    onDeath(
        enemy,
        api
    ) {
        deathSequences.push({
            x:
                enemy.x,

            y:
                enemy.y,

            radius:
                enemy.radius,

            time:
                0,

            entries:
                createSpawnEntries(
                    enemy.x,
                    enemy.y,
                    api
                )
        });
    },


    beforeUpdate(
        dt,
        api
    ) {
        for (
            let index =
                deathSequences.length -
                1;

            index >= 0;

            index--
        ) {
            const sequence =
                deathSequences[
                    index
                ];


            sequence.time +=
                dt;


            for (
                const entry
                of sequence.entries
            ) {
                if (
                    !entry.spawned &&

                    sequence.time >=
                    entry.spawnAt
                ) {
                    spawnEntry(
                        entry,
                        api
                    );
                }
            }


            if (
                sequence.entries.every(
                    entry =>
                        entry.spawned
                )
            ) {
                deathSequences.splice(
                    index,
                    1
                );
            }
        }
    },


    /*
        Teken de healingbeam achter
        de enemies.
    */

    drawBelow(
        ctx,
        api
    ) {
        const boss =
            findBoss(api);


        if (!boss) {
            return;
        }


        const time =
            performance.now() /
            1000;


        for (
            const enemy
            of api.getEnemies()
        ) {
            if (
                enemy.definition !==
                    this ||

                enemy.hp <= 0
            ) {
                continue;
            }


            const style =
                SPAWNER_STYLE;


            const pulse =
                0.62 +

                Math.sin(
                    time *
                    7 +
                    enemy.id
                ) *

                0.18;


            ctx.save();


            /*
                Donkere buitenbeam.
            */

            ctx.beginPath();


            ctx.moveTo(
                enemy.x,
                enemy.y
            );


            ctx.lineTo(
                boss.x,
                boss.y
            );


            ctx.strokeStyle =
                style.dark;


            ctx.globalAlpha =
                0.42;


            ctx.lineWidth =
                13;


            ctx.shadowBlur =
                18;


            ctx.shadowColor =
                style.main;


            ctx.stroke();


            /*
                Lichte binnenbeam.
            */

            ctx.beginPath();


            ctx.moveTo(
                enemy.x,
                enemy.y
            );


            ctx.lineTo(
                boss.x,
                boss.y
            );


            ctx.strokeStyle =
                style.light;


            ctx.globalAlpha =
                pulse;


            ctx.lineWidth =
                enemy.healPulse > 0
                    ? 6
                    : 3;


            ctx.stroke();


            /*
                Lichtdeeltjes bewegen
                richting de boss.
            */

            for (
                let particle = 0;
                particle < 5;
                particle++
            ) {
                const progress =
                    (
                        time *
                        0.72 +

                        particle /
                        5 +

                        enemy.id *
                        0.07
                    ) %
                    1;


                const particleX =
                    enemy.x +

                    (
                        boss.x -
                        enemy.x
                    ) *

                    progress;


                const particleY =
                    enemy.y +

                    (
                        boss.y -
                        enemy.y
                    ) *

                    progress;


                ctx.beginPath();


                ctx.arc(
                    particleX,
                    particleY,

                    enemy.healPulse > 0
                        ? 5
                        : 3,

                    0,
                    Math.PI * 2
                );


                ctx.fillStyle =
                    style.light;


                ctx.globalAlpha =
                    0.82;


                ctx.fill();
            }


            ctx.restore();
        }
    },


    /*
        Doodanimatie en rode outlines
        boven de enemies tekenen.
    */

    drawGlobal(ctx) {
        for (
            const sequence
            of deathSequences
        ) {
            drawDestroyedPortal(
                ctx,
                sequence
            );


            for (
                const entry
                of sequence.entries
            ) {
                drawSpawnPreview(
                    ctx,
                    entry,
                    sequence.time
                );
            }
        }
    },


    draw(
        enemy,
        ctx
    ) {
        const style =
            SPAWNER_STYLE;


        const radius =
            enemy.radius;


        const pulse =
            1 +

            Math.sin(
                enemy.portalAnimation
            ) *

            0.075;


        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


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
            style.dark;


        ctx.shadowBlur =
            enemy.healPulse > 0
                ? 34
                : 24;


        ctx.shadowColor =
            style.glow;


        ctx.fill();


        ctx.shadowBlur =
            0;


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
                    ring *
                    0.16
                )
            );


            ctx.beginPath();


            ctx.arc(
                0,
                0,

                radius *
                (
                    0.94 -
                    ring *
                    0.19
                ),

                ring *
                0.8,

                ring *
                0.8 +
                Math.PI *
                1.45
            );


            ctx.strokeStyle =
                ring === 0
                    ? style.light
                    : style.main;


            ctx.lineWidth =
                Math.max(
                    3,

                    radius *
                    0.10
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
                radius * 0.58
            );


        core.addColorStop(
            0,
            "#ffffff"
        );


        core.addColorStop(
            0.24,
            style.light
        );


        core.addColorStop(
            0.58,
            style.main
        );


        core.addColorStop(
            1,
            "rgba(0,0,0,0.18)"
        );


        ctx.beginPath();


        ctx.arc(
            0,
            0,
            radius * 0.58,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            core;


        ctx.fill();


        /*
            S van Spawner.
        */

        ctx.fillStyle =
            "#ffffff";


        ctx.strokeStyle =
            "rgba(0,0,0,0.88)";


        ctx.lineWidth =
            4;


        ctx.font =
            `bold ${
                Math.max(
                    15,

                    radius *
                    0.42
                )
            }px Arial`;


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.strokeText(
            "S",
            0,
            1
        );


        ctx.fillText(
            "S",
            0,
            1
        );


        ctx.restore();
    }
};


export {
    RANDOM_ENEMIES,
    PREVIEW_CONFIGS
};


export default spawner;