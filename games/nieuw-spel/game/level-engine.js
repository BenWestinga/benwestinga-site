(() => {

    const levelScreen =
        document.getElementById("level-screen");

    const canvas =
        document.getElementById("level-canvas");

    const ctx =
        canvas.getContext("2d");


    let animationFrame = null;
    let activeContext = null;

    let sandLoaded = false;

    const sandImage =
        new Image();

    sandImage.src =
        new URL(
            "sand.png",
            window.location.href
        ).href;

    sandImage.onload = () => {
        sandLoaded = true;
    };


    // ==========================================
    // GLOBALS
    // ==========================================

    window.levelActive = false;
    window.currentLevel = null;


    // ==========================================
    // RESIZE
    // ==========================================

    function resizeLevelCanvas() {

        canvas.width =
            window.innerWidth;

        canvas.height =
            window.innerHeight;
    }


    window.addEventListener(
        "resize",
        resizeLevelCanvas
    );


    // ==========================================
    // FULLSCREEN
    // ==========================================

    async function makeFullscreen() {

        if (
            document.fullscreenElement
        ) {
            return;
        }

        try {

            await document
                .documentElement
                .requestFullscreen();

        } catch (error) {

            console.log(
                "Fullscreen kon niet worden gestart.",
                error
            );
        }
    }


    // ==========================================
    // BACKGROUND
    // ==========================================

    function drawBackground() {

        ctx.fillStyle =
            "#d8c18b";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        if (sandLoaded) {

            ctx.save();

            /*
                Doorzichtige sand.png
                over het HELE scherm.
            */

            ctx.globalAlpha =
                0.58;

            ctx.drawImage(
                sandImage,
                0,
                0,
                canvas.width,
                canvas.height
            );

            ctx.restore();
        }
    }


    // ==========================================
    // BORDER
    // ==========================================

    function drawBorders() {

        const border = 14;


        // DONKERE BUITENRAND

        ctx.save();

        ctx.strokeStyle =
            "rgba(20, 20, 20, 0.95)";

        ctx.lineWidth =
            border;

        ctx.strokeRect(
            border / 2,
            border / 2,
            canvas.width - border,
            canvas.height - border
        );


        // LICHTE BINNENRAND

        ctx.strokeStyle =
            "rgba(255,255,255,0.85)";

        ctx.lineWidth =
            3;

        ctx.strokeRect(
            border,
            border,
            canvas.width - border * 2,
            canvas.height - border * 2
        );

        ctx.restore();
    }


    // ==========================================
    // MIDDENLIJN
    // ==========================================

    function drawCenterLine() {

        ctx.save();

        ctx.beginPath();

        ctx.moveTo(
            canvas.width / 2,
            14
        );

        ctx.lineTo(
            canvas.width / 2,
            canvas.height - 14
        );

        ctx.strokeStyle =
            "rgba(255,255,255,0.45)";

        ctx.lineWidth =
            4;

        ctx.setLineDash([
            18,
            18
        ]);

        ctx.stroke();

        ctx.restore();
    }


    // ==========================================
    // LEVEL TITEL
    // ==========================================

    function drawLevelTitle() {

        if (
            !window.currentLevel
        ) {
            return;
        }


        ctx.save();

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 28px Arial";

        ctx.lineWidth =
            6;

        ctx.strokeStyle =
            "rgba(0,0,0,0.75)";

        ctx.strokeText(
            "LEVEL " +
            window.currentLevel.number,
            canvas.width / 2,
            48
        );

        ctx.fillStyle =
            "white";

        ctx.fillText(
            "LEVEL " +
            window.currentLevel.number,
            canvas.width / 2,
            48
        );

        ctx.restore();
    }


    // ==========================================
    // DRAW
    // ==========================================

    function drawLevel() {

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        drawBackground();

        drawCenterLine();

        drawBorders();

        drawLevelTitle();
    }


    // ==========================================
    // LOOP
    // ==========================================

    function levelLoop() {

        if (
            !window.levelActive
        ) {

            animationFrame = null;
            return;
        }


        if (
            !window.gamePaused
        ) {

            /*
                Later komt hier algemene
                level gameplay.
            */

        }


        drawLevel();


        animationFrame =
            requestAnimationFrame(
                levelLoop
            );
    }


    // ==========================================
    // START LEVEL
    // ==========================================

    window.startStoryLevel =
        async function(
            config,
            context
        ) {

            activeContext =
                context;


            window.currentLevel =
                config;


            window.levelActive =
                true;


            window.gamePaused =
                false;


            /*
                Story map verbergen.
            */

            if (
                context &&
                context.hideMap
            ) {

                context.hideMap();
            }


            levelScreen.hidden =
                false;


            resizeLevelCanvas();


            await makeFullscreen();


            if (
                !animationFrame
            ) {

                animationFrame =
                    requestAnimationFrame(
                        levelLoop
                    );
            }
        };


    // ==========================================
    // TERUG NAAR MAP
    // ==========================================

    function returnToStoryMap() {

        window.levelActive =
            false;


        window.gamePaused =
            false;


        window.currentLevel =
            null;


        levelScreen.hidden =
            true;


        if (
            animationFrame
        ) {

            cancelAnimationFrame(
                animationFrame
            );

            animationFrame =
                null;
        }


        if (
            activeContext &&
            activeContext.returnToMap
        ) {

            activeContext
                .returnToMap();
        }


        activeContext =
            null;
    }


    window.returnToStoryMap =
        returnToStoryMap;

    window.leaveCurrentLevel =
        returnToStoryMap;

})();