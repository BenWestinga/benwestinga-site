const pauseMenuButton =
    document.getElementById("menu-button");

const pauseMenu =
    document.getElementById("pause-menu");

const continueButton =
    document.getElementById("continue-button");

const leaveLevelButton =
    document.getElementById("leave-level-button");

const leaveStoryButton =
    document.getElementById("leave-story-button");


window.gamePaused = false;


pauseMenuButton.addEventListener(
    "click",
    () => {

        const onMap =
            !storyMap.hidden;

        const inLevel =
            window.levelActive === true;


        // Niet in Story Mode?
        if (!onMap && !inLevel) {

            pauseMenuButton.hidden = true;

            return;
        }


        window.gamePaused = true;

        pauseMenu.hidden = false;

        pauseMenuButton.hidden = true;


        leaveLevelButton.hidden =
            !inLevel;
    }
);


continueButton.addEventListener(
    "click",
    () => {

        pauseMenu.hidden = true;

        window.gamePaused = false;

        pauseMenuButton.hidden = false;
    }
);


leaveLevelButton.addEventListener(
    "click",
    () => {

        if (!window.levelActive) {
            return;
        }

        pauseMenu.hidden = true;

        window.gamePaused = false;

        leaveCurrentLevel();
    }
);


leaveStoryButton.addEventListener(
    "click",
    async () => {

        pauseMenu.hidden = true;

        pauseMenuButton.hidden = true;

        window.gamePaused = false;


        if (window.levelActive) {

            window.levelActive = false;
            window.currentLevel = null;

            clearBullets();
            clearEnemies();

            document
                .getElementById("level-screen")
                .hidden = true;
        }


        storyMap.hidden = true;

        mapGameMenu.hidden = false;

        document.body.classList.remove(
            "game-active"
        );


        if (document.fullscreenElement) {

            try {
                await document.exitFullscreen();
            } catch {}
        }
    }
);