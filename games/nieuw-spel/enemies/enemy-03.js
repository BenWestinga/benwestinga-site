const sandBomb = {

    id:
        "sand-bomb",

    name:
        "Sand Bomb",

    behavior:
        "bomb-chase",


    hp:
        1,

    size:
        2,

    speed:
        "fast",

    tracking:
        0.3,


    explosionRadius:
        80,

    explosionDuration:
        0.1,


    color:
        "#675804",


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
            12 seconden chasen.
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
            4 seconden exact
            rechtdoor.
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


    onDeath(
        enemy,
        api
    ) {

        api.createExplosion(

            enemy.x,

            enemy.y,

            this.explosionRadius,

            this.explosionDuration
        );
    },


    onPlayerCollision(
        enemy,
        api
    ) {

        api.removeEnemy(
            enemy
        );


        api.createExplosion(

            enemy.x,

            enemy.y,

            this.explosionRadius,

            this.explosionDuration
        );


        return true;
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


export default sandBomb;