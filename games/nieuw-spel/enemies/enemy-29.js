const worms =
    new Map();


let nextWormId =
    1;


function clearWorms() {

    worms.clear();

    nextWormId =
        1;
}


const snowWorm = {

    id: "snow-worm",

    name: "Snow Worm",

    behavior:
        "snow-worm",

    spawnSize: 3,

    speed:
        "medium",

    /*
        SandWorm = 4.
        SnowWorm = 4 + 9 = 13.
    */

    segmentCount:
        18,

    partHp:
        12,

    headSize:
        3,

    segmentSize:
        2.3,

    headColor:
        "#e7f9ff",

    segmentColor:
        "#d4f1fa",

    image:
        "snow.png",

    bodyOverlap:
        4,

    chaseDuration:
        6,

    chaseTracking:
        0.4,

    wanderDuration:
        2,

    turnSpeed:
        0.75,


    reset() {

        clearWorms();
    },


    modifyDamage(
        enemy,
        damage
    ) {

        return (
            window.IceWorldEffects
                ?.active
        )
            ? damage * 0.5
            : damage;
    },


    spawn({
        definition,
        position,
        api
    }) {

        const wormId =
            nextWormId++;


        const baseSpeed =
            api.getEnemySpeed(
                definition.speed
            );


        const multiplier =

            window.IceWorldEffects
                ?.active

                ? 1.5
                : 1;


        const speed =
            baseSpeed *
            multiplier;


        const headRadius =
            api.getEnemyRadius(
                definition.headSize
            );


        const segmentRadius =
            api.getEnemyRadius(
                definition.segmentSize
            );


        const player =
            api.getPlayer();


        const angle =
            Math.atan2(

                player.y -
                    position.y,

                player.x -
                    position.x
            );


        const worm = {

            id:
                wormId,

            parts:
                [],

            baseSpeed,

            speed,

            angle,

            modeTime:
                0,

            wanderDirection:

                Math.random() <
                0.5

                    ? -1
                    : 1
        };


        const totalParts =
            1 +
            definition.segmentCount;


        for (
            let i = 0;
            i < totalParts;
            i++
        ) {

            const isHead =
                i === 0;


            const radius =
                isHead

                    ? headRadius
                    : segmentRadius;


            const spacing =
                headRadius +
                segmentRadius -
                definition.bodyOverlap;


            const part =
                api.createEntity(

                    definition,

                    {
                        x:
                            position.x -
                            Math.cos(
                                angle
                            ) *
                            spacing *
                            i,

                        y:
                            position.y -
                            Math.sin(
                                angle
                            ) *
                            spacing *
                            i
                    },

                    {
                        hp:
                            definition
                                .partHp,

                        maxHp:
                            definition
                                .partHp,

                        radius,

                        speed,

                        tracking:
                            definition
                                .chaseTracking,

                        color:
                            isHead

                                ? definition
                                    .headColor

                                : definition
                                    .segmentColor,

                        isWormPart:
                            true,

                        isWormHead:
                            isHead,

                        wormId,

                        headRadius,

                        segmentRadius,

                        headColor:
                            definition
                                .headColor,

                        segmentColor:
                            definition
                                .segmentColor,

                        vx:
                            Math.cos(
                                angle
                            ) *
                            speed,

                        vy:
                            Math.sin(
                                angle
                            ) *
                            speed
                    }
                );


            worm.parts.push(
                part
            );
        }


        worms.set(
            wormId,
            worm
        );


        return worm.parts;
    },


    beforeUpdate(
        dt,
        api
    ) {

        for (
            const worm
            of worms.values()
        ) {

            if (
                worm.parts.length ===
                0
            ) {

                continue;
            }


            const multiplier =

                window.IceWorldEffects
                    ?.active

                    ? 1.5
                    : 1;


            worm.speed =
                worm.baseSpeed *
                multiplier;


            const head =
                worm.parts[0];


            head.isWormHead =
                true;


            const cycleLength =
                this.chaseDuration +
                this.wanderDuration;


            const previousMode =

                worm.modeTime <
                this.chaseDuration

                    ? "chase"
                    : "wander";


            worm.modeTime +=
                dt;


            if (
                worm.modeTime >=
                cycleLength
            ) {

                worm.modeTime %=
                    cycleLength;
            }


            const mode =

                worm.modeTime <
                this.chaseDuration

                    ? "chase"
                    : "wander";


            if (
                previousMode ===
                    "chase" &&

                mode ===
                    "wander"
            ) {

                worm.wanderDirection =

                    Math.random() <
                    0.5

                        ? -1
                        : 1;


                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );
            }


            if (
                mode ===
                "chase"
            ) {

                const player =
                    api.getPlayer();


                const dx =
                    player.x -
                    head.x;


                const dy =
                    player.y -
                    head.y;


                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                const desiredVx =
                    dx /
                    distance *
                    worm.speed;


                const desiredVy =
                    dy /
                    distance *
                    worm.speed;


                const steering =
                    1 -
                    Math.exp(
                        -this
                            .chaseTracking *
                        dt
                    );


                head.vx +=
                    (
                        desiredVx -
                        head.vx
                    ) *
                    steering;


                head.vy +=
                    (
                        desiredVy -
                        head.vy
                    ) *
                    steering;


                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );


            } else {

                worm.angle +=

                    this.turnSpeed *
                    worm
                        .wanderDirection *
                    dt;


                head.vx =
                    Math.cos(
                        worm.angle
                    ) *
                    worm.speed;


                head.vy =
                    Math.sin(
                        worm.angle
                    ) *
                    worm.speed;
            }


            head.x +=
                head.vx *
                dt;


            head.y +=
                head.vy *
                dt;


            head.speed =
                worm.speed;


            if (
                !head.enteredArena &&
                api.isInsideArena(
                    head
                )
            ) {

                head.enteredArena =
                    true;
            }


            if (
                head.enteredArena
            ) {

                api.keepInsideArena(
                    head
                );


                worm.angle =
                    Math.atan2(
                        head.vy,
                        head.vx
                    );
            }


            /*
                Alle 13 segmenten volgen
                exact zoals bij SandWorm.
            */

            for (
                let i = 1;
                i <
                    worm.parts.length;
                i++
            ) {

                const previous =
                    worm.parts[
                        i - 1
                    ];


                const part =
                    worm.parts[i];


                part.isWormHead =
                    false;


                part.radius =
                    part.segmentRadius;


                part.color =
                    part.segmentColor;


                part.speed =
                    worm.speed;


                const dx =
                    part.x -
                    previous.x;


                const dy =
                    part.y -
                    previous.y;


                const distance =
                    Math.hypot(
                        dx,
                        dy
                    ) || 1;


                const wantedDistance =
                    Math.max(
                        2,

                        previous.radius +
                        part.radius -
                        this.bodyOverlap
                    );


                part.x =
                    previous.x +
                    dx /
                    distance *
                    wantedDistance;


                part.y =
                    previous.y +
                    dy /
                    distance *
                    wantedDistance;


                part.vx =
                    head.vx;


                part.vy =
                    head.vy;
            }
        }
    },


    update() {

        /*
            Hele worm wordt in
            beforeUpdate bestuurd.
        */
    },


    onDeath(
        enemy
    ) {

        const worm =
            worms.get(
                enemy.wormId
            );


        if (!worm) {

            return;
        }


        const index =
            worm.parts.indexOf(
                enemy
            );


        if (
            index === -1
        ) {

            return;
        }


        worm.parts.splice(
            index,
            1
        );


        if (
            worm.parts.length ===
            0
        ) {

            worms.delete(
                enemy.wormId
            );

            return;
        }


        /*
            Hoofd dood:
            volgende segment wordt hoofd.
        */

        if (
            index === 0
        ) {

            const newHead =
                worm.parts[0];


            newHead.isWormHead =
                true;


            newHead.radius =
                newHead.headRadius;


            newHead.color =
                newHead.headColor;


            newHead.vx =
                Math.cos(
                    worm.angle
                ) *
                worm.speed;


            newHead.vy =
                Math.sin(
                    worm.angle
                ) *
                worm.speed;
        }
    },


    draw(
        enemy,
        ctx,
        api
    ) {

        const image =
            api.getAssetImage(
                this.image
            );


        const r =
            enemy.radius;


        ctx.save();


        ctx.beginPath();

        ctx.arc(
            enemy.x,
            enemy.y,
            r,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            enemy.isWormHead

                ? this.headColor
                : this.segmentColor;


        ctx.fill();


        if (
            image &&
            image.complete &&
            image.naturalWidth > 0
        ) {

            ctx.save();

            ctx.clip();

            ctx.globalAlpha =
                0.78;


            ctx.drawImage(
                image,

                enemy.x -
                    r,

                enemy.y -
                    r,

                r * 2,
                r * 2
            );


            ctx.restore();
        }


        ctx.strokeStyle =
            "#9ed7e8";


        ctx.lineWidth =
            2;


        ctx.stroke();


        ctx.restore();


        /*
            Net als SandWorm alleen
            hoofd met boos gezicht.
        */

        if (
            enemy.isWormHead
        ) {

            api.drawEnemyFace(
                enemy
            );
        }
    }
};


export default snowWorm;