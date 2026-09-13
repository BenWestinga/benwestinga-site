const API_URL =
    "/api/nieuw-spel";


let currentUsername =
    null;


let pendingGameUrl =
    null;


/* =========================================================
   DOM
   ========================================================= */

const accountArea =
    document.getElementById(
        "account-area"
    );


const accountButton =
    document.getElementById(
        "account-button"
    );


const accountLabel =
    document.getElementById(
        "account-label"
    );


const accountDropdown =
    document.getElementById(
        "account-dropdown"
    );


const dropdownUsername =
    document.getElementById(
        "dropdown-username"
    );


const viewAccountButton =
    document.getElementById(
        "view-account-button"
    );


const dropdownLogoutButton =
    document.getElementById(
        "dropdown-logout-button"
    );


const authModal =
    document.getElementById(
        "auth-modal"
    );


const closeAuthModalButton =
    document.getElementById(
        "close-auth-modal"
    );


const loginTab =
    document.getElementById(
        "login-tab"
    );


const registerTab =
    document.getElementById(
        "register-tab"
    );


const loginForm =
    document.getElementById(
        "login-form"
    );


const registerForm =
    document.getElementById(
        "register-form"
    );


const authMessage =
    document.getElementById(
        "auth-message"
    );


const accountModal =
    document.getElementById(
        "account-modal"
    );


const closeAccountModalButton =
    document.getElementById(
        "close-account-modal"
    );


const accountProfileUsername =
    document.getElementById(
        "account-profile-username"
    );


const accountInfoUsername =
    document.getElementById(
        "account-info-username"
    );


const accountModalLogoutButton =
    document.getElementById(
        "account-modal-logout-button"
    );


const gameCards =
    document.querySelectorAll(
        ".game-card[data-game-url]"
    );


/* =========================================================
   API
   ========================================================= */

async function apiRequest(
    path,
    options = {}
) {

    const response =
        await fetch(
            API_URL +
                path,
            {
                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    ...(
                        options.headers ||
                        {}
                    )
                }
            }
        );


    let data =
        {};


    try {

        data =
            await response.json();

    } catch {}


    if (
        !response.ok
    ) {

        throw new Error(
            data.error ||
            "Something went wrong."
        );
    }


    return data;
}


/* =========================================================
   ACCOUNT STATE
   ========================================================= */

function isLoggedIn() {

    return (
        typeof currentUsername ===
            "string" &&
        currentUsername.length >
            0
    );
}


function renderAccountState() {

    if (
        isLoggedIn()
    ) {

        accountLabel.textContent =
            currentUsername;


        dropdownUsername.textContent =
            currentUsername;


        accountProfileUsername.textContent =
            currentUsername;


        accountInfoUsername.textContent =
            currentUsername;


        return;
    }


    accountLabel.textContent =
        "LOG IN";


    dropdownUsername.textContent =
        "-";


    accountProfileUsername.textContent =
        "-";


    accountInfoUsername.textContent =
        "-";


    closeAccountDropdown();
}


/* =========================================================
   ACCOUNT DROPDOWN
   ========================================================= */

function openAccountDropdown() {

    if (
        !isLoggedIn()
    ) {

        openAuthModal(
            "login"
        );

        return;
    }


    accountDropdown.hidden =
        false;


    accountButton.setAttribute(
        "aria-expanded",
        "true"
    );
}


function closeAccountDropdown() {

    accountDropdown.hidden =
        true;


    accountButton.setAttribute(
        "aria-expanded",
        "false"
    );
}


function toggleAccountDropdown() {

    if (
        !isLoggedIn()
    ) {

        openAuthModal(
            "login"
        );

        return;
    }


    if (
        accountDropdown.hidden
    ) {

        openAccountDropdown();

    } else {

        closeAccountDropdown();
    }
}


/* =========================================================
   AUTH MODAL
   ========================================================= */

function showAuthMode(
    mode
) {

    const loginMode =
        mode !==
        "register";


    loginForm.hidden =
        !loginMode;


    registerForm.hidden =
        loginMode;


    loginTab.classList.toggle(
        "active",
        loginMode
    );


    registerTab.classList.toggle(
        "active",
        !loginMode
    );


    authMessage.textContent =
        "";
}


function openAuthModal(
    mode = "login",
    targetUrl = null
) {

    if (
        targetUrl
    ) {

        pendingGameUrl =
            targetUrl;
    }


    showAuthMode(
        mode
    );


    closeAccountDropdown();


    authModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";
}


function closeAuthModal() {

    authModal.hidden =
        true;


    authMessage.textContent =
        "";


    document.body.style.overflow =
        "";
}


function setAuthMessage(
    text
) {

    authMessage.textContent =
        text;
}


/* =========================================================
   ACCOUNT DETAILS
   ========================================================= */

function openAccountModal() {

    if (
        !isLoggedIn()
    ) {

        openAuthModal(
            "login"
        );

        return;
    }


    closeAccountDropdown();


    accountProfileUsername.textContent =
        currentUsername;


    accountInfoUsername.textContent =
        currentUsername;


    accountModal.hidden =
        false;


    document.body.style.overflow =
        "hidden";
}


function closeAccountModal() {

    accountModal.hidden =
        true;


    document.body.style.overflow =
        "";
}


