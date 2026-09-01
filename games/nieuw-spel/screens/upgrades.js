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


    if (
        !upgradesButton ||
        !upgradesScreen ||
        !closeButton ||
        !upgradeList
    ) {

        console.error(
            "Upgrade menu HTML-elementen ontbreken."
        );

        return;

    }


    let selectedUpgradeId =
        null;


    // =====================================================
    // RENDER
    // =====================================================

    function renderUpgrades() {

        upgradeList.innerHTML =
            "";


        const tree =
            document.createElement(
                "div"
            );


        tree.className =
            "upgrade-tree";


        // =================================================
        // TOP BAR
        // =================================================

        const topBar =
            document.createElement(
                "div"
            );


        topBar.className =
            "upgrade-tree-topbar";


        topBar.innerHTML = `

            <div class="upgrade-tree-title">
                SPECIAL UPGRADES
            </div>

            <div class="upgrade-tree-books">
                📕 ${StoryProgress.getBooks()}
            </div>

        `;


        tree.appendChild(
            topBar
        );


        // =================================================
        // SVG VERBINDINGSLIJNEN
        // =================================================

        const svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );


        svg.classList.add(
            "upgrade-tree-lines"
        );


        svg.setAttribute(
            "viewBox",
            "0 0 100 100"
        );


        svg.setAttribute(
            "preserveAspectRatio",
            "none"
        );


        for (
            const upgrade
            of Object.values(
                StoryProgress.UPGRADES
            )
        ) {

            const childVisible =
                StoryProgress
                    .isUpgradeVisible(
                        upgrade.id
                    );


            if (!childVisible) {

                continue;

            }


            for (
                const parentId
                of upgrade.requires
            ) {

                const parent =
                    StoryProgress
                        .getUpgrade(
                            parentId
                        );


                if (!parent) {

                    continue;

                }


                const parentVisible =
                    StoryProgress
                        .isUpgradeVisible(
                            parentId
                        );


                if (!parentVisible) {

                    continue;

                }


                const line =
                    document.createElementNS(
                        "http://www.w3.org/2000/svg",
                        "line"
                    );


                line.setAttribute(
                    "x1",
                    parent.x
                );


                line.setAttribute(
                    "y1",
                    parent.y
                );


                line.setAttribute(
                    "x2",
                    upgrade.x
                );


                line.setAttribute(
                    "y2",
                    upgrade.y
                );


                if (
                    StoryProgress
                        .hasUpgrade(
                            parentId
                        )
                ) {

                    line.classList.add(
                        "active"
                    );

                }


                svg.appendChild(
                    line
                );

            }

        }


        tree.appendChild(
            svg
        );


        // =================================================
        // UPGRADE NODES
        // =================================================

        for (
            const upgrade
            of Object.values(
                StoryProgress.UPGRADES
            )
        ) {

            const visible =
                StoryProgress
                    .isUpgradeVisible(
                        upgrade.id
                    );


            if (!visible) {

                continue;

            }


            const owned =
                StoryProgress
                    .hasUpgrade(
                        upgrade.id
                    );


            const unlocked =
                StoryProgress
                    .isUpgradeUnlocked(
                        upgrade.id
                    );


            const affordable =
                StoryProgress
                    .getBooks() >=
                upgrade.cost;


            const node =
                document.createElement(
                    "button"
                );


            node.className =
                "upgrade-node";


            node.style.left =
                `${upgrade.x}%`;


            node.style.top =
                `${upgrade.y}%`;


            node.dataset.upgradeId =
                upgrade.id;


            if (owned) {

                node.classList.add(
                    "owned"
                );

            } else if (
                unlocked &&
                affordable
            ) {

                node.classList.add(
                    "available"
                );

            } else {

                node.classList.add(
                    "not-affordable"
                );

            }


            if (
                selectedUpgradeId ===
                upgrade.id
            ) {

                node.classList.add(
                    "focused"
                );

            }


            // =============================
            // ICON
            // =============================

            const icon =
                document.createElement(
                    "div"
                );


            icon.className =
                "upgrade-node-icon";


            icon.textContent =
                getUpgradeIcon(
                    upgrade.id
                );


            // =============================
            // NAME
            // =============================

            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "upgrade-node-name";


            name.textContent =
                upgrade.name;


            // =============================
            // PRICE
            // =============================

            const price =
                document.createElement(
                    "div"
                );


            price.className =
                "upgrade-node-cost";


            if (owned) {

                price.textContent =
                    "✓";

            } else {

                price.textContent =
                    `📕 ${upgrade.cost}`;

            }


            node.appendChild(
                icon
            );


            node.appendChild(
                name
            );


            node.appendChild(
                price
            );


            node.addEventListener(
                "mouseenter",
                () => {

                    selectedUpgradeId =
                        upgrade.id;


                    updateInfoPanel(
                        upgrade
                    );

                }
            );


            node.addEventListener(
                "click",
                () => {

                    selectedUpgradeId =
                        upgrade.id;


                    updateInfoPanel(
                        upgrade
                    );


                    if (owned) {

                        return;

                    }


                    const result =
                        StoryProgress
                            .buyUpgrade(
                                upgrade.id
                            );


                    if (
                        result.success
                    ) {

                        selectedUpgradeId =
                            upgrade.id;


                        renderUpgrades();

                        return;

                    }


                    if (
                        result.reason ===
                        "money"
                    ) {

                        showTemporaryMessage(
                            "Niet genoeg boekjes."
                        );

                    }


                    if (
                        result.reason ===
                        "locked"
                    ) {

                        showTemporaryMessage(
                            "Je moet eerst de vorige upgrade kopen."
                        );

                    }

                }
            );


            tree.appendChild(
                node
            );

        }


        // =================================================
        // CENTER INFO
        // =================================================

        const info =
            document.createElement(
                "div"
            );


        info.id =
            "upgrade-info-panel";


        tree.appendChild(
            info
        );


        upgradeList.appendChild(
            tree
        );


        // Toon info van geselecteerde upgrade,
        // anders algemene uitleg.

        if (
            selectedUpgradeId &&
            StoryProgress.getUpgrade(
                selectedUpgradeId
            )
        ) {

            updateInfoPanel(
                StoryProgress.getUpgrade(
                    selectedUpgradeId
                )
            );

        } else {

            showDefaultInfo();

        }

    }


    // =====================================================
    // ICONS
    // =====================================================

    function getUpgradeIcon(
        upgradeId
    ) {

        if (
            upgradeId.includes(
                "quick"
            ) ||
            upgradeId ===
                "doubleTap" ||
            upgradeId ===
                "splitBurst" ||
            upgradeId ===
                "overclockCore"
        ) {

            return "⚡";

        }


        if (
            upgradeId.includes(
                "frost"
            ) ||
            upgradeId.includes(
                "Freeze"
            ) ||
            upgradeId ===
                "coldShards" ||
            upgradeId ===
                "glacierReactor"
        ) {

            return "❄";

        }


        if (
            upgradeId ===
                "chainRhythm" ||
            upgradeId ===
                "blastExpert" ||
            upgradeId ===
                "napalmDust" ||
            upgradeId ===
                "infernoPayload"
        ) {

            return "💥";

        }


        if (
            upgradeId ===
                "shockPop" ||
            upgradeId ===
                "staticBuild" ||
            upgradeId ===
                "stormBurst" ||
            upgradeId ===
                "tempestCrown"
        ) {

            return "ϟ";

        }


        if (
            upgradeId ===
                "piercingTip" ||
            upgradeId ===
                "railRounds" ||
            upgradeId ===
                "returnShrapnel"
        ) {

            return "➤";

        }


        return "●";

    }


    // =====================================================
    // INFO
    // =====================================================

    function showDefaultInfo() {

        const info =
            document.getElementById(
                "upgrade-info-panel"
            );


        if (!info) {

            return;

        }


        info.innerHTML = `

            <strong>
                UPGRADE WEB
            </strong>

            <p>
                Begin met één van de twee upgrades.
                Nieuwe takken verschijnen wanneer je upgrades koopt.
            </p>

            <small>
                Alle upgrades samen kosten 📕 100
            </small>

        `;

    }


    function updateInfoPanel(
        upgrade
    ) {

        const info =
            document.getElementById(
                "upgrade-info-panel"
            );


        if (!info) {

            return;

        }


        const owned =
            StoryProgress
                .hasUpgrade(
                    upgrade.id
                );


        let status =
            `COST: 📕 ${upgrade.cost}`;


        if (owned) {

            status =
                "✓ OWNED";

        }


        info.innerHTML = `

            <strong>
                ${upgrade.name}
            </strong>

            <p>
                ${upgrade.description}
            </p>

            <small>
                ${status}
            </small>

        `;

    }


    // =====================================================
    // MESSAGE
    // =====================================================

    function showTemporaryMessage(
        text
    ) {

        const message =
            document.getElementById(
                "message"
            );


        if (!message) {

            return;

        }


        message.textContent =
            text;


        setTimeout(
            () => {

                if (
                    message.textContent ===
                    text
                ) {

                    message.textContent =
                        "";

                }

            },
            1800
        );

    }


    // =====================================================
    // OPEN
    // =====================================================

    function openUpgrades() {

        window.gamePaused =
            true;


        selectedUpgradeId =
            null;


        renderUpgrades();


        upgradesScreen.hidden =
            false;

    }


    // =====================================================
    // CLOSE
    // =====================================================

    function closeUpgrades() {

        upgradesScreen.hidden =
            true;


        window.gamePaused =
            false;

    }


    // =====================================================
    // EVENTS
    // =====================================================

    upgradesButton.addEventListener(
        "click",
        openUpgrades
    );


    closeButton.addEventListener(
        "click",
        closeUpgrades
    );


    window.addEventListener(
        "story-progress-changed",
        () => {

            if (
                !upgradesScreen.hidden
            ) {

                renderUpgrades();

            }

        }
    );

})();