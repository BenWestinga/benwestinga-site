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

        remaining:
            3,

        duration:
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

    trailDuration:
        3,

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
            Soms echt vanuit hoek.
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


            if (
                corner ===
                0
            ) {

                enemy.x =
                    -outside;

                enemy.y =
                    -outside;

            } else if (
                corner ===
                1
            ) {

                enemy.x =

                    canvas.width +
                    outside;

                enemy.y =
                    -outside;

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

            } else {

                enemy.x =
                    -outside;

                enemy.y =

                    canvas.height +
                    outside;
            }

        } else {

            /*
                Willekeurige rand.
            */

            const side =
                Math.floor(

                    Math.random() *
                    4
                );


            if (
                side ===
                0
            ) {

                enemy.x =
                    -outside;

                enemy.y =

                    Math.random() *
                    canvas.height;

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

            } else if (
                side ===
                2
            ) {

                enemy.x =

                    Math.random() *
                    canvas.width;

                enemy.y =
                    -outside;

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
            Doel ligt redelijk diep
            in de arena.

            Hierdoor zit hij minimaal
            een tijdje echt in beeld.
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


    /*
        Wordt 1x voor alle insects
        aangeroepen per update.
    */

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
                Slime doodt speler.
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
            Altijd rechte lijn.
        */

        api.moveStraight(
            enemy,
            dt
        );


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
            Eenmaal helemaal uit:
            verwijderen.
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


    drawBelow(
        ctx
    ) {

        for (
            const slime
            of slimeTrail
        ) {

            const alpha =
                Math.max(

                    0,

                    slime.remaining /
                    slime.duration
                );


            ctx.save();


            /*
                Hoofd-slijmblob.
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

                `rgba(69,190,68,${
                    0.52 *
                    alpha
                })`;


            ctx.fill();


            /*
                Extra slijmbobbels.
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

                    `rgba(85,220,75,${
                        0.34 *
                        alpha
                    })`;


                ctx.fill();
            }


            /*
                Glanzende highlight.
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

                `rgba(210,255,190,${
                    0.55 *
                    alpha
                })`;


            ctx.fill();


            ctx.restore();
        }
    },


    draw(
        enemy,
        ctx
    ) {

        const r =
            enemy.radius;


        const angle =
            Math.atan2(

                enemy.vy,

                enemy.vx
            );


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
            RUPSLICHAAM
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
            KOP
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
            OGEN
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
            VOELSPRIETEN
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