window.levelPlayer = {
    x: 0,
    y: 0,
    radius: 18
};


function resetPlayer() {

    const canvas =
        document.getElementById("level-canvas");

    levelPlayer.x =
        canvas.width / 2;

    levelPlayer.y =
        canvas.height / 2;
}


function movePlayerToPointer(event) {

    if (
        !window.levelActive ||
        window.gamePaused
    ) {
        return;
    }

    const canvas =
        document.getElementById("level-canvas");

    const rect =
        canvas.getBoundingClientRect();

    const x =
        (event.clientX - rect.left) *
        (canvas.width / rect.width);

    const y =
        (event.clientY - rect.top) *
        (canvas.height / rect.height);


    levelPlayer.x = Math.max(
        levelPlayer.radius,
        Math.min(
            canvas.width - levelPlayer.radius,
            x
        )
    );

    levelPlayer.y = Math.max(
        levelPlayer.radius,
        Math.min(
            canvas.height - levelPlayer.radius,
            y
        )
    );
}