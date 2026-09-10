const iceGoon = {

    id: "ice-goon",

    name: "Ice Goon",

    behavior: "straight-through",

    hp: 2,

    size: 2,

    speed: "medium",

    color: "#bdefff",

    image: "ice.png",


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

        enemy.baseIceSpeed =
            api.getEnemySpeed(
                this.speed
            );


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        enemy.speed =
            enemy.baseIceSpeed *
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


        const speed =
            enemy.baseIceSpeed *
            multiplier;


        const length =
            Math.hypot(
                enemy.vx,
                enemy.vy
            ) || 1;


        enemy.vx =
            enemy.vx /
            length *
            speed;


        enemy.vy =
            enemy.vy /
            length *
            speed;


        enemy.speed =
            speed;


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
                face: false,

                color:
                    "#bdefff",

                strokeStyle:
                    "#e9fbff",

                lineWidth: 3
            }
        );


        const image =
            api.getAssetImage(
                this.image
            );


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
                enemy.radius * 0.88,
                0,
                Math.PI * 2
            );

            ctx.clip();


            ctx.drawImage(
                image,

                enemy.x -
                    enemy.radius,

                enemy.y -
                    enemy.radius,

                enemy.radius * 2,
                enemy.radius * 2
            );


            ctx.restore();
        }


        api.drawEnemyFace(
            enemy
        );
    }
};


export default iceGoon;