import steenBen25 from "./boss-05.js";


const steenBen = {

    /*
        Neem ALLE mechanics van
        Boss 25 over.
    */

    ...steenBen25,


    id:
        "steen-ben-level-30",


    name:
        "SteenBen",


    /*
        ==========================================
        BOSS 30 STATS
        ==========================================

        Boss 25:
        size 6

        Boss 30:
        size 8

        Dus exact +2.
    */

    hp:
        250,


    size:
        8,


    /*
        Boss 30 gebruikt de verbeterde
        landing zoals de oude level-10 boss.

        1 seconde warning op de positie
        waar de speler stond.

        Daarna landt SteenBen.
    */

    dropOnSpawn:
        true,


    /* =====================================================
       ATTACK 1

       BOSS 25:
       6 grote stones.

       BOSS 30:
       12 grote stones.

       Elke grote stone:
       - raakt muur
       - breekt in 3
       - originele stone verdwijnt
       - fragments bouncen niet
       ===================================================== */

    attack1: {

        ...steenBen25.attack1,


        shots:
            12
    },


    /* =====================================================
       ATTACK 2

       BOSS 25:
       - 1 charge
       - 20 meteors

       BOSS 30:
       - 3 charges totaal
       - dus na eerste muur nog 2x
         opnieuw richting speler
       - wacht tussen charge 1->2
       - wacht tussen charge 2->3
       - dus exact 2 waits
       - iedere wall-hit 40 meteors
       ===================================================== */

    attack2: {

        ...steenBen25.attack2,


        /*
            Snellere charge zoals
            de sterkere oude boss.
        */

        dashSpeed:
            1400,


        /*
            Charge 1
            -> muur
            -> wachten

            Charge 2
            -> muur
            -> wachten

            Charge 3
            -> muur
            -> klaar
        */

        chargeRuns:
            3,


        /*
            Boss 25 = 20.

            Boss 30 =
            precies dubbel = 40.
        */

        meteorCount:
            40
    },


    /* =====================================================
       EXTRA ATTACK 3

       - SteenBen staat 0.5 sec stil
       - knippert grijs
       - daarna exact 5 Stones
       - die Stones zijn enemy-17.js
       - iedere Stone heeft dus:
         hp12
         size6
         extremelyFast
         roll animation
         bounce
       ===================================================== */

    attack3: {

        enabled:
            true,


        warningDuration:
            0.5,


        spawnCount:
            5,


        spawnEnemy:
            "stone"
    }
};


export default steenBen;