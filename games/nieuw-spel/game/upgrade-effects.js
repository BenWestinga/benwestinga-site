(() => {
    const lightningLines = [];
    const explosionVisuals = [];
    const napalmZones = [];
    const frostProjectiles = [];
    const frostBursts = [];
    const electricBursts = [];
    const frozenEnemies = new Set();

    let modifiers = {};
    let shotCounter = 0;
    let frostTimerMs = 0;

    const BASE_EXPLOSION_RADIUS = 68;
    const BASE_EXPLOSION_DAMAGE_FACTOR = 0.75;
    const BASE_NAPALM_DURATION = 0.75;
    const BASE_NAPALM_TICK = 0.25;
    const BASE_NAPALM_DAMAGE_FACTOR = 0.10;
    const BASE_LIGHTNING_RANGE = 210;
    const BASE_LIGHTNING_DAMAGE_FACTOR = 0.70;
    const BASE_STORM_BURST_CHANCE = 0.12;
    const BASE_STORM_BURST_RADIUS = 105;
    const BASE_STORM_BURST_DAMAGE_FACTOR = 0.45;

    function numberModifier(
        name,
        fallback
    ) {

        const value =
            Number(
                modifiers?.[
                    name
                ]
            );

        return Number.isFinite(
            value
        )
            ? value
            : fallback;
    }


    function booleanModifier(
        name
    ) {

        return modifiers?.[
            name
        ] === true;
    }


    function clearEnemyFreeze(
        enemy
    ) {

        if (!enemy) {
            return;
        }

        enemy.upgradeFreezeRemaining =
            0;

        frozenEnemies.delete(
            enemy
        );
    }


    function clearTransient() {

        lightningLines.length =
            0;

        explosionVisuals.length =
            0;

        napalmZones.length =
            0;

        frostProjectiles.length =
            0;

        frostBursts.length =
            0;

        electricBursts.length =
            0;


        for (
            const enemy
            of frozenEnemies
        ) {

            if (enemy) {

                enemy.upgradeFreezeRemaining =
                    0;
            }
        }


        frozenEnemies.clear();
    }


    function reset() {

        shotCounter =
            0;

        frostTimerMs =
            0;

        clearTransient();
    }


    function configure(
        nextModifiers = {}
    ) {

        modifiers =
            nextModifiers ||
            {};

        reset();
    }


    function isEnemyFrozen(
        enemy
    ) {

        return Number(
            enemy?.upgradeFreezeRemaining
        ) > 0;
    }


    function getTitanMultiplier() {

        return Math.max(
            1,

            numberModifier(
                "titanShellsMultiplier",
                1
            )
        );
    }


    function modifyWeaponStats(
        baseStats
    ) {

        if (!baseStats) {

            return null;
        }


        const titan =
            getTitanMultiplier();


        const fireRatePercent =
            numberModifier(
                "fireRatePercent",
                0
            );


        const bulletSizePercent =

            numberModifier(
                "bulletSizePercent",
                0
            ) *

            titan;


        const damagePercent =

            numberModifier(
                "damagePercent",
                0
            ) *

            titan;


        const pierceBonus =
            numberModifier(
                "pierceBonus",
                0
            );


        return {

            ...baseStats,


            shotsPerSecond:

                baseStats
                    .shotsPerSecond *

                (
                    1 +
                    fireRatePercent /
                    100
                ),


            damage:

                baseStats.damage *

                (
                    1 +
                    damagePercent /
                    100
                ),


            pierce:

                Math.max(

                    1,

                    Math.round(

                        baseStats.pierce +

                        pierceBonus
                    )
                ),


            bulletRadius:

                baseStats
                    .bulletRadius *

                (
                    1 +
                    bulletSizePercent /
                    100
                )
        };
    }


    function cloneProjectile(
        projectile,
        overrides = {}
    ) {

        return {

            ...projectile,

            ...overrides,

            hitEnemyIds:
                new Set()
        };
    }


    function getCritMultiplier() {

        const overclock =
            Math.max(

                1,

                numberModifier(
                    "overclockMultiplier",
                    1
                )
            );


        return (
            1 +
            overclock
        );
    }


    function prepareVolley({
        projectiles,
        baseAngle
    }) {

        const result =
            projectiles.map(
                projectile =>
                    cloneProjectile(
                        projectile
                    )
            );


        if (
            result.length ===
            0
        ) {

            return result;
        }


        shotCounter++;


        const critEvery =
            numberModifier(
                "critEvery",
                NaN
            );


        const explosiveEvery =
            numberModifier(
                "explosiveEvery",
                NaN
            );


        const isCrit =

            Number.isFinite(
                critEvery
            ) &&

            critEvery >
                0 &&

            shotCounter %
                critEvery ===
                0;


        if (isCrit) {

            const critMultiplier =
                getCritMultiplier();


            for (
                const projectile
                of result
            ) {

                projectile.damage *=
                    critMultiplier;


                projectile.isCrit =
                    true;


                projectile.color =
                    "#ffcf3f";


                projectile.glowColor =
                    "rgba(255,205,50,0.85)";
            }
        }


        const carrierIndex =

            Math.min(

                result.length -
                    1,

                Math.floor(
                    result.length /
                    2
                )
            );


        const carrier =
            result[
                carrierIndex
            ];


        if (

            Number.isFinite(
                explosiveEvery
            ) &&

            explosiveEvery >
                0 &&

            shotCounter %
                explosiveEvery ===
                0
        ) {

            carrier.isExplosive =
                true;


            carrier.color =
                "#ff8a2b";


            carrier.glowColor =
                "rgba(255,120,25,0.82)";
        }


        /*
            SHOCK POP

            Every 8th attack turns the
            entire normal volley electric.

            This is attack based, not
            projectile based. A shotgun
            therefore makes every pellet
            from that 8th attack electric.
        */

        const shockPopEvery =
            numberModifier(
                "shockPopEvery",
                NaN
            );


        const isShockPopAttack =

            booleanModifier(
                "shockPop"
            ) &&

            Number.isFinite(
                shockPopEvery
            ) &&

            shockPopEvery >
                0 &&

            shotCounter %
                shockPopEvery ===
                0;


        if (
            isShockPopAttack
        ) {

            for (
                const projectile
                of result
            ) {

                projectile.isLightning =
                    true;


                projectile.color =
                    "#ffe75a";


                projectile.glowColor =
                    "rgba(255,235,60,0.95)";
            }
        }


        /*
            DOUBLE TAP

            Attack:
            6
            12
            18
            24
            ...

            fires one complete extra
            copy of the normal volley.
        */

        const doubleTapEvery =
            numberModifier(
                "doubleTapEvery",
                NaN
            );


        if (

            booleanModifier(
                "doubleTap"
            ) &&

            Number.isFinite(
                doubleTapEvery
            ) &&

            doubleTapEvery >
                0 &&

            shotCounter %
                doubleTapEvery ===
                0
        ) {

            const originals =
                [
                    ...result
                ];


            for (
                const projectile
                of originals
            ) {

                result.push(

                    cloneProjectile(

                        projectile,

                        {
                            isDoubleTap:
                                true,

                            splitBurstPending:
                                false,

                            isSplitBurstCarrier:
                                false
                        }
                    )
                );
            }
        }


        /*
            SPLIT BURST

            Attack:
            12
            24
            36
            ...

            The main projectile receives
            a 0.5 second timer.

            If it hits an enemy before
            the timer finishes, nothing
            special happens.

            If it is still flying after
            0.5 seconds, it disappears
            and becomes 3 bullets.
        */

        const splitBurstEvery =
            numberModifier(
                "splitBurstEvery",
                NaN
            );


        if (

            booleanModifier(
                "splitBurst"
            ) &&

            Number.isFinite(
                splitBurstEvery
            ) &&

            splitBurstEvery >
                0 &&

            shotCounter %
                splitBurstEvery ===
                0
        ) {

            carrier.splitBurstPending =
                true;


            carrier.isSplitBurstCarrier =
                true;


            carrier.splitBurstElapsed =
                0;


            carrier.splitBurstDelay =

                Math.max(

                    0.01,

                    numberModifier(
                        "splitBurstDelay",
                        0.5
                    )
                );


            carrier.splitBurstCount =

                Math.max(

                    3,

                    Math.round(

                        numberModifier(
                            "splitBurstCount",
                            3
                        )
                    )
                );


            if (

                !carrier.isCrit &&

                !carrier.isExplosive &&

                !carrier.isLightning
            ) {

                carrier.color =
                    "#735cff";


                carrier.glowColor =
                    "rgba(125,95,255,0.78)";
            }
        }


        return result;
    }


    function getBossMultiplier(
        enemy
    ) {

        const isBoss =

            enemy
                ?.isBoss ===
            true ||

            enemy
                ?.definition
                ?.boss ===
            true;


        if (!isBoss) {

            return 1;
        }


        const raw =
            Math.max(

                1,

                numberModifier(
                    "bossDamageMultiplier",
                    1
                )
            );


        const titan =
            getTitanMultiplier();


        const bonus =
            raw -
            1;


        return (
            1 +
            bonus *
            titan
        );
    }


    function getArmorCrackMultiplier(
        enemy
    ) {

        const raw =
            Math.max(

                1,

                numberModifier(
                    "armorCrackDamageMultiplier",
                    1
                )
            );


        if (
            raw <=
            1
        ) {

            return 1;
        }


        const strongEnemy =

            Number(
                enemy?.maxHp
            ) >= 8 ||

            enemy?.armor ===
                true ||

            enemy
                ?.classes
                ?.includes
                ?.(
                    "armor"
                );


        return strongEnemy
            ? raw
            : 1;
    }


    function getFrozenDamageMultiplier(
        enemy
    ) {

        if (
            !isEnemyFrozen(
                enemy
            )
        ) {

            return 1;
        }


        const frozenMultiplier =
            Math.max(

                1,

                numberModifier(
                    "frozenDamageMultiplier",
                    1
                )
            );


        const glacier =
            Math.max(

                1,

                numberModifier(
                    "glacierReactorMultiplier",
                    1
                )
            );


        return (
            frozenMultiplier *
            glacier
        );
    }


    function getPierceDamageMultiplier(
        bullet
    ) {

        if (
            !bullet ||
            bullet.isShrapnel
        ) {

            return 1;
        }


        const previousHits =
            Math.max(

                0,

                Number(
                    bullet
                        .pierceHitCount
                ) ||
                0
            );


        if (

            previousHits <=
                0 ||

            Number(
                bullet
                    .initialPierce
            ) <=
                1
        ) {

            return 1;
        }


        const bonusPerPreviousHit =
            Math.max(

                0,

                numberModifier(
                    "railRoundsBonusPerHit",
                    0
                )
            );


        if (
            bonusPerPreviousHit <=
            0
        ) {

            return 1;
        }


        return (
            1 +
            previousHits *
            bonusPerPreviousHit
        );
    }


    function modifyHitDamage({

        enemy,

        bullet,

        damage,

        includePierce =
            true

    }) {

        let finalDamage =
            Number(
                damage
            ) ||
            0;


        finalDamage *=
            getBossMultiplier(
                enemy
            );


        finalDamage *=
            getArmorCrackMultiplier(
                enemy
            );


        finalDamage *=
            getFrozenDamageMultiplier(
                enemy
            );


        if (
            includePierce
        ) {

            finalDamage *=
                getPierceDamageMultiplier(
                    bullet
                );
        }


        return finalDamage;
    }


    function isTargetProtected(
        enemy,
        isGuardianShielded
    ) {

        return Boolean(

            isGuardianShielded
                ?.(
                    enemy
                )
        );
    }


    function dealEffectDamage({

        enemy,

        damage,

        bullet,

        damageEnemy,

        isGuardianShielded

    }) {

        if (

            !enemy ||

            Number(
                enemy.hp
            ) <=
            0
        ) {

            return;
        }


        if (
            isTargetProtected(

                enemy,

                isGuardianShielded
            )
        ) {

            return;
        }


        const finalDamage =
            modifyHitDamage({

                enemy,

                bullet,

                damage,

                includePierce:
                    false
            });


        damageEnemy(
            enemy,
            finalDamage
        );
    }


    function addExplosionVisual(
        x,
        y,
        radius
    ) {

        explosionVisuals.push({

            x,

            y,

            radius,

            remaining:
                0.24,

            maxRemaining:
                0.24
        });
    }


    function triggerExplosion({

        x,

        y,

        bullet,

        enemies,

        damageEnemy,

        isGuardianShielded

    }) {

        const radius =

            BASE_EXPLOSION_RADIUS *

            Math.max(

                1,

                numberModifier(
                    "explosionRadiusMultiplier",
                    1
                )
            );


        const damage =

            bullet.damage *

            BASE_EXPLOSION_DAMAGE_FACTOR *

            Math.max(

                1,

                numberModifier(
                    "explosionDamageMultiplier",
                    1
                )
            );


        addExplosionVisual(
            x,
            y,
            radius
        );


        const snapshot =
            [
                ...enemies
            ];


        for (
            const enemy
            of snapshot
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0
            ) {

                continue;
            }


            const distance =
                Math.hypot(

                    enemy.x -
                    x,

                    enemy.y -
                    y
                );


            if (
                distance >
                radius +
                enemy.radius
            ) {

                continue;
            }


            dealEffectDamage({

                enemy,

                damage,

                bullet,

                damageEnemy,

                isGuardianShielded
            });
        }


        const napalmMultiplier =
            Math.max(

                1,

                numberModifier(
                    "napalmDurationMultiplier",
                    1
                )
            );


        const duration =

            BASE_NAPALM_DURATION *

            napalmMultiplier;


        napalmZones.push({

            x,

            y,

            radius:
                radius *
                0.72,

            remaining:
                duration,

            maxRemaining:
                duration,

            tickTimer:
                0,

            damage:

                bullet.damage *

                BASE_NAPALM_DAMAGE_FACTOR,

            bullet
        });
    }


    function chooseNearestEnemy(
        origin,
        enemies,
        excluded,
        maxRange
    ) {

        let best =
            null;


        let bestDistance =
            Infinity;


        for (
            const enemy
            of enemies
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0 ||

                excluded.has(
                    enemy
                )
            ) {

                continue;
            }


            const distance =
                Math.hypot(

                    enemy.x -
                    origin.x,

                    enemy.y -
                    origin.y
                );


            if (

                distance <=
                    maxRange &&

                distance <
                    bestDistance
            ) {

                best =
                    enemy;


                bestDistance =
                    distance;
            }
        }


        return best;
    }


    function addLightningLine(
        from,
        to
    ) {

        lightningLines.push({

            x1:
                from.x,

            y1:
                from.y,

            x2:
                to.x,

            y2:
                to.y,

            remaining:
                0.14,

            maxRemaining:
                0.14
        });
    }


    function triggerStormBurst({

        center,

        bullet,

        enemies,

        damageEnemy,

        isGuardianShielded

    }) {

        const radius =
            BASE_STORM_BURST_RADIUS;


        electricBursts.push({

            x:
                center.x,

            y:
                center.y,

            radius,

            remaining:
                0.22,

            maxRemaining:
                0.22
        });


        const snapshot =
            [
                ...enemies
            ];


        for (
            const enemy
            of snapshot
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0
            ) {

                continue;
            }


            const distance =
                Math.hypot(

                    enemy.x -
                    center.x,

                    enemy.y -
                    center.y
                );


            if (
                distance >
                radius +
                enemy.radius
            ) {

                continue;
            }


            dealEffectDamage({

                enemy,

                damage:

                    bullet.damage *

                    BASE_STORM_BURST_DAMAGE_FACTOR,

                bullet,

                damageEnemy,

                isGuardianShielded
            });
        }
    }


    function triggerLightning({

        startEnemy,

        bullet,

        enemies,

        damageEnemy,

        isGuardianShielded

    }) {

        const rangeMultiplier =
            Math.max(

                1,

                numberModifier(
                    "lightningRangeMultiplier",
                    1
                )
            );


        const range =

            BASE_LIGHTNING_RANGE *

            rangeMultiplier;


        const extraTargets =

            1 +

            Math.max(

                0,

                Math.round(

                    numberModifier(
                        "lightningExtraTargets",
                        0
                    )
                )
            );


        /*
            Tempest Crown only
            increases lightning range.

            It does NOT increase
            lightning damage.
        */

        const lightningDamage =

            bullet.damage *

            BASE_LIGHTNING_DAMAGE_FACTOR;


        const excluded =
            new Set(
                [
                    startEnemy
                ]
            );


        let current =
            startEnemy;


        for (
            let i = 0;

            i <
            extraTargets;

            i++
        ) {

            const next =
                chooseNearestEnemy(

                    current,

                    enemies,

                    excluded,

                    range
                );


            if (!next) {

                break;
            }


            if (
                isTargetProtected(

                    next,

                    isGuardianShielded
                )
            ) {

                excluded.add(
                    next
                );

                continue;
            }


            addLightningLine(
                current,
                next
            );


            dealEffectDamage({

                enemy:
                    next,

                damage:
                    lightningDamage,

                bullet,

                damageEnemy,

                isGuardianShielded
            });


            excluded.add(
                next
            );


            current =
                next;
        }


        const stormMultiplier =
            Math.max(

                1,

                numberModifier(
                    "stormBurstMultiplier",
                    1
                )
            );


        if (
            stormMultiplier >
            1
        ) {

            const chance =
                Math.min(

                    1,

                    BASE_STORM_BURST_CHANCE *

                    stormMultiplier
                );


            if (
                Math.random() <
                chance
            ) {

                triggerStormBurst({

                    center:
                        startEnemy,

                    bullet,

                    enemies,

                    damageEnemy,

                    isGuardianShielded
                });
            }
        }
    }


    function spawnShrapnel({

        bullet,

        enemy,

        spawnBullet

    }) {

        const multiplier =
            Math.max(

                1,

                numberModifier(
                    "shrapnelMultiplier",
                    1
                )
            );


        if (

            multiplier <=
                1 ||

            bullet.isShrapnel ||

            Number(
                bullet
                    .initialPierce
            ) <=
                1
        ) {

            return;
        }


        const count =
            Math.max(

                1,

                Math.round(
                    2 *
                    multiplier
                )
            );


        const speed =
            Math.max(

                260,

                Math.hypot(

                    Number(
                        bullet.vx
                    ) ||
                    0,

                    Number(
                        bullet.vy
                    ) ||
                    0
                ) *

                0.72
            );


        for (
            let i = 0;

            i <
            count;

            i++
        ) {

            const angle =

                Math.PI *
                2 *
                i /
                count +

                Math.random() *
                0.20;


            spawnBullet({

                x:
                    enemy.x,

                y:
                    enemy.y,

                radius:
                    Math.max(

                        3,

                        bullet.radius *
                        0.55
                    ),

                vx:
                    Math.cos(
                        angle
                    ) *
                    speed,

                vy:
                    Math.sin(
                        angle
                    ) *
                    speed,

                damage:
                    bullet.damage *
                    0.35,

                remainingPierce:
                    1,

                initialPierce:
                    1,

                travelled:
                    0,

                maxDistance:
                    240,

                hitEnemyIds:
                    new Set(),

                isShrapnel:
                    true,

                color:
                    "#f5d58a",

                glowColor:
                    "rgba(255,210,120,0.55)",

                pierceHitCount:
                    0
            });
        }
    }


    function onBulletHit({

        bullet,

        enemy,

        enemies,

        damageEnemy,

        killed,

        spawnBullet,

        isGuardianShielded

    }) {

        /*
            If the Split Burst carrier
            hits an enemy before its
            timer expires, its burst
            gets cancelled.

            It still deals its normal
            bullet damage.
        */

        if (
            bullet
                ?.splitBurstPending
        ) {

            bullet.splitBurstPending =
                false;


            bullet.isSplitBurstCarrier =
                false;
        }


        if (
            bullet.isExplosive
        ) {

            triggerExplosion({

                x:
                    enemy.x,

                y:
                    enemy.y,

                bullet,

                enemies,

                damageEnemy,

                isGuardianShielded
            });
        }


        if (
            bullet.isLightning
        ) {

            triggerLightning({

                startEnemy:
                    enemy,

                bullet,

                enemies,

                damageEnemy,

                isGuardianShielded
            });
        }


        if (
            killed
        ) {

            spawnShrapnel({

                bullet,

                enemy,

                spawnBullet
            });
        }
    }


    function getFreezeGroup(
        target,
        enemies
    ) {

        if (!target) {

            return [];
        }


        const groupKeys = [

            "guardianId",

            "wormId",

            "groupId"
        ];


        for (
            const key
            of groupKeys
        ) {

            if (
                target[
                    key
                ] ==
                null
            ) {

                continue;
            }


            return enemies.filter(

                enemy =>

                    enemy &&

                    enemy[
                        key
                    ] ===
                    target[
                        key
                    ]
            );
        }


        return [
            target
        ];
    }


    function freezeTarget(
        target,
        enemies
    ) {

        const baseDuration =
            Math.max(

                0,

                numberModifier(
                    "frostFreezeDuration",
                    0
                )
            );


        if (
            baseDuration <=
            0
        ) {

            return;
        }


        const duration =

            baseDuration *

            Math.max(

                1,

                numberModifier(
                    "deepFreezeMultiplier",
                    1
                )
            ) *

            Math.max(

                1,

                numberModifier(
                    "glacierReactorMultiplier",
                    1
                )
            );


        for (
            const enemy
            of getFreezeGroup(
                target,
                enemies
            )
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0
            ) {

                continue;
            }


            enemy.upgradeFreezeRemaining =

                Math.max(

                    Number(
                        enemy
                            .upgradeFreezeRemaining
                    ) ||
                    0,

                    duration
                );


            frozenEnemies.add(
                enemy
            );
        }


        frostBursts.push({

            x:
                target.x,

            y:
                target.y,

            radius:
                target.radius +
                28,

            remaining:
                0.34,

            maxRemaining:
                0.34
        });
    }


    function findNearestFrostTarget(
        player,
        enemies,
        isGuardianShielded
    ) {

        let best =
            null;


        let bestDistance =
            Infinity;


        for (
            const enemy
            of enemies
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0
            ) {

                continue;
            }


            if (
                isTargetProtected(

                    enemy,

                    isGuardianShielded
                )
            ) {

                continue;
            }


            const distance =
                Math.hypot(

                    enemy.x -
                    player.x,

                    enemy.y -
                    player.y
                );


            if (
                distance <
                bestDistance
            ) {

                best =
                    enemy;


                bestDistance =
                    distance;
            }
        }


        return best;
    }


    function launchFrostBomb({

        player,

        enemies,

        isGuardianShielded

    }) {

        const target =
            findNearestFrostTarget(

                player,

                enemies,

                isGuardianShielded
            );


        if (!target) {

            return false;
        }


        frostProjectiles.push({

            x:
                player.x,

            y:
                player.y,

            startX:
                player.x,

            startY:
                player.y,

            target,

            elapsed:
                0,

            duration:
                0.42,

            radius:
                10
        });


        return true;
    }


    function updateFrostProjectiles({

        dt,

        enemies,

        player,

        isGuardianShielded

    }) {

        for (

            let i =
                frostProjectiles
                    .length -
                1;

            i >=
            0;

            i--
        ) {

            const projectile =
                frostProjectiles[
                    i
                ];


            if (

                !projectile.target ||

                Number(
                    projectile
                        .target
                        .hp
                ) <=
                0 ||

                !enemies.includes(
                    projectile.target
                )
            ) {

                projectile.target =
                    findNearestFrostTarget(

                        player,

                        enemies,

                        isGuardianShielded
                    );


                projectile.startX =
                    projectile.x;


                projectile.startY =
                    projectile.y;


                projectile.elapsed =
                    0;
            }


            if (
                !projectile.target
            ) {

                frostProjectiles.splice(
                    i,
                    1
                );

                continue;
            }


            projectile.elapsed +=
                dt;


            const progress =
                Math.min(

                    1,

                    projectile.elapsed /
                    projectile.duration
                );


            projectile.x =

                projectile.startX +

                (
                    projectile
                        .target
                        .x -

                    projectile
                        .startX
                ) *

                progress;


            projectile.y =

                projectile.startY +

                (
                    projectile
                        .target
                        .y -

                    projectile
                        .startY
                ) *

                progress;


            if (
                progress <
                1
            ) {

                continue;
            }


            if (
                !isTargetProtected(

                    projectile.target,

                    isGuardianShielded
                )
            ) {

                freezeTarget(

                    projectile.target,

                    enemies
                );
            }


            frostProjectiles.splice(
                i,
                1
            );
        }
    }

    function updateSplitBurstBullets(
        dt,
        context
    ) {

        const bullets =

            Array.isArray(
                window.bullets
            )

                ? window.bullets

                : null;


        if (

            !bullets ||

            typeof context
                ?.spawnBullet !==
            "function"
        ) {

            return;
        }


        for (

            let i =
                bullets.length -
                1;

            i >=
            0;

            i--
        ) {

            const bullet =
                bullets[
                    i
                ];


            if (

                !bullet ||

                bullet
                    .splitBurstPending !==
                true
            ) {

                continue;
            }


            bullet.splitBurstElapsed =

                (
                    Number(
                        bullet
                            .splitBurstElapsed
                    ) ||
                    0
                ) +

                dt;


            const delay =
                Math.max(

                    0.01,

                    Number(
                        bullet
                            .splitBurstDelay
                    ) ||
                    0.5
                );


            if (
                bullet
                    .splitBurstElapsed <
                delay
            ) {

                continue;
            }


            const currentIndex =
                bullets.indexOf(
                    bullet
                );


            if (
                currentIndex ===
                -1
            ) {

                continue;
            }


            bullet.splitBurstPending =
                false;


            bullet.isSplitBurstCarrier =
                false;


            /*
                Remove the original
                carrier bullet.
            */

            bullets.splice(
                currentIndex,
                1
            );


            const count =
                Math.max(

                    3,

                    Math.round(

                        Number(
                            bullet
                                .splitBurstCount
                        ) ||
                        3
                    )
                );


            const speed =
                Math.max(

                    1,

                    Math.hypot(

                        Number(
                            bullet.vx
                        ) ||
                        0,

                        Number(
                            bullet.vy
                        ) ||
                        0
                    )
                );


            const centerAngle =
                Math.atan2(

                    Number(
                        bullet.vy
                    ) ||
                    0,

                    Number(
                        bullet.vx
                    ) ||
                    0
                );


            /*
                With 3 bullets:

                -18 degrees
                 0 degrees
                +18 degrees
            */

            const totalSpread =

                36 *

                Math.PI /

                180;


            const remainingDistance =

                bullet.maxDistance ===
                    Infinity

                    ? Infinity

                    : Math.max(

                        1,

                        (
                            Number(
                                bullet
                                    .maxDistance
                            ) ||
                            1
                        ) -

                        (
                            Number(
                                bullet
                                    .travelled
                            ) ||
                            0
                        )
                    );


            for (

                let index =
                    0;

                index <
                    count;

                index++
            ) {

                const t =

                    count ===
                    1

                        ? 0.5

                        : index /
                            (
                                count -
                                1
                            );


                const angle =

                    centerAngle -

                    totalSpread /
                    2 +

                    totalSpread *
                    t;


                context.spawnBullet({

                    x:
                        bullet.x,

                    y:
                        bullet.y,

                    radius:
                        bullet.radius,

                    vx:
                        Math.cos(
                            angle
                        ) *
                        speed,

                    vy:
                        Math.sin(
                            angle
                        ) *
                        speed,


                    /*
                        Every new Split Burst
                        bullet keeps the exact
                        current damage of the
                        original projectile.
                    */

                    damage:
                        bullet.damage,


                    remainingPierce:
                        Math.max(

                            1,

                            Number(
                                bullet
                                    .remainingPierce
                            ) ||
                            1
                        ),


                    initialPierce:
                        Math.max(

                            1,

                            Number(
                                bullet
                                    .remainingPierce
                            ) ||
                            1
                        ),


                    travelled:
                        0,


                    maxDistance:
                        remainingDistance,


                    hitEnemyIds:
                        new Set(),


                    pierceHitCount:
                        0,


                    isCrit:
                        bullet.isCrit ===
                        true,


                    /*
                        We deliberately do
                        not copy explosive
                        or lightning here.

                        Otherwise one
                        special projectile
                        could create three
                        explosions/lightning
                        effects.
                    */

                    isExplosive:
                        false,


                    isLightning:
                        false,


                    color:

                        bullet.isCrit

                            ? (
                                bullet.color ||
                                "#ffcf3f"
                            )

                            : "#4f4f5b",


                    glowColor:

                        bullet.isCrit

                            ? (
                                bullet.glowColor ||
                                "rgba(255,205,50,0.85)"
                            )

                            : "rgba(135,115,255,0.45)"
                });
            }
        }
    }


    function updateFreezeTimers(
        dt
    ) {

        for (
            const enemy
            of [
                ...frozenEnemies
            ]
        ) {

            if (

                !enemy ||

                Number(
                    enemy.hp
                ) <=
                0
            ) {

                clearEnemyFreeze(
                    enemy
                );

                continue;
            }


            enemy.upgradeFreezeRemaining =

                Math.max(

                    0,

                    (
                        Number(
                            enemy
                                .upgradeFreezeRemaining
                        ) ||
                        0
                    ) -

                    dt
                );


            if (
                enemy
                    .upgradeFreezeRemaining <=
                0
            ) {

                clearEnemyFreeze(
                    enemy
                );
            }
        }
    }


    function updateNapalm({

        dt,

        enemies,

        damageEnemy,

        isGuardianShielded

    }) {

        for (

            let i =
                napalmZones
                    .length -
                1;

            i >=
            0;

            i--
        ) {

            const zone =
                napalmZones[
                    i
                ];


            zone.remaining -=
                dt;


            zone.tickTimer +=
                dt;


            while (
                zone.tickTimer >=
                BASE_NAPALM_TICK
            ) {

                zone.tickTimer -=
                    BASE_NAPALM_TICK;


                const snapshot =
                    [
                        ...enemies
                    ];


                for (
                    const enemy
                    of snapshot
                ) {

                    if (

                        !enemy ||

                        Number(
                            enemy.hp
                        ) <=
                        0
                    ) {

                        continue;
                    }


                    const distance =
                        Math.hypot(

                            enemy.x -
                            zone.x,

                            enemy.y -
                            zone.y
                        );


                    if (
                        distance >
                        zone.radius +
                        enemy.radius
                    ) {

                        continue;
                    }


                    dealEffectDamage({

                        enemy,

                        damage:
                            zone.damage,

                        bullet:
                            zone.bullet,

                        damageEnemy,

                        isGuardianShielded
                    });
                }
            }


            if (
                zone.remaining <=
                0
            ) {

                napalmZones.splice(
                    i,
                    1
                );
            }
        }
    }


    function updateVisualTimers(
        dt
    ) {

        const groups = [

            lightningLines,

            explosionVisuals,

            frostBursts,

            electricBursts
        ];


        for (
            const group
            of groups
        ) {

            for (

                let i =
                    group.length -
                    1;

                i >=
                0;

                i--
            ) {

                group[
                    i
                ].remaining -=
                    dt;


                if (
                    group[
                        i
                    ].remaining <=
                    0
                ) {

                    group.splice(
                        i,
                        1
                    );
                }
            }
        }
    }


    function update(
        dt,
        context
    ) {

        updateFreezeTimers(
            dt
        );


        updateVisualTimers(
            dt
        );


        updateSplitBurstBullets(
            dt,
            context
        );


        const frostInterval =
            numberModifier(
                "frostBombInterval",
                NaN
            );


        if (

            Number.isFinite(
                frostInterval
            ) &&

            frostInterval >
            0
        ) {

            frostTimerMs +=
                dt *
                1000;


            while (
                frostTimerMs >=
                frostInterval
            ) {

                frostTimerMs -=
                    frostInterval;


                if (

                    !launchFrostBomb({

                        player:
                            context.player,

                        enemies:
                            context.enemies,

                        isGuardianShielded:
                            context
                                .isGuardianShielded
                    })
                ) {

                    /*
                        No enemy exists right
                        now.

                        Try again soon instead
                        of waiting another
                        complete 10 seconds.
                    */

                    frostTimerMs =
                        Math.max(

                            frostTimerMs,

                            frostInterval -
                            1000
                        );


                    break;
                }
            }

        } else {

            frostTimerMs =
                0;
        }


        updateFrostProjectiles({

            dt,

            enemies:
                context.enemies,

            player:
                context.player,

            isGuardianShielded:
                context
                    .isGuardianShielded
        });


        updateNapalm({

            dt,

            enemies:
                context.enemies,

            damageEnemy:
                context.damageEnemy,

            isGuardianShielded:
                context
                    .isGuardianShielded
        });
    }


    function drawJaggedLightning(
        ctx,
        line,
        alpha
    ) {

        const dx =
            line.x2 -
            line.x1;


        const dy =
            line.y2 -
            line.y1;


        const distance =
            Math.hypot(
                dx,
                dy
            ) ||
            1;


        const nx =
            -dy /
            distance;


        const ny =
            dx /
            distance;


        const segments =
            Math.max(

                4,

                Math.ceil(
                    distance /
                    35
                )
            );


        ctx.beginPath();


        ctx.moveTo(
            line.x1,
            line.y1
        );


        for (
            let i = 1;

            i <
            segments;

            i++
        ) {

            const t =
                i /
                segments;


            const jitter =

                (
                    Math.random() -
                    0.5
                ) *

                Math.min(

                    26,

                    distance *
                    0.08
                );


            ctx.lineTo(

                line.x1 +
                dx *
                t +
                nx *
                jitter,

                line.y1 +
                dy *
                t +
                ny *
                jitter
            );
        }


        ctx.lineTo(
            line.x2,
            line.y2
        );


        ctx.lineCap =
            "round";


        ctx.lineJoin =
            "round";


        ctx.strokeStyle =
            `rgba(255,235,65,${0.95 * alpha})`;


        ctx.lineWidth =
            5;


        ctx.shadowBlur =
            14;


        ctx.shadowColor =
            "rgba(255,225,40,0.95)";


        ctx.stroke();


        ctx.shadowBlur =
            0;


        ctx.strokeStyle =
            `rgba(255,255,220,${0.95 * alpha})`;


        ctx.lineWidth =
            2;


        ctx.stroke();
    }


    function draw(
        ctx,
        context = {}
    ) {

        ctx.save();


        /*
            NAPALM AREAS
        */

        for (
            const zone
            of napalmZones
        ) {

            const alpha =
                Math.max(

                    0,

                    zone.remaining /
                    zone.maxRemaining
                );


            const pulse =

                0.92 +

                Math.sin(
                    performance.now() *
                    0.012
                ) *

                0.08;


            ctx.beginPath();


            ctx.arc(

                zone.x,

                zone.y,

                zone.radius *
                pulse,

                0,

                Math.PI *
                2
            );


            ctx.fillStyle =
                `rgba(255,95,20,${0.16 + 0.16 * alpha})`;


            ctx.fill();


            ctx.lineWidth =
                3;


            ctx.strokeStyle =
                `rgba(255,175,40,${0.40 + 0.35 * alpha})`;


            ctx.stroke();
        }


        /*
            FROZEN ENEMIES
        */

        for (
            const enemy
            of (
                context.enemies ||
                []
            )
        ) {

            if (
                !isEnemyFrozen(
                    enemy
                )
            ) {

                continue;
            }


            const pulse =

                1 +

                Math.sin(
                    performance.now() *
                    0.014
                ) *

                0.04;


            ctx.beginPath();


            ctx.arc(

                enemy.x,

                enemy.y,

                (
                    enemy.radius +
                    7
                ) *

                pulse,

                0,

                Math.PI *
                2
            );


            ctx.fillStyle =
                "rgba(95,205,255,0.16)";


            ctx.fill();


            ctx.lineWidth =
                4;


            ctx.strokeStyle =
                "rgba(135,225,255,0.90)";


            ctx.stroke();


            ctx.beginPath();


            ctx.moveTo(

                enemy.x -
                enemy.radius *
                0.55,

                enemy.y -
                enemy.radius *
                0.65
            );


            ctx.lineTo(

                enemy.x +
                enemy.radius *
                0.48,

                enemy.y +
                enemy.radius *
                0.60
            );


            ctx.moveTo(

                enemy.x +
                enemy.radius *
                0.50,

                enemy.y -
                enemy.radius *
                0.60
            );


            ctx.lineTo(

                enemy.x -
                enemy.radius *
                0.45,

                enemy.y +
                enemy.radius *
                0.55
            );


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "rgba(225,250,255,0.90)";


            ctx.stroke();
        }


        /*
            FROST PROJECTILES
        */

        for (
            const projectile
            of frostProjectiles
        ) {

            ctx.beginPath();


            ctx.arc(

                projectile.x,

                projectile.y,

                projectile.radius,

                0,

                Math.PI *
                2
            );


            ctx.fillStyle =
                "#8ee8ff";


            ctx.shadowBlur =
                15;


            ctx.shadowColor =
                "rgba(90,210,255,0.95)";


            ctx.fill();


            ctx.shadowBlur =
                0;


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "white";


            ctx.stroke();
        }


        /*
            FROST BURSTS
        */

        for (
            const burst
            of frostBursts
        ) {

            const progress =

                1 -

                burst.remaining /
                burst.maxRemaining;


            ctx.beginPath();


            ctx.arc(

                burst.x,

                burst.y,

                burst.radius *

                (
                    0.45 +
                    0.75 *
                    progress
                ),

                0,

                Math.PI *
                2
            );


            ctx.lineWidth =
                5;


            ctx.strokeStyle =
                `rgba(135,230,255,${1 - progress})`;


            ctx.stroke();
        }


        /*
            EXPLOSIONS
        */

        for (
            const visual
            of explosionVisuals
        ) {

            const progress =

                1 -

                visual.remaining /
                visual.maxRemaining;


            ctx.beginPath();


            ctx.arc(

                visual.x,

                visual.y,

                visual.radius *

                (
                    0.25 +
                    0.75 *
                    progress
                ),

                0,

                Math.PI *
                2
            );


            ctx.fillStyle =
                `rgba(255,110,20,${0.28 * (1 - progress)})`;


            ctx.fill();


            ctx.lineWidth =
                5;


            ctx.strokeStyle =
                `rgba(255,225,75,${1 - progress})`;


            ctx.stroke();
        }


        /*
            ELECTRIC BURST
        */

        for (
            const burst
            of electricBursts
        ) {

            const progress =

                1 -

                burst.remaining /
                burst.maxRemaining;


            ctx.beginPath();


            ctx.arc(

                burst.x,

                burst.y,

                burst.radius *

                (
                    0.25 +
                    0.75 *
                    progress
                ),

                0,

                Math.PI *
                2
            );


            ctx.lineWidth =
                5;


            ctx.strokeStyle =
                `rgba(255,232,60,${1 - progress})`;


            ctx.shadowBlur =
                15;


            ctx.shadowColor =
                "rgba(255,220,35,0.9)";


            ctx.stroke();


            ctx.shadowBlur =
                0;
        }


        /*
            CHAIN LIGHTNING
        */

        for (
            const line
            of lightningLines
        ) {

            const alpha =
                Math.max(

                    0,

                    line.remaining /
                    line.maxRemaining
                );


            drawJaggedLightning(

                ctx,

                line,

                alpha
            );
        }


        ctx.restore();
    }


    function getBulletStyle(
        bullet
    ) {

        return {

            color:
                bullet?.color ||
                "#111111",

            glowColor:
                bullet?.glowColor ||
                null
        };
    }


    window.UpgradeEffects = {

        configure,

        reset,

        clear:
            clearTransient,

        modifyWeaponStats,

        prepareVolley,

        modifyHitDamage,

        onBulletHit,

        update,

        draw,

        getBulletStyle,

        isEnemyFrozen
    };

})();