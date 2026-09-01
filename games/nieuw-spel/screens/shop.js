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


    if (
        !shopButton ||
        !shopScreen ||
        !closeButton ||
        !weaponList
    ) {

        console.error(
            "Weapon shop HTML-elementen ontbreken."
        );

        return;

    }


    // =====================================================
    // RENDER
    // =====================================================

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
                    "weapon-locked"
                );

            }


            if (selected) {

                card.classList.add(
                    "weapon-selected"
                );

            }


            // =============================
            // IMAGE CONTAINER
            // =============================

            const imageArea =
                document.createElement(
                    "div"
                );


            imageArea.className =
                "weapon-image-area";


            if (weapon.image) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    weapon.image;


                image.alt =
                    weapon.name;


                image.className =
                    "weapon-shop-image";


                image.draggable =
                    false;


                image.addEventListener(
                    "error",
                    () => {

                        image.remove();


                        const fallback =
                            document.createElement(
                                "div"
                            );


                        fallback.className =
                            "weapon-fallback";


                        fallback.textContent =
                            "🔫";


                        imageArea.appendChild(
                            fallback
                        );

                    },
                    {
                        once: true
                    }
                );


                imageArea.appendChild(
                    image
                );

            }


            // =============================
            // NAME
            // =============================

            const name =
                document.createElement(
                    "strong"
                );


            name.className =
                "weapon-shop-name";


            name.textContent =
                weapon.name;


            // =============================
            // UNLOCK
            // =============================

            const unlockText =
                document.createElement(
                    "div"
                );


            unlockText.className =
                "weapon-unlock-text";


            if (
                weapon.unlockLevel ===
                0
            ) {

                unlockText.textContent =
                    "STARTING WEAPON";

            } else {

                unlockText.textContent =
                    `LEVEL ${weapon.unlockLevel}`;

            }


            // =============================
            // STATUS
            // =============================

            const status =
                document.createElement(
                    "span"
                );


            status.className =
                "weapon-shop-status";


            if (selected) {

                status.textContent =
                    "✓ SELECTED";

            } else if (unlocked) {

                status.textContent =
                    "SELECT";

            } else {

                status.textContent =
                    `LOCKED`;

            }


            // =============================
            // ADD EVERYTHING
            // =============================

            card.appendChild(
                imageArea
            );


            card.appendChild(
                name
            );


            card.appendChild(
                unlockText
            );


            card.appendChild(
                status
            );


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


    // =====================================================
    // OPEN
    // =====================================================

    function openShop() {

        window.gamePaused =
            true;


        renderShop();


        shopScreen.hidden =
            false;

    }


    // =====================================================
    // CLOSE
    // =====================================================

    function closeShop() {

        shopScreen.hidden =
            true;


        window.gamePaused =
            false;

    }


    // =====================================================
    // EVENTS
    // =====================================================

    shopButton.addEventListener(
        "click",
        openShop
    );


    closeButton.addEventListener(
        "click",
        closeShop
    );


    window.addEventListener(
        "story-progress-changed",
        () => {

            if (
                !shopScreen.hidden
            ) {

                renderShop();

            }

        }
    );

})();