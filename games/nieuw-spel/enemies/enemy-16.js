import bigSandGoon from "./enemy-02.js";


const bigGrassGoon = {
    ...bigSandGoon,

    id: "big-grass-goon",

    name: "Big Grass Goon",

    color: "#63ad4f",


    draw(enemy, ctx, api) {
        api.drawDefaultEnemy(
            enemy,
            {
                face: true,
                color: "#63ad4f"
            }
        );
    }
};


export default bigGrassGoon;