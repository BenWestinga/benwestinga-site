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
        "#d7bd46",


    /*
        Alleen voor uiterlijk.

        GEEN armor:true,
        omdat dat gameplay-effecten
        zou activeren.
    */

    visualArmor:
        true,


    onSpawn(
        enemy,
        api
    ) {

        const canvas =
            api.getCanvas();


        /*
            Sand Guy mikt nooit
            op de speler.

            Hij gaat loodrecht
            vanaf zijn spawnkant
            door het level.
        */

        if (
            enemy.x <
            0
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
            enemy.y <
            0
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

        /*
            Eerst gewone gele body.
        */

        api.drawDefaultEnemy(

            enemy,

            {
                face:
                    true,

                color:
                    this.color,

                strokeStyle:
                    "#4f555c",

                lineWidth:
                    5
            }
        );


        const x =
            enemy.x;

        const y =
            enemy.y;

        const r =
            enemy.radius;


        ctx.save();


        /*
            Metalen bovenplaat.
        */

        ctx.beginPath();


        ctx.arc(

            x,

            y,

            r * 0.82,

            Math.PI * 1.08,

            Math.PI * 1.92
        );


        ctx.lineWidth =
            Math.max(
                5,
                r * 0.18
            );


        ctx.strokeStyle =
            "#747d87";


        ctx.stroke();


        /*
            Lichtgrijze highlight
            bovenop het metaal.
        */

        ctx.beginPath();


        ctx.arc(

            x,

            y,

            r * 0.67,

            Math.PI * 1.15,

            Math.PI * 1.55
        );


        ctx.lineWidth =
            Math.max(
                2,
                r * 0.07
            );


        ctx.strokeStyle =
            "#c6ced6";


        ctx.stroke();


        /*
            Linker armorplaat.
        */

        ctx.beginPath();


        ctx.moveTo(
            x - r * 0.82,
            y - r * 0.15
        );


        ctx.lineTo(
            x - r * 0.65,
            y + r * 0.48
        );


        ctx.lineWidth =
            Math.max(
                4,
                r * 0.13
            );


        ctx.strokeStyle =
            "#5d6670";


        ctx.stroke();


        /*
            Rechter armorplaat.
        */

        ctx.beginPath();


        ctx.moveTo(
            x + r * 0.82,
            y - r * 0.15
        );


        ctx.lineTo(
            x + r * 0.65,
            y + r * 0.48
        );


        ctx.stroke();


        /*
            Twee kleine metalen
            boutjes.
        */

        ctx.fillStyle =
            "#d8dde2";


        const boltRadius =
            Math.max(
                2,
                r * 0.065
            );


        ctx.beginPath();


        ctx.arc(

            x - r * 0.66,

            y - r * 0.37,

            boltRadius,

            0,

            Math.PI * 2
        );


        ctx.fill();


        ctx.beginPath();


        ctx.arc(

            x + r * 0.66,

            y - r * 0.37,

            boltRadius,

            0,

            Math.PI * 2
        );


        ctx.fill();


        ctx.restore();
    }
};


export default sandGuy;