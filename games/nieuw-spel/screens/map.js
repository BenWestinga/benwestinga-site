const storyButton =
    document.getElementById(
        "story-button"
    );

const mapGameMenu =
    document.getElementById(
        "game-menu"
    );

const storyMap =
    document.getElementById(
        "story-map"
    );

const canvas =
    document.getElementById(
        "map-canvas"
    );

const ctx =
    canvas.getContext(
        "2d"
    );

// ======================================================
// WIND / FOG
// ======================================================

const windImage =
    new Image();

let windImageLoaded =
    false;

windImage.onload =
    () => {

        windImageLoaded =
            true;

    };

windImage.onerror =
    () => {

        console.error(
            "wind.png could not be loaded."
        );

    };

windImage.src =
    new URL(
        "wind.png",
        window.location.href
    ).href;


// Offscreen canvas waarop de wind wordt getekend.
// Hierdoor kunnen reveal-zones elkaar veilig overlappen.

const windOverlayCanvas =
    document.createElement(
        "canvas"
    );

const windOverlayCtx =
    windOverlayCanvas.getContext(
        "2d"
    );


let WIND_REVEAL_RADIUS =
    450;

const WIND_MIN_EDGE_FACTOR =
    0.91;

// ======================================================
// CANVAS
// ======================================================

function resizeCanvas() {

    canvas.width =
        window.innerWidth;

    canvas.height =
        window.innerHeight;


    windOverlayCanvas.width =
        canvas.width;

    windOverlayCanvas.height =
        canvas.height;
}

resizeCanvas();


window.addEventListener(
    "resize",
    resizeCanvas
);


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

const levelPoints =
    new Map();


let spawnPoint = {

    x: 350,
    y: 1768

};


const LEVEL_RADIUS = 43;

const BOSS_RADIUS = 52;

const LEVEL_INTERACT_RADIUS = 72;


