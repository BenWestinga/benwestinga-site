(() => {

    const SAVE_KEY =
        "nieuw-spel-story-progress-v3";


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


    const UPGRADES = {

        quickHands1: {
            id: "quickHands1",
            name: "Quick Hands I",
            description:
                "+6% faster fire rate.",
            cost: 2,
            requires: [],
            x: 42,
            y: 48
        },

        heavyAmmo1: {
            id: "heavyAmmo1",
            name: "Heavy Ammo I",
            description:
                "+20% larger bullets.",
            cost: 2,
            requires: [],
            x: 58,
            y: 48
        },


        quickHands2: {
            id: "quickHands2",
            name: "Quick Hands II",
            description:
                "+4% faster fire rate.",
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
                "Every 6th attack fires twice as many bullets.",
            cost: 3,
            requires: [
                "quickHands2"
            ],
            x: 22,
            y: 27
        },

        splitBurst: {
            id: "splitBurst",
            name: "Split Burst",
            description:
                "Every 12th attack makes its main bullet burst into 3 full-damage bullets after 0.5 seconds, unless it hits an enemy first.",
            cost: 4,
            requires: [
                "quickHands2"
            ],
            x: 42,
            y: 27
        },

        critLine: {
            id: "critLine",
            name: "Crit Line",
            description:
                "Every 8th shot becomes a critical hit.",
            cost: 4,
            requires: [
                "splitBurst"
            ],
            x: 49,
            y: 37
        },

        overclockCore: {
            id: "overclockCore",
            name: "Overclock Core",
            description:
                "Critical hits deal 3x total damage instead of 2x.",
            cost: 4,
            requires: [
                "doubleTap",
                "splitBurst",
                "critLine"
            ],
            x: 32,
            y: 16
        },


        chainRhythm: {
            id: "chainRhythm",
            name: "Chain Rhythm",
            description:
                "Every 5th attack makes its main bullet explode and leave a brief damaging afterburn area.",
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
                "Explosion blast radius is doubled.",
            cost: 4,
            requires: [
                "chainRhythm"
            ],
            x: 18,
            y: 72
        },

        napalmDust: {
            id: "napalmDust",
            name: "Napalm Dust",
            description:
                "Afterburn areas from explosions last twice as long.",
            cost: 4,
            requires: [
                "chainRhythm"
            ],
            x: 33,
            y: 76
        },

        infernoPayload: {
            id: "infernoPayload",
            name: "Inferno Payload",
            description:
                "Explosion damage is doubled.",
            cost: 4,
            requires: [
                "blastExpert",
                "napalmDust"
            ],
            x: 21,
            y: 84
        },


        frostBomb: {
            id: "frostBomb",
            name: "Frost Bomb",
            description:
                "Every 10 seconds, an ice bomb targets the nearest enemy and freezes it for 2 seconds.",
            cost: 4,
            requires: [
                "quickHands1"
            ],
            x: 19,
            y: 49
        },

        deepFreeze: {
            id: "deepFreeze",
            name: "Deep Freeze",
            description:
                "Freeze effects last twice as long.",
            cost: 4,
            requires: [
                "frostBomb"
            ],
            x: 9,
            y: 37
        },

        coldShards: {
            id: "coldShards",
            name: "Cold Shards",
            description:
                "Frozen enemies take 2x damage.",
            cost: 4,
            requires: [
                "frostBomb"
            ],
            x: 9,
            y: 60
        },

        glacierReactor: {
            id: "glacierReactor",
            name: "Glacier Reactor",
            description:
                "Freeze duration and frozen-enemy damage are doubled again.",
            cost: 4,
            requires: [
                "deepFreeze",
                "coldShards"
            ],
            x: 9,
            y: 81
        },


        heavyAmmo2: {
            id: "heavyAmmo2",
            name: "Heavy Ammo II",
            description:
                "+12% larger bullets.",
            cost: 3,
            requires: [
                "heavyAmmo1"
            ],
            x: 67,
            y: 37
        },

        brutalForce: {
            id: "brutalForce",
            name: "Brutal Force",
            description:
                "+8% bullet damage.",
            cost: 4,
            requires: [
                "heavyAmmo2"
            ],
            x: 58,
            y: 27
        },

        bossHunter: {
            id: "bossHunter",
            name: "Boss Hunter",
            description:
                "+25% damage against bosses.",
            cost: 4,
            requires: [
                "heavyAmmo2"
            ],
            x: 78,
            y: 27
        },

        titanShells: {
            id: "titanShells",
            name: "Titan Shells",
            description:
                "Heavy Ammo size bonuses, Brutal Force, and Boss Hunter bonuses are doubled.",
            cost: 4,
            requires: [
                "brutalForce",
                "bossHunter"
            ],
            x: 68,
            y: 16
        },


        armorCrack: {
            id: "armorCrack",
            name: "Armor Crack",
            description:
                "Deal +15% damage to enemies with 8 or more HP or armor.",
            cost: 4,
            requires: [
                "heavyAmmo1"
            ],
            x: 69,
            y: 62
        },

        piercingTip: {
            id: "piercingTip",
            name: "Piercing Tip",
            description:
                "Bullets gain +2 pierce.",
            cost: 4,
            requires: [
                "armorCrack"
            ],
            x: 61,
            y: 75
        },

        railRounds: {
            id: "railRounds",
            name: "Rail Rounds",
            description:
                "After piercing an enemy, the bullet gains +15% damage for each enemy it has already pierced.",
            cost: 4,
            requires: [
                "piercingTip"
            ],
            x: 54,
            y: 84
        },

        returnShrapnel: {
            id: "returnShrapnel",
            name: "Return Shrapnel",
            description:
                "Piercing kills launch 4 shrapnel bullets.",
            cost: 4,
            requires: [
                "piercingTip"
            ],
            x: 72,
            y: 84
        },


        shockPop: {
            id: "shockPop",
            name: "Shock Pop",
            description:
                "Every 10 seconds, your next attack triggers chain lightning when it hits an enemy.",
            cost: 4,
            requires: [
                "heavyAmmo1"
            ],
            x: 81,
            y: 49
        },

        staticBuild: {
            id: "staticBuild",
            name: "Static Build",
            description:
                "Chain lightning can hit two additional enemies.",
            cost: 3,
            requires: [
                "shockPop"
            ],
            x: 90,
            y: 37
        },

        stormBurst: {
            id: "stormBurst",
            name: "Storm Burst",
            description:
                "Lightning hits have a 24% chance to create an electrical burst around the first target.",
            cost: 4,
            requires: [
                "shockPop"
            ],
            x: 90,
            y: 62
        },

        tempestCrown: {
            id: "tempestCrown",
            name: "Tempest Crown",
            description:
                "Chain lightning range is increased by 35%.",
            cost: 4,
            requires: [
                "staticBuild",
                "stormBurst"
            ],
            x: 90,
            y: 81
        }
    };


    function createDefaultData() {

        return {
            completedLevels: [],
            books: 0,
            selectedWeapon: "pistol",
            purchasedUpgrades: []
        };
    }


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
                JSON.parse(
                    saved
                );


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
                            Number.isInteger(
                                level
                            ) &&
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
                reason: "invalid"
            };
        }


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


        data.completedLevels.push(
            levelNumber
        );


        data.completedLevels.sort(
            (a, b) =>
                a - b
        );


        data.books +=
            2;


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
            booksEarned: 2,
            weaponUnlocked,

            highestCompletedLevel:
                getHighestCompletedLevel(),

            nextLevel:
                levelNumber < 50
                    ? levelNumber + 1
                    : null
        };
    }


    function getBooks() {

        return data.books;
    }


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
                requiredUpgradeId =>
                    hasUpgrade(
                        requiredUpgradeId
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
            !isUpgradeUnlocked(
                upgradeId
            )
        ) {

            return {
                success: false,
                reason: "locked"
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
            success: true,
            upgrade
        };
    }


    function getCombatModifiers() {

        let fireRatePercent =
            0;


        if (
            hasUpgrade(
                "quickHands1"
            )
        ) {

            fireRatePercent +=
                6;
        }


        if (
            hasUpgrade(
                "quickHands2"
            )
        ) {

            fireRatePercent +=
                4;
        }


        let bulletSizePercent =
            0;


        if (
            hasUpgrade(
                "heavyAmmo1"
            )
        ) {

            bulletSizePercent +=
                20;
        }


        if (
            hasUpgrade(
                "heavyAmmo2"
            )
        ) {

            bulletSizePercent +=
                12;
        }


        let damagePercent =
            0;


        if (
            hasUpgrade(
                "brutalForce"
            )
        ) {

            damagePercent +=
                8;
        }


        let pierceBonus =
            0;


        if (
            hasUpgrade(
                "piercingTip"
            )
        ) {

            pierceBonus +=
                2;
        }


        const frostBombInterval =
            hasUpgrade(
                "frostBomb"
            )
                ? 10000
                : null;


        return {

            fireRatePercent,

            shootCooldownMultiplier:
                1 /
                (
                    1 +
                    fireRatePercent /
                    100
                ),

            bulletSizePercent,

            damagePercent,

            pierceBonus,


            explosiveEvery:
                hasUpgrade(
                    "chainRhythm"
                )
                    ? 5
                    : null,


            explosionRadiusMultiplier:
                hasUpgrade(
                    "blastExpert"
                )
                    ? 2
                    : 1,


            napalmDurationMultiplier:
                hasUpgrade(
                    "napalmDust"
                )
                    ? 2
                    : 1,


            explosionDamageMultiplier:
                hasUpgrade(
                    "infernoPayload"
                )
                    ? 2
                    : 1,


            frostBombInterval,

            bombInterval:
                frostBombInterval,


            frostFreezeDuration:
                hasUpgrade(
                    "frostBomb"
                )
                    ? 2
                    : 0,


            deepFreezeMultiplier:
                hasUpgrade(
                    "deepFreeze"
                )
                    ? 2
                    : 1,


            frozenDamageMultiplier:
                hasUpgrade(
                    "coldShards"
                )
                    ? 2
                    : 1,


            glacierReactorMultiplier:
                hasUpgrade(
                    "glacierReactor"
                )
                    ? 2
                    : 1,


            doubleTap:
                hasUpgrade(
                    "doubleTap"
                ),


            doubleTapEvery:
                hasUpgrade(
                    "doubleTap"
                )
                    ? 6
                    : null,


            splitBurst:
                hasUpgrade(
                    "splitBurst"
                ),


            splitBurstEvery:
                hasUpgrade(
                    "splitBurst"
                )
                    ? 12
                    : null,


            splitBurstDelay:
                hasUpgrade(
                    "splitBurst"
                )
                    ? 0.5
                    : null,


            splitBurstCount:
                hasUpgrade(
                    "splitBurst"
                )
                    ? 3
                    : null,


            critEvery:
                hasUpgrade(
                    "critLine"
                )
                    ? 8
                    : null,


            overclockMultiplier:
                hasUpgrade(
                    "overclockCore"
                )
                    ? 2
                    : 1,


            bossDamageMultiplier:
                hasUpgrade(
                    "bossHunter"
                )
                    ? 1.25
                    : 1,


            armorCrackDamageMultiplier:
                hasUpgrade(
                    "armorCrack"
                )
                    ? 1.15
                    : 1,


            piercing:
                hasUpgrade(
                    "piercingTip"
                ),


            railRoundsBonusPerHit:
                hasUpgrade(
                    "railRounds"
                )
                    ? 0.15
                    : 0,


            shrapnelMultiplier:
                hasUpgrade(
                    "returnShrapnel"
                )
                    ? 2
                    : 1,


            titanShellsMultiplier:
                hasUpgrade(
                    "titanShells"
                )
                    ? 2
                    : 1,


            shockPop:
                hasUpgrade(
                    "shockPop"
                ),


            shockPopInterval:
                hasUpgrade(
                    "shockPop"
                )
                    ? 10000
                    : null,


            lightningExtraTargets:
                hasUpgrade(
                    "staticBuild"
                )
                    ? 2
                    : 0,


            stormBurstMultiplier:
                hasUpgrade(
                    "stormBurst"
                )
                    ? 2
                    : 1,


            lightningRangeMultiplier:
                hasUpgrade(
                    "tempestCrown"
                )
                    ? 1.35
                    : 1
        };
    }


    function reset() {

        data =
            createDefaultData();


        saveData();


        console.log(
            "Story progress fully reset."
        );
    }


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


    window.completeStoryLevel =
        completeLevel;


    window.resetStoryProgress =
        reset;


    updateBookCounter();

})();