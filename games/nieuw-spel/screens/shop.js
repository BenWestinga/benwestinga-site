(() => {

    const shopButton =
        document.getElementById(
            "shop-button"
        );

    const shopScreen =
        document.getElementById(
            "shop-screen"
        );

    const closeButton =
        document.getElementById(
            "close-shop-button"
        );

    const weaponList =
        document.getElementById(
            "weapon-list"
        );


    function renderShop() {

        weaponList.innerHTML =
            "";


        const selectedWeapon =
            StoryProgress
                .getSelectedWeapon();


        for (
            const weapon
            of Object.values(
                StoryProgress.WEAPONS
            )
        ) {

            const unlocked =
                StoryProgress
                    .isWeaponUnlocked(
                        weapon.id
                    );


            const selected =
                selectedWeapon.id ===
                weapon.id;


            const card =
                document.createElement(
                    "button"
                );


            card.className =
                "weapon-card";


            if (!unlocked) {

                card.classList.add(
                    "locked"
                );

            }


            if (selected) {

                card.classList.add(
                    "selected"
                );

            }


            card.innerHTML = `

                <div class="weapon-image">

                    ${
                        weapon.image
                            ? `<img src="${weapon.image}">`
                            : "🔫"
                    }

                </div>

                <strong>
                    ${weapon.name}
                </strong>

                <span>

                    ${
                        selected
                            ? "SELECTED"
                            : unlocked
                                ? "SELECT"
                                : `UNLOCK AT LEVEL ${weapon.unlockLevel}`
                    }

                </span>

            `;


            if (unlocked) {

                card.addEventListener(
                    "click",
                    () => {

                        StoryProgress
                            .selectWeapon(
                                weapon.id
                            );

                        renderShop();

                    }
                );

            }


            weaponList.appendChild(
                card
            );

        }

    }


    function openShop() {

        window.gamePaused =
            true;

        renderShop();

        shopScreen.hidden =
            false;

    }


    function closeShop() {

        shopScreen.hidden =
            true;

        window.gamePaused =
            false;

    }


    shopButton.addEventListener(
        "click",
        openShop
    );


    closeButton.addEventListener(
        "click",
        closeShop
    );

})();