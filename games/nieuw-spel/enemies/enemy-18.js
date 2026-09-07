import sandGoon from "./enemy-01.js";


const stoneGoon = {
    ...sandGoon,

    id: "stone-goon",

    name: "Stone Goon",

    /*
        Sand Goon heeft 2 HP.
        Stone Goon krijgt +2 HP.
    */
    hp: 4,

    color: "#858b91",


    draw(
        enemy,
        ctx,
        api
    ) {

        api.drawDefaultEnemy(
            enemy,
            {
                face: true,
                color: "#858b91",
                strokeStyle: "#d7dce0",
                lineWidth: 3
            }
        );
    }
};


export default stoneGoon;