const accountMenu = document.getElementById("account-menu");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const gameMenu = document.getElementById("game-menu");

const message = document.getElementById("message");
const currentUser = document.getElementById("current-user");


function showAccountMenu() {
    accountMenu.hidden = false;
    loginForm.hidden = true;
    registerForm.hidden = true;
    gameMenu.hidden = true;
    message.textContent = "";
}


function showLoggedIn(username) {
    accountMenu.hidden = true;
    loginForm.hidden = true;
    registerForm.hidden = true;
    gameMenu.hidden = false;

    currentUser.textContent = username;
    message.textContent = "";
}


document
    .getElementById("show-login")
    .addEventListener("click", () => {
        accountMenu.hidden = true;
        loginForm.hidden = false;
    });


document
    .getElementById("show-register")
    .addEventListener("click", () => {
        accountMenu.hidden = true;
        registerForm.hidden = false;
    });


document
    .querySelectorAll(".back-button")
    .forEach(button => {
        button.addEventListener("click", showAccountMenu);
    });


loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const username =
        document.getElementById("login-username").value;

    const password =
        document.getElementById("login-password").value;

    try {
        const data = await apiRequest(
            "/login",
            {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        loginForm.reset();
        showLoggedIn(data.username);

    } catch (error) {
        message.textContent = error.message;
    }
});


registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const username =
        document.getElementById("register-username").value;

    const password =
        document.getElementById("register-password").value;

    const confirmPassword =
        document.getElementById("register-password-confirm").value;


    if (password !== confirmPassword) {
        message.textContent = "Passwords do not match.";
        return;
    }


    try {
        const data = await apiRequest(
            "/register",
            {
                method: "POST",
                body: JSON.stringify({
                    username,
                    password
                })
            }
        );

        registerForm.reset();
        showLoggedIn(data.username);

    } catch (error) {
        message.textContent = error.message;
    }
});


document
    .getElementById("logout-button")
    .addEventListener("click", async () => {

        try {
            await apiRequest(
                "/logout",
                {
                    method: "POST"
                }
            );
        } catch {}

        showAccountMenu();
    });


async function checkLogin() {
    try {
        const data = await apiRequest("/me");
        showLoggedIn(data.username);

    } catch {
        showAccountMenu();
    }
}


checkLogin();