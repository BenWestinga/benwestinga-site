const gameMenu =
    document.getElementById(
        "game-menu"
    );


const message =
    document.getElementById(
        "message"
    );


const currentUser =
    document.getElementById(
        "current-user"
    );


/* =========================================================
   SHOW LOGGED IN MENU
   ========================================================= */

function showLoggedIn(
    username
) {

    currentUser.textContent =
        username;


    gameMenu.hidden =
        false;


    message.textContent =
        "";
}


/* =========================================================
   LOAD STORY PROGRESS
   ========================================================= */

async function loadAccountProgress(
    username
) {

    message.textContent =
        "Loading story progress...";


    if (
        window.StoryProgress &&
        typeof StoryProgress
            .loadForUser ===
            "function"
    ) {

        await StoryProgress
            .loadForUser(
                username
            );
    }
}


/* =========================================================
   RETURN TO BEN GAMES
   ========================================================= */

document
    .getElementById(
        "back-to-games-button"
    )
    .addEventListener(
        "click",
        () => {

            window.location.href =
                "/";
        }
    );


/* =========================================================
   CENTRAL LOGIN REDIRECT
   ========================================================= */

function redirectToCentralLogin() {

    const returnUrl =
        window.location.pathname +
        window.location.search;


    window.location.replace(
        "/?login=1&next=" +
        encodeURIComponent(
            returnUrl
        )
    );
}


/* =========================================================
   CHECK CENTRAL BEN GAMES ACCOUNT
   ========================================================= */

async function checkLogin() {

    message.textContent =
        "Checking Ben Games account...";


    let accountData;


    try {

        accountData =
            await apiRequest(
                "/me"
            );

    } catch {

        /*
            No valid Ben Games session.

            Do NOT create a separate account here.

            Redirect to the central website login.
        */

        redirectToCentralLogin();

        return;
    }


    /*
        We have a valid site-wide account.

        Now load the existing New Game progress
        belonging to exactly this username.
    */

    try {

        await loadAccountProgress(
            accountData.username
        );


        showLoggedIn(
            accountData.username
        );

    } catch (
        error
    ) {

        console.error(
            "Story progress could not be loaded:",
            error
        );


        message.textContent =
            "Your account is logged in, but story progress could not be loaded.";
    }
}


/* =========================================================
   START
   ========================================================= */

checkLogin();