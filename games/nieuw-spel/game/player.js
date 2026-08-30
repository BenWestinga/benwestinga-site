const levelPlayer = {
    x: 0,
    y: 0,
    radius: 16
};


function resetPlayer() {
    levelPlayer.x = levelCanvas.width / 2;
    levelPlayer.y = levelCanvas.height / 2;
}


function movePlayerToPointer(event) {

    if (!levelActive || gamePaused) {
        return;
    }   

    const rect = levelCanvas.getBoundingClientRect();

    levelPlayer.x =
        (event.clientX - rect.left) *
        (levelCanvas.width / rect.width);

    levelPlayer.y =
        (event.clientY - rect.top) *
        (levelCanvas.height / rect.height);
}