/* =========================================================
   SAFE REDIRECT
   ========================================================= */

function getSafeLocalUrl(
    url
) {

    if (
        typeof url !==
        "string"
    ) {

        return null;
    }


    if (
        !url.startsWith("/") ||
        url.startsWith("//")
    ) {

        return null;
    }


    return url;
}


function getRequestedGameUrl() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return getSafeLocalUrl(
        params.get(
            "next"
        )
    );
}


function clearLoginQuery() {

    if (
        !window.history
            ?.replaceState
    ) {

        return;
    }


    window.history.replaceState(
        {},
        "",
        window.location.pathname
    );
}


/* =========================================================
   FINISH LOGIN
   ========================================================= */

function finishAuthentication(
    username
) {

    currentUsername =
        username;


    renderAccountState();


    closeAuthModal();


    loginForm.reset();

    registerForm.reset();


    const target =
        getSafeLocalUrl(
            pendingGameUrl
        );


    pendingGameUrl =
        null;


    clearLoginQuery();


    if (
        target
    ) {

        window.location.href =
            target;
    }
}


/* =========================================================
   LOGIN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const username =
            document
                .getElementById(
                    "login-username"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "login-password"
                )
                .value;


        setAuthMessage(
            "Logging in..."
        );


        try {

            const data =
                await apiRequest(
                    "/login",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            finishAuthentication(
                data.username
            );

        } catch (
            error
        ) {

            setAuthMessage(
                error.message
            );
        }
    }
);


/* =========================================================
   REGISTER
   ========================================================= */

registerForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const username =
            document
                .getElementById(
                    "register-username"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "register-password"
                )
                .value;


        const confirmPassword =
            document
                .getElementById(
                    "register-password-confirm"
                )
                .value;


        if (
            password !==
            confirmPassword
        ) {

            setAuthMessage(
                "Passwords do not match."
            );

            return;
        }


        setAuthMessage(
            "Creating account..."
        );


        try {

            const data =
                await apiRequest(
                    "/register",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            finishAuthentication(
                data.username
            );

        } catch (
            error
        ) {

            setAuthMessage(
                error.message
            );
        }
    }
);


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

    closeAccountDropdown();

    closeAccountModal();


    try {

        await apiRequest(
            "/logout",
            {
                method:
                    "POST"
            }
        );

    } catch (
        error
    ) {

        console.error(
            "Logout failed:",
            error
        );
    }


    currentUsername =
        null;


    pendingGameUrl =
        null;


    renderAccountState();
}


/* =========================================================
   GAME OPENING
   ========================================================= */

function openGame(
    gameUrl
) {

    const safeUrl =
        getSafeLocalUrl(
            gameUrl
        );


    if (
        !safeUrl
    ) {

        return;
    }


    if (
        isLoggedIn()
    ) {

        window.location.href =
            safeUrl;

        return;
    }


    openAuthModal(
        "login",
        safeUrl
    );
}


gameCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                openGame(
                    card.dataset
                        .gameUrl
                );
            }
        );
    }
);


/* =========================================================
   BUTTONS
   ========================================================= */

accountButton.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        toggleAccountDropdown();
    }
);


viewAccountButton.addEventListener(
    "click",
    openAccountModal
);


dropdownLogoutButton.addEventListener(
    "click",
    logout
);


accountModalLogoutButton.addEventListener(
    "click",
    logout
);


closeAuthModalButton.addEventListener(
    "click",
    () => {

        pendingGameUrl =
            null;

        closeAuthModal();
    }
);


closeAccountModalButton.addEventListener(
    "click",
    closeAccountModal
);


loginTab.addEventListener(
    "click",
    () => {

        showAuthMode(
            "login"
        );
    }
);


registerTab.addEventListener(
    "click",
    () => {

        showAuthMode(
            "register"
        );
    }
);


/* =========================================================
   CLOSE WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener(
    "click",
    event => {

        if (
            !accountArea.contains(
                event.target
            )
        ) {

            closeAccountDropdown();
        }
    }
);


authModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            authModal
        ) {

            pendingGameUrl =
                null;

            closeAuthModal();
        }
    }
);


accountModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            accountModal
        ) {

            closeAccountModal();
        }
    }
);


/* =========================================================
   ESCAPE
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;
        }


        closeAccountDropdown();


        if (
            !authModal.hidden
        ) {

            pendingGameUrl =
                null;

            closeAuthModal();
        }


        if (
            !accountModal.hidden
        ) {

            closeAccountModal();
        }
    }
);


/* =========================================================
   INITIAL LOGIN CHECK
   ========================================================= */

async function checkLogin() {

    let loginData =
        null;


    try {

        loginData =
            await apiRequest(
                "/me"
            );


        currentUsername =
            loginData.username;

    } catch {

        currentUsername =
            null;
    }


    renderAccountState();


    const params =
        new URLSearchParams(
            window.location.search
        );


    const wantsLogin =
        params.get(
            "login"
        ) ===
        "1";


    const requestedGame =
        getRequestedGameUrl();


    if (
        wantsLogin &&
        requestedGame
    ) {

        if (
            isLoggedIn()
        ) {

            clearLoginQuery();


            window.location.href =
                requestedGame;

            return;
        }


        openAuthModal(
            "login",
            requestedGame
        );
    }
}


checkLogin();