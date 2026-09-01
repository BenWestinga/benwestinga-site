(() => {

    const upgradesButton =
        document.getElementById(
            "upgrades-button"
        );

    const upgradesScreen =
        document.getElementById(
            "upgrades-screen"
        );

    const closeButton =
        document.getElementById(
            "close-upgrades-button"
        );

    const upgradeList =
        document.getElementById(
            "upgrade-list"
        );


    function renderUpgrades() {

        upgradeList.innerHTML =
            "";


        for (
            const upgrade
            of Object.values(
                StoryProgress.UPGRADES
            )
        ) {

            const owned =
                StoryProgress
                    .hasUpgrade(
                        upgrade.id
                    );


            const card =
                document.createElement(
                    "button"
                );


            card.className =
                "upgrade-card";


            if (owned) {

                card.classList.add(
                    "owned"
                );

            }


            card.innerHTML = `

                <strong>
                    ${upgrade.name}
                </strong>

                <p>
                    ${upgrade.description}
                </p>

                <span>

                    ${
                        owned
                            ? "OWNED"
                            : "📕 " +
                              upgrade.cost
                    }

                </span>

            `;


            if (!owned) {

                card.addEventListener(
                    "click",
                    () => {

                        const result =
                            StoryProgress
                                .buyUpgrade(
                                    upgrade.id
                                );


                        if (
                            result.success
                        ) {

                            renderUpgrades();

                            return;
                        }


                        if (
                            result.reason ===
                            "money"
                        ) {

                            alert(
                                "Je hebt niet genoeg boekjes."
                            );

                        }

                    }
                );

            }


            upgradeList.appendChild(
                card
            );

        }

    }


    function openUpgrades() {

        window.gamePaused =
            true;

        renderUpgrades();

        upgradesScreen.hidden =
            false;

    }


    function closeUpgrades() {

        upgradesScreen.hidden =
            true;

        window.gamePaused =
            false;

    }


    upgradesButton.addEventListener(
        "click",
        openUpgrades
    );


    closeButton.addEventListener(
        "click",
        closeUpgrades
    );

})();