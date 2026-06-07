import asyncio
import math
import random
from pathlib import Path

import pygame


async def bossfight_Bond(screen):
    # ============================================================
    # Setup
    # ============================================================
    w, h = screen.get_size()
    clock = pygame.time.Clock()

    def clamp(v, lo, hi):
        return lo if v < lo else hi if v > hi else v

    def normalize(dx, dy):
        d = math.hypot(dx, dy)
        if d <= 1e-9:
            return 1.0, 0.0
        return dx / d, dy / d

    def dist_point_to_segment(px, py, ax, ay, bx, by):
        vx = bx - ax
        vy = by - ay
        wx = px - ax
        wy = py - ay
        vv = vx * vx + vy * vy
        if vv <= 1e-9:
            return math.hypot(px - ax, py - ay)
        t = (wx * vx + wy * vy) / vv
        t = clamp(t, 0.0, 1.0)
        cx_ = ax + t * vx
        cy_ = ay + t * vy
        return math.hypot(px - cx_, py - cy_)

    # ============================================================
    # End screen
    # ============================================================
    async def end_screen(result: str):
        t0 = pygame.time.get_ticks()
        font_big = pygame.font.SysFont(None, 90)
        font_small = pygame.font.SysFont(None, 42)

        while True:
            await asyncio.sleep(0)
            dt_ms = clock.tick(60)
            step = dt_ms / 16.6667
            now = pygame.time.get_ticks()

            refresh_stage3_temp_shrink(now)

            if boss_pending_move is not None and now >= boss_pending_move["at"]:
                left, top, right, bottom = arena_bounds()
                boss_x = float(clamp(boss_pending_move["x"], left + 2, right - boss_size - 2))
                boss_y = float(clamp(boss_pending_move["y"], top + 2, bottom - boss_size - 2))
                boss_pending_move = None

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        raw_mx, raw_my = pygame.mouse.get_pos()
        mx = clamp(raw_mx, 0, w - 1)
        my = clamp(raw_my, 0, h - 1)

        cursor_vel[0] = (mx - cursor_prev[0]) / max(1.0, step)
        cursor_vel[1] = (my - cursor_prev[1]) / max(1.0, step)
        cursor_prev[0] = mx
        cursor_prev[1] = my

        if not stage2_active:
            while now >= next_attack_time:
                start_stage_attack(now, mx, my)
                next_attack_time += attack_interval_ms
        elif stage3_active:
            if stage3_wait_for_damage and not damage_balls and not damage_orbs:
                init_stage3_cycle(now + 700)
                stage3_next_attack_start = now + 700

            if now >= boss_pause_until and not stage3_wait_for_damage:
                while now >= stage3_next_attack_start and not stage3_wait_for_damage:
                    if stage3_attack_pool:
                        picked = try_pick_stage3_attack()
                        if picked is None:
                            stage3_next_attack_start += 300
                            break
                        spawn_stage3_attack(picked, now, mx, my)
                        stage3_next_attack_start += stage3_attack_interval_ms
                    else:
                        spawn_damage_attack(now, mx, my)
                        stage3_wait_for_damage = True
                        stage3_next_attack_start = now + stage3_attack_interval_ms
        else:
            if phase2_wait_for_damage and not damage_balls and not damage_orbs:
                phase2_wait_for_damage = False
                stage3_active = False    
                stage3_wait_for_damage = False   
                stage3_next_attack_start = 0   
                stage3_attack_pool = []               
                phase2_next_attack_start = max(phase2_next_attack_start, now)

            if now >= boss_pause_until and not phase2_wait_for_damage:
                while now >= phase2_next_attack_start and not phase2_wait_for_damage:
                    start_phase2_attack(now, mx, my)
                    phase2_next_attack_start += phase2_attack_start_interval_ms

        # Stage 3 active attack timelines (20s windows, can overlap).
        for atk in stage3_active_attacks[:]:
            if atk["id"] == 2:
                while now >= atk["next_wall"] and now < atk["end"]:
                    left, top, right, bottom = arena_bounds()
                    thickness = max(36.0, min(72.0, (right - left) * 0.05))
                    gap_half = max(56.0, min(90.0, (bottom - top) * 0.13))
                    gap_y = random.uniform(top + gap_half + 24.0, bottom - gap_half - 24.0)
                    speed = max(4.2, min(8.4, (right - left) / 160.0))
                    stage3_hole_walls.append({
                        "x": left - thickness * 0.5,
                        "vx": speed,
                        "thickness": thickness,
                        "gap_y": gap_y,
                        "gap_half": gap_half,
                        "safe": 7.0,
                    })
                    atk["next_wall"] += 1000
            elif atk["id"] == 3:
                if not atk["spawned0"] and now >= atk["start"]:
                    spawn_stage3_miniboss("corner", now)
                    atk["spawned0"] = True
                if not atk["spawned12"] and now >= atk["start"] + 12000:
                    spawn_stage3_miniboss("corner", now)
                    atk["spawned12"] = True

            if now >= atk["end"]:
                stage3_active_attacks.remove(atk)

        refresh_stage3_temp_shrink(now)

        # Attack 1: 10 mild homing shots in 20 seconds.
        for atk in homing_attackers[:]:
            while atk["shots_left"] > 0 and now >= atk["next_shot"]:
                bx, by = boss_center()
                dx, dy = normalize(mx - bx, my - by)
                homing_shots.append({
                    "x": float(bx),
                    "y": float(by),
                    "vx": dx * 5.2,
                    "vy": dy * 5.2,
                    "r": 16,
                    "expire_time": now + 20000,
                })
                atk["shots_left"] -= 1
                atk["next_shot"] += 2000
            if now >= atk["end_time"] and atk["shots_left"] <= 0:
                homing_attackers.remove(atk)

        for shot in homing_shots[:]:
            desired_dx, desired_dy = normalize(mx - shot["x"], my - shot["y"])
            speed = max(0.01, math.hypot(shot["vx"], shot["vy"]))
            cur_dx, cur_dy = normalize(shot["vx"], shot["vy"])
            turn = min(0.035 * step, 0.13)
            mix_dx = cur_dx * (1.0 - turn) + desired_dx * turn
            mix_dy = cur_dy * (1.0 - turn) + desired_dy * turn
            mix_dx, mix_dy = normalize(mix_dx, mix_dy)
            shot["vx"] = mix_dx * speed
            shot["vy"] = mix_dy * speed
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step

            if touches_arena_wall(shot["x"], shot["y"], shot["r"]):
                lethal_zones.append({
                    "x": shot["x"],
                    "y": shot["y"],
                    "r": 108,                   
                    "end_time": now + 3600,                    
                    "color": (255, 0, 0),                   
                    "blink": False,                   
                    "solid": True,
                })
                homing_shots.remove(shot)
                continue

            if now >= shot["expire_time"]:
                lethal_zones.append({
                    "x": shot["x"],
                    "y": shot["y"],
                    "r": 136,                   
                    "end_time": now + 3600,                   
                    "color": (255, 0, 0),                  
                    "blink": False,                  
                     "solid": True,
                })
                homing_shots.remove(shot)

        # Attack 2: 5 ring bursts. Bounce, shatter, blink, then small red zones.
        for atk in ring_attackers[:]:
            while atk["bursts_left"] > 0 and now >= atk["next_burst"]:
                bx, by = boss_center()
                aim_ang = math.atan2(atk["aim_y"] - by, atk["aim_x"] - bx)
                for i in range(8):
                    ang = aim_ang + i * (math.tau / 8.0)
                    ring_balls.append({
                        "x": float(bx),
                        "y": float(by),
                        "vx": math.cos(ang) * 6.0,
                        "vy": math.sin(ang) * 6.0,
                        "r": 15,
                        "spawn_time": now,
                        "shattered": False,
                    })
                atk["bursts_left"] -= 1
                atk["next_burst"] += 4000
                atk["aim_x"] = mx
                atk["aim_y"] = my
            if now >= atk["end_time"] and atk["bursts_left"] <= 0:
                ring_attackers.remove(atk)

        for ball in ring_balls[:]:
            age = now - ball["spawn_time"]
            if age >= 12000:
                lethal_zones.append({
                    "x": ball["x"],
                    "y": ball["y"],
                    "r": 60,
                    "end_time": now + 2000,
                    "color": (255, 0, 0),
                    "blink": False,
                    "solid": True,
                })
                ring_balls.remove(ball)
                continue

            if age >= 8000 and not ball["shattered"]:
                ball["shattered"] = True

            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounce_ball(ball)

        # Attack 3: one bouncing trail ball with light homing.
        for ball in trail_balls[:]:
            desired_dx, desired_dy = normalize(mx - ball["x"], my - ball["y"])
            speed = max(0.01, math.hypot(ball["vx"], ball["vy"]))
            cur_dx, cur_dy = normalize(ball["vx"], ball["vy"])
            turn = min(0.018 * step, 0.08)
            mix_dx = cur_dx * (1.0 - turn) + desired_dx * turn
            mix_dy = cur_dy * (1.0 - turn) + desired_dy * turn
            mix_dx, mix_dy = normalize(mix_dx, mix_dy)
            ball["vx"] = mix_dx * speed
            ball["vy"] = mix_dy * speed

            old_x = ball["x"]
            old_y = ball["y"]
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounce_ball(ball)

            while now >= ball["next_trail"]:
                trail_segments.append({
                    "ax": ball["x"],
                    "ay": ball["y"],
                    "bx": ball["x"],
                    "by": ball["y"],
                    "width": 12,
                    "end_time": now + 15000,
                })
                ball["next_trail"] += ball["trail_gap_ms"]

            if now >= ball["end_time"]:
                trail_balls.remove(ball)

        # Attack 4: gravity cores with 5 orbiting satellites.
        for atk in gravity_attackers[:]:
            while atk["spawns_left"] > 0 and now >= atk["next_spawn"]:
                bx, by = boss_center()
                ang = math.atan2(my - by, mx - bx) + random.uniform(-0.4, 0.4)
                orbiters = []
                for _ in range(5):
                    orbiters.append({
                        "angle": random.uniform(0, math.tau),
                        "dist": random.uniform(90.0, 380.0),
                        "speed": random.uniform(-0.045, 0.045),
                        "r": 14,
                    })
                gravity_clusters.append({
                    "x": float(bx),
                    "y": float(by + 180.0),
                    "vx": math.cos(ang) * 2.35,
                    "vy": math.sin(ang) * 2.35,
                    "r": 26,
                    "field_r": 420,
                    "end_time": now + 10000,
                    "orbiters": orbiters,
                })
                atk["spawns_left"] -= 1
                atk["next_spawn"] += 3333
            if now >= atk["end_time"] and atk["spawns_left"] <= 0:
                gravity_attackers.remove(atk)

        for cluster in gravity_clusters[:]:
            cluster["x"] += cluster["vx"] * step
            cluster["y"] += cluster["vy"] * step
            for orb in cluster["orbiters"]:
                orb["angle"] += orb["speed"] * step
            if now >= cluster["end_time"]:
                gravity_clusters.remove(cluster)

        # Attack 5: splitters. Each bounce spawns another ball.
        for ball in splitter_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounced = bounce_ball(ball)
            if bounced:
                if (
                    now >= ball["spawn_lock_until"]
                    and len(splitter_balls) < 20
                    and now < ball["expire_time"]
                ):
                    child_ang = random.uniform(0, math.tau)
                    child_speed = random.uniform(4.0, 6.0)
                    splitter_balls.append({
                        "x": float(ball["x"]),
                        "y": float(ball["y"]),
                        "vx": math.cos(child_ang) * child_speed,
                        "vy": math.sin(child_ang) * child_speed,
                        "r": 16,
                        "bounces_left": 4,
                        "spawn_lock_until": now + 500,
                        "expire_time": ball["expire_time"],
                    })
                    ball["spawn_lock_until"] = now + 500
                ball["bounces_left"] -= 1

            if ball["bounces_left"] <= 0 or now >= ball["expire_time"]:
                splitter_balls.remove(ball)

        # Attack 6 replacement: one sentry that fires square Bond shots each second.
        for atk in sentry_attackers[:]:
            while now >= atk["next_shot"] and now < atk["end_time"]:
                dx, dy = normalize(mx - atk["x"], my - atk["y"])
                sentry_shots.append({
                    "x": float(atk["x"]),
                    "y": float(atk["y"]),
                    "vx": dx * 7.2,
                    "vy": dy * 7.2,
                    "half": 9.0,
                    "expire_time": now + 9000,
                })
                atk["next_shot"] += 1000
            if now >= atk["end_time"]:
                sentry_attackers.remove(atk)

        for shot in sentry_shots[:]:
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step
            if now >= shot["expire_time"]:
                sentry_shots.remove(shot)
                continue
            if not inside_arena(shot["x"], shot["y"]):
                sentry_shots.remove(shot)

        # Damage attack: 20s movement + radial volleys, then green orb.
        for ball in damage_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounce_ball(ball)

            while now >= ball["next_radial"] and now < ball["explode_time"]:
                spawn_damage_radial(ball["x"], ball["y"], 10, 5.8, 7000, now)
                ball["next_radial"] += 3000

            if now >= ball["explode_time"]:
                spawn_damage_radial(ball["x"], ball["y"], 16, 6.2, 7600, now)
                damage_orbs.append({
                    "x": ball["x"],
                    "y": ball["y"],
                    "vx": 0.0,
                    "vy": 0.0,
                    "r": 18,
                    "state": "idle",
                    "expire_time": now + 12000,
                })
                damage_balls.remove(ball)

        # Phase 2 attack updates.
        if stage2_active and not stage3_active and now >= boss_pause_until:
            for atk in phase2_line_attackers[:]:
                while now >= atk["next_shot"] and now < atk["end_time"]:
                    spawn_phase2_line_shot(now, mx, my)
                    atk["next_shot"] += phase2_line_shot_interval_ms
                if now >= atk["end_time"]:
                    phase2_line_attackers.remove(atk)

            for atk in phase2_stream_attackers[:]:
                while now >= atk["next_spawn"] and now < atk["end_time"]:
                    elapsed = atk["next_spawn"] - atk["start_time"]
                    cycle = phase2_stream_burst_on_ms + phase2_stream_burst_off_ms
                    if cycle <= 0 or (elapsed % cycle) < phase2_stream_burst_on_ms:
                        spawn_phase2_stream_ball(now)
                    atk["next_spawn"] += random.randint(phase2_stream_spawn_min_ms, phase2_stream_spawn_max_ms)
                if now >= atk["end_time"]:
                    phase2_stream_attackers.remove(atk)

            for atk in phase2_giant_attackers[:]:
                while atk["spawns_left"] > 0 and now >= atk["next_spawn"] and now < atk["end_time"]:
                    spawn_phase2_giant_homing_ball(now)
                    atk["spawns_left"] -= 1
                    atk["next_spawn"] += phase2_giant_spawn_interval_ms
                if now >= atk["end_time"] and atk["spawns_left"] <= 0:
                    phase2_giant_attackers.remove(atk)

            for atk in phase2_shrink_attackers[:]:
                while atk["spawns_left"] > 0 and now >= atk["next_spawn"] and now < atk["end_time"]:
                    spawn_phase2_shrink_ring(now)
                    atk["spawns_left"] -= 1
                    atk["next_spawn"] += phase2_shrink_spawn_interval_ms
                if now >= atk["end_time"] and atk["spawns_left"] <= 0:
                    phase2_shrink_attackers.remove(atk)

            for atk in phase2_bouncy_line_attackers[:]:
                while atk["spawns_left"] > 0 and now >= atk["next_spawn"] and now < atk["end_time"]:
                    spawn_phase2_bouncy_line(now, mx, my)
                    atk["spawns_left"] -= 1
                    atk["next_spawn"] += phase2_bouncy_line_spawn_interval_ms
                if now >= atk["end_time"] and atk["spawns_left"] <= 0:
                    phase2_bouncy_line_attackers.remove(atk)

        for shot in phase2_line_shots[:]:
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step
            if now >= shot["expire_time"]:
                phase2_line_shots.remove(shot)
                continue
            if not inside_arena(shot["x"], shot["y"]):
                phase2_line_shots.remove(shot)

        left, top, right, bottom = arena_bounds()
        for ball in phase2_stream_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            if now >= ball["expire_time"]:
                phase2_stream_balls.remove(ball)
                continue
            if (
                ball["x"] < left - ball["r"] * 2
                or ball["x"] > right + ball["r"] * 2
                or ball["y"] < top - ball["r"] * 2
                or ball["y"] > bottom + ball["r"] * 2
            ):
                phase2_stream_balls.remove(ball)

        for ball in phase2_giant_homing_balls[:]:
            desired_dx, desired_dy = normalize(mx - ball["x"], my - ball["y"])
            speed = max(0.01, math.hypot(ball["vx"], ball["vy"]))
            cur_dx, cur_dy = normalize(ball["vx"], ball["vy"])
            turn = min(0.028 * step, 0.10)
            mix_dx = cur_dx * (1.0 - turn) + desired_dx * turn
            mix_dy = cur_dy * (1.0 - turn) + desired_dy * turn
            mix_dx, mix_dy = normalize(mix_dx, mix_dy)
            ball["vx"] = mix_dx * speed
            ball["vy"] = mix_dy * speed

            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounce_ball(ball)

            if now >= ball["end_time"]:
                phase2_giant_homing_balls.remove(ball)

        for ring in phase2_shrink_rings[:]:
            if now >= ring["end_time"]:
                phase2_shrink_rings.remove(ring)

        for line in phase2_bouncy_lines[:]:
            line["x1"] += line["vx1"] * step
            line["y1"] += line["vy1"] * step
            line["x2"] += line["vx2"] * step
            line["y2"] += line["vy2"] * step

            pad = max(2.0, line["width"] * 0.5)
            line["x1"], line["y1"], line["vx1"], line["vy1"], b1 = bounce_endpoint(
                line["x1"], line["y1"], line["vx1"], line["vy1"], pad
            )
            line["x2"], line["y2"], line["vx2"], line["vy2"], b2 = bounce_endpoint(
                line["x2"], line["y2"], line["vx2"], line["vy2"], pad
            )

            if b1 > 0:
                line["bounces_left"] -= b1
            if b2 > 0:
                line["bounces_left"] -= b2

            if line["bounces_left"] <= 0 or now >= line["end_time"]:
                phase2_bouncy_lines.remove(line)

        for wall in stage3_hole_walls[:]:
            wall["x"] += wall["vx"] * step
            left, top, right, bottom = arena_bounds()
            if wall["x"] - wall["thickness"] * 0.5 > right + 40:
                stage3_hole_walls.remove(wall)

        for seq in stage3_laser_sequences[:]:
            age = now - seq["start"]
            if age < 0:
                continue

            bx, by = boss_center()
            if age < 2000:
                seq["aim_angle"] = math.atan2(my - by, mx - bx)
            elif not seq["locked"]:
                seq["lock_angle"] = seq.get("aim_angle", math.atan2(my - by, mx - bx))
                seq["locked"] = True

            if age >= 3000 and not seq["fired"]:
                ang = seq["lock_angle"] if seq["locked"] else math.atan2(my - by, mx - bx)
                beam_len = max(w, h) * 2.1
                ex = bx + math.cos(ang) * beam_len
                ey = by + math.sin(ang) * beam_len
                stage3_laser_beams.append({
                    "ax": bx,
                    "ay": by,
                    "bx": ex,
                    "by": ey,
                    "width": 22.0,
                    "end_time": now + 18000,
                    "next_ball": now + 1000,
                })
                seq["fired"] = True

            if age >= 3000 and seq["fired"]:
                stage3_laser_sequences.remove(seq)

        for beam in stage3_laser_beams[:]:
            while now >= beam["next_ball"] and now < beam["end_time"]:
                for _ in range(3):
                    t = random.uniform(0.05, 0.95)
                    sx = lerp(beam["ax"], beam["bx"], t)
                    sy = lerp(beam["ay"], beam["by"], t)
                    tx = mx + random.uniform(-75.0, 75.0)
                    ty = my + random.uniform(-75.0, 75.0)
                    dx, dy = normalize(tx - sx, ty - sy)
                    stage3_laser_balls.append({
                        "x": sx,
                        "y": sy,
                        "vx": dx * 4.4,
                        "vy": dy * 4.4,
                        "r": 9.0,
                        "expire_time": now + 7000,
                    })
                beam["next_ball"] += 1000
            if now >= beam["end_time"]:
                stage3_laser_beams.remove(beam)

        for ball in stage3_laser_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            if now >= ball["expire_time"]:
                stage3_laser_balls.remove(ball)
                continue
            if not inside_arena(ball["x"], ball["y"]):
                stage3_laser_balls.remove(ball)

        swing_segments = []
        for swing in stage3_swing_lines[:]:
            if now >= swing["end"]:
                stage3_swing_lines.remove(swing)
                continue

            life = (now - swing["start"]) / 1000.0
            left, top, right, bottom = arena_bounds()
            length = max(right - left, bottom - top) * 1.45
            ang = math.sin(life * 1.5) * 1.2
            ax, ay = boss_center()
            ux = math.cos(ang)
            uy = math.sin(ang)

            hole_center = length * 0.48 + math.sin(life * 0.85) * length * 0.22
            hole_half = swing["hole_half"]
            h0 = max(0.0, hole_center - hole_half)
            h1 = min(length, hole_center + hole_half)

            if h0 > 4.0:
                swing_segments.append({
                    "ax": ax,
                    "ay": ay,
                    "bx": ax + ux * h0,
                    "by": ay + uy * h0,
                    "width": swing["width"],
                })
            if h1 < length - 4.0:
                swing_segments.append({
                    "ax": ax + ux * h1,
                    "ay": ay + uy * h1,
                    "bx": ax + ux * length,
                    "by": ay + uy * length,
                    "width": swing["width"],
                })

        for ring in stage3_trap_rings[:]:
            if now >= ring["end"]:
                stage3_trap_rings.remove(ring)
                continue

            ring["x"] += ring["vx"] * step
            ring["y"] += ring["vy"] * step
            left, top, right, bottom = arena_bounds()
            safe_r = ring["r"] - ring["thickness"] * 0.5 - 6.0
            if ring["x"] - safe_r <= left:
                ring["x"] = left + safe_r
                ring["vx"] = abs(ring["vx"])
            elif ring["x"] + safe_r >= right:
                ring["x"] = right - safe_r
                ring["vx"] = -abs(ring["vx"])

            if ring["y"] - safe_r <= top:
                ring["y"] = top + safe_r
                ring["vy"] = abs(ring["vy"])
            elif ring["y"] + safe_r >= bottom:
                ring["y"] = bottom - safe_r
                ring["vy"] = -abs(ring["vy"])

        miniboss_force_x = 0.0
        miniboss_force_y = 0.0
        blackout_active = False

        for mb in stage3_minibosses[:]:
            mb["beam_visible"] = False
            blinking = miniboss_is_blinking(mb, now)

            if blinking and circle_hits_player(mb["x"], mb["y"], mb["r"], mx, my):
                stage3_minibosses.remove(mb)
                continue
            if blinking:
                continue

            if mb["kind"] == "corner":
                left, top, right, bottom = arena_bounds()
                margin = max(70.0, mb["r"] + 26.0)
                corners = [
                    (left + margin, top + margin),
                    (right - margin, top + margin),
                    (left + margin, bottom - margin),
                    (right - margin, bottom - margin),
                ]
                if now >= mb["next_dash"]:
                    tx, ty = max(corners, key=lambda c: (c[0] - mb["x"]) ** 2 + (c[1] - mb["y"]) ** 2)
                    if random.random() < 0.45:
                        tx, ty = random.choice(corners)
                    dx, dy = normalize(tx - mb["x"], ty - mb["y"])
                    mb["dash_vx"] = dx * 13.2
                    mb["dash_vy"] = dy * 13.2
                    mb["dash_end"] = now + 650
                    mb["target_x"] = tx
                    mb["target_y"] = ty
                    mb["next_dash"] = now + 10000

                if now < mb["dash_end"]:
                    mb["x"] += mb["dash_vx"] * step
                    mb["y"] += mb["dash_vy"] * step
                else:
                    dx, dy = normalize(mb["target_x"] - mb["x"], mb["target_y"] - mb["y"])
                    mb["x"] += dx * 2.2 * step
                    mb["y"] += dy * 2.2 * step

                if now >= mb["next_attack"]:
                    mb["attack_type"] = random.choice((1, 2, 3))
                    mb["attack_end"] = now + 8000
                    mb["next_attack"] = now + 10000

                if mb["attack_type"] is not None and now < mb["attack_end"]:
                    aim_ang = math.atan2(my - mb["y"], mx - mb["x"])
                    da = ((aim_ang - mb["beam_angle"] + math.pi) % math.tau) - math.pi
                    mb["beam_angle"] += da * min(1.0, 0.18 * step)
                    beam_len = max(w, h) * 2.0
                    bx2 = mb["x"] + math.cos(mb["beam_angle"]) * beam_len
                    by2 = mb["y"] + math.sin(mb["beam_angle"]) * beam_len
                    mb["beam_visible"] = True
                    mb["beam_ax"] = mb["x"]
                    mb["beam_ay"] = mb["y"]
                    mb["beam_bx"] = bx2
                    mb["beam_by"] = by2
                    mb["beam_width"] = 20.0

                    if dist_point_to_segment(mx, my, mb["x"], mb["y"], bx2, by2) <= 10.0:
                        to_dx = mb["x"] - mx
                        to_dy = mb["y"] - my
                        dist = max(1e-6, math.hypot(to_dx, to_dy))
                        f = 18.5 * step
                        if mb["attack_type"] == 1:
                            miniboss_force_x += (to_dx / dist) * f
                            miniboss_force_y += (to_dy / dist) * f
                        elif mb["attack_type"] == 2:
                            miniboss_force_x -= (to_dx / dist) * f
                            miniboss_force_y -= (to_dy / dist) * f
                        else:
                            blackout_active = True
                else:
                    mb["attack_type"] = None

            elif mb["kind"] == "predictive":
                pred_x = mx + cursor_vel[0] * 22.0
                pred_y = my + cursor_vel[1] * 22.0
                pred_x, pred_y = project_inside(pred_x, pred_y, margin=mb["r"] + 8)

                if now >= mb["next_charge"]:
                    dx, dy = normalize(pred_x - mb["x"], pred_y - mb["y"])
                    mb["charge_vx"] = dx * 12.6
                    mb["charge_vy"] = dy * 12.6
                    mb["charge_end"] = now + 420
                    mb["next_charge"] = now + 4000

                if now < mb["charge_end"]:
                    mb["x"] += mb["charge_vx"] * step
                    mb["y"] += mb["charge_vy"] * step
                else:
                    dx, dy = normalize(pred_x - mb["x"], pred_y - mb["y"])
                    mb["x"] += dx * 2.15 * step
                    mb["y"] += dy * 2.15 * step

            elif mb["kind"] == "grow":
                if abs(mb["grow_target_x"] - mb["x"]) < 1.0 and abs(mb["grow_target_y"] - mb["y"]) < 1.0:
                    left, top, right, bottom = arena_bounds()
                    mb["grow_target_x"] = clamp((left + right) - mb["x"], left + 120.0, right - 120.0)
                    mb["grow_target_y"] = clamp((top + bottom) - mb["y"], top + 90.0, bottom - 90.0)

                dx, dy = normalize(mb["grow_target_x"] - mb["x"], mb["grow_target_y"] - mb["y"])
                mb["x"] += dx * 2.0 * step
                mb["y"] += dy * 2.0 * step

                while now >= mb["next_spawn"]:
                    stage3_grow_balls.append({
                        "x": mb["x"],
                        "y": mb["y"],
                        "vx": 0.0,
                        "vy": 0.0,
                        "r": 8.0,
                        "spawn_time": now,
                        "state": "grow",
                        "blink_start": 0,
                    })
                    mb["next_spawn"] += 8000

            mb["x"], mb["y"] = project_inside(mb["x"], mb["y"], margin=mb["r"] + 4)

        for gb in stage3_grow_balls[:]:
            if gb["state"] == "grow":
                dx, dy = normalize(mx - gb["x"], my - gb["y"])
                gb["vx"] = dx * 1.9
                gb["vy"] = dy * 1.9
                gb["x"] += gb["vx"] * step
                gb["y"] += gb["vy"] * step
                gb["x"], gb["y"] = project_inside(gb["x"], gb["y"], margin=8)
                t = clamp((now - gb["spawn_time"]) / 8000.0, 0.0, 1.0)
                gb["r"] = 8.0 + t * 52.0
                if now >= gb["spawn_time"] + 8000:
                    gb["state"] = "blink"
                    gb["blink_start"] = now
            elif gb["state"] == "blink":
                if now >= gb["blink_start"] + 1000:
                    stage3_craters.append({
                        "x": gb["x"],
                        "y": gb["y"],
                        "r": max(120.0, gb["r"] * 2.3),
                        "end_time": now + 10000,
                    })
                    stage3_grow_balls.remove(gb)

        for crater in stage3_craters[:]:
            if now >= crater["end_time"]:
                stage3_craters.remove(crater)

        for shot in damage_radial_shots[:]:
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step
            if now >= shot["expire_time"]:
                damage_radial_shots.remove(shot)
                continue
            left, top, right, bottom = arena_bounds()
            if shot["x"] < left - 40 or shot["x"] > right + 40 or shot["y"] < top - 40 or shot["y"] > bottom + 40:
                damage_radial_shots.remove(shot)

        # Cleanup timed objects.
        for zone in lethal_zones[:]:
            if now >= zone["end_time"]:
                lethal_zones.remove(zone)

        for pulse in visual_pulses[:]:
            if now >= pulse["end_time"]:
                visual_pulses.remove(pulse)

        for seg in trail_segments[:]:
            if now >= seg["end_time"]:
                trail_segments.remove(seg)

        # Combined cursor forces: gravity + miniboss beam forces.
        pull_dx = 0.0
        pull_dy = 0.0
        for cluster in gravity_clusters:
            dx = cluster["x"] - mx
            dy = cluster["y"] - my
            dist = math.hypot(dx, dy)
            if dist <= 1e-9 or dist >= cluster["field_r"]:
                continue
            strength = max(0.9 * step, (1.0 - dist / cluster["field_r"]) * 5.0 * step)
            pull_dx += (dx / dist) * strength
            pull_dy += (dy / dist) * strength

        pull_dx += miniboss_force_x
        pull_dy += miniboss_force_y

        pull_len = math.hypot(pull_dx, pull_dy)
        if pull_len > 22.0 * step:
            scale = (22.0 * step) / pull_len
            pull_dx *= scale
            pull_dy *= scale

        if pull_len > 0.0:
            mx = clamp(mx + pull_dx, 0, w - 1)
            my = clamp(my + pull_dy, 0, h - 1)

        for ring in stage3_trap_rings:
            dx = mx - ring["x"]
            dy = my - ring["y"]
            dist = math.hypot(dx, dy)
            lock_r = ring["r"] - ring["thickness"] * 0.5 - 6.0
            if dist > lock_r:
                nx, ny = normalize(dx, dy)
                mx = ring["x"] + nx * lock_r
                my = ring["y"] + ny * lock_r

        if abs(mx - raw_mx) > 0.5 or abs(my - raw_my) > 0.5:
            pygame.mouse.set_pos((int(mx), int(my)))

        # Shield
        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # Green orb logic
        for orb in damage_orbs[:]:
            if orb["state"] == "idle":
                if now >= orb["expire_time"]:
                    damage_orbs.remove(orb)
                    continue
                if circle_hits_player(orb["x"], orb["y"], orb["r"], mx, my):
                    orb["state"] = "to_boss"

            if orb["state"] == "to_boss":
                bx, by = boss_center()
                dx, dy = normalize(bx - orb["x"], by - orb["y"])
                orb["vx"] = dx * 8.8
                orb["vy"] = dy * 8.8
                orb["x"] += orb["vx"] * step
                orb["y"] += orb["vy"] * step

                if boss_rect().inflate(10, 10).collidepoint(orb["x"], orb["y"]):
                    damage_orbs.remove(orb)
                    if boss_take_damage(now):
                        return
                    break

        # ============================================================
        # Lethal checks
        # ============================================================
        if not inside_arena(mx, my):
            if die(now):
                return

        if now >= boss_black_until and boss_rect().collidepoint(mx, my):
            if die(now):
                return

        for shot in homing_shots:
            if circle_hits_player(shot["x"], shot["y"], shot["r"], mx, my):
                if die(now):
                    return

        for ball in ring_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for ball in trail_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for seg in trail_segments:
            if dist_point_to_segment(mx, my, seg["ax"], seg["ay"], seg["bx"], seg["by"]) <= seg["width"]:
                if die(now):
                    return

        for cluster in gravity_clusters:
            if circle_hits_player(cluster["x"], cluster["y"], cluster["r"], mx, my):
                if die(now):
                    return
            for orb in cluster["orbiters"]:
                ox = cluster["x"] + math.cos(orb["angle"]) * orb["dist"]
                oy = cluster["y"] + math.sin(orb["angle"]) * orb["dist"]
                if circle_hits_player(ox, oy, orb["r"], mx, my):
                    if die(now):
                        return

        for ball in splitter_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for anchor in spiral_anchors:
            if now >= anchor["armed_time"] and circle_hits_player(anchor["x"], anchor["y"], anchor["r"], mx, my):
                if die(now):
                    return
            for orb in anchor["orbs"]:
                if not orb["alive"]:
                    continue
                if now < anchor["armed_time"]:
                    continue
                ox = anchor["x"] + math.cos(orb["angle"]) * orb["radius"]
                oy = anchor["y"] + math.sin(orb["angle"]) * orb["radius"]
                if circle_hits_player(ox, oy, orb["r"], mx, my):
                    if die(now):
                        return

        for ball in damage_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for shot in phase2_line_shots:
            if circle_hits_player(shot["x"], shot["y"], shot["r"], mx, my):
                if die(now):
                    return
            ax, ay, bx, by = phase2_line_segment(shot)
            if dist_point_to_segment(mx, my, ax, ay, bx, by) <= (shot["line_width"] * 0.5):
                if die(now):
                    return

        for ball in phase2_stream_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for ball in phase2_giant_homing_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for ring in phase2_shrink_rings:
            rr = phase2_shrink_radius(ring, now)
            dist = math.hypot(mx - ring["cx"], my - ring["cy"])
            if abs(dist - rr) <= ring["thickness"] * 0.5:
                ang = math.atan2(my - ring["cy"], mx - ring["cx"])
                if angle_distance(ang, ring["gap_angle"]) > ring["gap_half"]:
                    if die(now):
                        return

        for line in phase2_bouncy_lines:
            if dist_point_to_segment(mx, my, line["x1"], line["y1"], line["x2"], line["y2"]) <= (line["width"] * 0.5):
                if die(now):
                    return

        for zone in lethal_zones:
            if circle_hits_player(zone["x"], zone["y"], zone["r"], mx, my):
                if die(now):
                    return

        # ============================================================
        # Draw
        # ============================================================
        screen.fill((255, 0, 0))

        left, top, right, bottom = arena_bounds()
        arena_rect = pygame.Rect(int(left), int(top), int(right - left), int(bottom - top))
        pygame.draw.rect(screen, (0, 0, 255), arena_rect)
        pygame.draw.rect(screen, (0, 0, 0), arena_rect, 4)

        for seg in trail_segments:
            if abs(seg["ax"] - seg["bx"]) < 0.5 and abs(seg["ay"] - seg["by"]) < 0.5:
                pygame.draw.circle(screen, (255, 0, 0), (int(seg["ax"]), int(seg["ay"])), int(seg["width"]))
            else:
                width = max(6, int(seg["width"] * 2))
                pygame.draw.line(
                    screen,
                    (255, 0, 0),
                    (int(seg["ax"]), int(seg["ay"])),
                    (int(seg["bx"]), int(seg["by"])),
                    width,
                )

        for zone in lethal_zones:
            if zone.get("solid"):
                pygame.draw.circle(screen, zone["color"], (int(zone["x"]), int(zone["y"])), int(zone["r"]))
            else:
                alpha = 150 if zone.get("blink") else 140
                if zone.get("blink") and ((now // 120) % 2) == 1:
                    draw_soft_circle(zone["x"], zone["y"], zone["r"], (255, 120, 120, 90))
                else:
                    draw_soft_circle(zone["x"], zone["y"], zone["r"], (*zone["color"], alpha))

        for pulse in visual_pulses:
            pygame.draw.circle(screen, pulse["color"], (int(pulse["x"]), int(pulse["y"])), int(pulse["r"]), 4)

        draw_boss(now)

        for shot in homing_shots:
            draw_face_ball(shot["x"], shot["y"], shot["r"])

        for shot in phase2_line_shots:
            ax, ay, bx, by = phase2_line_segment(shot)
            pygame.draw.line(
                screen,
                (255, 0, 0),
                (int(ax), int(ay)),
                (int(bx), int(by)),
                max(2, int(shot["line_width"])),
            )
            draw_face_ball(shot["x"], shot["y"], shot["r"])

        for ball in phase2_stream_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"])

        for ball in phase2_giant_homing_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"])

        for ring in phase2_shrink_rings:
            rr = phase2_shrink_radius(ring, now)
            if rr <= 1.0:
                continue
            th = max(8, int(ring["thickness"]))
            cxr = int(ring["cx"])
            cyr = int(ring["cy"])
            pygame.draw.circle(screen, (255, 50, 50), (cxr, cyr), int(rr), th)

            a1 = ring["gap_angle"] - ring["gap_half"]
            a2 = ring["gap_angle"] + ring["gap_half"]
            inner = max(0.0, rr - th * 0.5 - 4.0)
            outer = rr + th * 0.5 + 4.0
            cut = [
                (ring["cx"] + math.cos(a1) * inner, ring["cy"] + math.sin(a1) * inner),
                (ring["cx"] + math.cos(a1) * outer, ring["cy"] + math.sin(a1) * outer),
                (ring["cx"] + math.cos(a2) * outer, ring["cy"] + math.sin(a2) * outer),
                (ring["cx"] + math.cos(a2) * inner, ring["cy"] + math.sin(a2) * inner),
            ]
            pygame.draw.polygon(screen, (0, 0, 255), [(int(x), int(y)) for x, y in cut])

        for line in phase2_bouncy_lines:
            pygame.draw.line(
                screen,
                (255, 120, 120),
                (int(line["x1"]), int(line["y1"])),
                (int(line["x2"]), int(line["y2"])),
                max(2, int(line["width"])),
            )

        for ball in ring_balls:
            age = now - ball["spawn_time"]
            if 8000 <= age < 12000 and ((now // 120) % 2) == 1:
                draw_face_ball(ball["x"], ball["y"], ball["r"], tint=(255, 0, 0), alpha=255)
            else:
                draw_face_ball(ball["x"], ball["y"], ball["r"])

        for ball in trail_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"])

        for cluster in gravity_clusters:
            draw_soft_circle(cluster["x"], cluster["y"], cluster["field_r"], (255, 120, 120, 55))
            pygame.draw.circle(screen, (180, 60, 60), (int(cluster["x"]), int(cluster["y"])), int(cluster["field_r"]), 3)
            draw_face_ball(
                cluster["x"],
                cluster["y"],
                cluster["r"],
                glow=(255, 180, 180),
                outline=None,
                tint=(58, 58, 0),
            )
            for orb in cluster["orbiters"]:
                ox = cluster["x"] + math.cos(orb["angle"]) * orb["dist"]
                oy = cluster["y"] + math.sin(orb["angle"]) * orb["dist"]
                draw_face_ball(ox, oy, orb["r"], outline=None, tint=(58, 58, 0))

        for ball in splitter_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"])

        for anchor in spiral_anchors:
            is_armed = now >= anchor["armed_time"]
            if is_armed:
                draw_face_ball(anchor["x"], anchor["y"], anchor["r"], tint=(0, 85, 0), alpha=180)
            else:
                draw_face_ball(anchor["x"], anchor["y"], anchor["r"], black=True)
            for orb in anchor["orbs"]:
                if not orb["alive"]:
                    continue
                ox = anchor["x"] + math.cos(orb["angle"]) * orb["radius"]
                oy = anchor["y"] + math.sin(orb["angle"]) * orb["radius"]
                if is_armed:
                    draw_face_ball(ox, oy, orb["r"], outline=None, tint=(0, 85, 0), alpha=180)
                else:
                    draw_face_ball(ox, oy, orb["r"], outline=None, black=True)
        for ball in damage_balls:
            side = int(ball["r"] * 2)
            square = pygame.Surface((side, side), pygame.SRCALPHA)
            square.fill((90, 20, 140))
            face = get_face_sprite(ball["r"])
            square.blit(face, (0, 0))
            tint = pygame.Surface((side, side), pygame.SRCALPHA)
            tint.fill((70, 0, 110, 120))
            square.blit(tint, (0, 0), special_flags=pygame.BLEND_RGBA_ADD)
            screen.blit(square, square.get_rect(center=(int(ball["x"]), int(ball["y"]))))

        for orb in damage_orbs:
            pygame.draw.circle(screen, (0, 190, 0), (int(orb["x"]), int(orb["y"])), int(orb["r"]))

        draw_shield_pickup()
        draw_shield_indicator()
        draw_boss_ui()

        stage_number = boss_max_hp - boss_hp + 1
        stage_surf = header_font.render(f"Stage {stage_number}", True, (255, 255, 255))
        screen.blit(stage_surf, stage_surf.get_rect(topright=(w - 80, 145)))

        pygame.display.flip()
