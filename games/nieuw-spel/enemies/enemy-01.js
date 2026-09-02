const sandGoon = {
    id: "sand-goon",
    name: "Sand Goon",
    behavior: "straight-through",

    hp: 2,
    size: 2,
    speed: "medium",

    color: "#f1d84b",

    onSpawn(enemy, api) {
        api.aimVelocityAtPlayer(
            enemy
        );
    },

    update(enemy, dt, api) {
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

    draw(enemy, ctx, api) {
        api.drawDefaultEnemy(
            enemy,
            {
                face:
                    true
            }
        );
    }
};

export default sandGoon;