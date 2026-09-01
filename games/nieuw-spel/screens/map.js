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


// ==========================================
// CANVAS
// ==========================================

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener(
    "resize",
    resizeCanvas
);


// ==========================================
// TILED MAP
// ==========================================

let tiledMap = null;

let TILE_WIDTH = 32;
let TILE_HEIGHT = 32;

let WORLD_WIDTH = 3200;
let WORLD_HEIGHT = 3200;

let tilesets = [];

let mapLoaded = false;

let mapLoadingPromise = null;


// ==========================================
// MAP PLAYER
// ==========================================

const player = {
    x: 500,
    y: 500,

    size: 26,

    speed: 4,

    spawnX: 500,
    spawnY: 500
};


// ==========================================
// CAMERA
// ==========================================

const camera = {
    x: 0,
    y: 0
};


// ==========================================
// LEVEL 1 LOCATION
// ==========================================

const level1 = {
    x: 900,
    y: 500,
    radius: 70
};


// ==========================================
// KEYS
// ==========================================

const keys = {};


// ==========================================
// TILED PROPERTY OMZETTEN
// ==========================================

function convertPropertyValue(
    value,
    type
) {

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


// ==========================================
// TILESET LADEN
// ==========================================

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
            `Tileset kon niet geladen worden: ${tsxUrl}`
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
            `Ongeldige TSX: ${tilesetReference.source}`
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
            ":scope > image"
        );


    if (!imageElement) {

        throw new Error(
            `Geen afbeelding gevonden in ${tilesetReference.source}`
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
                () => reject(
                    new Error(
                        `Afbeelding kon niet geladen worden: ${imageUrl}`
                    )
                );
        }
    );


    // ======================================
    // PROPERTIES VAN TILES
    // ======================================

    const tileProperties =
        new Map();


    const tileElements =
        tilesetElement.querySelectorAll(
            ":scope > tile"
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
                ":scope > properties > property"
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


// ==========================================
// HELE MAP LADEN
// ==========================================

async function loadTiledMap() {

    if (mapLoaded) {
        return;
    }


    if (mapLoadingPromise) {
        return mapLoadingPromise;
    }


    mapLoadingPromise =
        (async () => {

            try {

                /*
                    spelmap.json moet in dezelfde
                    map staan als de HTML-pagina
                    van je game.

                    Bijvoorbeeld:

                    nieuw-spel/
                    ├── index.html
                    ├── spelmap.json
                    ├── grass.tsx
                    ├── water.tsx
                    ├── lava.tsx
                    └── ...
                */

                const mapUrl =
                    new URL(
                        "spelmap.json",
                        window.location.href
                    );


                const response =
                    await fetch(
                        mapUrl
                    );


                if (!response.ok) {

                    throw new Error(
                        "spelmap.json kon niet worden geladen."
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
                    const tilesetReference
                    of tiledMap.tilesets
                ) {

                    const loadedTileset =
                        await loadTileset(
                            tilesetReference,
                            mapUrl
                        );


                    tilesets.push(
                        loadedTileset
                    );
                }


                // Sorteer voor GID lookup
                tilesets.sort(
                    (a, b) =>
                        a.firstgid -
                        b.firstgid
                );


                mapLoaded = true;


                console.log(
                    "Tiled map geladen."
                );

                console.log(
                    "Wereld:",
                    WORLD_WIDTH,
                    "x",
                    WORLD_HEIGHT
                );

            } catch (error) {

                console.error(
                    "Fout bij laden map:",
                    error
                );


                alert(
                    "De Tiled-map kon niet geladen worden. Open F12 → Console om de fout te bekijken."
                );


                throw error;
            }
        })();


    return mapLoadingPromise;
}


// ==========================================
// TILESET VINDEN VOOR GID
// ==========================================

function getTilesetForGid(
    rawGid
) {

    /*
        Tiled gebruikt de bovenste bits
        soms voor flip-informatie.

        Hiermee verwijderen we die bits.
    */

    const gid =
        rawGid & 0x1FFFFFFF;


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
                tileset:
                    tilesets[i],

                gid
            };
        }
    }


    return null;
}


// ==========================================
// PROPERTY VAN EEN GID
// ==========================================

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


    const tileset =
        result.tileset;


    const localTileId =
        result.gid -
        tileset.firstgid;


    return (
        tileset.tileProperties.get(
            localTileId
        ) || {}
    );
}


// ==========================================
// GID OP EEN MAP-POSITIE
// ==========================================

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


// ==========================================
// PROPERTIES OP WERELD-POSITIE
// ==========================================

function getPropertiesAtPosition(
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


    const combinedProperties =
        {};


    for (
        const gid
        of gids
    ) {

        Object.assign(
            combinedProperties,
            getPropertiesForGid(
                gid
            )
        );
    }


    return combinedProperties;
}


