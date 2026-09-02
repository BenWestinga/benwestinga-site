const sandBomb = {
    id: "sand-bomb",
    name: "Sand Bomb",
    behavior: "bomb-chase",

    hp: 1,
    size: 2,

    speed: "fast",
    tracking: 0.3,

    color: "#675804",

    explosionRadius: 80,
    explosionDuration: 0.1,

    update(enemy, dt, api) {
        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );
    },

    onDeath(enemy, api) {
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

export default sandBomb;