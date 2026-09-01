const storyButton = document.getElementById("story-button");
const mapGameMenu = document.getElementById("game-menu");
const storyMap = document.getElementById("story-map");
const canvas = document.getElementById("map-canvas");
const ctx = canvas.getContext("2d");


// ======================================================
// CANVAS
// ======================================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);


// ======================================================
// MAP
// ======================================================

let tiledMap = null;

let TILE_WIDTH = 32;
let TILE_HEIGHT = 32;

let WORLD_WIDTH = 3200;
let WORLD_HEIGHT = 3200;

let tilesets = [];

let mapLoaded = false;
let mapLoadingPromise = null;


// ======================================================
// LEVELS
// ======================================================

const levelPoints = new Map();

let spawnPoint = {
    x: 350,
    y: 1768
};

const LEVEL_RADIUS = 43;
const BOSS_RADIUS = 52;
const LEVEL_INTERACT_RADIUS = 72;

const bossLevels = new Set([
    5,
    10,
    15,
    20,
    25,
    30,
    35,
    40,
    45,
    49,
    50
]);


// ======================================================
// PROGRESS
// ======================================================

const PROGRESS_KEY =
    "nieuwSpelHighestCompletedLevel";

let highestCompletedLevel =
    Number(
        localStorage.getItem(PROGRESS_KEY)
    ) || 0;

highestCompletedLevel =
    Math.max(
        0,
        Math.min(50, highestCompletedLevel)
    );


// ======================================================
// PLAYER
// ======================================================

const player = {
    x: 350,
    y: 1768,
    size: 26,
    speed: 4
};


// ======================================================
// CAMERA
// ======================================================

const camera = {
    x: 0,
    y: 0
};


// ======================================================
// INPUT
// ======================================================

const keys = {};

let levelLaunchBusy = false;


// ======================================================
// DEATH / MESSAGE
// ======================================================

let hazardGraceUntil = 0;

let noticeText = "";
let noticeUntil = 0;

function showNotice(text, duration = 2200) {

    noticeText = text;

    noticeUntil =
        performance.now() +
        duration;
}


// ======================================================
// PROPERTY VALUE
// ======================================================

function convertPropertyValue(value, type) {

    if (type === "bool") {
        return value === "true";
    }

    if (
        type === "int" ||
        type === "float"
    ) {
        return Number(value);
    }

    return value;
}


// ======================================================
// TILESET LADEN
// ======================================================

async function loadTileset(
    tilesetReference,
    mapUrl
) {

    const tsxUrl =
        new URL(
            tilesetReference.source,
            mapUrl
        );

    const response =
        await fetch(tsxUrl);

    if (!response.ok) {

        throw new Error(
            "Tileset niet gevonden: " +
            tilesetReference.source
        );
    }

    const text =
        await response.text();

    const parser =
        new DOMParser();

    const xml =
        parser.parseFromString(
            text,
            "text/xml"
        );

    const tilesetElement =
        xml.querySelector("tileset");

    if (!tilesetElement) {

        throw new Error(
            "Ongeldige tileset: " +
            tilesetReference.source
        );
    }

    const tileWidth =
        Number(
            tilesetElement.getAttribute(
                "tilewidth"
            )
        );

    const tileHeight =
        Number(
            tilesetElement.getAttribute(
                "tileheight"
            )
        );

    const spacing =
        Number(
            tilesetElement.getAttribute(
                "spacing"
            ) || 0
        );

    const margin =
        Number(
            tilesetElement.getAttribute(
                "margin"
            ) || 0
        );

    const columns =
        Number(
            tilesetElement.getAttribute(
                "columns"
            ) || 1
        );

    const tileCount =
        Number(
            tilesetElement.getAttribute(
                "tilecount"
            ) || 0
        );

    const imageElement =
        tilesetElement.querySelector(
            "image"
        );

    if (!imageElement) {

        throw new Error(
            "Geen PNG in " +
            tilesetReference.source
        );
    }

    const imageSource =
        imageElement.getAttribute(
            "source"
        );

    const imageUrl =
        new URL(
            imageSource,
            tsxUrl
        );

    const image =
        new Image();

    image.src =
        imageUrl.href;

    await new Promise(
        (resolve, reject) => {

            image.onload =
                resolve;

            image.onerror =
                () =>
                    reject(
                        new Error(
                            "PNG niet geladen: " +
                            imageUrl.href
                        )
                    );
        }
    );


    // TILE PROPERTIES

    const tileProperties =
        new Map();

    const tileElements =
        tilesetElement.querySelectorAll(
            "tile"
        );

    for (
        const tileElement
        of tileElements
    ) {

        const tileId =
            Number(
                tileElement.getAttribute(
                    "id"
                )
            );

        const properties = {};

        const propertyElements =
            tileElement.querySelectorAll(
                "properties > property"
            );

        for (
            const propertyElement
            of propertyElements
        ) {

            const name =
                propertyElement.getAttribute(
                    "name"
                );

            const type =
                propertyElement.getAttribute(
                    "type"
                ) || "string";

            let value =
                propertyElement.getAttribute(
                    "value"
                );

            if (value === null) {

                value =
                    propertyElement.textContent;
            }

            properties[name] =
                convertPropertyValue(
                    value,
                    type
                );
        }

        tileProperties.set(
            tileId,
            properties
        );
    }


    return {

        firstgid:
            tilesetReference.firstgid,

        source:
            tilesetReference.source,

        image,

        tileWidth,
        tileHeight,
        spacing,
        margin,
        columns,
        tileCount,

        tileProperties
    };
}


