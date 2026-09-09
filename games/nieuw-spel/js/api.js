const API_URL = "/api/nieuw-spel";


async function apiRequest(path, options = {}) {

    const response = await fetch(
        API_URL + path,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            }
        }
    );


    let data = {};

    try {
        data = await response.json();
    } catch {}


    if (!response.ok) {
        throw new Error(
            data.error || "Something went wrong."
        );
    }


    return data;
}


async function getStoryProgress() {

    return apiRequest(
        "/progress"
    );
}


async function saveStoryProgress(progress) {

    return apiRequest(
        "/progress",
        {
            method: "POST",
            body: JSON.stringify(
                progress
            )
        }
    );
}
