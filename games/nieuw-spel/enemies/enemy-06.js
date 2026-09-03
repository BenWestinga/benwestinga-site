const sandGuy = {

    id:
        "sand-guy",

    name:
        "Sand Guy",

    behavior:
        "sand-guy",


    hp:
        6,

    size:
        3.5,

    speed:
        "medium",


    color:
        "#6f622a",


    onSpawn(
        enemy,
        api
    ) {

        const canvas =
            api.getCanvas();


        /*
            Sand Guy mikt NIET
            op de speler.

            Hij gaat gewoon recht
            de arena door.
        */

        if (
            enemy.x < 0
        ) {

            enemy.vx =
                enemy.speed;

            enemy.vy =
                0;

        } else if (
            enemy.x >
            canvas.width
        ) {

            enemy.vx =
                -enemy.speed;

            enemy.vy =
                0;

        } else if (
            enemy.y < 0
        ) {

            enemy.vx =
                0;

            enemy.vy =
                enemy.speed;

        } else {

            enemy.vx =
                0;

            enemy.vy =
                -enemy.speed;
        }
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


        if (
            enemy.enteredArena &&
            api.isFullyOutsideArena(
                enemy
            )
        ) {

            api.removeEnemy(
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


export default sandGuy;