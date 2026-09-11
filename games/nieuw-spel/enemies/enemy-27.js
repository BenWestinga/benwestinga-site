let activeStorm =
    null;


const effects =
    window.IceWorldEffects ||
    {
        active: false,

        speedMultiplier: 1.5,

        damageMultiplier: 0.5
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

    duration: 30,

    healInterval: 2,

    collidesWithPlayer:
        false,

    hideWorldHealthBar:
        true,


    spawn({
        definition,
        api
    }) {
        /*
            Maximaal één SnowStorm.
        */

        if (
            activeStorm &&
            api.isEnemyAlive(
                activeStorm
            )
        ) {
            return [];
        }

        /*
            Technisch enemy-object
            buiten beeld zodat hij
            in de engine blijft bestaan.
        */

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

                vx: 0,

                vy: 0,

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

        enemy.visualTime =
            0;

        effects.active =
            true;
    },


    /*
        SnowStorm zelf kan
        niet geschoten worden.
    */

    modifyDamage() {
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
            stopStorm();

            return;
        }

        activeStorm.visualTime +=
            dt;

        activeStorm.healTimer -=
            dt;

        /*
            Iedere 2 sec
            iedere enemy +1 HP.
        */

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


    /*
        =====================================
        STORM VISUAL
        =====================================
    */

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
            activeStorm.visualTime ||
            0;

        ctx.save();

        /*
            Koude blauwe waas.

            Duidelijk zichtbaar maar
            transparant genoeg om te spelen.
        */

        ctx.fillStyle =
            "rgba(215,238,248,0.16)";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        /*
            Blauwe storm-vignette.
        */

        const vignette =
            ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,

                Math.min(
                    canvas.width,
                    canvas.height
                ) * 0.18,

                canvas.width / 2,
                canvas.height / 2,

                Math.max(
                    canvas.width,
                    canvas.height
                ) * 0.72
            );

        vignette.addColorStop(
            0,
            "rgba(255,255,255,0)"
        );

        vignette.addColorStop(
            0.70,
            "rgba(190,225,240,0.08)"
        );

        vignette.addColorStop(
            1,
            "rgba(145,198,220,0.26)"
        );

        ctx.fillStyle =
            vignette;

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        /*
            Sneeuwstrepen.

            72 particles:
            duidelijk maar niet extreem
            zwaar.
        */

        ctx.lineCap =
            "round";

        for (
            let i = 0;
            i < 72;
            i++
        ) {
            const seed =
                i * 97.123;

            const x =
                (
                    seed * 29 +
                    time * 500
                ) %
                (
                    canvas.width +
                    320
                ) -
                160;

            const y =
                (
                    seed * 17 +
                    time * 270
                ) %
                (
                    canvas.height +
                    180
                ) -
                90;

            const length =
                22 +
                (i % 7) *
                5;

            ctx.beginPath();

            ctx.moveTo(
                x,
                y
            );

            ctx.lineTo(
                x + length,
                y +
                    length *
                    0.33
            );

            ctx.lineWidth =
                1.5 +
                (i % 3) *
                0.8;

            ctx.strokeStyle =
                `rgba(255,255,255,${
                    0.18 +
                    (i % 4) *
                    0.045
                })`;

            ctx.stroke();
        }

        /*
            Grotere sneeuwdeeltjes.
        */

        for (
            let i = 0;
            i < 28;
            i++
        ) {
            const seed =
                i * 123.77;

            const x =
                (
                    seed * 41 +
                    time * 175
                ) %
                canvas.width;

            const y =
                (
                    seed * 23 +
                    time * 125
                ) %
                canvas.height;

            const radius =
                1.8 +
                (i % 3) *
                0.9;

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                radius,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
                "rgba(255,255,255,0.58)";

            ctx.fill();
        }

        /*
            IJsrand om heel scherm.
        */

        const borderAlpha =
            0.18 +
            Math.sin(
                time * 2
            ) *
            0.03;

        ctx.strokeStyle =
            `rgba(210,245,255,${
                borderAlpha
            })`;

        ctx.lineWidth =
            16;

        ctx.strokeRect(
            8,
            8,
            canvas.width - 16,
            canvas.height - 16
        );

        ctx.restore();
    },


    /*
        Duidelijke tekst bovenin.
    */

    drawHud(
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

        const remaining =
            Math.max(
                0,
                Math.ceil(
                    activeStorm
                        .stormRemaining
                )
            );

        ctx.save();

        ctx.textAlign =
            "center";

        ctx.textBaseline =
            "middle";

        ctx.font =
            "bold 29px Arial";

        ctx.lineWidth =
            7;

        ctx.strokeStyle =
            "rgba(20,45,60,0.90)";

        ctx.strokeText(
            `❄ SNOWSTORM ${remaining}s ❄`,
            canvas.width / 2,
            86
        );

        ctx.fillStyle =
            "#ffffff";

        ctx.fillText(
            `❄ SNOWSTORM ${remaining}s ❄`,
            canvas.width / 2,
            86
        );

        ctx.font =
            "bold 15px Arial";

        ctx.lineWidth =
            4;

        ctx.strokeStyle =
            "rgba(20,45,60,0.82)";

        const message =
            "Enemies: 1.5× sneller  •  50% damage  •  +1 HP per 2 sec";

        ctx.strokeText(
            message,
            canvas.width / 2,
            116
        );

        ctx.fillStyle =
            "rgba(245,253,255,0.98)";

        ctx.fillText(
            message,
            canvas.width / 2,
            116
        );

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