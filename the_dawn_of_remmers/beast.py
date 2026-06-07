import asyncio
# beast.py
import pygame
import random
import math
from pathlib import Path
import game_settings

async def bossfight_beast(screen, start_stage=1, arcade_hp_one=False, arcade_no_endscreen=False):
    w, h = screen.get_size()
    clock = pygame.time.Clock()
    pygame.mouse.set_pos(w // 2, h // 2)

    # ============================================================
    # Helpers
    # ============================================================
    
    def clamp(v, lo, hi):
        return lo if v < lo else hi if v > hi else v

    def draw_text_center(text, y, size=72):
        f = pygame.font.SysFont(None, size)
        surf = f.render(text, True, (255, 255, 255))
        rect = surf.get_rect(center=(w // 2, y))
        screen.blit(surf, rect)

    async def end_screen(result: str):
        if arcade_no_endscreen:
            return
        t0 = pygame.time.get_ticks()
        font_big = pygame.font.SysFont(None, 90)
        font_small = pygame.font.SysFont(None, 42)

        while True:
            await asyncio.sleep(0)
            for e in pygame.event.get():
                if e.type == pygame.QUIT:
                    return
                if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                    return

            screen.fill((0, 0, 0))
            msg = "Mrbeast is defeated" if result == "win" else "You were defeated by Mrbeast"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 50)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return

            clock.tick(60)

    def make_circle_sprite(src_img, size):
        scaled = pygame.transform.scale(src_img, (size, size)).convert_alpha()
        out = pygame.Surface((size, size), pygame.SRCALPHA)
        out.blit(scaled, (0, 0))
        mask = pygame.Surface((size, size), pygame.SRCALPHA)
        pygame.draw.circle(mask, (255, 255, 255, 255), (size // 2, size // 2), size // 2)
        out.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        return out

    # ============================================================
    # Arena exactly like Joe
    # ============================================================
    LEFT_WALL_W = 385
    TOP_WALL_H = 110
    BOT_WALL_H = 110
    RIGHT_WALL_W = 100

    # Joe-style right wall position (on 1920x1080: x=1700)
    # If your window is different, this still keeps the Joe-style look visible.
    right_x = min(1700, w - RIGHT_WALL_W)

    left_wall = pygame.Rect(0, 0, LEFT_WALL_W, h)
    top_wall = pygame.Rect(0, 0, w, TOP_WALL_H)
    bot_wall = pygame.Rect(0, h - BOT_WALL_H, w, BOT_WALL_H)
    right_wall = pygame.Rect(right_x, 0, RIGHT_WALL_W, h)

    PLAY_LEFT = LEFT_WALL_W
    PLAY_RIGHT = right_x
    PLAY_TOP = TOP_WALL_H
    PLAY_BOT = h - BOT_WALL_H

    # ============================================================
    # Shield pickup + indicator
    # ============================================================
    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 13
    SHIELD_COLOR = (0, 100, 0)     # pickup groen
    INDICATOR_POS = (270, 160)     # donkerblauw stipje

    shield_pos = None
    shield_active = False
    invuln_until = 0
    next_shield_spawn = pygame.time.get_ticks() + SHIELD_SPAWN_MS

    def maybe_spawn_shield(now):
        if game_settings.NO_SHIELDS:
            return
        nonlocal shield_pos, next_shield_spawn
        if shield_pos is None and now >= next_shield_spawn:
            cx, cy = w // 2, h // 2
            r = 180
            sx = random.randint(cx - r, cx + r)
            sy = random.randint(cy - r, cy + r)
            sx = clamp(sx, PLAY_LEFT + 20, PLAY_RIGHT - 20)
            sy = clamp(sy, PLAY_TOP + 20, PLAY_BOT - 20)
            shield_pos = (sx, sy)
            next_shield_spawn = now + SHIELD_SPAWN_MS

    def try_pickup_shield(mx, my):
        nonlocal shield_pos, shield_active
        if shield_pos is None:
            return
        sx, sy = shield_pos
        if (mx - sx) ** 2 + (my - sy) ** 2 <= SHIELD_RADIUS ** 2:
            shield_active = True
            shield_pos = None

    def draw_shield_pickup():
        if shield_pos is not None:
            pygame.draw.circle(screen, SHIELD_COLOR, (int(shield_pos[0]), int(shield_pos[1])), int(SHIELD_RADIUS))
            pygame.draw.circle(screen, (255, 255, 255), (int(shield_pos[0]), int(shield_pos[1])), int(SHIELD_RADIUS), 2)

    def draw_shield_indicator():
        if shield_active:
            pygame.draw.circle(screen, (0, 0, 139), INDICATOR_POS, 12)
            pygame.draw.circle(screen, (255, 255, 255), INDICATOR_POS, 12, 2)

    def damage_should_kill(now):
        nonlocal shield_active, invuln_until
        if now < invuln_until:
            return False
        if shield_active:
            shield_active = False
            invuln_until = now + INVULN_MS
            return False
        return True

    # ============================================================
    # Boss sprite + HP (beast has 4 HP)
    # ============================================================
    boss_name = "Mrbeast"
    boss_size = 100
    boss_x = float(325 - boss_size // 2)
    boss_y = float(h // 2 - boss_size // 2)

    boss_max_hp = 4
    boss_hp = boss_max_hp
    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(boss_max_hp, start_stage))
    boss_hp = max(1, boss_max_hp - (start_stage - 1))

    last_recorded_hp = boss_max_hp

    ORB_REFLECT_SPEED_BASE = 14.0

    font = pygame.font.SysFont(None, 40)

    try:
        ben_img_raw = pygame.image.load(str(Path(__file__).resolve().with_name("beast.png"))).convert_alpha()
    except:
        ben_img_raw = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
        ben_img_raw.fill((200, 200, 200))
        pygame.draw.rect(ben_img_raw, (0, 0, 0), ben_img_raw.get_rect(), 3)

    ben_img = pygame.transform.scale(ben_img_raw, (boss_size, boss_size))

    # ============================================================
    # Mouse stun (big drop)
    # ============================================================
    mouse_stun_until = 0
    mouse_stun_pos = (w // 2, h // 2)

    def apply_mouse_stun(now):
        if now < mouse_stun_until:
            pygame.mouse.set_pos(mouse_stun_pos)
            pygame.mouse.get_rel()
            return mouse_stun_pos[0], mouse_stun_pos[1]
        return None

    # ============================================================
    # Sandstorm attack (stronger push + more rocks with beast face)
    # ============================================================
    STORM_COOLDOWN_MS = 10000
    STORM_DURATION_MS = 5500
    STORM_WARN_MS = 1200

    # >>>> TWEAK HIER: harder duwen
    STORM_FORCE = 2.5

    STORM_TINT_ALPHA = 110

    storm_state = "idle"      # idle -> warn -> active
    storm_dir = (0.0, 0.0)
    storm_until = 0
    storm_warn_until = 0
    next_storm_start = pygame.time.get_ticks() + STORM_COOLDOWN_MS

    storm_rocks = []
    # >>>> TWEAK HIER: meer stenen
    ROCK_SPAWN_MS = 120
    ROCKS_PER_SPAWN = 2

    ROCK_SPEED = 7.5
    ROCK_SIZE = 24
    rock_sprite = make_circle_sprite(ben_img_raw, ROCK_SIZE)

    next_rock_spawn = 0

    def pick_storm_dir():
        # wind komt VAN: links/rechts/boven/onder
        # dus push is: naar de andere kant
        side = random.choice(["left", "right", "top", "bottom"])
        if side == "left":
            return (1.0, 0.0)
        if side == "right":
            return (-1.0, 0.0)
        if side == "top":
            return (0.0, 1.0)
        return (0.0, -1.0)

    def spawn_storm_rock():
        dx, dy = storm_dir
        if dx > 0:
            x = PLAY_LEFT + 4
            y = random.randint(PLAY_TOP + 10, PLAY_BOT - 10)
        elif dx < 0:
            x = PLAY_RIGHT - 4
            y = random.randint(PLAY_TOP + 10, PLAY_BOT - 10)
        elif dy > 0:
            x = random.randint(PLAY_LEFT + 10, PLAY_RIGHT - 10)
            y = PLAY_TOP + 4
        else:
            x = random.randint(PLAY_LEFT + 10, PLAY_RIGHT - 10)
            y = PLAY_BOT - 4

        storm_rocks.append({
            "x": float(x),
            "y": float(y),
            "vx": dx * ROCK_SPEED,
            "vy": dy * ROCK_SPEED,
            "r": ROCK_SIZE / 2
        })

    # ============================================================
    # Quarter-rim attack (2x zo vaak + elke 5e is "special")
    # + als arc wall raakt -> explode in shrapnel met bounces
    # ============================================================
    # >>>> 2x zo vaak
    ARC_SHOT_MS = 1800
    next_arc_shot = pygame.time.get_ticks() + 800

    ARC_SPEED = 6.8
    ARC_RADIUS = 140
    ARC_BEADS = 18
    ARC_BEAD_SIZE = 28
    arc_bead_sprite = make_circle_sprite(ben_img_raw, ARC_BEAD_SIZE)

    arc_projectiles = []
    arc_shot_count = 0
    boss_red_blink_until = 0
    arc_in_warning = False

    ARC_WARNING_MS = 800      # hoe lang de indicatie duurt
    pending_special_arc = False
    special_arc_fire_time = 0


    # shrapnel na explode
    shrapnels = []  # {"x","y","vx","vy","size","r","bounces_left","sprite"}
    SHRAPNEL_SIZE = 24
    shrapnel_sprite = make_circle_sprite(ben_img_raw, SHRAPNEL_SIZE)
    SHRAPNEL_SPEED_MIN = 5.5
    SHRAPNEL_SPEED_MAX = 8.5
    SHRAPNEL_BOUNCES = 3

    ARC_GRACE_MS = 500

    def spawn_arc(mx, my, speed_mult=1.0, is_special=False):
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        ang_to_target = math.atan2(my - by, mx - bx)

        local_angles = []
        for i in range(ARC_BEADS):
            t = i / max(1, ARC_BEADS - 1)
            a = (-math.pi / 4) + t * (math.pi / 2)
            local_angles.append(a)

        vx = math.cos(ang_to_target) * (ARC_SPEED * speed_mult)
        vy = math.sin(ang_to_target) * (ARC_SPEED * speed_mult)

        arc_projectiles.append({
            "x": float(bx),
            "y": float(by),
            "vx": float(vx),
            "vy": float(vy),
            "base_ang": float(ang_to_target),
            "angles": local_angles,
            "r": float(ARC_RADIUS),
            "special": bool(is_special),
            "spawn_time": pygame.time.get_ticks(),  # <<< NIEUW
        })


    def arc_bead_positions(a):
        cx = a["x"]
        cy = a["y"]
        theta = a["base_ang"]
        out = []
        for la in a["angles"]:
            aa = theta + la
            out.append((cx + math.cos(aa) * a["r"], cy + math.sin(aa) * a["r"]))
        return out

    def explode_arc(a):
        # maak van alle beads random shrapnel
        for (px, py) in arc_bead_positions(a):
            ang = random.random() * 2 * math.pi
            sp = random.uniform(SHRAPNEL_SPEED_MIN, SHRAPNEL_SPEED_MAX)
            shrapnels.append({
                "x": float(px),
                "y": float(py),
                "vx": math.cos(ang) * sp,
                "vy": math.sin(ang) * sp,
                "size": SHRAPNEL_SIZE,
                "r": SHRAPNEL_SIZE / 2,
                "bounces_left": SHRAPNEL_BOUNCES,
                "sprite": shrapnel_sprite,
            })

    # ============================================================
    # Big drop attack (elke 35 sec, NIET direct start)
    # + kill als cursor op landing staat
    # + orb spawn like Joe green orb
    # ============================================================
    BIGROCK_COOLDOWN_MS = 33000
    next_bigrock = pygame.time.get_ticks() + BIGROCK_COOLDOWN_MS  # NIET direct!

    ROCK_AIM_MS = 2000
    ROCK_SHRINK_MS = 1000
    ROCK_STUN_MS = 500

    DROP_WARN_COLOR = (200, 0, 0)      # rood = gevaar
    DROP_SHRINK_COLOR = (160, 160, 160)
    DROP_OUTLINE = (255, 255, 255)

    bigrock_state = "idle"  # idle / aim / shrink
    bigrock_aim_until = 0
    bigrock_shrink_until = 0
    bigrock_shrink_start = 0
    rock_target = (w // 2, h // 2)

    ROCK_SIZE_BIG = 180
    ROCK_SIZE_SMALL = 60

    green_orb = None
    GREEN_R = 12
    ORB_SPEED = 8.5

    # reflect maar 1x bij lives_lost=1,2,3
    reflected_count = 0
    REFLECT_MS = 5000
    PURPLE = (70, 0, 110)

    def start_bigrock(now, mx, my):
        nonlocal bigrock_state, bigrock_aim_until, rock_target
        bigrock_state = "aim"
        bigrock_aim_until = now + ROCK_AIM_MS
        rock_target = (mx, my)

    def spawn_green_orb_at(x, y):
        nonlocal green_orb
        green_orb = {
            "x": float(x),
            "y": float(y),
            "vx": 0.0,
            "vy": 0.0,
            "state": "idle",   # idle / to_boss / reflected / rest
            "color": (0, 255, 0),
            "reflect_until": 0
        }

    def orb_activate_to_boss():
        nonlocal green_orb
        if green_orb is None:
            return
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        dx = bx - green_orb["x"]
        dy = by - green_orb["y"]
        dist = max(1.0, math.hypot(dx, dy))
        green_orb["vx"] = dx / dist * ORB_SPEED
        green_orb["vy"] = dy / dist * ORB_SPEED
        green_orb["state"] = "to_boss"
        green_orb["color"] = (0, 255, 0)

    def orb_reflect_to_mouse(now, mx, my):
        nonlocal green_orb
        if green_orb is None:
            return
        green_orb["state"] = "reflected"
        green_orb["color"] = PURPLE
        green_orb["reflect_until"] = now + REFLECT_MS

        dx = mx - green_orb["x"]
        dy = my - green_orb["y"]
        dist = max(1.0, math.hypot(dx, dy))
        sp = ORB_REFLECT_SPEED_BASE
        green_orb["vx"] = dx / dist * sp
        green_orb["vy"] = dy / dist * sp

    def apply_post_hit_scaling():
        nonlocal ARC_SHOT_MS, STORM_FORCE, SHRAPNEL_BOUNCES, ORB_REFLECT_SPEED_BASE, last_recorded_hp
        if boss_hp < last_recorded_hp:
            lives_lost_now = boss_max_hp - boss_hp
            ARC_SHOT_MS = max(800, ARC_SHOT_MS - 50)
            STORM_FORCE += 0.1
            SHRAPNEL_BOUNCES += 1
            ORB_REFLECT_SPEED_BASE = 14.0 + lives_lost_now * 3
            last_recorded_hp = boss_hp

    while last_recorded_hp > boss_hp:
        apply_post_hit_scaling()

    # ============================================================
    # Main loop
    # ============================================================
    while True:
        await asyncio.sleep(0)
        now = pygame.time.get_ticks()

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        mx, my = pygame.mouse.get_pos()
        mx = clamp(mx, 0, w - 1)
        my = clamp(my, 0, h - 1)

        #stun_xy = apply_mouse_stun(now)
        #if stun_xy is not None:
            #mx, my = stun_xy

        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # ============================
        # Sandstorm state machine
        # ============================
        if storm_state == "idle" and now >= next_storm_start:
            storm_state = "warn"
            storm_dir = pick_storm_dir()
            storm_warn_until = now + STORM_WARN_MS

        elif storm_state == "warn" and now >= storm_warn_until:
            storm_state = "active"
            storm_until = now + STORM_DURATION_MS
            next_rock_spawn = now
            storm_rocks.clear()

        elif storm_state == "active" and now >= storm_until:
            storm_state = "idle"
            next_storm_start = now + STORM_COOLDOWN_MS
            storm_rocks.clear()

        # Storm pushes mouse + spawns rocks
        if storm_state == "active" and now >= mouse_stun_until:
            dx, dy = storm_dir
            px = int(mx + dx * STORM_FORCE)
            py = int(my + dy * STORM_FORCE)
            px = clamp(px, 0, w - 1)
            py = clamp(py, 0, h - 1)
            pygame.mouse.set_pos(px, py)
            pygame.mouse.get_rel()
            mx, my = pygame.mouse.get_pos()
            mx = clamp(mx, 0, w - 1)
            my = clamp(my, 0, h - 1)

            if now >= next_rock_spawn:
                next_rock_spawn = now + ROCK_SPAWN_MS
                for _ in range(ROCKS_PER_SPAWN):
                    spawn_storm_rock()

        # Move rocks
        for r in storm_rocks[:]:
            r["x"] += r["vx"]
            r["y"] += r["vy"]
            if r["x"] < -120 or r["x"] > w + 120 or r["y"] < -120 or r["y"] > h + 120:
                storm_rocks.remove(r)

        # ============================
        # Arc shooting (2x vaak + elke 5e special)
        # ============================
        # Alleen nieuwe arc starten als we NIET in indicatie zitten
        if (not arc_in_warning) and now >= next_arc_shot:
            arc_shot_count += 1

            if arc_shot_count % 5 == 0:
                # START indicatie
                arc_in_warning = True
                boss_red_blink_until = now + ARC_WARNING_MS
                special_arc_fire_time = now + ARC_WARNING_MS
            else:
                spawn_arc(mx, my, speed_mult=1.0, is_special=False)
                next_arc_shot = now + ARC_SHOT_MS

        if arc_in_warning and now >= special_arc_fire_time:
            spawn_arc(mx, my, speed_mult=2.0, is_special=True)

            arc_in_warning = False
            next_arc_shot = now + ARC_SHOT_MS

        
        if pending_special_arc and now >= special_arc_fire_time:
            spawn_arc(mx, my, speed_mult=2.0, is_special=True)
            pending_special_arc = False

        # Update arcs
        for a in arc_projectiles[:]:
            a["x"] += a["vx"]
            a["y"] += a["vy"]

            hit_wall = False
            age = now - a["spawn_time"]

            # pas NA de grace period collisions checken
            if age >= ARC_GRACE_MS:
                for (px, py) in arc_bead_positions(a):
                    ipx = int(px)
                    ipy = int(py)

                    # alleen PLAY borders, niet rood
                    if ipx < PLAY_LEFT or ipx > PLAY_RIGHT or ipy < PLAY_TOP or ipy > PLAY_BOT:
                        hit_wall = True
                        break


            if hit_wall:
                if a["special"]:
                    explode_arc(a)     # ALLEEN speciale arc explodeert
                arc_projectiles.remove(a)  # normale arc verdwijnt gewoon
                continue


            # cleanup als hele arc ver weg is
            if a["x"] < -400 or a["x"] > w + 400 or a["y"] < -400 or a["y"] > h + 400:
                arc_projectiles.remove(a)

        # ============================
        # Shrapnel update (bouncen 3x)
        # ============================
        for s in shrapnels[:]:
            s["x"] += s["vx"]
            s["y"] += s["vy"]

            bounced = False

            if s["x"] - s["r"] <= PLAY_LEFT:
                s["x"] = PLAY_LEFT + s["r"]
                s["vx"] *= -1
                bounced = True
            elif s["x"] + s["r"] >= PLAY_RIGHT:
                s["x"] = PLAY_RIGHT - s["r"]
                s["vx"] *= -1
                bounced = True

            if s["y"] - s["r"] <= PLAY_TOP:
                s["y"] = PLAY_TOP + s["r"]
                s["vy"] *= -1
                bounced = True
            elif s["y"] + s["r"] >= PLAY_BOT:
                s["y"] = PLAY_BOT - s["r"]
                s["vy"] *= -1
                bounced = True

            if bounced:
                s["bounces_left"] -= 1
                if s["bounces_left"] <= 0:
                    shrapnels.remove(s)
                    continue

        # ============================
        # Big drop (alleen als geen orb) en elke 35s
        # ============================
        if bigrock_state == "idle" and now >= next_bigrock and green_orb is None:
            start_bigrock(now, mx, my)

        if bigrock_state == "aim":
            rock_target = (mx, my)
            if now >= bigrock_aim_until:
                bigrock_state = "shrink"
                bigrock_shrink_start = now
                bigrock_shrink_until = now + ROCK_SHRINK_MS
                rock_target = (mx, my)

        elif bigrock_state == "shrink":
            if now >= bigrock_shrink_until:
                # landing moment!
                bigrock_state = "idle"
                next_bigrock = now + BIGROCK_COOLDOWN_MS

                # kill als cursor op landing staat
                tx, ty = rock_target
                land_rect = pygame.Rect(int(tx - ROCK_SIZE_SMALL / 2), int(ty - ROCK_SIZE_SMALL / 2), ROCK_SIZE_SMALL, ROCK_SIZE_SMALL)
                if land_rect.collidepoint(mx, my):
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"

                # stun
                mouse_stun_until = now + ROCK_STUN_MS
                mouse_stun_pos = (mx, my)
                pygame.mouse.set_pos(mouse_stun_pos)
                pygame.mouse.get_rel()

                # spawn orb
                spawn_green_orb_at(rock_target[0], rock_target[1])

        # ============================
        # Orb update (reflect 1x bij lives_lost=1,2,3)
        # ============================
        boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)

        if green_orb is not None:
            g = green_orb

            if g["state"] in ("idle", "rest"):
                if (mx - g["x"]) ** 2 + (my - g["y"]) ** 2 <= (GREEN_R + 2) ** 2:
                    orb_activate_to_boss()

            if g["state"] == "to_boss":
                bx2 = boss_x + boss_size / 2
                by2 = boss_y + boss_size / 2
                dx = bx2 - g["x"]
                dy = by2 - g["y"]
                dist = max(1.0, math.hypot(dx, dy))
                homing = 0.18
                g["vx"] = (1 - homing) * g["vx"] + homing * (dx / dist * ORB_SPEED)
                g["vy"] = (1 - homing) * g["vy"] + homing * (dy / dist * ORB_SPEED)

                g["x"] += g["vx"]
                g["y"] += g["vy"]

                if boss_rect.collidepoint(g["x"], g["y"]):
                    lives_lost = boss_max_hp - boss_hp
                    max_reflects = lives_lost

                    if reflected_count < max_reflects:
                        # boss slaat bal terug
                        reflected_count += 1
                        orb_reflect_to_mouse(now, mx, my)
                    else:
                                                # boss krijgt damage
                        if arcade_hp_one:
                            boss_hp = 0
                        else:
                            boss_hp -= 1
                        green_orb = None
                        reflected_count = 0

                        if boss_hp <= 0:
                            await end_screen("win")
                            return "win"

                        apply_post_hit_scaling()


            elif g["state"] == "reflected":
                g["x"] += g["vx"]
                g["y"] += g["vy"]

                # bounce in playable
                if g["x"] - GREEN_R <= PLAY_LEFT:
                    g["x"] = PLAY_LEFT + GREEN_R
                    g["vx"] *= -1
                elif g["x"] + GREEN_R >= PLAY_RIGHT:
                    g["x"] = PLAY_RIGHT - GREEN_R
                    g["vx"] *= -1

                if g["y"] - GREEN_R <= PLAY_TOP:
                    g["y"] = PLAY_TOP + GREEN_R
                    g["vy"] *= -1
                elif g["y"] + GREEN_R >= PLAY_BOT:
                    g["y"] = PLAY_BOT - GREEN_R
                    g["vy"] *= -1

                # hit mouse
                if (mx - g["x"]) ** 2 + (my - g["y"]) ** 2 <= (GREEN_R + 3) ** 2:
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"

                # end reflect -> wordt groen OP DEZELFDE PLEK
                if now >= g["reflect_until"]:
                    g["state"] = "rest"
                    g["color"] = (0, 255, 0)
                    g["vx"] = 0.0
                    g["vy"] = 0.0


        # ============================================================
        # CHECKS
        # ============================================================
        # Walls lethal
        if left_wall.collidepoint(mx, my) or top_wall.collidepoint(mx, my) or bot_wall.collidepoint(mx, my) or right_wall.collidepoint(mx, my):
            if damage_should_kill(now):
                await end_screen("lose")
                return "lose"

        # Boss touch lethal
        if boss_rect.collidepoint(mx, my):
            if damage_should_kill(now):
                await end_screen("lose")
                return "lose"

        # Storm rocks lethal
        if storm_state == "active":
            for r in storm_rocks:
                dx = mx - r["x"]
                dy = my - r["y"]
                if dx * dx + dy * dy <= (r["r"] + 3) ** 2:
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"
                    break

        # Arc beads lethal
        for a in arc_projectiles:
            for (px, py) in arc_bead_positions(a):
                dx = mx - px
                dy = my - py
                if dx * dx + dy * dy <= (ARC_BEAD_SIZE * 0.45) ** 2:
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"
                    break

        # Shrapnel lethal
        for s in shrapnels:
            dx = mx - s["x"]
            dy = my - s["y"]
            if dx * dx + dy * dy <= (s["r"] + 2) ** 2:
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"
                break

        # ============================================================
        # DRAW
        # ============================================================
        screen.fill((0, 0, 255))

        pygame.draw.rect(screen, (255, 0, 0), left_wall)
        pygame.draw.rect(screen, (255, 0, 0), top_wall)
        pygame.draw.rect(screen, (255, 0, 0), bot_wall)
        pygame.draw.rect(screen, (255, 0, 0), right_wall)

        # Storm tint
        if storm_state == "active":
            tint = pygame.Surface((w, h), pygame.SRCALPHA)
            tint.fill((255, 165, 0, STORM_TINT_ALPHA))
            screen.blit(tint, (0, 0))

        # Boss sprite
        screen.blit(ben_img, (int(boss_x), int(boss_y)))

        # Boss blink before storm
        if storm_state == "warn" and (now // 120) % 2 == 0:
            ov = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            ov.fill((255, 170, 80, 120))
            screen.blit(ov, (int(boss_x), int(boss_y)))

        # Boss blink red on every 5th arc shot
        if now < boss_red_blink_until and (now // 120) % 2 == 0:
            ov = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            ov.fill((255, 0, 0, 120))
            screen.blit(ov, (int(boss_x), int(boss_y)))

        # Storm rocks (beast face + orange outline)
        for r in storm_rocks:
            x = int(r["x"] - ROCK_SIZE / 2)
            y = int(r["y"] - ROCK_SIZE / 2)
            screen.blit(rock_sprite, (x, y))
            pygame.draw.circle(screen, (255, 165, 0), (int(r["x"]), int(r["y"])), int(ROCK_SIZE / 2), 2)

        # Big drop telegraph
        if bigrock_state in ("aim", "shrink"):
            tx, ty = rock_target

            if bigrock_state == "aim":
                size = ROCK_SIZE_BIG
                fill_color = DROP_WARN_COLOR      # 🔴 GEVAAR
            else:
                t = (now - bigrock_shrink_start) / max(1, ROCK_SHRINK_MS)
                t = clamp(t, 0.0, 1.0)
                size = int(ROCK_SIZE_BIG * (1 - t) + ROCK_SIZE_SMALL * t)
                fill_color = DROP_SHRINK_COLOR

            rx = int(tx - size / 2)
            ry = int(ty - size / 2)
            rect = pygame.Rect(rx, ry, size, size)

            pygame.draw.rect(screen, fill_color, rect)
            pygame.draw.rect(screen, DROP_OUTLINE, rect, 3)


        # Arc beads draw
        for a in arc_projectiles:
            for (px, py) in arc_bead_positions(a):
                x = int(px - ARC_BEAD_SIZE / 2)
                y = int(py - ARC_BEAD_SIZE / 2)
                screen.blit(arc_bead_sprite, (x, y))

        # Shrapnel draw
        for s in shrapnels:
            spr = s["sprite"]
            x = int(s["x"] - spr.get_width() / 2)
            y = int(s["y"] - spr.get_height() / 2)
            screen.blit(spr, (x, y))

        # Orb draw
        if green_orb is not None:
            g = green_orb
            pygame.draw.circle(screen, g["color"], (int(g["x"]), int(g["y"])), GREEN_R)
            pygame.draw.circle(screen, (255, 255, 255), (int(g["x"]), int(g["y"])), GREEN_R, 2)

        # Name + HP bar (beter zichtbaar)
        name_surf = font.render(boss_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        bar_w = max(220, name_rect.width + 60)
        bar_h = 20
        bx = w // 2 - bar_w // 2
        by = name_rect.bottom + 8

        # filled background so blue doesn't show through
        pygame.draw.rect(screen, (25, 25, 25), (bx, by, bar_w, bar_h))
        pygame.draw.rect(screen, (0, 0, 0), (bx, by, bar_w, bar_h), 3)

        inner_pad = 3
        inner_w = bar_w - 2 * inner_pad
        inner_h = bar_h - 2 * inner_pad
        seg = inner_w / boss_max_hp

        for i in range(boss_hp):
            sx = bx + inner_pad + int(i * seg)
            sw = int(seg) - 2
            pygame.draw.rect(screen, (0, 255, 0), (sx, by + inner_pad, sw, inner_h))

        draw_shield_pickup()
        draw_shield_indicator()

        pygame.display.flip()
        clock.tick(60)














