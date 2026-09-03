(() => {

    const bullets = [];


    const BASE_BULLET_RADIUS = 6;

    const RANGE_UNIT_PIXELS = 70;


    const WEAPON_FILE_BY_ID = {

        pistol:
            "pistol.js",

        smg:
            "smg4.js",

        smg4:
            "smg4.js",

        shotgun:
            "shotgun.js",

        huntingRifle:
            "hunting_rifle.js",

        hunting_rifle:
            "hunting_rifle.js",

        ak:
            "ak.js"
    };


    let weapon =
        null;


    let combatModifiers =
        {};


    let fireAccumulator =
        0;


    let lastDirection =
        1;


    window.bullets =
        bullets;


    function numberModifier(
        name,
        fallback
    ) {

        const value =
            Number(
                combatModifiers?.[
                    name
                ]
            );


        return Number.isFinite(
            value
        )
            ? value
            : fallback;
    }


    function getEnemyDamageMultiplier(
        enemy
    ) {

        let multiplier =
            1;


        /*
            BOSS DAMAGE
        */

        if (
            enemy?.isBoss ||

            enemy
                ?.definition
                ?.boss ===
            true
        ) {

            multiplier *=
                numberModifier(

                    "bossDamageMultiplier",

                    1
                );
        }


        /*
            ARMOR DAMAGE
        */

        const isArmor =

            enemy?.armor ===
                true ||

            enemy
                ?.classes
                ?.includes
                ?.(
                    "armor"
                );


        if (
            isArmor
        ) {

            let armorMultiplier =
                numberModifier(

                    "armorCrackDamageMultiplier",

                    NaN
                );


            /*
                Als StoryProgress die
                modifier nog niet meegeeft,
                kijken we direct of
                Armor Crack gekocht is.
            */

            if (
                !Number.isFinite(
                    armorMultiplier
                )
            ) {

                armorMultiplier =

                    window
                        .StoryProgress
                        ?.hasUpgrade
                        ?.(
                            "armorCrack"
                        )

                        ? 1.4

                        : 1;
            }


            multiplier *=
                armorMultiplier;
        }


        return multiplier;
    }


    function isGuardianShielded(
        enemy
    ) {

        return (

            enemy
                ?.guardianShieldSources
                instanceof Set &&

            enemy
                .guardianShieldSources
                .size >
            0
        );
    }


    function getModifiedWeaponStats() {

        if (
            !weapon
        ) {

            return null;
        }


        const fireRateMultiplier =

            numberModifier(
                "fireRateMultiplier",
                1
            ) *

            (
                1 +

                numberModifier(
                    "fireRateBonus",
                    0
                )
            ) *

            (
                1 +

                numberModifier(
                    "fireRatePercent",
                    0
                ) /

                100
            );


        const damageMultiplier =

            numberModifier(
                "damageMultiplier",
                1
            ) *

            (
                1 +

                numberModifier(
                    "damageBonus",
                    0
                )
            ) *

            (
                1 +

                numberModifier(
                    "damagePercent",
                    0
                ) /

                100
            );


        const bulletSizeMultiplier =

            numberModifier(
                "bulletSizeMultiplier",
                1
            ) *

            (
                1 +

                numberModifier(
                    "bulletSizeBonus",
                    0
                )
            ) *

            (
                1 +

                numberModifier(
                    "bulletSizePercent",
                    0
                ) /

                100
            );


        const rangeMultiplier =
            numberModifier(
                "rangeMultiplier",
                1
            );


        return {

            shotsPerSecond:

                weapon
                    .shotsPerSecond *

                fireRateMultiplier,


            damage:

                weapon.damage *

                damageMultiplier,


            pierce:

                Math.max(

                    1,

                    Math.round(

                        weapon.pierce +

                        numberModifier(
                            "pierceBonus",
                            0
                        )
                    )
                ),


            bulletRadius:

                BASE_BULLET_RADIUS *

                (
                    weapon
                        .bulletSizeMultiplier ||
                    1
                ) *

                bulletSizeMultiplier,


            projectilesPerShot:

                Math.max(

                    1,

                    Math.round(

                        (
                            weapon
                                .projectilesPerShot ||
                            1
                        ) +

                        numberModifier(

                            "projectilesPerShotBonus",

                            0
                        )
                    )
                ),


            bulletSpeed:
                weapon.bulletSpeed,


            spreadDegrees:

                weapon.spreadDegrees ||
                0,


            rangePixels:

                weapon.range ===
                Infinity

                    ? Infinity

                    :

                    weapon.range *

                    RANGE_UNIT_PIXELS *

                    rangeMultiplier
        };
    }


    async function configureWeapon(
        weaponId,
        modifiers = {}
    ) {

        const fileName =

            WEAPON_FILE_BY_ID[
                weaponId
            ] ||

            WEAPON_FILE_BY_ID
                .pistol;


        const url =
            new URL(

                `weapons/${fileName}`,

                window.location.href
            ).href;


        const module =
            await import(
                url
            );


        weapon =

            module.default ||

            module.weapon ||

            module.config;


        combatModifiers =
            modifiers ||
            {};


        clearBullets();


        resetShootingTimer();
    }


    function getShootDirection() {

        const canvas =
            document.getElementById(
                "level-canvas"
            );


        const middle =
            canvas.width /
            2;


        if (
            window
                .levelPlayer
                .x <
            middle
        ) {

            lastDirection =
                1;

        } else if (
            window
                .levelPlayer
                .x >
            middle
        ) {

            lastDirection =
                -1;
        }


        return lastDirection;
    }


    function shootVolley() {

        const stats =
            getModifiedWeaponStats();


        if (!stats) {

            return;
        }


        const direction =
            getShootDirection();


        const baseAngle =

            direction ===
            1

                ? 0

                : Math.PI;


        for (
            let i = 0;

            i <
            stats
                .projectilesPerShot;

            i++
        ) {

            let offsetDegrees =
                0;


            if (
                stats
                    .projectilesPerShot >
                1
            ) {

                offsetDegrees =

                    -stats
                        .spreadDegrees /
                    2 +

                    stats
                        .spreadDegrees *

                    (
                        i /

                        (
                            stats
                                .projectilesPerShot -
                            1
                        )
                    );
            }


            const angle =

                baseAngle +

                offsetDegrees *

                (
                    Math.PI /
                    180
                );


            bullets.push({

                x:
                    window
                        .levelPlayer
                        .x,

                y:
                    window
                        .levelPlayer
                        .y,


                radius:
                    stats
                        .bulletRadius,


                vx:

                    Math.cos(
                        angle
                    ) *

                    stats
                        .bulletSpeed,


                vy:

                    Math.sin(
                        angle
                    ) *

                    stats
                        .bulletSpeed,


                damage:
                    stats.damage,


                remainingPierce:
                    stats.pierce,


                travelled:
                    0,


                maxDistance:
                    stats
                        .rangePixels,


                hitEnemyIds:
                    new Set()
            });
        }
    }


    function updateCombat(
        dt,
        enemies,
        damageEnemy
    ) {

        if (
            !weapon
        ) {

            return;
        }


        const stats =
            getModifiedWeaponStats();


        /*
            AUTO SHOOT
        */

        if (
            stats &&

            stats
                .shotsPerSecond >
            0
        ) {

            const interval =

                1 /

                stats
                    .shotsPerSecond;


            fireAccumulator +=
                dt;


            let safety =
                0;


            while (
                fireAccumulator >=
                    interval &&

                safety <
                    20
            ) {

                shootVolley();


                fireAccumulator -=
                    interval;


                safety++;
            }
        }


        const canvas =
            document.getElementById(
                "level-canvas"
            );


        /*
            BULLETS
        */

        for (
            let i =
                bullets.length -
                1;

            i >= 0;

            i--
        ) {

            const bullet =
                bullets[i];


            const stepX =
                bullet.vx *
                dt;


            const stepY =
                bullet.vy *
                dt;


            bullet.x +=
                stepX;


            bullet.y +=
                stepY;


            bullet.travelled +=
                Math.hypot(

                    stepX,

                    stepY
                );


            /*
                RANGE
            */

            if (
                bullet.travelled >=
                bullet.maxDistance
            ) {

                bullets.splice(
                    i,
                    1
                );


                continue;
            }


            /*
                OUTSIDE SCREEN
            */

            if (
                bullet.x <
                    -150 ||

                bullet.x >
                    canvas.width +
                    150 ||

                bullet.y <
                    -150 ||

                bullet.y >
                    canvas.height +
                    150
            ) {

                bullets.splice(
                    i,
                    1
                );


                continue;
            }


            let bulletRemoved =
                false;


            /*
                ENEMY COLLISION
            */

            for (
                let e =
                    enemies.length -
                    1;

                e >= 0;

                e--
            ) {

                const enemy =
                    enemies[e];


                if (
                    bullet
                        .hitEnemyIds
                        .has(
                            enemy.id
                        )
                ) {

                    continue;
                }


                const distance =
                    Math.hypot(

                        bullet.x -
                            enemy.x,

                        bullet.y -
                            enemy.y
                    );


                if (
                    distance <=

                    bullet.radius +

                    enemy.radius
                ) {

                    bullet
                        .hitEnemyIds
                        .add(
                            enemy.id
                        );


                    /*
                        ==================================
                        GUARDIAN SHIELD
                        ==================================

                        Shield blokkeert de kogel
                        volledig.

                        Ook pierce bullets kunnen
                        er niet doorheen.
                    */

                    if (
                        isGuardianShielded(
                            enemy
                        )
                    ) {

                        bullets.splice(
                            i,
                            1
                        );


                        bulletRemoved =
                            true;


                        break;
                    }


                    /*
                        Normale damage +
                        boss/armor modifiers.
                    */

                    const enemyDamage =

                        bullet.damage *

                        getEnemyDamageMultiplier(
                            enemy
                        );


                    damageEnemy(

                        enemy,

                        enemyDamage
                    );


                    bullet.remainingPierce--;


                    if (
                        bullet
                            .remainingPierce <=
                        0
                    ) {

                        bullets.splice(
                            i,
                            1
                        );


                        bulletRemoved =
                            true;


                        break;
                    }
                }
            }


            if (
                bulletRemoved
            ) {

                continue;
            }
        }
    }


    function drawBullets(
        ctx
    ) {

        ctx.save();


        ctx.fillStyle =
            "#111111";


        for (
            const bullet
            of bullets
        ) {

            ctx.beginPath();


            ctx.arc(

                bullet.x,

                bullet.y,

                bullet.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fill();
        }


        ctx.restore();
    }


    function clearBullets() {

        bullets.length =
            0;
    }


    function resetShootingTimer() {

        fireAccumulator =
            0;
    }


    function resetCombat() {

        clearBullets();


        resetShootingTimer();
    }


    window.LevelCombat = {

        configure:
            configureWeapon,


        update:
            updateCombat,


        draw:
            drawBullets,


        clear:
            clearBullets,


        reset:
            resetCombat,


        getWeapon:
            () =>
                weapon,


        getModifiedWeaponStats
    };

})();