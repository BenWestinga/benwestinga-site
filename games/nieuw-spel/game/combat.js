(() => {
    const bullets = [];

    const BASE_BULLET_RADIUS = 6;
    const RANGE_UNIT_PIXELS = 70;

    const WEAPON_FILE_BY_ID = {
        pistol: "pistol.js",
        smg: "smg4.js",
        smg4: "smg4.js",
        shotgun: "shotgun.js",
        huntingRifle: "hunting_rifle.js",
        hunting_rifle: "hunting_rifle.js",
        ak: "ak.js"
    };

    let weapon = null;
    let combatModifiers = {};
    let fireAccumulator = 0;
    let lastDirection = 1;

    window.bullets = bullets;


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


    function getBaseWeaponStats() {

        if (!weapon) {

            return null;
        }


        const rangeMultiplier =
            numberModifier(
                "rangeMultiplier",
                1
            );


        return {

            shotsPerSecond:
                Number(
                    weapon.shotsPerSecond
                ) ||
                0,


            damage:
                Number(
                    weapon.damage
                ) ||
                0,


            pierce:

                Math.max(

                    1,

                    Math.round(
                        Number(
                            weapon.pierce
                        ) ||
                        1
                    )
                ),


            bulletRadius:

                BASE_BULLET_RADIUS *

                (
                    Number(
                        weapon
                            .bulletSizeMultiplier
                    ) ||
                    1
                ),


            projectilesPerShot:

                Math.max(

                    1,

                    Math.round(
                        Number(
                            weapon
                                .projectilesPerShot
                        ) ||
                        1
                    )
                ),


            bulletSpeed:
                Number(
                    weapon.bulletSpeed
                ) ||
                600,


            spreadDegrees:
                Number(
                    weapon.spreadDegrees
                ) ||
                0,


            rangePixels:

                weapon.range ===
                Infinity

                    ? Infinity

                    :
                    (
                        Number(
                            weapon.range
                        ) ||
                        0
                    ) *

                    RANGE_UNIT_PIXELS *

                    rangeMultiplier
        };
    }


    function getModifiedWeaponStats() {

        const baseStats =
            getBaseWeaponStats();


        if (!baseStats) {

            return null;
        }


        if (
            window
                .UpgradeEffects
                ?.modifyWeaponStats
        ) {

            return window
                .UpgradeEffects
                .modifyWeaponStats(

                    baseStats,

                    combatModifiers
                );
        }


        return baseStats;
    }


    async function configureWeapon(
        weaponId,
        modifiers = {}
    ) {

        const normalizedWeaponId =

            typeof weaponId ===
            "string"

                ? weaponId

                : weaponId?.id;


        const fileName =

            WEAPON_FILE_BY_ID[
                normalizedWeaponId
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


        window
            .UpgradeEffects
            ?.configure
            ?.(
                combatModifiers
            );
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


    function createBaseVolley(
        stats,
        baseAngle
    ) {

        const projectiles =
            [];


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

                Math.PI /
                180;


            projectiles.push({

                angle,


                radius:
                    stats
                        .bulletRadius,


                damage:
                    stats.damage,


                remainingPierce:
                    stats.pierce,


                initialPierce:
                    stats.pierce,


                travelled:
                    0,


                maxDistance:
                    stats
                        .rangePixels,


                bulletSpeed:
                    stats
                        .bulletSpeed,


                hitEnemyIds:
                    new Set(),


                pierceHitCount:
                    0,


                color:
                    "#111111",


                glowColor:
                    null
            });
        }


        return projectiles;
    }


    function pushPreparedBullet(
        projectile
    ) {

        const angle =
            Number(
                projectile.angle
            ) ||
            0;


        const speed =
            Number(
                projectile
                    .bulletSpeed
            ) ||
            600;


        bullets.push({

            ...projectile,


            x:
                window
                    .levelPlayer
                    .x,


            y:
                window
                    .levelPlayer
                    .y,


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


            hitEnemyIds:

                projectile
                    .hitEnemyIds
                instanceof Set

                    ? projectile
                        .hitEnemyIds

                    : new Set()
        });
    }


    function spawnEffectBullet(
        projectile
    ) {

        if (!projectile) {

            return null;
        }


        const bullet = {

            x:
                Number(
                    projectile.x
                ) ||
                0,


            y:
                Number(
                    projectile.y
                ) ||
                0,


            radius:

                Math.max(

                    2,

                    Number(
                        projectile.radius
                    ) ||
                    4
                ),


            vx:
                Number(
                    projectile.vx
                ) ||
                0,


            vy:
                Number(
                    projectile.vy
                ) ||
                0,


            damage:

                Math.max(

                    0,

                    Number(
                        projectile.damage
                    ) ||
                    0
                ),


            remainingPierce:

                Math.max(

                    1,

                    Math.round(
                        Number(
                            projectile
                                .remainingPierce
                        ) ||
                        1
                    )
                ),


            initialPierce:

                Math.max(

                    1,

                    Math.round(
                        Number(
                            projectile
                                .initialPierce
                        ) ||
                        1
                    )
                ),


            travelled:
                Number(
                    projectile.travelled
                ) ||
                0,


            maxDistance:

                projectile.maxDistance ===
                Infinity

                    ? Infinity

                    :
                    Math.max(

                        1,

                        Number(
                            projectile
                                .maxDistance
                        ) ||
                        240
                    ),


            hitEnemyIds:

                projectile
                    .hitEnemyIds
                instanceof Set

                    ? projectile
                        .hitEnemyIds

                    : new Set(),


            pierceHitCount:
                Number(
                    projectile
                        .pierceHitCount
                ) ||
                0,


            color:
                projectile.color ||
                "#111111",


            glowColor:
                projectile.glowColor ||
                null,


            isShrapnel:
                projectile.isShrapnel ===
                true,


            isCrit:
                projectile.isCrit ===
                true,


            isExplosive:
                projectile.isExplosive ===
                true,


            isLightning:
                projectile.isLightning ===
                true
        };


        bullets.push(
            bullet
        );


        return bullet;
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


        const baseProjectiles =
            createBaseVolley(

                stats,

                baseAngle
            );


        const preparedProjectiles =

            window
                .UpgradeEffects
                ?.prepareVolley

                ?

                window
                    .UpgradeEffects
                    .prepareVolley({

                        projectiles:
                            baseProjectiles,

                        baseAngle,

                        stats,

                        weapon
                    })

                :

                baseProjectiles;


        for (
            const projectile
            of preparedProjectiles
        ) {

            pushPreparedBullet(
                projectile
            );
        }
    }


    function calculateBulletDamage(
        bullet,
        enemy
    ) {

        if (
            window
                .UpgradeEffects
                ?.modifyHitDamage
        ) {

            return window
                .UpgradeEffects
                .modifyHitDamage({

                    enemy,

                    bullet,

                    damage:
                        bullet.damage,

                    includePierce:
                        true
                });
        }


        return bullet.damage;
    }


    function updateCombat(
        dt,
        enemies,
        damageEnemy
    ) {

        if (!weapon) {

            return;
        }


        const stats =
            getModifiedWeaponStats();


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


        window
            .UpgradeEffects
            ?.update
            ?.(
                dt,
                {
                    enemies,

                    damageEnemy,

                    player:
                        window
                            .levelPlayer,

                    isGuardianShielded,

                    spawnBullet:
                        spawnEffectBullet
                }
            );


        const canvas =
            document.getElementById(
                "level-canvas"
            );


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


            if (!bullet) {

                continue;
            }


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


            for (

                let e =
                    enemies.length -
                    1;

                e >=
                0;

                e--
            ) {

                const enemy =
                    enemies[
                        e
                    ];


                if (!enemy) {

                    continue;
                }


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
                    distance >
                    bullet.radius +
                    enemy.radius
                ) {

                    continue;
                }


                bullet
                    .hitEnemyIds
                    .add(
                        enemy.id
                    );


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


                const enemyDamage =
                    calculateBulletDamage(

                        bullet,

                        enemy
                    );


                damageEnemy(

                    enemy,

                    enemyDamage
                );


                if (
                    !window
                        .levelPlayer
                        ?.alive
                ) {

                    return;
                }


                const killed =

                    enemy.hp <=
                        0 ||

                    !enemies.includes(
                        enemy
                    );


                window
                    .UpgradeEffects
                    ?.onBulletHit
                    ?.({

                        bullet,

                        enemy,

                        enemies,

                        damageEnemy,

                        killed,

                        spawnBullet:
                            spawnEffectBullet,

                        isGuardianShielded
                    });


                if (
                    !window
                        .levelPlayer
                        ?.alive
                ) {

                    return;
                }


                bullet.pierceHitCount =

                    (
                        Number(
                            bullet
                                .pierceHitCount
                        ) ||
                        0
                    ) +

                    1;


                bullet.remainingPierce--;


                if (
                    bullet
                        .remainingPierce <=
                    0
                ) {

                    const currentIndex =
                        bullets.indexOf(
                            bullet
                        );


                    if (
                        currentIndex !==
                        -1
                    ) {

                        bullets.splice(
                            currentIndex,
                            1
                        );
                    }


                    bulletRemoved =
                        true;


                    break;
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


        for (
            const bullet
            of bullets
        ) {

            const style =

                window
                    .UpgradeEffects
                    ?.getBulletStyle
                    ?.(
                        bullet
                    ) ||

                {
                    color:
                        bullet.color ||
                        "#111111",

                    glowColor:
                        bullet.glowColor ||
                        null
                };


            ctx.beginPath();


            ctx.arc(

                bullet.x,

                bullet.y,

                bullet.radius,

                0,

                Math.PI *
                2
            );


            ctx.fillStyle =
                style.color;


            if (
                style.glowColor
            ) {

                ctx.shadowBlur =
                    14;


                ctx.shadowColor =
                    style.glowColor;

            } else {

                ctx.shadowBlur =
                    0;
            }


            ctx.fill();


            if (

                bullet.isCrit ||

                bullet.isExplosive ||

                bullet.isLightning
            ) {

                ctx.shadowBlur =
                    0;


                ctx.lineWidth =
                    2;


                ctx.strokeStyle =
                    "rgba(255,255,255,0.85)";


                ctx.stroke();
            }
        }


        ctx.shadowBlur =
            0;


        ctx.restore();


        window
            .UpgradeEffects
            ?.draw
            ?.(
                ctx,
                {
                    enemies:

                        window
                            .LevelEngine
                            ?.getState
                            ?.()
                            ?.enemies ||

                        []
                }
            );
    }


    function clearBullets() {

        bullets.length =
            0;
    }


    function clearCombat() {

        clearBullets();


        window
            .UpgradeEffects
            ?.clear
            ?.();
    }


    function resetShootingTimer() {

        fireAccumulator =
            0;
    }


    function resetCombat() {

        clearBullets();


        resetShootingTimer();


        window
            .UpgradeEffects
            ?.reset
            ?.();
    }


    window.LevelCombat = {

        configure:
            configureWeapon,


        update:
            updateCombat,


        draw:
            drawBullets,


        clear:
            clearCombat,


        reset:
            resetCombat,


        getWeapon:
            () =>
                weapon,


        getModifiedWeaponStats
    };

})();