const slimeTrail = [];


/* =====================================================
   SLIME
   ===================================================== */

function clearSlimeTrail() {

    slimeTrail.length =
        0;
}


function addSlime(
    enemy
) {

    slimeTrail.push({

        x:
            enemy.x,

        y:
            enemy.y,

        radius:

            Math.max(

                8,

                enemy.radius *
                    0.58
            ),

        /*
            Exact 3 seconden gevaarlijk.
        */

        remaining:
            3,

        wobble:

            Math.random() *
            Math.PI *
            2
    });
}


/* =====================================================
   INSECT
   ===================================================== */

const insect = {

    id:
        "insect",

    name:
        "Insect",

    behavior:
        "slime-caterpillar",

    hp:
        3,

    size:
        1.5,

    shape:
        "circle",

    speed:
        "mediumSlow",

    color:
        "#67bd45",

    /*
        Slime blijft exact
        3 seconden bestaan.
    */

    trailDuration:
        3,

    /*
        Hoe vaak een nieuwe
        slimeblob wordt geplaatst.
    */

    trailInterval:
        0.08,


    reset() {

        clearSlimeTrail();
    },


    onPlayerDeath() {

        clearSlimeTrail();
    },


    onLevelWin() {

        clearSlimeTrail();
    },


    /* =================================================
       SPAWN
       ================================================= */

    onSpawn(
        enemy,
        api
    ) {

        const canvas =
            api.getCanvas();


        const outside =
            enemy.radius +
            45;


        /*
            35% kans dat hij
            echt vanuit een hoek komt.
        */

        if (
            Math.random() <
            0.35
        ) {

            const corner =
                Math.floor(

                    Math.random() *
                    4
                );


            /*
                Linksboven.
            */

            if (
                corner ===
                0
            ) {

                enemy.x =
                    -outside;

                enemy.y =
                    -outside;


            /*
                Rechtsboven.
            */

            } else if (
                corner ===
                1
            ) {

                enemy.x =

                    canvas.width +
                    outside;

                enemy.y =
                    -outside;


            /*
                Rechtsonder.
            */

            } else if (
                corner ===
                2
            ) {

                enemy.x =

                    canvas.width +
                    outside;

                enemy.y =

                    canvas.height +
                    outside;


            /*
                Linksonder.
            */

            } else {

                enemy.x =
                    -outside;

                enemy.y =

                    canvas.height +
                    outside;
            }


        } else {

            /*
                Anders komt hij
                vanaf een random kant.
            */

            const side =
                Math.floor(

                    Math.random() *
                    4
                );


            /*
                Links.
            */

            if (
                side ===
                0
            ) {

                enemy.x =
                    -outside;

                enemy.y =

                    Math.random() *
                    canvas.height;


            /*
                Rechts.
            */

            } else if (
                side ===
                1
            ) {

                enemy.x =

                    canvas.width +
                    outside;

                enemy.y =

                    Math.random() *
                    canvas.height;


            /*
                Boven.
            */

            } else if (
                side ===
                2
            ) {

                enemy.x =

                    Math.random() *
                    canvas.width;

                enemy.y =
                    -outside;


            /*
                Onder.
            */

            } else {

                enemy.x =

                    Math.random() *
                    canvas.width;

                enemy.y =

                    canvas.height +
                    outside;
            }
        }


        /*
            =========================================
            DOELPUNT

            Het doel ligt bewust diep in
            de arena.

            Daardoor vliegt hij niet alleen
            heel even door een hoekje.
            =========================================
        */

        const targetX =

            canvas.width *

            (
                0.25 +

                Math.random() *
                0.50
            );


        const targetY =

            canvas.height *

            (
                0.25 +

                Math.random() *
                0.50
            );


        const dx =
            targetX -
            enemy.x;


        const dy =
            targetY -
            enemy.y;


        const distance =
            Math.hypot(
                dx,
                dy
            ) || 1;


        enemy.vx =

            (
                dx /
                distance
            ) *

            enemy.speed;


        enemy.vy =

            (
                dy /
                distance
            ) *

            enemy.speed;


        enemy.insectState = {

            trailTimer:
                0,

            wiggleTime:

                Math.random() *
                10
        };
    },


    /* =================================================
       SLIME UPDATE

       Slime blijft 100% zichtbaar
       zolang remaining > 0.

       Zodra remaining <= 0:
       direct verwijderen.
       ================================================= */

    beforeUpdate(
        dt,
        api
    ) {

        for (

            let i =
                slimeTrail.length -
                1;

            i >=
                0;

            i--

        ) {

            const slime =
                slimeTrail[i];


            slime.remaining -=
                dt;


            slime.wobble +=
                dt *
                2;


            /*
                =====================================
                EXACT VERWIJDERMOMENT

                Geen fade.

                > 0 sec:
                zichtbaar + dodelijk

                <= 0 sec:
                meteen weg + niet dodelijk
                =====================================
            */

            if (
                slime.remaining <=
                0
            ) {

                slimeTrail.splice(
                    i,
                    1
                );


                continue;
            }


            /*
                Slime is dodelijk zolang
                hij zichtbaar bestaat.
            */

            if (
                api.playerTouchesCircle(

                    slime.x,

                    slime.y,

                    slime.radius
                )
            ) {

                api.killPlayer();


                return;
            }
        }
    },


    /* =================================================
       INSECT UPDATE
       ================================================= */

    update(
        enemy,
        dt,
        api
    ) {

        const state =
            enemy.insectState;


        if (!state) {

            return;
        }


        state.wiggleTime +=
            dt;


        /*
            Altijd rechtdoor.

            Hij target de speler dus
            niet nadat hij gespawned is.
        */

        api.moveStraight(
            enemy,
            dt
        );


        /*
            Zodra hij in arena zit,
            begint slime trail.
        */

        if (
            api.isInsideArena(
                enemy
            )
        ) {

            enemy.enteredArena =
                true;


            state.trailTimer +=
                dt;


            while (

                state.trailTimer >=
                this.trailInterval

            ) {

                state.trailTimer -=
                    this.trailInterval;


                addSlime(
                    enemy
                );
            }
        }


        /*
            Eenmaal door arena geweest
            en helemaal buiten:

            insect verwijderen.
        */

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


    /* =================================================
       SLIME DRAW

       BELANGRIJK:

       GEEN alpha gebaseerd op remaining.

       Iedere blob is dus 100%
       zichtbaar totdat hij verdwijnt.
       ================================================= */

    drawBelow(
        ctx
    ) {

        for (
            const slime
            of slimeTrail
        ) {

            ctx.save();


            /*
                =====================================
                HOOFDBLOB

                Volledig groen.
                Geen transparantie.
                =====================================
            */

            ctx.beginPath();


            ctx.arc(

                slime.x,

                slime.y,

                slime.radius,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#45be44";


            ctx.fill();


            /*
                Donkere buitenrand.

                Hierdoor blijft het slijm
                ook op mountain.png
                heel duidelijk zichtbaar.
            */

            ctx.lineWidth =
                Math.max(

                    2,

                    slime.radius *
                        0.12
                );


            ctx.strokeStyle =
                "#235f29";


            ctx.stroke();


            /*
                =====================================
                EXTRA SLIJMBLOBS

                Ook volledig zichtbaar.
                =====================================
            */

            for (

                let n =
                    0;

                n <
                    3;

                n++

            ) {

                const angle =

                    slime.wobble +

                    n *
                    Math.PI *
                    2 /
                    3;


                ctx.beginPath();


                ctx.arc(

                    slime.x +

                        Math.cos(
                            angle
                        ) *

                        slime.radius *
                        0.48,


                    slime.y +

                        Math.sin(
                            angle
                        ) *

                        slime.radius *
                        0.42,


                    slime.radius *

                        (
                            0.34 +

                            n *
                                0.04
                        ),


                    0,

                    Math.PI *
                        2
                );


                ctx.fillStyle =
                    "#55dc4b";


                ctx.fill();
            }


            /*
                =====================================
                GLANZENDE SLIJM-HIGHLIGHT
                =====================================
            */

            ctx.beginPath();


            ctx.arc(

                slime.x -
                    slime.radius *
                    0.25,

                slime.y -
                    slime.radius *
                    0.28,

                slime.radius *
                    0.18,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#d2ffbe";


            ctx.fill();


            /*
                Tweede kleine shine.
            */

            ctx.beginPath();


            ctx.arc(

                slime.x +
                    slime.radius *
                    0.23,

                slime.y +
                    slime.radius *
                    0.16,

                slime.radius *
                    0.09,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =
                "#9df58a";


            ctx.fill();


            ctx.restore();
        }
    },


    /* =================================================
       INSECT DRAW
       ================================================= */

    draw(
        enemy,
        ctx
    ) {

        const r =
            enemy.radius;


        /*
            Rups draait mee met
            zijn bewegingsrichting.
        */

        const angle =
            Math.atan2(

                enemy.vy,

                enemy.vx
            );


        /*
            Kleine lichaams-wiggle.
        */

        const wiggle =

            Math.sin(

                (
                    enemy.insectState
                        ?.wiggleTime ||
                    0
                ) *

                9
            ) *

            r *
            0.08;


        ctx.save();


        ctx.translate(
            enemy.x,
            enemy.y
        );


        ctx.rotate(
            angle
        );


        /*
            =====================================
            RUPSLICHAAM
            =====================================
        */

        const segmentCount =
            5;


        const segmentSpacing =
            r *
            0.48;


        for (

            let i =
                0;

            i <
                segmentCount;

            i++

        ) {

            const x =

                (
                    i -

                    (
                        segmentCount -
                        1
                    ) /

                    2
                ) *

                segmentSpacing;


            const y =

                i %
                2 ===
                0

                    ? wiggle

                    : -wiggle;


            ctx.beginPath();


            ctx.ellipse(

                x,

                y,

                r *
                    0.58,

                r *
                    0.72,

                0,

                0,

                Math.PI *
                    2
            );


            ctx.fillStyle =

                i ===
                segmentCount -
                    1

                    ? "#82cf4d"

                    : "#59b843";


            ctx.fill();


            ctx.lineWidth =
                2;


            ctx.strokeStyle =
                "#245d2a";


            ctx.stroke();
        }


        /*
            =====================================
            KOP
            =====================================
        */

        const headX =
            r *
            1.15;


        ctx.beginPath();


        ctx.ellipse(

            headX,

            0,

            r *
                0.70,

            r *
                0.76,

            0,

            0,

            Math.PI *
                2
        );


        ctx.fillStyle =
            "#78ca49";


        ctx.fill();


        ctx.lineWidth =
            2;


        ctx.strokeStyle =
            "#245d2a";


        ctx.stroke();


        /*
            =====================================
            OGEN
            =====================================
        */

        ctx.fillStyle =
            "#101010";


        for (
            const side
            of [
                -1,
                1
            ]
        ) {

            ctx.beginPath();


            ctx.arc(

                headX +
                    r *
                    0.22,

                side *
                    r *
                    0.23,

                Math.max(

                    1.8,

                    r *
                        0.09
                ),

                0,

                Math.PI *
                    2
            );


            ctx.fill();
        }


        /*
            =====================================
            VOELSPRIETEN
            =====================================
        */

        ctx.strokeStyle =
            "#245d2a";


        ctx.lineWidth =
            2;


        ctx.lineCap =
            "round";


        for (
            const side
            of [
                -1,
                1
            ]
        ) {

            ctx.beginPath();


            ctx.moveTo(

                headX +
                    r *
                    0.35,

                side *
                    r *
                    0.35
            );


            ctx.lineTo(

                headX +
                    r *
                    0.72,

                side *
                    r *
                    0.62
            );


            ctx.stroke();
        }


        ctx.restore();
    }
};


export default insect;