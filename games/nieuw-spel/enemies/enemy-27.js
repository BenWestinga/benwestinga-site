let activeStorm =
    null;


const effects =
    window.IceWorldEffects ||
    {
        active: false,

        /*
            Tijdens SnowStorm:

            enemies bewegen
            1.2x zo snel.
        */
        speedMultiplier: 1.2,

        /*
            Enemies ontvangen
            de helft van damage.
        */
        damageMultiplier: 0.5
    };


/*
    Ook als IceWorldEffects al bestond,
    zetten we de juiste waardes.

    Zo blijft niet per ongeluk
    een oude 1.5 staan.
*/

effects.speedMultiplier =
    1.2;

effects.damageMultiplier =
    0.5;


window.IceWorldEffects =
    effects;


function stopStorm() {

    activeStorm =
        null;

    effects.active =
        false;
}


const snowstorm = {

    id:
        "snowstorm",

    name:
        "Snowstorm",

    behavior:
        "global-snowstorm",

    /*
        Technische enemy.

        Hij staat buiten beeld
        en kan niet normaal
        aangevallen worden.
    */

    hp:
        1,

    size:
        1,

    speed:
        0,

    /*
        Storm duurt nog steeds
        30 seconden.

        Alleen wordt die tijd
        nergens meer als tekst
        weergegeven.
    */

    duration:
        30,

    /*
        Iedere 2 seconden
        krijgen enemies +1 HP.
    */

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
            =====================================
            MAXIMAAL 1 SNOWSTORM
            =====================================
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
            De SnowStorm gebruikt technisch
            een enemy entity.

            Die staat ver buiten beeld.
        */

        return api.createEntity(

            definition,

            {
                x:
                    -10000,

                y:
                    -10000
            },

            {
                hp:
                    1,

                maxHp:
                    1,

                radius:
                    1,

                speed:
                    0,

                vx:
                    0,

                vy:
                    0,

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


        /*
            Random offset voor visuals.

            Hierdoor begint niet iedere
            storm exact hetzelfde.
        */

        enemy.visualOffset =
            Math.random() *
            1000;


        /*
            Active effect aan.
        */

        effects.active =
            true;


        /*
            Zeker weten dat de nieuwe
            waarden gebruikt worden.
        */

        effects.speedMultiplier =
            1.2;


        effects.damageMultiplier =
            0.5;
    },


    /*
        SnowStorm zelf kan
        geen normale damage krijgen.
    */

    modifyDamage() {

        return 0;
    },


    beforeUpdate(
        dt,
        api
    ) {

        /*
            Als het storm-object
            om wat voor reden dan ook
            verdwenen is:

            effect direct stoppen.
        */

        if (
            !activeStorm ||
            !api.isEnemyAlive(
                activeStorm
            )
        ) {

            stopStorm();

            return;
        }


        /*
            Visual timer.
        */

        activeStorm.visualTime +=
            dt;


        /*
            Heal timer.
        */

        activeStorm.healTimer -=
            dt;


        /*
            =====================================
            SNOWSTORM HEAL
            =====================================

            Iedere 2 seconden:

            +1 HP voor levende enemies.

            Niet boven maxHp.
        */

        while (
            activeStorm.healTimer <=
            0
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
                    enemy.hp <=
                        0 ||
                    !Number.isFinite(
                        enemy.maxHp
                    )
                ) {

                    continue;
                }


                enemy.hp =
                    Math.min(

                        enemy.maxHp,

                        enemy.hp +
                        1
                    );
            }
        }
    },


    update(
        enemy,
        dt,
        api
    ) {

        /*
            Alleen de daadwerkelijke
            actieve SnowStorm mag
            de timer aanpassen.
        */

        if (
            enemy !==
            activeStorm
        ) {

            return;
        }


        enemy.stormRemaining -=
            dt;


        /*
            Storm loopt nog.
        */

        if (
            enemy.stormRemaining >
            0
        ) {

            return;
        }


        /*
            =====================================
            STORM EINDE
            =====================================
        */

        stopStorm();


        api.removeEnemy(
            enemy
        );
    },


    /*
        ==========================================
        STORM VISUAL
        ==========================================

        Geen tekst.

        Alleen visuals zodat je direct ziet
        dat je midden in een SnowStorm zit.
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
            (
                activeStorm.visualTime ||
                0
            ) +
            (
                activeStorm.visualOffset ||
                0
            );


        ctx.save();


        /*
            =====================================
            1. KOUDE BLAUWE WAAS
            =====================================

            Bewust transparant.

            Gameplay blijft goed zichtbaar.
        */

        ctx.fillStyle =
            "rgba(205,232,245,0.14)";


        ctx.fillRect(

            0,

            0,

            canvas.width,

            canvas.height
        );


        /*
            =====================================
            2. STORM VIGNETTE
            =====================================

            Vooral aan de buitenkant
            wordt het kouder/blauwer.
        */

        const vignette =
            ctx.createRadialGradient(

                canvas.width /
                    2,

                canvas.height /
                    2,

                Math.min(
                    canvas.width,
                    canvas.height
                ) *
                    0.18,


                canvas.width /
                    2,

                canvas.height /
                    2,

                Math.max(
                    canvas.width,
                    canvas.height
                ) *
                    0.73
            );


        vignette.addColorStop(

            0,

            "rgba(255,255,255,0)"
        );


        vignette.addColorStop(

            0.62,

            "rgba(200,230,243,0.035)"
        );


        vignette.addColorStop(

            0.84,

            "rgba(170,215,235,0.11)"
        );


        vignette.addColorStop(

            1,

            "rgba(120,185,215,0.25)"
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
            =====================================
            3. SNELLE WIND-SNEEUW
            =====================================

            64 strepen.

            Genoeg om duidelijk een storm
            te laten zien zonder honderden
            particles te tekenen.
        */

        ctx.lineCap =
            "round";


        const streakCount =
            64;


        for (
            let i = 0;
            i < streakCount;
            i++
        ) {

            const seed =
                i *
                97.123;


            /*
                Beweegt schuin van
                linksboven naar rechtsonder.
            */

            const x =
                (
                    seed *
                        29 +

                    time *
                        490
                ) %

                (
                    canvas.width +
                    360
                ) -

                180;


            const y =
                (
                    seed *
                        17 +

                    time *
                        275
                ) %

                (
                    canvas.height +
                    200
                ) -

                100;


            const length =
                20 +
                (
                    i %
                    8
                ) *
                5;


            const thickness =
                1.3 +
                (
                    i %
                    3
                ) *
                0.75;


            const alpha =
                0.17 +
                (
                    i %
                    5
                ) *
                0.035;


            ctx.beginPath();


            ctx.moveTo(

                x,

                y
            );


            ctx.lineTo(

                x +
                    length,

                y +
                    length *
                    0.34
            );


            ctx.lineWidth =
                thickness;


            ctx.strokeStyle =
                `rgba(255,255,255,${alpha})`;


            ctx.stroke();
        }


        /*
            =====================================
            4. GROTERE SNEEUWVLOKKEN
            =====================================

            Rustiger dan de windstrepen.
        */

        const flakeCount =
            26;


        for (
            let i = 0;
            i < flakeCount;
            i++
        ) {

            const seed =
                i *
                123.77;


            const x =
                (
                    seed *
                        41 +

                    time *
                        155
                ) %

                (
                    canvas.width +
                    40
                ) -

                20;


            const y =
                (
                    seed *
                        23 +

                    time *
                        112
                ) %

                (
                    canvas.height +
                    40
                ) -

                20;


            const radius =
                1.8 +
                (
                    i %
                    3
                ) *
                0.9;


            ctx.beginPath();


            ctx.arc(

                x,

                y,

                radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "rgba(255,255,255,0.58)";


            ctx.fill();
        }


        /*
            =====================================
            5. EXTRA WINDLAAG
            =====================================

            Minder deeltjes, grotere strepen.

            Geeft storm meer diepte.
        */

        const foregroundCount =
            18;


        for (
            let i = 0;
            i < foregroundCount;
            i++
        ) {

            const seed =
                i *
                211.37;


            const x =
                (
                    seed *
                        31 +

                    time *
                        620
                ) %

                (
                    canvas.width +
                    440
                ) -

                220;


            const y =
                (
                    seed *
                        13 +

                    time *
                        310
                ) %

                (
                    canvas.height +
                    220
                ) -

                110;


            const length =
                42 +
                (
                    i %
                    4
                ) *
                9;


            ctx.beginPath();


            ctx.moveTo(
                x,
                y
            );


            ctx.lineTo(

                x +
                    length,

                y +
                    length *
                    0.31
            );


            ctx.strokeStyle =
                "rgba(245,253,255,0.18)";


            ctx.lineWidth =
                3;


            ctx.stroke();
        }


        /*
            =====================================
            6. IJSRAND
            =====================================

            Laat duidelijk zien dat het
            scherm door een koude storm
            wordt omringd.

            Geen tekst nodig.
        */

        const borderPulse =
            0.19 +
            Math.sin(
                time *
                1.8
            ) *
            0.025;


        ctx.strokeStyle =
            `rgba(205,240,250,${borderPulse})`;


        ctx.lineWidth =
            18;


        ctx.strokeRect(

            9,

            9,

            canvas.width -
                18,

            canvas.height -
                18
        );


        /*
            Tweede lichtere rand.
        */

        ctx.strokeStyle =
            "rgba(240,252,255,0.10)";


        ctx.lineWidth =
            5;


        ctx.strokeRect(

            19,

            19,

            canvas.width -
                38,

            canvas.height -
                38
        );


        ctx.restore();
    },


    /*
        ==========================================
        HUD
        ==========================================

        Bewust leeg.

        Dus:
        - geen SNOWSTORM tekst
        - geen timer
        - geen enemy stat tekst
        - helemaal niets
    */

    drawHud(
        ctx,
        api
    ) {

        /*
            Bewust niets tekenen.
        */

        return;
    },


    /*
        ==========================================
        RESET
        ==========================================
    */

    reset() {

        stopStorm();
    },


    /*
        Als player doodgaat:
        storm-effect uit.
    */

    onPlayerDeath() {

        stopStorm();
    },


    /*
        Als level gewonnen wordt:
        storm-effect uit.
    */

    onLevelWin() {

        stopStorm();
    }
};


export default snowstorm;