```javascript
/*
    =========================
    BLUE DOT LEADERBOARD
    =========================

    Dit bestand communiceert met
    de Blue Dot server.

    Later komt hier bijvoorbeeld:

    GET  /api/blue-dot/scores
    POST /api/blue-dot/score
*/


const API_URL =
    "/api/blue-dot";


/* =========================
   SCORE OPSLAAN
   ========================= */

async function submitScore(name, time) {

    try {

        const response =
            await fetch(
                API_URL + "/score",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        time: Number(
                            time.toFixed(2)
                        )
                    })
                }
            );


        if (!response.ok) {

            console.error(
                "Score kon niet worden opgeslagen."
            );

            return null;
        }


        const data =
            await response.json();


        return data;

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
        document.getElementById(
            "leaderboard"
        );


    leaderboard.innerHTML =
        "Laden...";


    try {

        const response =
            await fetch(
                API_URL + "/scores"
            );


        if (!response.ok) {

            throw new Error(
                "Server error"
            );
        }


        const scores =
            await response.json();


        /*
            Maak leaderboard leeg.
        */

        leaderboard.innerHTML = "";


        if (
            !Array.isArray(scores) ||
            scores.length === 0
        ) {

            leaderboard.innerHTML =
                "Nog geen scores.";

            return;
        }


        /*
            Alleen beste 5.
        */

        const topFive =
            scores.slice(0, 5);


        topFive.forEach(
            function(score, index) {

                const row =
                    document.createElement(
                        "div"
                    );

                row.className =
                    "leaderboardRow";


                const rank =
                    document.createElement(
                        "div"
                    );

                rank.className =
                    "leaderboardRank";

                rank.textContent =
                    (index + 1) + ".";


                const name =
                    document.createElement(
                        "div"
                    );

                name.className =
                    "leaderboardName";

                name.textContent =
                    score.name;


                const time =
                    document.createElement(
                        "div"
                    );

                time.className =
                    "leaderboardScore";

                time.textContent =
                    Number(
                        score.time
                    ).toFixed(2) +
                    "s";


                row.appendChild(rank);

                row.appendChild(name);

                row.appendChild(time);


                leaderboard.appendChild(row);
            }
        );

    } catch (error) {

        console.error(error);

        leaderboard.innerHTML =
            "Leaderboard tijdelijk niet beschikbaar.";
    }
}
```
