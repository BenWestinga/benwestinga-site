const bigsandGoon = {
    id: "big-sand-goon",
    name: "Big Sand Goon",
    behavior: "chase",

    hp: 8,
    size: 5,

    speed: "slow",
    tracking: 0.8,

    color: "#f1d84b",

    update(enemy, dt, api) {
        api.moveTowardPlayer(
            enemy,
            dt,
            this.tracking
        );
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

export default bigsandGoon;