// ======================================================
// LEVEL OBJECTS UIT TILED
// ======================================================

function loadLevelObjects() {

    levelPoints.clear();

    const levelLayer =
        tiledMap.layers.find(
            layer =>
                layer.type ===
                    "objectgroup" &&
                layer.name.toLowerCase() ===
                    "levels"
        );

    if (!levelLayer) {

        console.error(
            "Levels object layer niet gevonden."
        );

        return;
    }

    for (
        const object
        of levelLayer.objects
    ) {

        const name =
            object.name
                .trim()
                .toLowerCase();


        // Jouw JSON gebruikt "spawnpoint".
        // "spawn" werkt ook.

        if (
            name === "spawnpoint" ||
            name === "spawn"
        ) {

            spawnPoint = {
                x: object.x,
                y: object.y
            };

            continue;
        }


        const levelNumber =
            Number(object.name);

        if (
            Number.isInteger(levelNumber) &&
            levelNumber >= 1 &&
            levelNumber <= 50
        ) {

            levelPoints.set(
                levelNumber,
                {
                    x: object.x,
                    y: object.y
                }
            );
        }
    }


    console.log(
        "Spawn:",
        spawnPoint
    );

    console.log(
        "Levels gevonden:",
        levelPoints.size
    );
}


// ======================================================
// MAP LADEN
// ======================================================

async function loadTiledMap() {

    if (mapLoaded) {
        return;
    }

    if (mapLoadingPromise) {
        return mapLoadingPromise;
    }

    mapLoadingPromise =
        (async () => {

            const mapUrl =
                new URL(
                    "spelmap.json",
                    window.location.href
                );

            const response =
                await fetch(mapUrl);

            if (!response.ok) {

                throw new Error(
                    "spelmap.json niet gevonden."
                );
            }

            tiledMap =
                await response.json();

            TILE_WIDTH =
                tiledMap.tilewidth;

            TILE_HEIGHT =
                tiledMap.tileheight;

            WORLD_WIDTH =
                tiledMap.width *
                TILE_WIDTH;

            WORLD_HEIGHT =
                tiledMap.height *
                TILE_HEIGHT;

            tilesets = [];

            for (
                const reference
                of tiledMap.tilesets
            ) {

                const tileset =
                    await loadTileset(
                        reference,
                        mapUrl
                    );

                tilesets.push(
                    tileset
                );
            }

            tilesets.sort(
                (a, b) =>
                    a.firstgid -
                    b.firstgid
            );

            loadLevelObjects();

            mapLoaded = true;

            console.log(
                "Map geladen:",
                WORLD_WIDTH,
                WORLD_HEIGHT
            );
        })();

    return mapLoadingPromise;
}


// ======================================================
// TILESET HELPERS
// ======================================================

function cleanGid(rawGid) {

    return (
        rawGid &
        0x1FFFFFFF
    );
}


function getTilesetForGid(rawGid) {

    const gid =
        cleanGid(rawGid);

    if (gid === 0) {
        return null;
    }

    for (
        let i =
            tilesets.length - 1;

        i >= 0;

        i--
    ) {

        if (
            gid >=
            tilesets[i].firstgid
        ) {

            return {
                gid,
                tileset:
                    tilesets[i]
            };
        }
    }

    return null;
}


