(() => {

    const SAVE_KEY =
        "nieuw-spel-story-progress-v2";


    // =====================================================
    // WEAPONS
    // =====================================================

    const WEAPONS = {

        pistol: {
            id: "pistol",
            name: "Pistol",
            unlockLevel: 0,
            image: "pistol.png"
        },

        smg4: {
            id: "smg4",
            name: "SMG4",
            unlockLevel: 10,
            image: "smg4.png"
        },

        shotgun: {
            id: "shotgun",
            name: "Shotgun",
            unlockLevel: 20,
            image: "shotgun.png"
        },

        huntingRifle: {
            id: "huntingRifle",
            name: "Hunting Rifle",
            unlockLevel: 30,
            image: "hunting_rifle.png"
        },

        ak: {
            id: "ak",
            name: "AK",
            unlockLevel: 40,
            image: "ak.png"
        }

    };


    // =====================================================
    // UPGRADE TREE
    //
    // 27 upgrades
    // Total cost: exactly 100 books
    // =====================================================

    const UPGRADES = {


        // =================================================
        // START
        // =================================================

        quickHands1: {

            id: "quickHands1",

            name: "Quick Hands I",

            description:
                "+2% faster fire rate.",

            cost: 2,

            requires: [],

            x: 42,
            y: 48
        },


        heavyAmmo1: {

            id: "heavyAmmo1",

            name: "Heavy Ammo I",

            description:
                "+4% larger bullets.",

            cost: 2,

            requires: [],

            x: 58,
            y: 48
        },


        // =================================================
        // RAPID FIRE
        // =================================================

        quickHands2: {

            id: "quickHands2",

            name: "Quick Hands II",

            description:
                "Your fire rate increases even further.",

            cost: 3,

            requires: [
                "quickHands1"
            ],

            x: 33,
            y: 34
        },


        doubleTap: {

            id: "doubleTap",

            name: "Double Tap",

            description:
                "Some shots instantly fire a second bullet.",

            cost: 3,

            requires: [
                "quickHands2"
            ],

            x: 22,
            y: 22
        },


        splitBurst: {

            id: "splitBurst",

            name: "Split Burst",

            description:
                "Occasionally fires two small extra bullets alongside your normal shot.",

            cost: 4,

            requires: [
                "quickHands2"
            ],

            x: 42,
            y: 18
        },


        critLine: {

            id: "critLine",

            name: "Crit Line",

            description:
                "Every 15th shot becomes a critical hit.",

            cost: 4,

            requires: [
                "splitBurst"
            ],

            x: 49,
            y: 30
        },


        overclockCore: {

            id: "overclockCore",

            name: "Overclock Core",

            description:
                "Powerful final upgrade for a rapid-fire build.",

            cost: 4,

            requires: [
                "doubleTap",
                "splitBurst"
            ],

            x: 32,
            y: 7
        },


        // =================================================
        // EXPLOSIVES
        // =================================================

        chainRhythm: {

            id: "chainRhythm",

            name: "Chain Rhythm",

            description:
                "Every 10th bullet causes a small explosion.",

            cost: 4,

            requires: [
                "quickHands1"
            ],

            x: 31,
            y: 61
        },


        blastExpert: {

            id: "blastExpert",

            name: "Blast Expert",

            description:
                "Explosions have a larger blast radius.",

            cost: 4,

            requires: [
                "chainRhythm"
            ],

            x: 19,
            y: 70
        },


        napalmDust: {

            id: "napalmDust",

            name: "Napalm Dust",

            description:
                "Explosions briefly leave behind a damaging area.",

            cost: 4,

            requires: [
                "chainRhythm"
            ],

            x: 33,
            y: 77
        },


        infernoPayload: {

            id: "infernoPayload",

            name: "Inferno Payload",

            description:
                "Powerful final upgrade for explosive attacks.",

            cost: 4,

            requires: [
                "blastExpert",
                "napalmDust"
            ],

            x: 20,
            y: 91
        },


        // =================================================
        // ICE
        // =================================================

        frostBomb: {

            id: "frostBomb",

            name: "Frost Bomb",

            description:
                "Every 20 seconds, an ice bomb targets the nearest enemy and freezes it for 1 second.",

            cost: 4,

            requires: [
                "quickHands1"
            ],

            x: 20,
            y: 47
        },


        deepFreeze: {

            id: "deepFreeze",

            name: "Deep Freeze",

            description:
                "Enemies remain frozen for longer.",

            cost: 4,

            requires: [
                "frostBomb"
            ],

            x: 8,
            y: 38
        },


        coldShards: {

            id: "coldShards",

            name: "Cold Shards",

            description:
                "Frozen enemies take additional damage.",

            cost: 4,

            requires: [
                "frostBomb"
            ],

            x: 8,
            y: 57
        },


        glacierReactor: {

            id: "glacierReactor",

            name: "Glacier Reactor",

            description:
                "Powerful final upgrade for a freeze build.",

            cost: 4,

            requires: [
                "deepFreeze",
                "coldShards"
            ],

            x: 5,
            y: 76
        },


        // =================================================
        // HEAVY AMMO
        // =================================================

        heavyAmmo2: {

            id: "heavyAmmo2",

            name: "Heavy Ammo II",

            description:
                "Your bullets become even larger.",

            cost: 3,

            requires: [
                "heavyAmmo1"
            ],

            x: 67,
            y: 34
        },


        brutalForce: {

            id: "brutalForce",

            name: "Brutal Force",

            description:
                "All bullets deal slightly more damage.",

            cost: 4,

            requires: [
                "heavyAmmo2"
            ],

            x: 58,
            y: 18
        },


        bossHunter: {

            id: "bossHunter",

            name: "Boss Hunter",

            description:
                "Deal additional damage to bosses.",

            cost: 4,

            requires: [
                "heavyAmmo2"
            ],

            x: 78,
            y: 22
        },


        titanShells: {

            id: "titanShells",

            name: "Titan Shells",

            description:
                "Powerful final upgrade for heavy bullets and raw damage.",

            cost: 4,

            requires: [
                "brutalForce",
                "bossHunter"
            ],

            x: 68,
            y: 7
        },


        // =================================================
        // PIERCING
        // =================================================

        armorCrack: {

            id: "armorCrack",

            name: "Armor Crack",

            description:
                "Strong and armored enemies lose their protection faster.",

            cost: 4,

            requires: [
                "heavyAmmo1"
            ],

            x: 69,
            y: 61
        },


        piercingTip: {

            id: "piercingTip",

            name: "Piercing Tip",

            description:
                "Some bullets pass through one enemy.",

            cost: 4,

            requires: [
                "armorCrack"
            ],

            x: 61,
            y: 78
        },


        railRounds: {

            id: "railRounds",

            name: "Rail Rounds",

            description:
                "Piercing bullets retain more power after hitting an enemy.",

            cost: 4,

            requires: [
                "piercingTip"
            ],

            x: 55,
            y: 92
        },


        returnShrapnel: {

            id: "returnShrapnel",

            name: "Return Shrapnel",

            description:
                "A piercing kill launches small pieces of shrapnel.",

            cost: 4,

            requires: [
                "piercingTip"
            ],

            x: 72,
            y: 90
        },


        // =================================================
        // ELECTRIC
        // =================================================

        shockPop: {

            id: "shockPop",

            name: "Shock Pop",

            description:
                "Every 12th bullet triggers a small chain lightning attack.",

            cost: 4,

            requires: [
                "heavyAmmo1"
            ],

            x: 80,
            y: 47
        },


        staticBuild: {

            id: "staticBuild",

            name: "Static Build",

            description:
                "Chain lightning can hit one additional enemy.",

            cost: 3,

            requires: [
                "shockPop"
            ],

            x: 91,
            y: 37
        },


        stormBurst: {

            id: "stormBurst",

            name: "Storm Burst",

            description:
                "Occasionally creates an electrical burst around the enemy you hit.",

            cost: 4,

            requires: [
                "shockPop"
            ],

            x: 91,
            y: 58
        },


        tempestCrown: {

            id: "tempestCrown",

            name: "Tempest Crown",

            description:
                "Powerful final upgrade for a lightning build.",

            cost: 4,

            requires: [
                "staticBuild",
                "stormBurst"
            ],

            x: 94,
            y: 78
        }

    };


    // =====================================================
    // DEFAULT SAVE
    // =====================================================

    function createDefaultData() {

        return {

            completedLevels: [],

            books: 0,

            selectedWeapon:
                "pistol",

            purchasedUpgrades: []

        };

    }


    // =====================================================
    // LOAD
    // =====================================================

    function loadData() {

        try {

            const saved =
                localStorage.getItem(
                    SAVE_KEY
                );


            if (!saved) {

                return createDefaultData();

            }


            const parsed =
                JSON.parse(saved);


            // =============================================
            // COMPLETED LEVELS
            // =============================================

            let completedLevels =
                Array.isArray(
                    parsed.completedLevels
                )
                    ? parsed.completedLevels
                    : [];


            completedLevels =
                completedLevels
                    .map(Number)
                    .filter(
                        level =>
                            Number.isInteger(level) &&
                            level >= 1 &&
                            level <= 50
                    );


            completedLevels =
                [
                    ...new Set(
                        completedLevels
                    )
                ].sort(
                    (a, b) =>
                        a - b
                );


            // =============================================
            // BOOKS
            // =============================================

            let books =
                Number(
                    parsed.books
                );


            if (
                !Number.isFinite(
                    books
                ) ||
                books < 0
            ) {

                books = 0;

            }


            // =============================================
            // PURCHASED UPGRADES
            // =============================================

            let purchasedUpgrades =
                Array.isArray(
                    parsed.purchasedUpgrades
                )
                    ? [
                        ...new Set(
                            parsed.purchasedUpgrades
                        )
                    ]
                    : [];


            // =============================================
            // OLD SAVE MIGRATION
            //
            // Old:
            // fasterShooting -> Quick Hands I
            // automaticBomb -> Frost Bomb
            // =============================================

            purchasedUpgrades =
                purchasedUpgrades.map(
                    upgradeId => {

                        if (
                            upgradeId ===
                            "fasterShooting"
                        ) {

                            return "quickHands1";

                        }


                        if (
                            upgradeId ===
                            "automaticBomb"
                        ) {

                            return "frostBomb";

                        }


                        return upgradeId;

                    }
                );


            purchasedUpgrades =
                [
                    ...new Set(
                        purchasedUpgrades
                    )
                ];


            purchasedUpgrades =
                purchasedUpgrades.filter(
                    upgradeId =>
                        UPGRADES[
                            upgradeId
                        ]
                );


            // =============================================
            // SELECTED WEAPON
            // =============================================

            let selectedWeapon =
                typeof parsed.selectedWeapon ===
                "string"
                    ? parsed.selectedWeapon
                    : "pistol";


            if (
                !WEAPONS[
                    selectedWeapon
                ]
            ) {

                selectedWeapon =
                    "pistol";

            }


            return {

                completedLevels,

                books,

                selectedWeapon,

                purchasedUpgrades

            };


        } catch (error) {

            console.error(

                "Story progress could not be loaded:",

                error

            );


            return createDefaultData();

        }

    }


    let data =
        loadData();


    // =====================================================
    // BOOK COUNTER
    // =====================================================

    function updateBookCounter() {

        const counter =
            document.getElementById(
                "book-count"
            );


        if (!counter) {

            return;

        }


        counter.textContent =
            String(
                data.books
            );

    }


    // =====================================================
    // DATA COPY
    // =====================================================

    function getData() {

        return {

            completedLevels: [
                ...data.completedLevels
            ],

            books:
                data.books,

            selectedWeapon:
                data.selectedWeapon,

            purchasedUpgrades: [
                ...data.purchasedUpgrades
            ]

        };

    }


    // =====================================================
    // SAVE
    // =====================================================

    function saveData() {

        localStorage.setItem(

            SAVE_KEY,

            JSON.stringify(
                data
            )

        );


        updateBookCounter();


        window.dispatchEvent(

            new CustomEvent(

                "story-progress-changed",

                {
                    detail:
                        getData()
                }

            )

        );

    }


    // =====================================================
    // LEVEL COMPLETED?
    // =====================================================

    function isLevelCompleted(
        levelNumber
    ) {

        levelNumber =
            Number(
                levelNumber
            );


        return data
            .completedLevels
            .includes(
                levelNumber
            );

    }


    // =====================================================
    // LEVEL UNLOCKED?
    // =====================================================

    function isLevelUnlocked(
        levelNumber
    ) {

        levelNumber =
            Number(
                levelNumber
            );


        if (
            !Number.isInteger(
                levelNumber
            ) ||
            levelNumber < 1 ||
            levelNumber > 50
        ) {

            return false;

        }


        // Level 1 is always available.

        if (
            levelNumber ===
            1
        ) {

            return true;

        }


        // Completed levels remain available.

        if (
            isLevelCompleted(
                levelNumber
            )
        ) {

            return true;

        }


        // Previous level must be completed.

        return isLevelCompleted(
            levelNumber - 1
        );

    }


    // =====================================================
    // HIGHEST COMPLETED LEVEL
    // =====================================================

    function getHighestCompletedLevel() {

        if (
            data.completedLevels.length ===
            0
        ) {

            return 0;

        }


        return Math.max(
            ...data.completedLevels
        );

    }


    // =====================================================
    // COMPLETE LEVEL
    // =====================================================

    function completeLevel(
        levelNumber
    ) {

        levelNumber =
            Number(
                levelNumber
            );


        if (
            !Number.isInteger(
                levelNumber
            ) ||
            levelNumber < 1 ||
            levelNumber > 50
        ) {

            return {

                success:
                    false,

                reason:
                    "invalid"

            };

        }


        if (
            !isLevelUnlocked(
                levelNumber
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "locked"

            };

        }


        // =============================================
        // REPLAY
        // =============================================

        if (
            isLevelCompleted(
                levelNumber
            )
        ) {

            return {

                success:
                    true,

                firstTime:
                    false,

                booksEarned:
                    0,

                weaponUnlocked:
                    null,

                highestCompletedLevel:
                    getHighestCompletedLevel()

            };

        }


        // =============================================
        // FIRST COMPLETION
        // =============================================

        data.completedLevels.push(
            levelNumber
        );


        data.completedLevels.sort(
            (a, b) =>
                a - b
        );


        data.books +=
            1;


        // =============================================
        // CHECK FOR WEAPON UNLOCK
        // =============================================

        let weaponUnlocked =
            null;


        for (
            const weapon
            of Object.values(
                WEAPONS
            )
        ) {

            if (
                weapon.unlockLevel ===
                levelNumber
            ) {

                weaponUnlocked =
                    weapon;

                break;

            }

        }


        saveData();


        return {

            success:
                true,

            firstTime:
                true,

            booksEarned:
                1,

            weaponUnlocked,

            highestCompletedLevel:
                getHighestCompletedLevel(),

            nextLevel:
                levelNumber < 50
                    ? levelNumber + 1
                    : null

        };

    }


    // =====================================================
    // BOOKS
    // =====================================================

    function getBooks() {

        return data.books;

    }


    // =====================================================
    // WEAPON UNLOCK
    // =====================================================

    function isWeaponUnlocked(
        weaponId
    ) {

        const weapon =
            WEAPONS[
                weaponId
            ];


        if (!weapon) {

            return false;

        }


        if (
            weapon.unlockLevel ===
            0
        ) {

            return true;

        }


        return isLevelCompleted(
            weapon.unlockLevel
        );

    }


    // =====================================================
    // SELECT WEAPON
    // =====================================================

    function selectWeapon(
        weaponId
    ) {

        if (
            !isWeaponUnlocked(
                weaponId
            )
        ) {

            return false;

        }


        data.selectedWeapon =
            weaponId;


        saveData();


        return true;

    }


    // =====================================================
    // GET SELECTED WEAPON
    // =====================================================

    function getSelectedWeapon() {

        const weapon =
            WEAPONS[
                data.selectedWeapon
            ];


        if (
            !weapon ||
            !isWeaponUnlocked(
                weapon.id
            )
        ) {

            data.selectedWeapon =
                "pistol";


            saveData();


            return WEAPONS.pistol;

        }


        return weapon;

    }


    // =====================================================
    // GET UPGRADE
    // =====================================================

    function getUpgrade(
        upgradeId
    ) {

        return (

            UPGRADES[
                upgradeId
            ] ||

            null

        );

    }


    // =====================================================
    // HAS UPGRADE
    // =====================================================

    function hasUpgrade(
        upgradeId
    ) {

        return data
            .purchasedUpgrades
            .includes(
                upgradeId
            );

    }


    // =====================================================
    // UPGRADE UNLOCKED?
    // =====================================================

    function isUpgradeUnlocked(
        upgradeId
    ) {

        const upgrade =
            getUpgrade(
                upgradeId
            );


        if (!upgrade) {

            return false;

        }


        if (
            upgrade.requires.length ===
            0
        ) {

            return true;

        }


        return upgrade
            .requires
            .every(
                requiredUpgradeId =>

                    hasUpgrade(
                        requiredUpgradeId
                    )
            );

    }


    // =====================================================
    // UPGRADE VISIBLE?
    // =====================================================

    function isUpgradeVisible(
        upgradeId
    ) {

        const upgrade =
            getUpgrade(
                upgradeId
            );


        if (!upgrade) {

            return false;

        }


        if (
            hasUpgrade(
                upgradeId
            )
        ) {

            return true;

        }


        return isUpgradeUnlocked(
            upgradeId
        );

    }


    // =====================================================
    // BUY UPGRADE
    // =====================================================

    function buyUpgrade(
        upgradeId
    ) {

        const upgrade =
            getUpgrade(
                upgradeId
            );


        if (!upgrade) {

            return {

                success:
                    false,

                reason:
                    "unknown"

            };

        }


        if (
            hasUpgrade(
                upgradeId
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "owned"

            };

        }


        if (
            !isUpgradeUnlocked(
                upgradeId
            )
        ) {

            return {

                success:
                    false,

                reason:
                    "locked"

            };

        }


        if (
            data.books <
            upgrade.cost
        ) {

            return {

                success:
                    false,

                reason:
                    "money"

            };

        }


        data.books -=
            upgrade.cost;


        data.purchasedUpgrades.push(
            upgradeId
        );


        saveData();


        return {

            success:
                true,

            upgrade

        };

    }


    // =====================================================
    // COMBAT MODIFIERS
    //
    // New modifier names are included.
    // Old bombInterval is also kept for compatibility.
    // =====================================================

    function getCombatModifiers() {

        let shootCooldownMultiplier =
            1;


        if (
            hasUpgrade(
                "quickHands1"
            )
        ) {

            shootCooldownMultiplier *=
                0.98;

        }


        if (
            hasUpgrade(
                "quickHands2"
            )
        ) {

            shootCooldownMultiplier *=
                0.96;

        }


        let bulletSizeMultiplier =
            1;


        if (
            hasUpgrade(
                "heavyAmmo1"
            )
        ) {

            bulletSizeMultiplier *=
                1.04;

        }


        if (
            hasUpgrade(
                "heavyAmmo2"
            )
        ) {

            bulletSizeMultiplier *=
                1.06;

        }


        const frostBombInterval =

            hasUpgrade(
                "frostBomb"
            )

                ? 20000

                : null;


        return {

            // =============================
            // BASIC
            // =============================

            shootCooldownMultiplier,

            bulletSizeMultiplier,


            // =============================
            // EXPLOSIVE
            // =============================

            explosiveEvery:

                hasUpgrade(
                    "chainRhythm"
                )

                    ? 10

                    : null,


            // =============================
            // FROST
            // =============================

            frostBombInterval,


            // Legacy name from the old system.
            // Kept so older combat code does not break.

            bombInterval:
                frostBombInterval,


            // =============================
            // RAPID FIRE
            // =============================

            doubleTap:

                hasUpgrade(
                    "doubleTap"
                ),


            splitBurst:

                hasUpgrade(
                    "splitBurst"
                ),


            critEvery:

                hasUpgrade(
                    "critLine"
                )

                    ? 15

                    : null,


            // =============================
            // PIERCING
            // =============================

            piercing:

                hasUpgrade(
                    "piercingTip"
                ),


            // =============================
            // LIGHTNING
            // =============================

            lightningEvery:

                hasUpgrade(
                    "shockPop"
                )

                    ? 12

                    : null

        };

    }


    // =====================================================
    // RESET
    // =====================================================

    function reset() {

        data =
            createDefaultData();


        saveData();


        console.log(
            "Story progress fully reset."
        );

    }


    // =====================================================
    // GLOBAL API
    // =====================================================

    window.StoryProgress = {

        WEAPONS,
        UPGRADES,

        getData,

        isLevelCompleted,
        isLevelUnlocked,

        completeLevel,

        getHighestCompletedLevel,

        getBooks,

        isWeaponUnlocked,
        selectWeapon,
        getSelectedWeapon,

        getUpgrade,
        hasUpgrade,
        isUpgradeUnlocked,
        isUpgradeVisible,
        buyUpgrade,

        getCombatModifiers,

        reset

    };


    // =====================================================
    // TEST HELPERS
    // =====================================================

    window.completeStoryLevel =
        completeLevel;


    window.resetStoryProgress =
        reset;


    updateBookCounter();

})();