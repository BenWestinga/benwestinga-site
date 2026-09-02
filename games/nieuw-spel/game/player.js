(() => {

    const player = {
        x: 0,
        y: 0,
        radius: 18,
        alive: true
    };


    window.levelPlayer = player;


    function getCanvas() {
        return document.getElementById("level-canvas");
    }


    function resetPlayer() {

        const canvas = getCanvas();

        if (!canvas) {
            return;
        }


        player.x =
            canvas.width * 0.25;

        player.y =
            canvas.height * 0.5;

        player.alive = true;
    }


    function clampPlayer() {

        const canvas = getCanvas();

        if (!canvas) {
            return;
        }

    // 14px = de donkere arena-rand.
    // Hierdoor kan de bal nooit half buiten de arena komen.
        const margin =
            player.radius + 14;

        player.x = Math.max(
            margin,
            Math.min(
                canvas.width - margin,
                player.x
            )
        );

        player.y = Math.max(
            margin,
            Math.min(
                canvas.height - margin,
                player.y
            )
        );
    }


    function movePlayerToPointer(event) {

        if (
            !window.levelActive ||
            window.gamePaused ||
            !player.alive
        ) {
            return;
        }


        const canvas = getCanvas();

        if (!canvas) {
            return;
        }


        const rect =
            canvas.getBoundingClientRect();


        player.x =
            (event.clientX - rect.left) *
            (canvas.width / rect.width);


        player.y =
            (event.clientY - rect.top) *
            (canvas.height / rect.height);


        clampPlayer();
    }


    function drawPlayer(ctx) {

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            player.x,
            player.y,
            player.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            player.alive
                ? "#2f6fff"
                : "#555555";

        ctx.fill();


        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.stroke();

        ctx.restore();
    }


    function touchesCircle(
        x,
        y,
        radius
    ) {

        const dx =
            player.x - x;

        const dy =
            player.y - y;


        return (
            Math.hypot(dx, dy) <=
            player.radius + radius
        );
    }


    function bindControls() {

        const canvas = getCanvas();


        if (
            !canvas ||
            canvas.dataset.playerControlsBound === "1"
        ) {
            return;
        }


        canvas.dataset.playerControlsBound =
            "1";


        canvas.addEventListener(
            "pointermove",
            movePlayerToPointer
        );


        canvas.addEventListener(
            "pointerdown",
            movePlayerToPointer
        );
    }


    window.LevelPlayer = {
        reset: resetPlayer,
        clamp: clampPlayer,
        draw: drawPlayer,
        touchesCircle,
        bindControls
    };


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            bindControls
        );

    } else {

        bindControls();
    }

})();