// ==========================================
// COLLISION CONTROLEREN
// ==========================================

function positionHasCollision(
    x,
    y
) {

    const half =
        player.size / 2;


    /*
        We controleren meerdere punten
        rondom de speler.

        Daardoor kan de speler niet half
        door een rots of berg lopen.
    */

    const points = [

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


    for (
        const point
        of points
    ) {

        const properties =
            getPropertiesAtPosition(
                point.x,
                point.y
            );


        /*
            collision = juiste spelling.

            colission staat er ook bij
            voor het geval ergens in Tiled
            nog de oude spelfout staat.
        */

        if (
            properties.collision === true ||
            properties.colission === true
        ) {

            return true;
        }
    }


    return false;
}


// ==========================================
// WATER / LAVA CONTROLEREN
// ==========================================

function checkDangerousTile() {

    const properties =
        getPropertiesAtPosition(
            player.x,
            player.y
        );


    // LAVA
    if (
        properties.deadly === true
    ) {

        killPlayer(
            "lava"
        );

        return;
    }


    // WATER
    if (
        properties.water === true
    ) {

        killPlayer(
            "water"
        );
    }
}


// ==========================================
// SPELER DOOD + RESPAWN
// ==========================================

function killPlayer(
    cause
) {

    console.log(
        "Speler dood door:",
        cause
    );


    player.x =
        player.spawnX;

    player.y =
        player.spawnY;


    // Toetsen leegmaken zodat
    // je niet meteen opnieuw loopt.

    for (
        const key
        in keys
    ) {

        keys[key] = false;
    }
}


// ==========================================
// KEYBOARD
// ==========================================

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

            keys["enter"] =
                false;

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


// ==========================================
// START STORY MODE
// ==========================================

storyButton.addEventListener(
    "click",
    async () => {

        /*
            Eerst de echte Tiled-map laden.
        */

        await loadTiledMap();


        mapGameMenu.hidden =
            true;

        storyMap.hidden =
            false;


        window.gamePaused =
            false;


        document.body.classList.add(
            "game-active"
        );


        document
            .getElementById(
                "menu-button"
            )
            .hidden = false;


        // Fullscreen
        if (
            !document.fullscreenElement
        ) {

            try {

                await document
                    .documentElement
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


// ==========================================
// LEVEL CHECK
// ==========================================

function isPlayerOnLevel1() {

    const dx =
        player.x -
        level1.x;


    const dy =
        player.y -
        level1.y;


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


// ==========================================
// MOVE MAP PLAYER
// ==========================================

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


    // ======================================
    // X-BEWEGING
    // ======================================

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


    // ======================================
    // Y-BEWEGING
    // ======================================

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


    // Water/lava controleren
    checkDangerousTile();
}


// ==========================================
// CAMERA
// ==========================================

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


// ==========================================
// ÉÉN TILE TEKENEN
// ==========================================

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


// ==========================================
// TILED MAP TEKENEN
// ==========================================

function drawTiledMap() {

    if (!mapLoaded) {
        return;
    }


    /*
        Alleen tegels tekenen die ongeveer
        in beeld zijn.

        Dit is veel sneller dan iedere frame
        alle 10.000 tiles tekenen.
    */

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
                let column = startColumn;
                column <= endColumn;
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


// ==========================================
// DRAW WORLD
// ==========================================

function drawWorld() {

    // Achtergrond wissen
    ctx.clearRect(
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


    // ======================================
    // ECHTE TILED MAP
    // ======================================

    drawTiledMap();


    // ======================================
    // LEVEL 1
    // ======================================

    const onLevel =
        isPlayerOnLevel1();


    ctx.fillStyle =
        onLevel
            ? "rgba(40, 40, 40, 0.85)"
            : "rgba(80, 80, 80, 0.75)";


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
    ctx.fillStyle =
        "white";


    ctx.font =
        "bold 40px Arial";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(
        "1",
        level1.x,
        level1.y
    );


    // ======================================
    // MAP PLAYER
    // ======================================

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


    ctx.restore();


    // ======================================
    // LEVEL INFORMATION
    // ======================================

    if (onLevel) {

        ctx.fillStyle =
            "rgba(0, 0, 0, 0.65)";


        ctx.fillRect(
            canvas.width / 2 - 180,
            canvas.height - 130,
            360,
            90
        );


        ctx.fillStyle =
            "white";


        ctx.textAlign =
            "center";


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


// ==========================================
// MAP LOOP
// ==========================================

function gameLoop() {

    /*
        Stop wanneer we bijvoorbeeld
        een level ingaan.
    */

    if (storyMap.hidden) {
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