const bossLevels =
    new Set([

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


let levelLaunchBusy =
    false;


// ======================================================
// DEATH / MESSAGE
// ======================================================

let hazardGraceUntil = 0;

let noticeText = "";

let noticeUntil = 0;


function showNotice(
    text,
    duration = 2200
) {

    noticeText =
        text;


    noticeUntil =
        performance.now() +
        duration;

}


// ======================================================
// PROPERTY VALUE
// ======================================================

function convertPropertyValue(
    value,
    type
) {

    if (
        type === "bool"
    ) {

        return value ===
            "true";
    }


    if (
        type === "int" ||
        type === "float"
    ) {

        return Number(
            value
        );
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
        await fetch(
            tsxUrl
        );


    if (
        !response.ok
    ) {

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
        xml.querySelector(
            "tileset"
        );


    if (
        !tilesetElement
    ) {

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


    if (
        !imageElement
    ) {

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

        (
            resolve,
            reject
        ) => {

            image.onload =
                resolve;


            image.onerror =
                () => {

                    reject(

                        new Error(

                            "PNG niet geladen: " +
                            imageUrl.href

                        )

                    );

                };

        }

    );


    // ==================================================
    // TILE PROPERTIES
    // ==================================================

    const tileProperties =
        new Map();


    const tileElements =
        tilesetElement
            .querySelectorAll(
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
            tileElement
                .querySelectorAll(
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


            if (
                value === null
            ) {

                value =
                    propertyElement.textContent;

            }


            properties[
                name
            ] =
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

                layer.name
                    .toLowerCase() ===
                    "levels"

        );


    if (
        !levelLayer
    ) {

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


        if (
            name ===
                "spawnpoint" ||
            name ===
                "spawn"
        ) {

            spawnPoint = {

                x: object.x,
                y: object.y

            };


            continue;

        }


        const levelNumber =
            Number(
                object.name
            );


        if (

            Number.isInteger(
                levelNumber
            ) &&

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

    recalculateWindRevealRadius();

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
// WIND REVEAL SYSTEM
// ======================================================

function recalculateWindRevealRadius() {

    let maximumDistance =
        0;


    let previousPoint =
        spawnPoint;


    // Spawn -> Level 1
    // Level 1 -> Level 2
    // ...
    // Level 48 -> Level 49
    //
    // Na Level 49 verdwijnt alle wind.

    for (
        let levelNumber = 1;
        levelNumber <= 49;
        levelNumber++
    ) {

        const point =
            levelPoints.get(
                levelNumber
            );


        if (!point) {

            continue;

        }


        const distance =
            Math.hypot(

                point.x -
                    previousPoint.x,

                point.y -
                    previousPoint.y

            );


        maximumDistance =
            Math.max(

                maximumDistance,
                distance

            );


        previousPoint =
            point;

    }


    // Extra ruimte zorgt ervoor dat ook
    // de hele level-marker zichtbaar blijft.
    //
    // Delen door 0.91 compenseert voor
    // de naar binnen lopende spikes.

    WIND_REVEAL_RADIUS =
        Math.max(

            360,

            (
                maximumDistance +
                BOSS_RADIUS +
                90
            ) /
            WIND_MIN_EDGE_FACTOR

        );


    console.log(
        "Wind reveal radius:",
        Math.round(
            WIND_REVEAL_RADIUS
        )
    );

}


// ======================================================
// ALLE WIND WEG NA LEVEL 49
// ======================================================

function isWindFullyCleared() {

    return (

        window.StoryProgress &&

        StoryProgress
            .isLevelCompleted(
                49
            )

    );

}


// ======================================================
// REVEAL CENTERS
// ======================================================

function getWindRevealCenters() {

    const centers = [

        {
            x: spawnPoint.x,
            y: spawnPoint.y
        }

    ];


    if (
        !window.StoryProgress
    ) {

        return centers;

    }


    for (
        let levelNumber = 1;
        levelNumber <= 48;
        levelNumber++
    ) {

        if (
            !StoryProgress
                .isLevelCompleted(
                    levelNumber
                )
        ) {

            continue;

        }


        const point =
            levelPoints.get(
                levelNumber
            );


        if (point) {

            centers.push({

                x: point.x,
                y: point.y

            });

        }

    }


    return centers;

}


// ======================================================
// NATUURLIJKE, LICHT SPIKY RAND
// ======================================================

function getWindEdgeFactor(
    center,
    angle
) {

    const seed =

        center.x *
            0.013 +

        center.y *
            0.017;


    return (

        1 +

        Math.sin(
            angle * 7 +
            seed
        ) *
            0.045 +

        Math.sin(
            angle * 13 +
            seed * 1.7
        ) *
            0.030 +

        Math.sin(
            angle * 19 +
            seed * 0.6
        ) *
            0.015

    );

}


// ======================================================
// IS DIT PUNT VRIJ VAN WIND?
// ======================================================

function isPointRevealedByWind(
    x,
    y
) {

    if (
        isWindFullyCleared()
    ) {

        return true;

    }


    const centers =
        getWindRevealCenters();


    for (
        const center
        of centers
    ) {

        const dx =
            x -
            center.x;


        const dy =
            y -
            center.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        const angle =
            Math.atan2(
                dy,
                dx
            );


        const edgeRadius =

            WIND_REVEAL_RADIUS *

            getWindEdgeFactor(
                center,
                angle
            );


        if (
            distance <=
            edgeRadius
        ) {

            return true;

        }

    }


    return false;

}


// ======================================================
// HELE SPELER MOET BUITEN DE WIND ZIJN
// ======================================================

function positionInsideRevealedWindArea(
    x,
    y
) {

    if (
        isWindFullyCleared()
    ) {

        return true;

    }


    const half =
        player.size / 2 -
        2;


    const points = [

        {
            x,
            y
        },

        {
            x: x - half,
            y: y - half
        },

        {
            x: x + half,
            y: y - half
        },

        {
            x: x - half,
            y: y + half
        },

        {
            x: x + half,
            y: y + half
        }

    ];


    return points.every(

        point =>

            isPointRevealedByWind(

                point.x,
                point.y

            )

    );

}


// ======================================================
// SPIKY REVEAL PATH TEKENEN
// ======================================================

function createWindRevealPath(
    context,
    center
) {

    const pointCount =
        72;


    context.beginPath();


    for (
        let i = 0;
        i < pointCount;
        i++
    ) {

        const angle =

            (
                i /
                pointCount
            ) *

            Math.PI *
            2;


        const radius =

            WIND_REVEAL_RADIUS *

            getWindEdgeFactor(
                center,
                angle
            );


        const screenX =

            center.x -
            camera.x +

            Math.cos(
                angle
            ) *
            radius;


        const screenY =

            center.y -
            camera.y +

            Math.sin(
                angle
            ) *
            radius;


        if (
            i === 0
        ) {

            context.moveTo(
                screenX,
                screenY
            );

        } else {

            context.lineTo(
                screenX,
                screenY
            );

        }

    }


    context.closePath();

}


// ======================================================
// WIND TEKENEN
// ======================================================

function drawWindOverlay() {

    if (
        isWindFullyCleared()
    ) {

        return;

    }


    const windCtx =
        windOverlayCtx;


    windCtx.clearRect(

        0,
        0,

        windOverlayCanvas.width,
        windOverlayCanvas.height

    );


    // Witte basis zodat onbekend gebied
    // echt nauwelijks zichtbaar is.

    windCtx.fillStyle =
        "rgba(245, 248, 252, 0.94)";


    windCtx.fillRect(

        0,
        0,

        windOverlayCanvas.width,
        windOverlayCanvas.height

    );


    // ==================================================
    // BEWEGENDE WIND.PNG
    // ==================================================

    if (
        windImageLoaded
    ) {

        const tileWidth =
            440;


        const tileHeight =

            tileWidth *

            (
                windImage.height /
                windImage.width
            );


        const time =
            performance.now();


        const offsetX =

            (
                time *
                0.018
            ) %
            tileWidth;


        const offsetY =

            (
                time *
                0.007
            ) %
            tileHeight;


        windCtx.save();


        windCtx.globalAlpha =
            0.72;


        for (

            let y =
                -tileHeight -
                offsetY;

            y <
                canvas.height +
                tileHeight;

            y +=
                tileHeight

        ) {

            for (

                let x =
                    -tileWidth +
                    offsetX;

                x <
                    canvas.width +
                    tileWidth;

                x +=
                    tileWidth

            ) {

                windCtx.drawImage(

                    windImage,

                    x,
                    y,

                    tileWidth,
                    tileHeight

                );

            }

        }


        windCtx.restore();

    }


    // ==================================================
    // GATEN UIT WIND SNIJDEN
    // ==================================================

    windCtx.save();


    windCtx.globalCompositeOperation =
        "destination-out";


    for (
        const center
        of getWindRevealCenters()
    ) {

        createWindRevealPath(

            windCtx,
            center

        );


        windCtx.fillStyle =
            "black";


        windCtx.fill();

    }


    windCtx.restore();


    // ==================================================
    // OVER MAP TEKENEN
    // ==================================================

    ctx.drawImage(

        windOverlayCanvas,

        0,
        0

    );

}

// ======================================================
// MAP LADEN
// ======================================================

async function loadTiledMap() {

    if (
        mapLoaded
    ) {

        return;
    }


    if (
        mapLoadingPromise
    ) {

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
                await fetch(
                    mapUrl
                );


            if (
                !response.ok
            ) {

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


            mapLoaded =
                true;


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

function cleanGid(
    rawGid
) {

    return (

        rawGid &
        0x1FFFFFFF

    );

}


function getTilesetForGid(
    rawGid
) {

    const gid =
        cleanGid(
            rawGid
        );


    if (
        gid === 0
    ) {

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

        .replaceAll(
            "\\",
            "/"
        )

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


    if (
        !result
    ) {

        return {};
    }


    const localTileId =
        result.gid -
        result.tileset.firstgid;


    return (

        result.tileset
            .tileProperties
            .get(
                localTileId
            )

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


    if (
        !tiledMap
    ) {

        return gids;
    }


    if (

        tileX < 0 ||
        tileY < 0 ||

        tileX >=
            tiledMap.width ||

        tileY >=
            tiledMap.height

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
            layer.data[
                index
            ];


        if (
            gid
        ) {

            gids.push(
                gid
            );

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
            x /
            TILE_WIDTH
        );


    const tileY =
        Math.floor(
            y /
            TILE_HEIGHT
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


        if (
            !result
        ) {

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


        const properties =
            getPropertiesForGid(
                gid
            );


        if (

            properties.collision ===
                true ||

            properties.colission ===
                true

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
            x /
            TILE_WIDTH
        );


    const tileY =
        Math.floor(
            y /
            TILE_HEIGHT
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


        if (
            !result
        ) {

            continue;
        }


        const source =
            getTilesetName(
                result.tileset
            );


        // HELE WATER TILESET IS DODELIJK

        if (
            source ===
            "water.tsx"
        ) {

            return "water";

        }


        // HELE LAVA TILESET IS DODELIJK
        // lavapath.tsx NIET

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
            properties.water ===
            true
        ) {

            return "water";

        }


        if (
            properties.deadly ===
            true
        ) {

            return "lava";

        }

    }


    return null;

}


// ======================================================
// DANGEROUS TILE CHECK
// ======================================================

function checkDangerousTile() {

    if (

        performance.now() <
        hazardGraceUntil

    ) {

        return;

    }


    const offset =
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
                offset,

            y:
                player.y -
                offset

        },

        {

            x:
                player.x +
                offset,

            y:
                player.y -
                offset

        },

        {

            x:
                player.x -
                offset,

            y:
                player.y +
                offset

        },

        {

            x:
                player.x +
                offset,

            y:
                player.y +
                offset

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


        if (
            danger
        ) {

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

    const highestCompletedLevel =
        StoryProgress
            .getHighestCompletedLevel();


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


    // Voorkomt dat hij onmiddellijk
    // opnieuw doodgaat als de spawn
    // vlak langs water/lava ligt.

    hazardGraceUntil =
        performance.now() +
        1000;


    for (
        const key
        in keys
    ) {

        keys[
            key
        ] =
            false;

    }


    updateCamera();

}


// ======================================================
// PLAYER DEAD
// ======================================================

function killPlayer(
    cause
) {

    if (
        cause ===
        "water"
    ) {

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
    function(
        levelNumber
    ) {

        const result =
            StoryProgress
                .completeLevel(
                    levelNumber
                );


        if (
            !result ||
            !result.success
        ) {

            if (
                result &&
                result.reason ===
                    "locked"
            ) {

                showNotice(
                    "Dit level is nog niet unlocked."
                );

            }


            return result;

        }


        // REPLAY

        if (
            !result.firstTime
        ) {

            showNotice(

                "Level " +
                levelNumber +
                " opnieuw gehaald. Geen extra boekje.",

                3000

            );


            return result;

        }


        // EERSTE KEER

        let message =

            "Level " +
            levelNumber +
            " gehaald! +1 boekje";


        if (
            result.weaponUnlocked
        ) {

            message +=

                " | " +
                result.weaponUnlocked.name +
                " unlocked!";

        }


        showNotice(

            message,

            4500

        );


        return result;

    };


// ======================================================
// RESET VOOR TESTEN
// ======================================================

window.resetStoryProgress =
    function() {

        StoryProgress.reset();

        respawnPlayer();

        showNotice(
            "Story progress gereset."
        );

    };


// ======================================================
// LEVEL BIJ SPELER
// ======================================================

function getPlayerLevel() {

    let closest =
        null;


    let closestDistance =
        Infinity;


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

    if (
        levelLaunchBusy
    ) {

        return;

    }


    // ==================================================
    // LOCK CHECK
    // ==================================================

    if (

        !StoryProgress
            .isLevelUnlocked(
                levelNumber
            )

    ) {

        showNotice(

            "Haal eerst Level " +
            (
                levelNumber -
                1
            ) +
            "."

        );


        return;

    }


    levelLaunchBusy =
        true;


    const fileName =

        "level-" +

        String(
            levelNumber
        ).padStart(
            2,
            "0"
        )

        + ".js";


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


                selectedWeapon:
                    StoryProgress
                        .getSelectedWeapon(),


                combatModifiers:
                    StoryProgress
                        .getCombatModifiers(),


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


    } finally {

        levelLaunchBusy =
            false;

    }

}


// ======================================================
// KEYBOARD
// ======================================================

document.addEventListener(

    "keydown",

    event => {


        const key =
            event.key.toLowerCase();


        keys[
            key
        ] =
            true;


        if (

            [
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright"
            ].includes(
                key
            )

        ) {

            event.preventDefault();

        }


        if (

            event.key ===
                "Enter" &&

            !event.repeat &&

            !storyMap.hidden &&

            !window.gamePaused

        ) {

            const level =
                getPlayerLevel();


            if (
                level
            ) {

                keys[
                    "enter"
                ] =
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
        ] =
            false;

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

            console.error(
                error
            );


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


        document.body
            .classList.add(
                "game-active"
            );


        const menuButton =
            document.getElementById(
                "menu-button"
            );


        if (
            menuButton
        ) {

            menuButton.hidden =
                false;

        }


        // START BIJ HOOGSTE GEHAALDE LEVEL.
        // NIETS GEHAALD = SPAWNPOINT.

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


    // ==================================================
    // X
    // ==================================================

    if (
        moveX !== 0
    ) {

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

        ) &&

        positionInsideRevealedWindArea(

            newX,
            player.y

        )

    ) {

        player.x =
            newX;

    }


    // ==================================================
    // Y
    // ==================================================

    if (
        moveY !== 0
    ) {

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

        ) &&

        positionInsideRevealedWindArea(

            player.x,
            newY

        )

    ) {

        player.y =
            newY;

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


    if (
        !result
    ) {

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

            let row =
                startRow;

            row <=
                endRow;

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
                    layer.data[
                        index
                    ];


                if (
                    !gid
                ) {

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

    if (
        levelNumber <= 10
    ) {

        return {

            tileset:
                "sand.tsx",

            fallback:
                "#d4bb79"

        };

    }


    if (
        levelNumber <= 20
    ) {

        return {

            tileset:
                "grass.tsx",

            fallback:
                "#72a954"

        };

    }


    if (
        levelNumber <= 30
    ) {

        return {

            tileset:
                "mountain.tsx",

            fallback:
                "#777777"

        };

    }


    if (
        levelNumber <= 40
    ) {

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
// STAR
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

            Math.cos(
                angle
            ) *

            radius;


        const py =

            y +

            Math.sin(
                angle
            ) *

            radius;


        if (
            i === 0
        ) {

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
// MARKER TEXTURE
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


    if (
        boss
    ) {

        createStarPath(

            x,
            y,

            radius,

            radius *
            0.53

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


    ctx.fillStyle =
        theme.fallback;


    ctx.fillRect(

        x - radius,
        y - radius,

        radius * 2,
        radius * 2

    );


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

    if (
        boss
    ) {

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


        const unlocked =
            StoryProgress
                .isLevelUnlocked(
                    levelNumber
                );


        const completed =
            StoryProgress
                .isLevelCompleted(
                    levelNumber
                );


        const radius =

            boss

                ? BOSS_RADIUS

                : LEVEL_RADIUS;


        // NORMALE TEXTURE

        drawMarkerTexture(

            levelNumber,

            position.x,
            position.y,

            radius,

            boss

        );


        // ==================================================
        // LOCKED = DONKERE LAAG
        // ==================================================

        if (
            !unlocked
        ) {

            ctx.save();


            ctx.fillStyle =
                "rgba(0,0,0,0.70)";


            if (
                boss
            ) {

                createStarPath(

                    position.x,
                    position.y,

                    radius,

                    radius *
                    0.53

                );


                ctx.fill();

            } else {

                ctx.beginPath();


                ctx.arc(

                    position.x,
                    position.y,

                    radius,

                    0,

                    Math.PI * 2

                );


                ctx.fill();

            }


            ctx.restore();

        }


        // ==================================================
        // RAND
        // ==================================================

        if (
            boss
        ) {

            createStarPath(

                position.x,
                position.y,

                radius,

                radius *
                0.53

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


        // ==================================================
        // LEVELNUMMER
        // ==================================================

        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.font =

            boss

                ? "bold 24px Arial"

                : "bold 22px Arial";


        ctx.lineWidth =
            5;


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
            unlocked
                ? "white"
                : "#aaaaaa";


        ctx.fillText(

            String(
                levelNumber
            ),

            position.x,
            position.y

        );


        // ==================================================
        // COMPLETED CHECKMARK
        // ==================================================

        if (
            completed
        ) {

            ctx.font =
                "bold 20px Arial";


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "rgba(0,0,0,0.9)";


            ctx.strokeText(

                "✓",

                position.x +
                    radius *
                    0.65,

                position.y -
                    radius *
                    0.65

            );


            ctx.fillStyle =
                "white";


            ctx.fillText(

                "✓",

                position.x +
                    radius *
                    0.65,

                position.y -
                    radius *
                    0.65

            );

        }

    }

}


// ======================================================
// PLAYER
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


    if (
        activeLevel
    ) {

        const levelNumber =
            activeLevel.levelNumber;


        const boss =
            bossLevels.has(
                levelNumber
            );


        const unlocked =
            StoryProgress
                .isLevelUnlocked(
                    levelNumber
                );


        const completed =
            StoryProgress
                .isLevelCompleted(
                    levelNumber
                );


        ctx.fillStyle =
            "rgba(0,0,0,0.72)";


        ctx.fillRect(

            canvas.width / 2 -
            210,

            canvas.height -
            145,

            420,
            102

        );


        ctx.textAlign =
            "center";


        ctx.textBaseline =
            "middle";


        ctx.fillStyle =
            "white";


        ctx.font =
            "bold 24px Arial";


        let title =

            boss

                ? "BOSS LEVEL " +
                    levelNumber

                : "LEVEL " +
                    levelNumber;


        if (
            completed
        ) {

            title +=
                " ✓";

        }


        ctx.fillText(

            title,

            canvas.width / 2,

            canvas.height -
            110

        );


        ctx.font =
            "18px Arial";


        if (
            unlocked
        ) {

            ctx.fillText(

                "Press ENTER to play",

                canvas.width / 2,

                canvas.height -
                74

            );

        } else {

            ctx.fillText(

                "LOCKED - Complete Level " +
                (
                    levelNumber -
                    1
                ),

                canvas.width / 2,

                canvas.height -
                74

            );

        }

    }


    // ==================================================
    // NOTICE
    // ==================================================

    if (

        noticeText &&

        performance.now() <
        noticeUntil

    ) {

        ctx.fillStyle =
            "rgba(0,0,0,0.78)";


        ctx.fillRect(

            canvas.width / 2 -
            260,

            35,

            520,

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

        noticeText =
            "";

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


    // ==================================================
    // MAP + LEVEL MARKERS
    // ==================================================

    ctx.save();


    ctx.translate(

        -camera.x,
        -camera.y

    );


    drawTiledMap();


    drawLevelMarkers();


    ctx.restore();


    // ==================================================
    // WIND BOVEN DE WERELD
    // ==================================================

    drawWindOverlay();


    // ==================================================
    // PLAYER BOVEN WIND
    // ==================================================

    ctx.save();


    ctx.translate(

        -camera.x,
        -camera.y

    );


    drawPlayer();


    ctx.restore();


    // ==================================================
    // HUD
    // ==================================================

    drawHud();

}


// ======================================================
// LOOP
// ======================================================

let mapLoopRunning =
    false;


function startMapLoop() {

    if (
        mapLoopRunning
    ) {

        return;
    }


    mapLoopRunning =
        true;


    requestAnimationFrame(
        gameLoop
    );

}


function gameLoop() {

    if (
        storyMap.hidden
    ) {

        mapLoopRunning =
            false;


        return;

    }


    if (
        !window.gamePaused
    ) {

        updatePlayer();

    }


    updateCamera();


    drawWorld();


    requestAnimationFrame(
        gameLoop
    );

}