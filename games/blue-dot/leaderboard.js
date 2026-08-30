const API_URL = "/api/blue-dot";


/* =========================
   SCORE OPSLAAN
   ========================= */

async function submitScore(name, time) {

    try {

        const response = await fetch(
            API_URL + "/score",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    time: Number(time.toFixed(2))
                })
            }
        );

        if (!response.ok) {
            console.error("Score kon niet worden opgeslagen.");
            return null;
        }

        return await response.json();

    } catch (error) {

        console.error(
            "Leaderboard server niet bereikbaar:",
            error
        );

        return null;
    }
}


/* =========================
   TOP 5 OPHALEN
   ========================= */

async function loadLeaderboard() {

    const leaderboard =
        document.getElementById("leaderboard");

    leaderboard.innerHTML = "Laden...";

    try {

        const response =
            await fetch(
                API_URL + "/scores",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error("Server error");
        }

        const scores =
            await response.json();


        /* =========================
           BESTE SCORE PER NAAM
           ========================= */

        const bestScores = {};

        scores.forEach(function(score) {

            const name =
                String(score.name || "").trim();

            const time =
                Number(score.time);

            if (!name || !Number.isFinite(time)) {
                return;
            }

            /*
                Alleen de beste score
                van iedere naam bewaren.
            */

            if (
                !bestScores[name] ||
                time > bestScores[name].time
            ) {

                bestScores[name] = {
                    name: name,
                    time: time
                };
            }
        });


        /*
            Omzetten naar array
            en beste tijden bovenaan.
        */

        const topFive =
            Object.values(bestScores)
                .sort(function(a, b) {
                    return b.time - a.time;
                })
                .slice(0, 5);


        leaderboard.innerHTML = "";


        if (topFive.length === 0) {

            leaderboard.innerHTML =
                "Nog geen scores.";

            return;
        }


        /* =========================
           WEERGAVE
           ========================= */

        topFive.forEach(
            function(score, index) {

                const row =
                    document.createElement("div");

                row.className =
                    "leaderboardRow";


                const rank =
                    document.createElement("div");

                rank.className =
                    "leaderboardRank";

                rank.textContent =
                    (index + 1) + ".";


                const name =
                    document.createElement("div");

                name.className =
                    "leaderboardName";

                name.textContent =
                    score.name;


                const time =
                    document.createElement("div");

                time.className =
                    "leaderboardScore";

                time.textContent =
                    score.time.toFixed(2) + "s";


                row.appendChild(rank);
                row.appendChild(name);
                row.appendChild(time);

                leaderboard.appendChild(row);
            }
        );

    } catch (error) {

        console.error(
            "Leaderboard fout:",
            error
        );

        leaderboard.innerHTML =
            "Leaderboard tijdelijk niet beschikbaar.";
    }
}
