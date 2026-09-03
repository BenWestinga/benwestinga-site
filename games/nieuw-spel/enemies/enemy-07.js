const sandBall = {

    id:
        "sand-ball",

    name:
        "Sand Ball",

    behavior:
        "sand-ball",


    hp:
        1,

    size:
        0.9,

    speed:
        "extremelyFast",


    color:
        "#f7e889",


    collidesWithPlayer:
        true,


    onSpawn(
        enemy,
        api
    ) {

        /*
            Alleen op het moment
            van spawnen wordt op de
            speler gericht.

            Daarna verandert de
            richting NIET vanzelf.
        */

        api.aimVelocityAtPlayer(
            enemy,
            enemy.speed
        );
    },


    update(
        enemy,
        dt,
        api
    ) {

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


        /*
            Zodra Sand Ball binnen is,
            kan hij nooit meer ontsnappen.

            Hij blijft oneindig bouncen.
        */

        if (
            enemy.enteredArena
        ) {

            api.keepInsideArena(
                enemy,
                14,
                true
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
                    false,

                strokeStyle:
                    "rgba(120,95,20,0.55)"
            }
        );
    }
};


export default sandBall;