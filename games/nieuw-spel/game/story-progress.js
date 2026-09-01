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
    // Totale prijs van ALLE upgrades samen:
    // 100 boekjes
    // =====================================================

    const UPGRADES = {


        // =================================================
        // START
        // =================================================

        quickHands1: {

            id: "quickHands1",

            name: "Quick Hands I",

            description:
                "+2% sneller schieten.",

            cost: 2,

            requires: [],

            x: 42,
            y: 48
        },


        heavyAmmo1: {

            id: "heavyAmmo1",

            name: "Heavy Ammo I",

            description:
                "+4% grotere kogels.",

            cost: 2,

            requires: [],

            x: 58,
            y: 48
        },


        // =================================================
        // SNELHEID / LINKSBOVEN
        // =================================================

        quickHands2: {

            id: "quickHands2",

            name: "Quick Hands II",

            description:
                "Je vuursnelheid wordt nog iets hoger.",

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
                "Sommige schoten vuren direct een extra kogel af.",

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
                "Af en toe ontstaan twee kleine extra kogels naast je normale schot.",

            cost: 4,

            requires: [
                "quickHands2"
            ],

            x: 42,
            y: 18
        },


        overclockCore: {

            id: "overclockCore",

            name: "Overclock Core",

            description:
                "Sterke eindupgrade voor een snelle-fire build.",

            cost: 4,

            requires: [
                "doubleTap",
                "splitBurst"
            ],

            x: 32,
            y: 7
        },


        // =================================================
        // EXPLOSIES / LINKSONDER
        // =================================================

        chainRhythm: {

            id: "chainRhythm",

            name: "Chain Rhythm",

            description:
                "Elke 10e kogel veroorzaakt een lichte explosie.",

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
                "Explosies krijgen een grotere radius.",

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
                "Explosies laten kort een schadelijk gebied achter.",

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
                "Sterke eindupgrade voor explosieve aanvallen.",

            cost: 4,

            requires: [
                "blastExpert",
                "napalmDust"
            ],

            x: 20,
            y: 91
        },


        // =================================================
        // IJS / HELEMAAL LINKS
        // =================================================

        frostBomb: {

            id: "frostBomb",

            name: "Frost Bomb",

            description:
                "Elke 20 seconden valt een ijsbom op de dichtstbijzijnde enemy en bevriest die 1 seconde.",

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
                "Enemies blijven langer bevroren.",

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
                "Bevroren enemies krijgen extra damage.",

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
                "Sterke eindupgrade voor de freeze-build.",

            cost: 4,

            requires: [
                "deepFreeze",
                "coldShards"
            ],

            x: 5,
            y: 76
        },


        // =================================================
        // HEAVY / RECHTSBOVEN
        // =================================================

        heavyAmmo2: {

            id: "heavyAmmo2",

            name: "Heavy Ammo II",

            description:
                "Je kogels worden nog groter.",

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
                "Je kogels doen iets meer algemene damage.",

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
                "Je doet extra damage tegen bosses.",

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
                "Sterke eindupgrade voor zware kogels en brute damage.",

            cost: 4,

            requires: [
                "brutalForce",
                "bossHunter"
            ],

            x: 68,
            y: 7
        },


        // =================================================
        // PIERCING / RECHTSONDER
        // =================================================

        armorCrack: {

            id: "armorCrack",

            name: "Armor Crack",

            description:
                "Sterkere enemies verliezen sneller hun bescherming.",

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
                "Sommige kogels vliegen door een enemy heen.",

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
                "Piercing kogels behouden meer kracht nadat ze een enemy raken.",

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
                "Een kill met een piercing kogel schiet kleine scherven weg.",

            cost: 4,

            requires: [
                "piercingTip"
            ],

            x: 72,
            y: 90
        },


        // =================================================
        // ELECTRIC / HELEMAAL RECHTS
        // =================================================

        shockPop: {

            id: "shockPop",

            name: "Shock Pop",

            description:
                "Elke 12e kogel veroorzaakt kleine chain lightning.",

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
                "Chain lightning kan één extra enemy raken.",

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
                "Soms ontstaat een elektrische burst rondom de geraakte enemy.",

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
                "Sterke eindupgrade voor de lightning-build.",

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
                        (a, b) =>
                            a - b
                    );


            let books =
                Number(
                    parsed.books
                );


            if (
                !Number.isFinite(books) ||
                books < 0
            ) {

                books = 0;

            }


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


            // Oude test-upgrades omzetten
            // zodat oude saves niet fout gaan.

            purchasedUpgrades =
                purchasedUpgrades.map(
                    id => {

                        if (
                            id ===
                            "fasterShooting"
                        ) {

                            return "quickHands1";

                        }


                        if (
                            id ===
                            "automaticBomb"
                        ) {

                            return "frostBomb";

                        }


                        return id;

                    }
                );


            purchasedUpgrades =
                purchasedUpgrades.filter(
                    id =>
                        UPGRADES[id]
                );


            return {

                completedLevels,

                books,

                selectedWeapon:
                    typeof parsed.selectedWeapon ===
                    "string"
                        ? parsed.selectedWeapon
                        : "pistol",

                purchasedUpgrades

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
                String(
                    data.books
                );

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
    // LEVEL COMPLETED
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
    // LEVEL UNLOCKED
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


        if (
            levelNumber === 1
        ) {

            return true;

        }


        if (
            isLevelCompleted(
                levelNumber
            )
        ) {

            return true;

        }


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

                success: false,

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

                success: false,

                reason:
                    "locked"

            };

        }


        // REPLAY

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


        // EERSTE KEER

        data.completedLevels.push(
            levelNumber
        );


        data.completedLevels.sort(
            (a, b) =>
                a - b
        );


        data.books += 1;


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
    // WEAPONS
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

    function getUpgrade(
        upgradeId
    ) {

        return UPGRADES[
            upgradeId
        ] || null;

    }


    function hasUpgrade(
        upgradeId
    ) {

        return data
            .purchasedUpgrades
            .includes(
                upgradeId
            );

    }


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
                requiredId =>
                    hasUpgrade(
                        requiredId
                    )
            );

    }


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


    function buyUpgrade(
        upgradeId
    ) {

        const upgrade =
            getUpgrade(
                upgradeId
            );


        if (!upgrade) {

            return {

                success: false,

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

                success: false,

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

                success: false,

                reason:
                    "locked"

            };

        }


        if (
            data.books <
            upgrade.cost
        ) {

            return {

                success: false,

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

            success: true,

            upgrade

        };

    }


    // =====================================================
    // COMBAT MODIFIERS
    //
    // Deze worden later daadwerkelijk
    // door combat.js gebruikt.
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


        return {

            shootCooldownMultiplier,

            bulletSizeMultiplier,

            explosiveEvery:
                hasUpgrade(
                    "chainRhythm"
                )
                    ? 10
                    : null,

            frostBombInterval:
                hasUpgrade(
                    "frostBomb"
                )
                    ? 20000
                    : null,

            doubleTap:
                hasUpgrade(
                    "doubleTap"
                ),

            piercing:
                hasUpgrade(
                    "piercingTip"
                ),

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

        getUpgrade,
        hasUpgrade,
        isUpgradeUnlocked,
        isUpgradeVisible,
        buyUpgrade,

        getCombatModifiers,

        reset

    };


    // Voor tijdelijk testen vanuit console

    window.completeStoryLevel =
        completeLevel;

    window.resetStoryProgress =
        reset;


    updateBookCounter();

})();