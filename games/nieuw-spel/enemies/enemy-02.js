const bigsandGoon = {

    id:
        "big-sand-goon",

    name:
        "Big Sand Goon",

    behavior:
        "chase-break",


    hp:
        8,

    size:
        5,

    speed:
        "slow",

    tracking:
        0.8,

    color:
        "#f1d84b",


    chaseDuration:
        12,

    straightDuration:
        4,


    onSpawn(
        enemy
    ) {

        enemy.movementTimer =
            0;

        enemy.movementMode =
            "chase";
    },


    update(
        enemy,
        dt,
        api
    ) {

        enemy.movementTimer +=
            dt;


        const fullCycle =

            this.chaseDuration +

            this.straightDuration;


        const cycleTime =

            enemy.movementTimer %

            fullCycle;


        /*
            Eerste 12 seconden:
            speler volgen.
        */

        if (
            cycleTime <
            this.chaseDuration
        ) {

            enemy.movementMode =
                "chase";


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
                    enemy
                );
            }


            return;
        }


        /*
            Daarna 4 seconden:

            NIET meer sturen.

            De enemy houdt exact
            zijn huidige snelheid
            en richting vast.
        */

        enemy.movementMode =
            "straight";


        api.moveStraight(
            enemy,
            dt
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
                enemy
            );
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
                face:
                    true
            }
        );
    }
};


export default bigsandGoon;