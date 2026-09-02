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


// ======================================================
// ENTER HINT
// ======================================================

const enterHint =
    document.createElement("div");

enterHint.textContent =
    "ENTER - Continue";

enterHint.style.position =
    "fixed";

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

enterHint.style.zIndex =
    "99999";

enterHint.style.pointerEvents =
    "none";

pauseMenu.appendChild(
    enterHint
);


// ======================================================
// PAUSE MENU OPENEN
// ======================================================

function openPauseMenu() {

    const onMap =
        !storyMap.hidden;

    const inLevel =
        window.levelActive === true;


    if (
        !onMap &&
        !inLevel
    ) {

        pauseMenuButton.hidden =
            true;

        return;
    }


    window.gamePaused =
        true;

    pauseMenu.hidden =
        false;

    pauseMenuButton.hidden =
        true;


    leaveLevelButton.hidden =
        !inLevel;
}


// ======================================================
// PAUSE MENU SLUITEN
// ======================================================

function closePauseMenu() {

    pauseMenu.hidden =
        true;

    window.gamePaused =
        false;


    const onMap =
        !storyMap.hidden;

    const inLevel =
        window.levelActive === true;


    pauseMenuButton.hidden =
        !onMap &&
        !inLevel;
}


// ======================================================
// MENU BUTTON
// ======================================================

pauseMenuButton.addEventListener(
    "click",
    () => {

        openPauseMenu();

    }
);


// ======================================================
// KEYBOARD
// ======================================================

window.addEventListener(
    "keydown",
    event => {

        const key =
            typeof event.key === "string"
                ? event.key.toLowerCase()
                : "";


        // ==============================================
        // ENTER = PAUSE MENU SLUITEN
        // ==============================================

        if (
            (
                key === "enter" ||
                event.code === "Enter" ||
                event.code === "NumpadEnter"
            ) &&
            pauseMenu.hidden === false
        ) {

            event.preventDefault();

            event.stopPropagation();

            event.stopImmediatePropagation();


            closePauseMenu();

            return;
        }


        // ==============================================
        // SPACE = PAUSE MENU OPENEN
        // ==============================================

        if (
            event.code === "Space" &&
            !event.repeat
        ) {

            const onMap =
                !storyMap.hidden;

            const inLevel =
                window.levelActive === true;


            if (
                !onMap &&
                !inLevel
            ) {
                return;
            }


            event.preventDefault();


            if (
                pauseMenu.hidden
            ) {

                openPauseMenu();

            }

        }

    },
    true
);


// ======================================================
// CONTINUE BUTTON
// ======================================================

continueButton.addEventListener(
    "click",
    () => {

        closePauseMenu();

    }
);


// ======================================================
// LEAVE LEVEL
// ======================================================

leaveLevelButton.addEventListener(
    "click",
    () => {

        if (
            !window.levelActive
        ) {
            return;
        }


        pauseMenu.hidden =
            true;

        window.gamePaused =
            false;


        leaveCurrentLevel();
    }
);


// ======================================================
// LEAVE STORY MODE
// ======================================================

leaveStoryButton.addEventListener(
    "click",
    async () => {

        pauseMenu.hidden =
            true;

        pauseMenuButton.hidden =
            true;

        window.gamePaused =
            false;


        if (
            window.levelActive
        ) {

            window.levelActive =
                false;

            window.currentLevel =
                null;


            clearBullets();

            clearEnemies();


            document
                .getElementById(
                    "level-screen"
                )
                .hidden =
                    true;
        }


        storyMap.hidden =
            true;

        mapGameMenu.hidden =
            false;


        document.body
            .classList.remove(
                "game-active"
            );


        if (
            document.fullscreenElement
        ) {

            try {

                await document
                    .exitFullscreen();

            } catch {}

        }

    }
);