function getTilesetName(
    tileset
) {

    return tileset.source
        .replaceAll("\\", "/")
        .split("/")
        .pop()
        .toLowerCase();
}


function getPropertiesForGid(
    rawGid
) {

    const result =
        getTilesetForGid(
            rawGid
        );

    if (!result) {
        return {};
    }

    const localTileId =
        result.gid -
        result.tileset.firstgid;

    return (
        result.tileset
            .tileProperties
            .get(localTileId)
        || {}
    );
}


// ======================================================
// TILE OP POSITIE
// ======================================================

function getGidsAtTile(
    tileX,
    tileY
) {

    const gids = [];

    if (!tiledMap) {
        return gids;
    }

    if (
        tileX < 0 ||
        tileY < 0 ||
        tileX >= tiledMap.width ||
        tileY >= tiledMap.height
    ) {

        return gids;
    }

    for (
        const layer
        of tiledMap.layers
    ) {

        if (
            layer.type !==
                "tilelayer" ||
            !layer.visible
        ) {

            continue;
        }

        const index =
            tileY *
            layer.width +
            tileX;

        const gid =
            layer.data[index];

        if (gid) {
            gids.push(gid);
        }
    }

    return gids;
}


// ======================================================
// COLLISION
// ======================================================

function pointHasCollision(
    x,
    y
) {

    const tileX =
        Math.floor(
            x / TILE_WIDTH
        );

    const tileY =
        Math.floor(
            y / TILE_HEIGHT
        );

    const gids =
        getGidsAtTile(
            tileX,
            tileY
        );

    for (
        const gid
        of gids
    ) {

        const result =
            getTilesetForGid(gid);

        if (!result) {
            continue;
        }

        const source =
            getTilesetName(
                result.tileset
            );


        // ALLE BERGEN EN STENEN BLOKKEREN

        if (
            source ===
                "mountain.tsx" ||
            source ===
                "rock.tsx"
        ) {

            return true;
        }


        // PROPERTIES BLIJVEN OOK WERKEN

        const properties =
            getPropertiesForGid(
                gid
            );

        if (
            properties.collision === true ||
            properties.colission === true
        ) {

            return true;
        }
    }

    return false;
}


function positionHasCollision(
    x,
    y
) {

    const half =
        player.size / 2;

    const inset = 2;

    const points = [

        {
            x:
                x -
                half +
                inset,

            y:
                y -
                half +
                inset
        },

        {
            x:
                x +
                half -
                inset,

            y:
                y -
                half +
                inset
        },

        {
            x:
                x -
                half +
                inset,

            y:
                y +
                half -
                inset
        },

        {
            x:
                x +
                half -
                inset,

            y:
                y +
                half -
                inset
        }

    ];

    return points.some(
        point =>
            pointHasCollision(
                point.x,
                point.y
            )
    );
}


// ======================================================
// WATER / LAVA
// ======================================================

function pointHazard(
    x,
    y
) {

    const tileX =
        Math.floor(
            x / TILE_WIDTH
        );

    const tileY =
        Math.floor(
            y / TILE_HEIGHT
        );

    const gids =
        getGidsAtTile(
            tileX,
            tileY
        );

    for (
        const gid
        of gids
    ) {

        const result =
            getTilesetForGid(
                gid
            );

        if (!result) {
            continue;
        }

        const source =
            getTilesetName(
                result.tileset
            );


        // Niet afhankelijk van properties.
        // Alles uit water.tsx is water.

        if (
            source ===
            "water.tsx"
        ) {

            return "water";
        }


        // Alles uit lava.tsx is dodelijke lava.
        // lavapath.tsx wordt NIET automatisch dodelijk.

        if (
            source ===
            "lava.tsx"
        ) {

            return "lava";
        }


        const properties =
            getPropertiesForGid(
                gid
            );

        if (
            properties.water === true
        ) {

            return "water";
        }

        if (
            properties.deadly === true
        ) {

            return "lava";
        }
    }

    return null;
}


