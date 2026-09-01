(() => {

    const SAVE_KEY =
        "nieuw-spel-story-progress-v2";


    // =====================================================
    // WEAPENS
    // =====================================================

    const WEAPONS = {

        pistol: {
            id: "pistol",
            name: "Pistol",
            unlockLevel: 0,
            image: null
        },

        smg4: {
            id: "smg4",
            name: "SMG4",
            unlockLevel: 10,
            image: null
        },

        shotgun: {
            id: "shotgun",
            name: "Shotgun",
            unlockLevel: 20,
            image: null
        },

        huntingRifle: {
            id: "huntingRifle",
            name: "Hunting Rifle",
            unlockLevel: 30,
            image: null
        },

        ak: {
            id: "ak",
            name: "AK",
            unlockLevel: 40,
            image: null
        }

    };


    // =====================================================
    // UPGRADES
    // =====================================================

    const UPGRADES = {

        fasterShooting: {

            id: "fasterShooting",

            name: "Fast Trigger",

            description:
                "Je schiet 10% sneller.",

            cost: 3
        },


        automaticBomb: {

            id: "automaticBomb",

            name: "Automatic Bomb",

            description:
                "Iedere 10 seconden wordt automatisch een bom gebruikt.",

            cost: 5
        }

    };


    // =====================================================
    // DEFAULT SAVE
    // =====================================================

    function createDefaultData() {

        return {

            completedLevels: [],

            books: 0,

            selectedWeapon: "pistol",

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
                [...new Set(completedLevels)]
                    .sort(
                        (a, b) => a - b
                    );


            let books =
                Number(parsed.books);


            if (
                !Number.isFinite(books) ||
                books < 0
            ) {

                books = 0;
            }


            return {

                completedLevels,

                books,

                selectedWeapon:
                    typeof parsed.selectedWeapon ===
                    "string"
                        ? parsed.selectedWeapon
                        : "pistol",

                purchasedUpgrades:
                    Array.isArray(
                        parsed.purchasedUpgrades
                    )
                        ? [
                            ...new Set(
                                parsed.purchasedUpgrades
                            )
                        ]
                        : []

            };

        } catch (error) {

            console.error(
                "Story progress kon niet worden geladen:",
                error
            );


            return createDefaultData();
        }

    }


    let data =
        loadData();


    // =====================================================
    // UI
    // =====================================================

    function updateBookCounter() {

        const counter =
            document.getElementById(
                "book-count"
            );


        if (counter) {

            counter.textContent =
                String(data.books);
        }

    }


    // =====================================================
    // SAVE
    // =====================================================

    function saveData() {

        localStorage.setItem(

            SAVE_KEY,

            JSON.stringify(data)

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
    // DATA KOPIE
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
    // LEVEL COMPLETED?
    // =====================================================

    function isLevelCompleted(
        levelNumber
    ) {

        levelNumber =
            Number(levelNumber);


        return data.completedLevels
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
            Number(levelNumber);


        if (
            !Number.isInteger(
                levelNumber
            ) ||
            levelNumber < 1 ||
            levelNumber > 50
        ) {

            return false;
        }


        // LEVEL 1 ALTIJD OPEN

        if (levelNumber === 1) {

            return true;
        }


        // AL GEHAALD = BLIJFT OPEN

        if (
            isLevelCompleted(
                levelNumber
            )
        ) {

            return true;
        }


        // VORIGE LEVEL MOET GEHAALD ZIJN

        return isLevelCompleted(
            levelNumber - 1
        );

    }


    // =====================================================
    // HOOGSTE GEHAALDE LEVEL
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
    // LEVEL VOLTOOIEN
    // =====================================================

    function completeLevel(
        levelNumber
    ) {

        levelNumber =
            Number(levelNumber);


        if (
            !Number.isInteger(
                levelNumber
            ) ||
            levelNumber < 1 ||
            levelNumber > 50
        ) {

            return {

                success: false,

                reason: "invalid"

            };

        }


        // Je kunt niet via code zomaar
        // level 40 halen als 39 niet open is.

        if (
            !isLevelUnlocked(
                levelNumber
            )
        ) {

            return {

                success: false,

                reason: "locked"

            };

        }


        // =================================
        // REPLAY
        // =================================

        if (
            isLevelCompleted(
                levelNumber
            )
        ) {

            return {

                success: true,

                firstTime: false,

                booksEarned: 0,

                weaponUnlocked: null,

                highestCompletedLevel:
                    getHighestCompletedLevel()

            };

        }


        // =================================
        // EERSTE KEER GEHAALD
        // =================================

        data.completedLevels.push(
            levelNumber
        );


        data.completedLevels.sort(
            (a, b) =>
                a - b
        );


        // ÉÉN BOEKJE

        data.books += 1;


        // =================================
        // WAPEN UNLOCK
        // =================================

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

            success: true,

            firstTime: true,

            booksEarned: 1,

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
    // BOEKJES
    // =====================================================

    function getBooks() {

        return data.books;
    }


    // =====================================================
    // WAPEN UNLOCKED?
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
    // WAPEN SELECTEREN
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
    // UPGRADES
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


    function buyUpgrade(
        upgradeId
    ) {

        const upgrade =
            UPGRADES[
                upgradeId
            ];


        if (!upgrade) {

            return {

                success: false,

                reason: "unknown"

            };

        }


        if (
            hasUpgrade(
                upgradeId
            )
        ) {

            return {

                success: false,

                reason: "owned"

            };

        }


        if (
            data.books <
            upgrade.cost
        ) {

            return {

                success: false,

                reason: "money"

            };

        }


        data.books -=
            upgrade.cost;


        data.purchasedUpgrades.push(
            upgradeId
        );


        saveData();


        return {

            success: true

        };

    }


    // =====================================================
    // COMBAT MODIFIERS
    // =====================================================

    function getCombatModifiers() {

        return {

            shootCooldownMultiplier:
                hasUpgrade(
                    "fasterShooting"
                )
                    ? 0.90
                    : 1,


            bombInterval:
                hasUpgrade(
                    "automaticBomb"
                )
                    ? 10000
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
            "Story progress volledig gereset."
        );

    }


    // =====================================================
    // GLOBAL
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

        hasUpgrade,
        buyUpgrade,

        getCombatModifiers,

        reset

    };


    updateBookCounter();

})();