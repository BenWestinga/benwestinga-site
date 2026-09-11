const icePuller = {

    id: "ice-puller",

    name: "Ice Puller",

    behavior:
        "ice-pull",

    hp: 15,

    size: 3,

    speed: "fast",

    tracking: 1,

    image: "ice.png",

    /*
        Bewust geen extreme pull.
    */

    pullStrength: 58,


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
        enemy.basePullerSpeed =
            api.getEnemySpeed(
                this.speed
            );

        enemy.pullAnimation =
            Math.random() *
            Math.PI *
            2;

        enemy.magicPulse =
            Math.random() *
            Math.PI *
            2;

        const multiplier =
            window.IceWorldEffects
                ?.active
                ? 1.5
                : 1;

        enemy.speed =
            enemy.basePullerSpeed *
            multiplier;

        api.aimVelocityAtPlayer(
            enemy
        );
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
            enemy.basePullerSpeed *
            multiplier;

        /*
            Zelf speler volgen.
        */

        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );

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
            =================================
            PLAYER PULL
            =================================
        */

        const player =
            api.getPlayer();

        const dx =
            enemy.x -
            player.x;

        const dy =
            enemy.y -
            player.y;

        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;

        /*
            Pull wordt dichtbij
            iets zwakker.
        */

        const distanceFactor =
            Math.min(
                1,
                distance / 220
            );

        const pull =
            this.pullStrength *
            distanceFactor *
            dt;

        player.x +=
            dx /
            distance *
            pull;

        player.y +=
            dy /
            distance *
            pull;

        window.LevelPlayer
            ?.clamp
            ?.();

        /*
            Animaties.
        */

        enemy.pullAnimation +=
            dt * 6;

        enemy.magicPulse +=
            dt * 3;
    },


    /*
        =====================================
        MAGIC PULL LINE
        =====================================
    */

    drawBelow(
        ctx,
        api
    ) {
        const player =
            api.getPlayer();

        for (
            const enemy
            of api.getEnemies()
        ) {
            if (
                !enemy ||
                enemy.hp <= 0 ||
                enemy.definition
                    ?.id !==
                    this.id
            ) {
                continue;
            }

            const dx =
                player.x -
                enemy.x;

            const dy =
                player.y -
                enemy.y;

            const distance =
                Math.hypot(
                    dx,
                    dy
                ) || 1;

            /*
                Normaal-vector
                voor de wave.
            */

            const nx =
                -dy /
                distance;

            const ny =
                dx /
                distance;

            ctx.save();

            /*
                Buitenste paarse lijn.
            */

            ctx.beginPath();

            const segments =
                14;

            for (
                let i = 0;
                i <= segments;
                i++
            ) {
                const progress =
                    i /
                    segments;

                const wobble =
                    Math.sin(
                        progress *
                        19 +
                        enemy
                            .pullAnimation
                    ) *
                    6;

                const x =
                    enemy.x +
                    dx *
                    progress +
                    nx *
                    wobble;

                const y =
                    enemy.y +
                    dy *
                    progress +
                    ny *
                    wobble;

                if (
                    i === 0
                ) {
                    ctx.moveTo(
                        x,
                        y
                    );
                }

                else {
                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }

            ctx.strokeStyle =
                "rgba(125,82,255,0.82)";

            ctx.lineWidth =
                6;

            ctx.shadowBlur =
                12;

            ctx.shadowColor =
                "#744cff";

            ctx.stroke();

            /*
                Blauwe kernlijn.
            */

            ctx.beginPath();

            for (
                let i = 0;
                i <= segments;
                i++
            ) {
                const progress =
                    i /
                    segments;

                const wobble =
                    Math.sin(
                        progress *
                        19 +
                        enemy
                            .pullAnimation
                    ) *
                    3;

                const x =
                    enemy.x +
                    dx *
                    progress +
                    nx *
                    wobble;

                const y =
                    enemy.y +
                    dy *
                    progress +
                    ny *
                    wobble;

                if (
                    i === 0
                ) {
                    ctx.moveTo(
                        x,
                        y
                    );
                }

                else {
                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }

            ctx.shadowBlur =
                0;

            ctx.strokeStyle =
                "rgba(125,225,255,0.94)";

            ctx.lineWidth =
                2.4;

            ctx.stroke();

            ctx.restore();
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {
        const r =
            enemy.radius;

        /*
            Paarse/blauwe basis.
        */

        api.drawDefaultEnemy(
            enemy,

            {
                face: false,

                color:
                    "#756bdc",

                strokeStyle:
                    "#c9c2ff",

                lineWidth:
                    4
            }
        );

        const image =
            api.getAssetImage(
                this.image
            );

        /*
            ice.png subtiel.
        */

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
                r * 0.86,
                0,
                Math.PI * 2
            );

            ctx.clip();

            ctx.globalAlpha =
                0.30;

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
            ==================================
            GOOCHELAAR HOED
            ==================================
        */

        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.05,

            enemy.y -
                r * 1.20
        );

        ctx.quadraticCurveTo(
            enemy.x +
                r * 0.28,

            enemy.y -
                r * 0.82,

            enemy.x +
                r * 0.42,

            enemy.y -
                r * 0.22
        );

        ctx.lineTo(
            enemy.x -
                r * 0.50,

            enemy.y -
                r * 0.22
        );

        ctx.quadraticCurveTo(
            enemy.x -
                r * 0.20,

            enemy.y -
                r * 0.72,

            enemy.x -
                r * 0.05,

            enemy.y -
                r * 1.20
        );

        ctx.closePath();

        const hatGradient =
            ctx.createLinearGradient(
                enemy.x - r,
                enemy.y - r,

                enemy.x + r,
                enemy.y
            );

        hatGradient.addColorStop(
            0,
            "#3f2aa9"
        );

        hatGradient.addColorStop(
            0.55,
            "#765be3"
        );

        hatGradient.addColorStop(
            1,
            "#3eb8ef"
        );

        ctx.fillStyle =
            hatGradient;

        ctx.fill();

        ctx.strokeStyle =
            "#ded7ff";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            Brede hoedrand.
        */

        ctx.beginPath();

        ctx.ellipse(
            enemy.x,
            enemy.y -
                r * 0.22,

            r * 0.66,
            r * 0.15,

            0,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#5440be";

        ctx.fill();

        ctx.strokeStyle =
            "#c6eaff";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            Blauwe ijsband.
        */

        ctx.strokeStyle =
            "#79ddff";

        ctx.lineWidth =
            Math.max(
                3,
                r * 0.10
            );

        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.34,

            enemy.y -
                r * 0.38
        );

        ctx.lineTo(
            enemy.x +
                r * 0.32,

            enemy.y -
                r * 0.34
        );

        ctx.stroke();

        /*
            ==================================
            WIZARD ROBE
            ==================================
        */

        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.58,

            enemy.y +
                r * 0.04
        );

        ctx.lineTo(
            enemy.x -
                r * 0.42,

            enemy.y +
                r * 0.76
        );

        ctx.lineTo(
            enemy.x,

            enemy.y +
                r * 0.92
        );

        ctx.lineTo(
            enemy.x +
                r * 0.42,

            enemy.y +
                r * 0.76
        );

        ctx.lineTo(
            enemy.x +
                r * 0.58,

            enemy.y +
                r * 0.04
        );

        ctx.closePath();

        const robeGradient =
            ctx.createLinearGradient(
                enemy.x,
                enemy.y,

                enemy.x,
                enemy.y + r
            );

        robeGradient.addColorStop(
            0,
            "#5139b9"
        );

        robeGradient.addColorStop(
            0.55,
            "#624bd2"
        );

        robeGradient.addColorStop(
            1,
            "#2e91cf"
        );

        ctx.fillStyle =
            robeGradient;

        ctx.fill();

        ctx.strokeStyle =
            "#d9e9ff";

        ctx.lineWidth =
            3;

        ctx.stroke();

        /*
            Donkere schouders/cape.
        */

        ctx.fillStyle =
            "#39248f";

        ctx.beginPath();

        ctx.arc(
            enemy.x -
                r * 0.53,

            enemy.y +
                r * 0.06,

            r * 0.24,

            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        ctx.beginPath();

        ctx.arc(
            enemy.x +
                r * 0.53,

            enemy.y +
                r * 0.06,

            r * 0.24,

            Math.PI,
            Math.PI * 2
        );

        ctx.fill();

        /*
            ==================================
            MAGIC CRYSTAL
            ==================================
        */

        const crystalPulse =
            1 +
            Math.sin(
                enemy.magicPulse
            ) *
            0.08;

        ctx.beginPath();

        ctx.moveTo(
            enemy.x,

            enemy.y +
                r * 0.12 -
                r * 0.18 *
                crystalPulse
        );

        ctx.lineTo(
            enemy.x +
                r * 0.14 *
                crystalPulse,

            enemy.y +
                r * 0.34
        );

        ctx.lineTo(
            enemy.x,

            enemy.y +
                r * 0.58
        );

        ctx.lineTo(
            enemy.x -
                r * 0.14 *
                crystalPulse,

            enemy.y +
                r * 0.34
        );

        ctx.closePath();

        ctx.fillStyle =
            "#8fe8ff";

        ctx.shadowBlur =
            10;

        ctx.shadowColor =
            "#6d61ff";

        ctx.fill();

        ctx.shadowBlur =
            0;

        ctx.strokeStyle =
            "#ebfbff";

        ctx.lineWidth =
            2;

        ctx.stroke();

        ctx.restore();

        /*
            Standaard boos gezicht.
        */

        api.drawEnemyFace(
            enemy
        );
    }
};


export default icePuller;