function checkDangerousTile() {

    if (
        performance.now() <
        hazardGraceUntil
    ) {

        return;
    }

    const half =
        player.size *
        0.28;

    const points = [

        {
            x: player.x,
            y: player.y
        },

        {
            x:
                player.x -
                half,

            y:
                player.y -
                half
        },

        {
            x:
                player.x +
                half,

            y:
                player.y -
                half
        },

        {
            x:
                player.x -
                half,

            y:
                player.y +
                half
        },

        {
            x:
                player.x +
                half,

            y:
                player.y +
                half
        }

    ];

    for (
        const point
        of points
    ) {

        const danger =
            pointHazard(
                point.x,
                point.y
            );

        if (danger) {

            killPlayer(
                danger
            );

            return;
        }
    }
}


// ======================================================
// CHECKPOINT / RESPAWN
// ======================================================

function getRespawnPoint() {

    if (
        highestCompletedLevel > 0 &&
        levelPoints.has(
            highestCompletedLevel
        )
    ) {

        return levelPoints.get(
            highestCompletedLevel
        );
    }

    return spawnPoint;
}


function respawnPlayer() {

    const respawn =
        getRespawnPoint();

    player.x =
        respawn.x;

    player.y =
        respawn.y;

    hazardGraceUntil =
        performance.now() +
        1000;

    for (
        const key
        in keys
    ) {

        keys[key] = false;
    }

    updateCamera();
}


function killPlayer(cause) {

    if (cause === "water") {

        showNotice(
            "Je bent verdronken!"
        );

    } else {

        showNotice(
            "Je bent in de lava gevallen!"
        );
    }

    respawnPlayer();
}


// ======================================================
// LEVEL VOLTOOID
// ======================================================

window.completeStoryLevel =
    function(levelNumber) {

        levelNumber =
            Number(levelNumber);

        if (
            !Number.isInteger(
                levelNumber
            ) ||
            levelNumber < 1 ||
            levelNumber > 50
        ) {

            return;
        }


        /*
            Alleen verhogen.

            Voorbeeld:
            3 gehaald → checkpoint 3.

            Daarna level 2 opnieuw gehaald →
            checkpoint blijft 3.
        */

        if (
            levelNumber >
            highestCompletedLevel
        ) {

            highestCompletedLevel =
                levelNumber;

            localStorage.setItem(
                PROGRESS_KEY,
                highestCompletedLevel
            );

            showNotice(
                "Level " +
                levelNumber +
                " gehaald!"
            );
        }
    };


// Handig tijdens het bouwen.
// Later kunnen we dit verwijderen.

window.resetStoryProgress =
    function() {

        highestCompletedLevel = 0;

        localStorage.removeItem(
            PROGRESS_KEY
        );

        respawnPlayer();

        console.log(
            "Story progress gereset."
        );
    };


// ======================================================
// LEVEL BIJ SPELER
// ======================================================

function getPlayerLevel() {

    let closest = null;
    let closestDistance = Infinity;

    for (
        const [
            levelNumber,
            position
        ]
        of levelPoints
    ) {

        const dx =
            player.x -
            position.x;

        const dy =
            player.y -
            position.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (
            distance <=
                LEVEL_INTERACT_RADIUS &&
            distance <
                closestDistance
        ) {

            closestDistance =
                distance;

            closest = {
                levelNumber,
                position
            };
        }
    }

    return closest;
}


// ======================================================
// LEVEL FILE OPENEN
// ======================================================

async function launchLevel(
    levelNumber
) {

    if (levelLaunchBusy) {
        return;
    }

    levelLaunchBusy = true;

    const fileName =
        "level-" +
        String(levelNumber)
            .padStart(2, "0") +
        ".js";

    const levelUrl =
        new URL(
            "levels/" +
                fileName,
            window.location.href
        );

    try {

        const levelModule =
            await import(
                levelUrl.href
            );


        /*
            Later kun je in bijvoorbeeld
            level-03.js zetten:

            export function startLevel(context) {
                ...
            }

            of:

            export default function(context) {
                ...
            }
        */

        const startFunction =
            levelModule.startLevel ||
            levelModule.default;


        if (
            typeof startFunction ===
            "function"
        ) {

            window.gamePaused =
                true;

            await startFunction({

                levelNumber,

                completeLevel:
                    () =>
                        window
                            .completeStoryLevel(
                                levelNumber
                            ),

                hideMap:
                    () => {

                        storyMap.hidden =
                            true;
                    },

                returnToMap:
                    () => {

                        storyMap.hidden =
                            false;

                        window.gamePaused =
                            false;

                        resizeCanvas();

                        startMapLoop();
                    }
            });

        } else {

            showNotice(
                "Level " +
                levelNumber +
                " is gekoppeld, maar is nog leeg."
            );
        }

    } catch (error) {

        console.error(
            "Probleem met " +
            fileName,
            error
        );

        showNotice(
            fileName +
            " kon niet worden geladen."
        );
    }

    levelLaunchBusy = false;
}


