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

const enterHint =
    document.createElement("div");

enterHint.textContent =
    "ENTER - Continue";

enterHint.style.position =
    "absolute";

enterHint.style.right =
    "30px";

enterHint.style.bottom =
    "25px";

enterHint.style.color =
    "white";

enterHint.style.font =
    "bold 18px Arial";

enterHint.style.opacity =
    "0.85";

enterHint.style.pointerEvents =
    "none";

pauseMenu.appendChild(
    enterHint
);

function openPauseMenu() {

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


pauseMenuButton.addEventListener(
    "click",
    openPauseMenu
);


document.addEventListener(
    "keydown",
    event => {

        if (
            event.code !== "Space" ||
            event.repeat
        ) {
            return;
        }


        const onMap =
            !storyMap.hidden;

        const inLevel =
            window.levelActive === true;


        if (!onMap && !inLevel) {
            return;
        }


        event.preventDefault();


        if (pauseMenu.hidden) {
            openPauseMenu();
        }
    }
);

function resumeGame() {

    pauseMenu.hidden = true;

    window.gamePaused = false;

    pauseMenuButton.hidden = false;
}


continueButton.addEventListener(
    "click",
    resumeGame
);


document.addEventListener(
    "keydown",
    event => {

        const isEnter =
            event.key === "Enter" ||
            event.code === "Enter" ||
            event.code === "NumpadEnter";

        if (
            !isEnter ||
            event.repeat ||
            pauseMenu.hidden
        ) {
            return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        resumeGame();
    },
    true
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