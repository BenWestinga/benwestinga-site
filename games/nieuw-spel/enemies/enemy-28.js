const snowProtector = {

    id: "snow-protector",

    name: "Snow Protector",

    behavior:
        "protection-aura",

    hp: 28,

    size: 4,

    speed: "slow",

    tracking: 0.7,

    image: "snow.png",

    /*
        Beschermingsradius.
    */

    auraRadius: 230,

    /*
        5 sec follow,
        10 sec straight + bounce.
    */

    followDuration: 5,

    straightDuration: 10,


    modifyDamage(
        enemy,
        damage
    ) {
        if (
            window.IceWorldEffects
                ?.active
        ) {
            return damage * 0.5;
        }

        return damage;
    },


    onSpawn(
        enemy,
        api
    ) {
        enemy.baseProtectorSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.movementTimer =
            0;

        enemy.auraAnimation =
            Math.random() *
            Math.PI *
            2;

        enemy.shieldSpin =
            Math.random() *
            Math.PI *
            2;

        const multiplier =
            window.IceWorldEffects
                ?.active
                ? 1.5
                : 1;

        enemy.speed =
            enemy.baseProtectorSpeed *
            multiplier;

        api.aimVelocityAtPlayer(
            enemy
        );
    },


    /*
        ======================================
        SHIELD PROTECTION
        ======================================

        Iedere frame:

        - oude SnowProtector refs weg
        - kijken welke enemies
          in een levende protector-radius staan
        - die krijgen guardianShieldSources

        LevelCombat gebruikt dat
        om damage te blokkeren.
    */

    beforeUpdate(
        dt,
        api
    ) {
        const enemies =
            api.getEnemies();

        /*
            Oude refs verwijderen.
        */

        for (
            const target
            of enemies
        ) {
            if (
                !(
                    target
                        ?.guardianShieldSources
                    instanceof Set
                )
            ) {
                continue;
            }

            for (
                const source
                of [
                    ...target
                        .guardianShieldSources
                ]
            ) {
                if (
                    source
                        ?.definition
                        ?.id ===
                    this.id
                ) {
                    target
                        .guardianShieldSources
                        .delete(
                            source
                        );
                }
            }
        }

        /*
            Alle levende Protectors.
        */

        const protectors =
            enemies.filter(
                enemy =>
                    enemy &&
                    enemy.hp > 0 &&
                    enemy.definition
                        ?.id ===
                        this.id
            );

        /*
            Enemies beschermen.
        */

        for (
            const protector
            of protectors
        ) {
            for (
                const target
                of enemies
            ) {
                if (
                    !target ||
                    target ===
                        protector ||
                    target.hp <= 0 ||
                    target.definition
                        ?.id ===
                        this.id ||
                    target.definition
                        ?.id ===
                        "snowstorm"
                ) {
                    continue;
                }

                const distance =
                    Math.hypot(
                        target.x -
                            protector.x,

                        target.y -
                            protector.y
                    );

                if (
                    distance >
                    this.auraRadius +
                    target.radius
                ) {
                    continue;
                }

                if (
                    !(
                        target
                            .guardianShieldSources
                        instanceof Set
                    )
                ) {
                    target
                        .guardianShieldSources =
                        new Set();
                }

                target
                    .guardianShieldSources
                    .add(
                        protector
                    );
            }
        }
    },


    update(
        enemy,
        dt,
        api
    ) {
        const multiplier =
            window.IceWorldEffects
                ?.active
                ? 1.5
                : 1;

        enemy.speed =
            enemy.baseProtectorSpeed *
            multiplier;

        /*
            Movement cycle.
        */

        const cycle =
            this.followDuration +
            this.straightDuration;

        const previousMode =
            enemy.movementTimer <
            this.followDuration
                ? "follow"
                : "straight";

        enemy.movementTimer +=
            dt;

        if (
            enemy.movementTimer >=
            cycle
        ) {
            enemy.movementTimer %=
                cycle;
        }

        const mode =
            enemy.movementTimer <
            this.followDuration
                ? "follow"
                : "straight";

        /*
            Beginnend straight:
            één keer richten.
        */

        if (
            mode !== previousMode &&
            mode === "straight"
        ) {
            api.aimVelocityAtPlayer(
                enemy
            );
        }

        /*
            Follow.
        */

        if (
            mode === "follow"
        ) {
            api.moveTowardPlayer(
                enemy,
                dt,
                this.tracking
            );
        }

        /*
            Straight.
        */

        else {
            const length =
                Math.hypot(
                    enemy.vx,
                    enemy.vy
                ) || 1;

            enemy.vx =
                enemy.vx /
                length *
                enemy.speed;

            enemy.vy =
                enemy.vy /
                length *
                enemy.speed;

            api.moveStraight(
                enemy,
                dt
            );
        }

        /*
            Arena.
        */

        if (
            !enemy.enteredArena &&
            api.isInsideArena(
                enemy
            )
        ) {
            enemy.enteredArena =
                true;
        }

        if (
            enemy.enteredArena
        ) {
            api.keepInsideArena(
                enemy,
                14,
                true
            );
        }

        /*
            Visual timers.
        */

        enemy.auraAnimation +=
            dt * 2.2;

        enemy.shieldSpin +=
            dt * 0.42;
    },


    /*
        Als Protector doodgaat:
        direct al zijn shield refs weg.
    */

    onDeath(
        enemy,
        api
    ) {
        for (
            const target
            of api.getEnemies()
        ) {
            target
                ?.guardianShieldSources
                ?.delete?.(
                    enemy
                );
        }
    },


    /*
        ======================================
        SHIELD ICON
        ======================================
    */

    drawShieldIcon(
        ctx,
        x,
        y,
        size,
        alpha = 1
    ) {
        ctx.save();

        ctx.translate(
            x,
            y
        );

        /*
            Schildvorm.
        */

        ctx.beginPath();

        ctx.moveTo(
            0,
            -size * 0.62
        );

        ctx.lineTo(
            size * 0.52,
            -size * 0.38
        );

        ctx.lineTo(
            size * 0.42,
            size * 0.20
        );

        ctx.quadraticCurveTo(
            size * 0.24,
            size * 0.58,

            0,
            size * 0.72
        );

        ctx.quadraticCurveTo(
            -size * 0.24,
            size * 0.58,

            -size * 0.42,
            size * 0.20
        );

        ctx.lineTo(
            -size * 0.52,
            -size * 0.38
        );

        ctx.closePath();

        /*
            Metallic ice gradient.
        */

        const gradient =
            ctx.createLinearGradient(
                -size,
                0,
                size,
                0
            );

        gradient.addColorStop(
            0,
            `rgba(90,170,205,${
                0.75 * alpha
            })`
        );

        gradient.addColorStop(
            0.5,
            `rgba(240,252,255,${
                0.96 * alpha
            })`
        );

        gradient.addColorStop(
            1,
            `rgba(90,170,205,${
                0.75 * alpha
            })`
        );

        ctx.fillStyle =
            gradient;

        ctx.fill();

        ctx.strokeStyle =
            `rgba(255,255,255,${
                0.90 * alpha
            })`;

        ctx.lineWidth =
            Math.max(
                2,
                size * 0.10
            );

        ctx.stroke();

        /*
            Middenlijn.
        */

        ctx.beginPath();

        ctx.moveTo(
            0,
            -size * 0.36
        );

        ctx.lineTo(
            0,
            size * 0.39
        );

        ctx.strokeStyle =
            `rgba(90,155,190,${
                0.75 * alpha
            })`;

        ctx.lineWidth =
            Math.max(
                1.5,
                size * 0.07
            );

        ctx.stroke();

        ctx.restore();
    },


    draw(
        enemy,
        ctx,
        api
    ) {
        const r =
            enemy.radius;

        const pulse =
            1 +
            Math.sin(
                enemy.auraAnimation ||
                0
            ) *
            0.035;

        const auraRadius =
            this.auraRadius *
            pulse;

        /*
            ===================================
            BESCHERMINGSVELD
            ===================================
        */

        ctx.save();

        const auraGradient =
            ctx.createRadialGradient(
                enemy.x,
                enemy.y,
                enemy.radius * 0.6,

                enemy.x,
                enemy.y,
                auraRadius
            );

        auraGradient.addColorStop(
            0,
            "rgba(220,248,255,0.02)"
        );

        auraGradient.addColorStop(
            0.65,
            "rgba(205,240,250,0.05)"
        );

        auraGradient.addColorStop(
            1,
            "rgba(235,250,255,0.16)"
        );

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            auraRadius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            auraGradient;

        ctx.fill();

        /*
            Duidelijke buitenrand.
        */

        ctx.strokeStyle =
            "rgba(235,250,255,0.66)";

        ctx.lineWidth =
            4;

        ctx.stroke();

        /*
            ===================================
            SHIELD ICONS
            ===================================

            8 draaiende schildjes.

            Genoeg om meteen te begrijpen:
            deze gast beschermt enemies.

            Niet onnodig veel voor performance.
        */

        const iconCount =
            8;

        for (
            let i = 0;
            i < iconCount;
            i++
        ) {
            const angle =
                enemy.shieldSpin +
                i /
                iconCount *
                Math.PI *
                2;

            const iconRadius =
                auraRadius -
                12;

            const x =
                enemy.x +
                Math.cos(
                    angle
                ) *
                iconRadius;

            const y =
                enemy.y +
                Math.sin(
                    angle
                ) *
                iconRadius;

            const size =
                15 +
                Math.sin(
                    enemy.auraAnimation +
                    i
                ) *
                1.8;

            this.drawShieldIcon(
                ctx,
                x,
                y,
                size,
                0.90
            );
        }

        ctx.restore();

        /*
            ===================================
            BODY
            ===================================
        */

        api.drawDefaultEnemy(
            enemy,

            {
                face: false,

                color:
                    "#dff6ff",

                strokeStyle:
                    "#739fb4",

                lineWidth:
                    5
            }
        );

        const image =
            api.getAssetImage(
                this.image
            );

        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {
            ctx.save();

            ctx.beginPath();

            ctx.arc(
                enemy.x,
                enemy.y,
                r * 0.87,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.45;

            ctx.drawImage(
                image,
                enemy.x - r,
                enemy.y - r,
                r * 2,
                r * 2
            );

            ctx.restore();
        }

        ctx.save();

        /*
            ===================================
            HEAVY ICE HELMET
            ===================================
        */

        const helmetGradient =
            ctx.createLinearGradient(
                enemy.x - r,
                enemy.y,
                enemy.x + r,
                enemy.y
            );

        helmetGradient.addColorStop(
            0,
            "#4f8ca8"
        );

        helmetGradient.addColorStop(
            0.5,
            "#bcecf8"
        );

        helmetGradient.addColorStop(
            1,
            "#4f8ca8"
        );

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y -
                r * 0.12,

            r * 0.73,

            Math.PI,
            Math.PI * 2
        );

        ctx.lineTo(
            enemy.x +
                r * 0.62,

            enemy.y -
                r * 0.02
        );

        ctx.lineTo(
            enemy.x -
                r * 0.62,

            enemy.y -
                r * 0.02
        );

        ctx.closePath();

        ctx.fillStyle =
            helmetGradient;

        ctx.fill();

        ctx.strokeStyle =
            "#e8fbff";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            IJs-crest bovenop helm.
        */

        ctx.beginPath();

        ctx.moveTo(
            enemy.x,
            enemy.y -
                r * 0.63
        );

        ctx.lineTo(
            enemy.x -
                r * 0.16,

            enemy.y -
                r * 1.05
        );

        ctx.lineTo(
            enemy.x +
                r * 0.20,

            enemy.y -
                r * 0.74
        );

        ctx.closePath();

        ctx.fillStyle =
            "#d7f8ff";

        ctx.fill();

        ctx.strokeStyle =
            "#7bbbd2";

        ctx.stroke();

        /*
            ===================================
            CHEST ARMOUR
            ===================================
        */

        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.62,

            enemy.y +
                r * 0.06
        );

        ctx.lineTo(
            enemy.x -
                r * 0.48,

            enemy.y +
                r * 0.72
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y +
                r * 0.92,

            enemy.x +
                r * 0.48,

            enemy.y +
                r * 0.72
        );

        ctx.lineTo(
            enemy.x +
                r * 0.62,

            enemy.y +
                r * 0.06
        );

        ctx.quadraticCurveTo(
            enemy.x,
            enemy.y +
                r * 0.36,

            enemy.x -
                r * 0.62,

            enemy.y +
                r * 0.06
        );

        ctx.closePath();

        ctx.fillStyle =
            "#659fb8";

        ctx.fill();

        ctx.strokeStyle =
            "#ddf8ff";

        ctx.lineWidth =
            4;

        ctx.stroke();

        /*
            Shoulder armour.
        */

        ctx.fillStyle =
            "#8bc8dc";

        ctx.beginPath();

        ctx.arc(
            enemy.x -
                r * 0.63,

            enemy.y +
                r * 0.04,

            r * 0.26,

            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.stroke();

        ctx.beginPath();

        ctx.arc(
            enemy.x +
                r * 0.63,

            enemy.y +
                r * 0.04,

            r * 0.26,

            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.stroke();

        /*
            Groot shield logo
            midden op armour.
        */

        this.drawShieldIcon(
            ctx,

            enemy.x,

            enemy.y +
                r * 0.35,

            r * 0.48,

            1
        );

        ctx.restore();

        /*
            Standaard boos gezicht.
        */

        api.drawEnemyFace(
            enemy
        );
    }
};


export default snowProtector;