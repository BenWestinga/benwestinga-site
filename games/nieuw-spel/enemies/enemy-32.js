const icePuller = {

    id: "ice-puller",

    name: "Ice Puller",

    behavior:
        "ice-pull",

    hp: 15,

    size: 3,

    speed:
        "fast",

    tracking:
        1,

    image:
        "ice.png",

    /*
        Pixels per seconde.

        Bewust niet extreem hard.
    */

    pullStrength:
        58,


    modifyDamage(
        enemy,
        damage
    ) {

        return (
            window.IceWorldEffects
                ?.active
        )
            ? damage * 0.5
            : damage;
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


        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );


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
            PLAYER NAAR PULLER TREKKEN.
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
            Heel dichtbij wordt de pull
            automatisch iets zwakker.
        */

        const distanceFactor =
            Math.min(
                1,
                distance /
                220
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


        enemy.pullAnimation +=
            dt *
            6;
    },


    drawBelow(
        ctx,
        api
    ) {

        /*
            Alle levende IcePullers
            krijgen een geanimeerde
            ijslijn naar player.
        */

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


            const nx =
                -dy /
                distance;


            const ny =
                dx /
                distance;


            ctx.save();


            ctx.beginPath();


            const segments =
                12;


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
                        18 +
                        (
                            enemy
                                .pullAnimation ||
                            0
                        )
                    ) *
                    5;


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

                } else {

                    ctx.lineTo(
                        x,
                        y
                    );
                }
            }


            ctx.strokeStyle =
                "rgba(155,232,255,0.72)";


            ctx.lineWidth =
                4;


            ctx.shadowBlur =
                10;


            ctx.shadowColor =
                "#8de7ff";


            ctx.stroke();


            ctx.restore();
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        api.drawDefaultEnemy(
            enemy,
            {
                face: false,

                color:
                    "#8edff5",

                strokeStyle:
                    "#e5fbff",

                lineWidth:
                    4
            }
        );


        const image =
            api.getAssetImage(
                this.image
            );


        const r =
            enemy.radius;


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
                0.78;


            ctx.drawImage(
                image,

                enemy.x - r,
                enemy.y - r,

                r * 2,
                r * 2
            );


            ctx.restore();
        }


        /*
            IJSPAK.
        */

        ctx.save();


        ctx.strokeStyle =
            "#e8fdff";


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.12
            );


        ctx.beginPath();

        ctx.moveTo(
            enemy.x -
                r * 0.55,

            enemy.y +
                r * 0.55
        );


        ctx.lineTo(
            enemy.x -
                r * 0.35,

            enemy.y +
                r * 0.10
        );


        ctx.lineTo(
            enemy.x +
                r * 0.35,

            enemy.y +
                r * 0.10
        );


        ctx.lineTo(
            enemy.x +
                r * 0.55,

            enemy.y +
                r * 0.55
        );


        ctx.stroke();


        /*
            Energiepunt.
        */

        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y +
                r * 0.35,

            r * 0.15,

            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#ffffff";


        ctx.shadowBlur =
            12;


        ctx.shadowColor =
            "#7cecff";


        ctx.fill();


        ctx.restore();


        api.drawEnemyFace(
            enemy
        );
    }
};


export default icePuller;