// ======================================================
// KEYBOARD
// ======================================================

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


        if (
            event.key === "Enter" &&
            !event.repeat &&
            !storyMap.hidden &&
            !window.gamePaused
        ) {

            const level =
                getPlayerLevel();

            if (level) {

                keys["enter"] =
                    false;

                launchLevel(
                    level.levelNumber
                );
            }
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


// ======================================================
// STORY MODE START
// ======================================================

storyButton.addEventListener(
    "click",
    async () => {

        try {

            await loadTiledMap();

        } catch (error) {

            console.error(error);

            alert(
                "De map kon niet geladen worden. Open F12 → Console."
            );

            return;
        }


        mapGameMenu.hidden =
            true;

        storyMap.hidden =
            false;

        window.gamePaused =
            false;


        document.body.classList.add(
            "game-active"
        );


        const menuButton =
            document.getElementById(
                "menu-button"
            );

        if (menuButton) {

            menuButton.hidden =
                false;
        }


        /*
            Ook wanneer je Story Mode opnieuw
            opent, start je bij het hoogste
            behaalde level.
        */

        respawnPlayer();


        if (
            !document.fullscreenElement
        ) {

            try {

                await document
                    .documentElement
                    .requestFullscreen();

            } catch {

                console.log(
                    "Fullscreen kon niet gestart worden."
                );
            }
        }


        resizeCanvas();

        startMapLoop();
    }
);


// ======================================================
// PLAYER MOVE
// ======================================================

function updatePlayer() {

    let moveX = 0;
    let moveY = 0;


    if (
        keys["w"] ||
        keys["arrowup"]
    ) {

        moveY -=
            player.speed;
    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {

        moveY +=
            player.speed;
    }


    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {

        moveX -=
            player.speed;
    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {

        moveX +=
            player.speed;
    }


    // X LOS CONTROLEREN

    if (moveX !== 0) {

        let newX =
            player.x +
            moveX;

        newX =
            Math.max(
                player.size / 2,
                Math.min(
                    WORLD_WIDTH -
                        player.size / 2,
                    newX
                )
            );

        if (
            !positionHasCollision(
                newX,
                player.y
            )
        ) {

            player.x =
                newX;
        }
    }


    // Y LOS CONTROLEREN

    if (moveY !== 0) {

        let newY =
            player.y +
            moveY;

        newY =
            Math.max(
                player.size / 2,
                Math.min(
                    WORLD_HEIGHT -
                        player.size / 2,
                    newY
                )
            );

        if (
            !positionHasCollision(
                player.x,
                newY
            )
        ) {

            player.y =
                newY;
        }
    }


    checkDangerousTile();
}


// ======================================================
// CAMERA
// ======================================================

function updateCamera() {

    camera.x =
        player.x -
        canvas.width / 2;

    camera.y =
        player.y -
        canvas.height / 2;


    camera.x =
        Math.max(
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


    camera.y =
        Math.max(
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


// ======================================================
// TILE TEKENEN
// ======================================================

function drawTile(
    rawGid,
    worldX,
    worldY
) {

    const result =
        getTilesetForGid(
            rawGid
        );

    if (!result) {
        return;
    }

    const tileset =
        result.tileset;

    const localTileId =
        result.gid -
        tileset.firstgid;

    const column =
        localTileId %
        tileset.columns;

    const row =
        Math.floor(
            localTileId /
            tileset.columns
        );

    const sourceX =
        tileset.margin +
        column *
        (
            tileset.tileWidth +
            tileset.spacing
        );

    const sourceY =
        tileset.margin +
        row *
        (
            tileset.tileHeight +
            tileset.spacing
        );


    ctx.drawImage(

        tileset.image,

        sourceX,
        sourceY,

        tileset.tileWidth,
        tileset.tileHeight,

        worldX,
        worldY,

        TILE_WIDTH,
        TILE_HEIGHT
    );
}


// ======================================================
// MAP TEKENEN
// ======================================================

function drawTiledMap() {

    const startColumn =
        Math.max(
            0,
            Math.floor(
                camera.x /
                TILE_WIDTH
            ) - 1
        );

    const endColumn =
        Math.min(
            tiledMap.width - 1,
            Math.ceil(
                (
                    camera.x +
                    canvas.width
                ) /
                TILE_WIDTH
            ) + 1
        );

    const startRow =
        Math.max(
            0,
            Math.floor(
                camera.y /
                TILE_HEIGHT
            ) - 1
        );

    const endRow =
        Math.min(
            tiledMap.height - 1,
            Math.ceil(
                (
                    camera.y +
                    canvas.height
                ) /
                TILE_HEIGHT
            ) + 1
        );


    for (
        const layer
        of tiledMap.layers
    ) {

        if (
            layer.type !==
                "tilelayer" ||
            !layer.visible
        ) {

            continue;
        }

        for (
            let row = startRow;
            row <= endRow;
            row++
        ) {

            for (
                let column =
                    startColumn;

                column <=
                    endColumn;

                column++
            ) {

                const index =
                    row *
                    layer.width +
                    column;

                const gid =
                    layer.data[index];

                if (!gid) {
                    continue;
                }

                drawTile(

                    gid,

                    column *
                        TILE_WIDTH,

                    row *
                        TILE_HEIGHT
                );
            }
        }
    }
}


// ======================================================
// LEVEL THEME
// ======================================================

function getLevelTheme(
    levelNumber
) {

    if (levelNumber <= 10) {

        return {
            tileset:
                "sand.tsx",
            fallback:
                "#d4bb79"
        };
    }

    if (levelNumber <= 20) {

        return {
            tileset:
                "grass.tsx",
            fallback:
                "#72a954"
        };
    }

    if (levelNumber <= 30) {

        return {
            tileset:
                "mountain.tsx",
            fallback:
                "#777777"
        };
    }

    if (levelNumber <= 40) {

        return {
            tileset:
                "snow.tsx",
            fallback:
                "#dce8ed"
        };
    }

    return {
        tileset:
            "lava.tsx",
        fallback:
            "#9b3827"
    };
}


function findTilesetByName(
    name
) {

    return tilesets.find(
        tileset =>
            getTilesetName(
                tileset
            ) ===
            name
    );
}


// ======================================================
// STAR PATH
// ======================================================

function createStarPath(
    x,
    y,
    outerRadius,
    innerRadius
) {

    ctx.beginPath();

    const points = 10;

    for (
        let i = 0;
        i < points;
        i++
    ) {

        const radius =
            i % 2 === 0
                ? outerRadius
                : innerRadius;

        const angle =
            -Math.PI / 2 +
            (
                i *
                Math.PI /
                5
            );

        const px =
            x +
            Math.cos(angle) *
            radius;

        const py =
            y +
            Math.sin(angle) *
            radius;

        if (i === 0) {

            ctx.moveTo(
                px,
                py
            );

        } else {

            ctx.lineTo(
                px,
                py
            );
        }
    }

    ctx.closePath();
}


// ======================================================
// TEXTURE IN LEVEL MARKER
// ======================================================

function drawMarkerTexture(
    levelNumber,
    x,
    y,
    radius,
    boss
) {

    const theme =
        getLevelTheme(
            levelNumber
        );

    const tileset =
        findTilesetByName(
            theme.tileset
        );


    ctx.save();


    if (boss) {

        createStarPath(
            x,
            y,
            radius,
            radius * 0.53
        );

    } else {

        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );
    }

    ctx.clip();


    // BASISKLEUR

    ctx.fillStyle =
        theme.fallback;

    ctx.fillRect(
        x - radius,
        y - radius,
        radius * 2,
        radius * 2
    );


    /*
        Gebruik daadwerkelijk de PNG
        uit de bijbehorende tileset.
    */

    if (
        tileset &&
        tileset.image.complete
    ) {

        const sourceX =
            tileset.margin;

        const sourceY =
            tileset.margin;

        const tileSize = 32;


        for (
            let py =
                y - radius;

            py <
                y + radius;

            py +=
                tileSize
        ) {

            for (
                let px =
                    x - radius;

                px <
                    x + radius;

                px +=
                    tileSize
            ) {

                ctx.drawImage(

                    tileset.image,

                    sourceX,
                    sourceY,

                    tileset.tileWidth,
                    tileset.tileHeight,

                    px,
                    py,

                    tileSize,
                    tileSize
                );
            }
        }
    }


    // BOSS DONKERDER

    if (boss) {

        ctx.fillStyle =
            "rgba(0,0,0,0.30)";

        ctx.fillRect(
            x - radius,
            y - radius,
            radius * 2,
            radius * 2
        );
    }


    ctx.restore();
}


// ======================================================
// LEVEL MARKERS
// ======================================================

function drawLevelMarkers() {

    const activeLevel =
        getPlayerLevel();

    for (
        const [
            levelNumber,
            position
        ]
        of levelPoints
    ) {

        const boss =
            bossLevels.has(
                levelNumber
            );

        const radius =
            boss
                ? BOSS_RADIUS
                : LEVEL_RADIUS;


        drawMarkerTexture(
            levelNumber,
            position.x,
            position.y,
            radius,
            boss
        );


        // RAND

        if (boss) {

            createStarPath(
                position.x,
                position.y,
                radius,
                radius * 0.53
            );

        } else {

            ctx.beginPath();

            ctx.arc(
                position.x,
                position.y,
                radius,
                0,
                Math.PI * 2
            );
        }


        const active =
            activeLevel &&
            activeLevel.levelNumber ===
                levelNumber;


        ctx.strokeStyle =
            active
                ? "white"
                : "rgba(0,0,0,0.65)";

        ctx.lineWidth =
            active
                ? 6
                : 4;

        ctx.stroke();


        // LEVELNUMMER

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            boss
                ? "bold 24px Arial"
                : "bold 22px Arial";

        ctx.lineWidth = 5;

        ctx.strokeStyle =
            "rgba(0,0,0,0.80)";

        ctx.strokeText(
            String(
                levelNumber
            ),
            position.x,
            position.y
        );

        ctx.fillStyle =
            "white";

        ctx.fillText(
            String(
                levelNumber
            ),
            position.x,
            position.y
        );
    }
}


// ======================================================
// PLAYER DRAW
// ======================================================

function drawPlayer() {

    ctx.fillStyle =
        "blue";

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.size / 2,
        0,
        Math.PI * 2
    );

    ctx.fill();
}


// ======================================================
// HUD
// ======================================================

function drawHud() {

    const activeLevel =
        getPlayerLevel();


    if (activeLevel) {

        const levelNumber =
            activeLevel.levelNumber;

        const boss =
            bossLevels.has(
                levelNumber
            );


        ctx.fillStyle =
            "rgba(0,0,0,0.72)";

        ctx.fillRect(
            canvas.width / 2 -
                190,
            canvas.height -
                135,
            380,
            92
        );


        ctx.textAlign =
            "center";

        ctx.fillStyle =
            "white";

        ctx.font =
            "bold 24px Arial";

        ctx.fillText(
            boss
                ? "BOSS LEVEL " +
                    levelNumber
                : "LEVEL " +
                    levelNumber,
            canvas.width / 2,
            canvas.height -
                100
        );


        ctx.font =
            "18px Arial";

        ctx.fillText(
            "Press ENTER to play",
            canvas.width / 2,
            canvas.height -
                68
        );
    }


    if (
        noticeText &&
        performance.now() <
            noticeUntil
    ) {

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";

        ctx.fillRect(
            canvas.width / 2 -
                240,
            35,
            480,
            55
        );

        ctx.fillStyle =
            "white";

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "18px Arial";

        ctx.fillText(
            noticeText,
            canvas.width / 2,
            62
        );

    } else {

        noticeText = "";
    }
}


// ======================================================
// DRAW WORLD
// ======================================================

function drawWorld() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.save();


    ctx.translate(
        -camera.x,
        -camera.y
    );


    drawTiledMap();

    drawLevelMarkers();

    drawPlayer();


    ctx.restore();


    drawHud();
}


// ======================================================
// LOOP
// ======================================================

let mapLoopRunning =
    false;


function startMapLoop() {

    if (mapLoopRunning) {
        return;
    }

    mapLoopRunning =
        true;

    requestAnimationFrame(
        gameLoop
    );
}


function gameLoop() {

    if (storyMap.hidden) {

        mapLoopRunning =
            false;

        return;
    }


    if (!window.gamePaused) {

        updatePlayer();
    }


    updateCamera();

    drawWorld();


    requestAnimationFrame(
        gameLoop
    );
}