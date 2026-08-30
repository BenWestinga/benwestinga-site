const menuButton =
    document.getElementById("menu-button");

const pauseMenu =
    document.getElementById("pause-menu");

const continueButton =
    document.getElementById("continue-button");

const leaveLevelButton =
    document.getElementById("leave-level-button");

const leaveStoryButton =
    document.getElementById("leave-story-button");


let gamePaused = false;


// MENU OPENEN
menuButton.addEventListener("click", () => {

    gamePaused = true;

    pauseMenu.hidden = false;
    menuButton.hidden = true;

    // Alleen zichtbaar als we echt in een level zitten
    leaveLevelButton.hidden = !levelActive;
});


// CONTINUE
continueButton.addEventListener("click", () => {

    pauseMenu.hidden = true;
    menuButton.hidden = false;

    gamePaused = false;
});


// LEVEL VERLATEN
leaveLevelButton.addEventListener("click", () => {

    pauseMenu.hidden = true;

    gamePaused = false;

    leaveCurrentLevel();

    menuButton.hidden = false;
});


// STORY MODE VERLATEN
leaveStoryButton.addEventListener("click", async () => {

    pauseMenu.hidden = true;
    menuButton.hidden = true;

    gamePaused = false;


    // Als speler in een level zit
    if (levelActive) {

        levelActive = false;
        currentLevel = null;

        clearBullets();

        levelScreen.hidden = true;
    }


    // Map afsluiten
    storyMap.hidden = true;

    mapGameMenu.hidden = false;


    // Fullscreen afsluiten
    if (document.fullscreenElement) {

        try {
            await document.exitFullscreen();
        } catch {}
    }
});