let activeStorm =
    null;


const effects =
    window.IceWorldEffects || {

        active: false,

        speedMultiplier:
            1.5,

        damageMultiplier:
            0.5
    };


window.IceWorldEffects =
    effects;


function stopStorm() {

    activeStorm =
        null;


    effects.active =
        false;
}


const snowstorm = {

    id: "snowstorm",

    name: "Snowstorm",

    behavior:
        "global-snowstorm",

    hp: 1,

    size: 1,

    speed: 0,

    duration:
        30,

    healInterval:
        2,

    collidesWithPlayer:
        false,

    hideWorldHealthBar:
        true,


    spawn({
        definition,
        api
    }) {

        /*
            Er kan altijd maar één
            SnowStorm actief zijn.
        */

        if (
            activeStorm &&
            api.isEnemyAlive(
                activeStorm
            )
        ) {

            return [];
        }


        return api.createEntity(

            definition,

            {
                x: -10000,
                y: -10000
            },

            {
                hp: 1,

                maxHp: 1,

                radius: 1,

                speed: 0,

                collidesWithPlayer:
                    false,

                hideWorldHealthBar:
                    true
            }
        );
    },


    onSpawn(
        enemy
    ) {

        activeStorm =
            enemy;


        enemy.stormRemaining =
            this.duration;


        enemy.healTimer =
            this.healInterval;


        effects.active =
            true;
    },


    modifyDamage() {

        /*
            Snowstorm zelf is geen
            normale enemy.
        */

        return 0;
    },


    beforeUpdate(
        dt,
        api
    ) {

        if (
            !activeStorm ||
            !api.isEnemyAlive(
                activeStorm
            )
        ) {

            effects.active =
                false;

            activeStorm =
                null;

            return;
        }


        activeStorm.healTimer -=
            dt;


        while (
            activeStorm.healTimer <= 0
        ) {

            activeStorm.healTimer +=
                this.healInterval;


            for (
                const enemy
                of api.getEnemies()
            ) {

                if (
                    !enemy ||
                    enemy ===
                        activeStorm ||

                    enemy.hp <= 0 ||

                    !Number.isFinite(
                        enemy.maxHp
                    )
                ) {

                    continue;
                }


                enemy.hp =
                    Math.min(
                        enemy.maxHp,
                        enemy.hp + 1
                    );
            }
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        if (
            enemy !==
            activeStorm
        ) {

            return;
        }


        enemy.stormRemaining -=
            dt;


        if (
            enemy.stormRemaining >
            0
        ) {

            return;
        }


        stopStorm();


        api.removeEnemy(
            enemy
        );
    },


    drawGlobal(
        ctx,
        api
    ) {

        if (
            !effects.active ||
            !activeStorm
        ) {

            return;
        }


        const canvas =
            api.getCanvas();


        const time =
            performance.now() *
            0.001;


        ctx.save();


        /*
            Heel lichte witte waas,
            zodat spel zichtbaar blijft.
        */

        ctx.fillStyle =
            "rgba(230,248,255,0.055)";


        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        ctx.lineCap =
            "round";


        for (
            let i = 0;
            i < 75;
            i++
        ) {

            const seed =
                i * 97.731;


            const x =
                (
                    seed * 41 +
                    time * 430
                ) %
                (
                    canvas.width +
                    180
                ) -
                90;


            const y =
                (
                    seed * 17 +
                    time * 240
                ) %
                (
                    canvas.height +
                    100
                ) -
                50;


            const length =
                16 +
                (
                    i % 7
                ) *
                3;


            ctx.beginPath();


            ctx.moveTo(
                x,
                y
            );


            ctx.lineTo(
                x + length,
                y + length * 0.35
            );


            ctx.lineWidth =
                1.5 +
                (
                    i % 3
                );


            ctx.strokeStyle =
                `rgba(255,255,255,${
                    0.10 +
                    (
                        i % 4
                    ) *
                    0.025
                })`;


            ctx.stroke();
        }


        ctx.restore();
    },


    reset() {

        stopStorm();
    },


    onPlayerDeath() {

        stopStorm();
    },


    onLevelWin() {

        stopStorm();
    }
};


export default snowstorm;