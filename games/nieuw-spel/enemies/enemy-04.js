export default {

    id:
        "sand-shooter",

    name:
        "Sand Shooter",

    hp:
        3,

    // Zelfde grootte als Sand Goon
    size:
        2,

    // Vierkant in plaats van rond
    shape:
        "square",

    // Langzaamste snelheid.
    // Getal i.p.v. naam zodat dit altijd werkt.
    speed:
        70,

    // Extreem weinig trekkracht naar de speler
    tracking:
        0.02,

    behavior:
        "sand-shooter",

    color:
        "#f1d84b",


    // ==========================================
    // SHOOTING
    // ==========================================

    shootInterval:
        3,

    projectileRadius:
        6,

    projectileSpeed:
        260,

    projectileColor:
        "#e32626"
};