# Stein.py
import asyncio
import pygame
import random
import math
from pathlib import Path
import game_settings

async def bossfight_Stein(screen, start_stage=1, arcade_hp_one=False, arcade_no_endscreen=False):
    w, h = screen.get_size()
    clock = pygame.time.Clock()
    pygame.mouse.set_pos(w // 2, h // 2)

    # ============================================================
    # Guess "visible" area (als jouw window groter is dan je monitor)
    # ============================================================
    info = pygame.display.Info()
    visible_w = min(w, info.current_w) if info.current_w > 0 else w
    visible_h = min(h, info.current_h) if info.current_h > 0 else h

    # ============================================================
    # Shield pickup + indicator (donkerblauw op (270,160))
    # ============================================================
    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 13
    SHIELD_COLOR = (0, 100, 0)

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
            pygame.draw.circle(screen, SHIELD_COLOR, (int(shield_pos[0]), int(shield_pos[1])), SHIELD_RADIUS)
            pygame.draw.circle(screen, (255, 255, 255), (int(shield_pos[0]), int(shield_pos[1])), SHIELD_RADIUS, 2)

    def draw_shield_indicator():
        if shield_active:
            pygame.draw.circle(screen, (0, 0, 139), (270, 160), 12)
            pygame.draw.circle(screen, (255, 255, 255), (270, 160), 12, 2)

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
    # Arena walls: links/boven/onder rood, rechts ORANJE (zichtbaar)
    # ============================================================
    LEFT_WALL_W = 500
    TOP_WALL_H = 150
    BOT_WALL_H = 150
    RIGHT_WALL_W = 150   # <- dit is jouw "ORANGE_W"

    left_wall = pygame.Rect(0, 0, LEFT_WALL_W, h)
    top_wall = pygame.Rect(0, 0, w, TOP_WALL_H)
    bot_wall = pygame.Rect(0, h - BOT_WALL_H, w, BOT_WALL_H)

    # Zelf makkelijk schuiven:
    ORANGE_SHIFT_LEFT = 150 # zet bv 200 om hem 200px naar links te schuiven

    # basis: probeer binnen "visible_w" te blijven, en dan shiften
    base_orange_x = min(w - RIGHT_WALL_W, visible_w - RIGHT_WALL_W)
    orange_x = max(LEFT_WALL_W + 50, base_orange_x - ORANGE_SHIFT_LEFT)
    orange_wall = pygame.Rect(int(orange_x), 0, RIGHT_WALL_W, h)

    # ============================================================
    # Sprites: boss + circular bullets (rinke-foto in cirkel)
    # ============================================================
    boss_name = "Epstein"
    boss_size = 100
    boss_x = float(325 - boss_size // 2)
    boss_y = float(h // 2 - boss_size // 2)

    boss_max_hp = 2
    boss_hp = boss_max_hp
    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(boss_max_hp, start_stage))
    boss_hp = max(1, boss_max_hp - (start_stage - 1))

    font = pygame.font.SysFont(None, 40)
    rinke_img_raw = pygame.image.load(str(Path(__file__).resolve().with_name("Stein.png"))).convert_alpha()
    rinke_img = pygame.transform.scale(rinke_img_raw, (boss_size, boss_size))

    def make_circle_sprite(src_img, size):
        scaled = pygame.transform.scale(src_img, (size, size)).convert_alpha()
        out = pygame.Surface((size, size), pygame.SRCALPHA)
        out.blit(scaled, (0, 0))
        mask = pygame.Surface((size, size), pygame.SRCALPHA)
        pygame.draw.circle(mask, (255, 255, 255, 255), (size // 2, size // 2), size // 2)
        out.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        return out

    BULLET_SIZE_A = 34
    BULLET_SIZE_B = 36
    bullet_sprite_A = make_circle_sprite(rinke_img_raw, BULLET_SIZE_A)
    bullet_sprite_B = make_circle_sprite(rinke_img_raw, BULLET_SIZE_B)

    # ============================================================
    # Mouse velocity -> predictive targeting
    # ============================================================
    last_mx, last_my = pygame.mouse.get_pos()
    last_mouse_t = pygame.time.get_ticks()
    mouse_vx = 0.0
    mouse_vy = 0.0

    def update_mouse_velocity(now, mx, my):
        nonlocal last_mx, last_my, last_mouse_t, mouse_vx, mouse_vy
        dt_ms = max(1, now - last_mouse_t)
        dt = dt_ms / 1000.0

        vx_new = (mx - last_mx) / dt
        vy_new = (my - last_my) / dt

        alpha = 0.30
        mouse_vx = (1 - alpha) * mouse_vx + alpha * vx_new
        mouse_vy = (1 - alpha) * mouse_vy + alpha * vy_new

        last_mx, last_my = mx, my
        last_mouse_t = now

    def predict_mouse(mx, my, lead_s):
        px = mx + mouse_vx * lead_s
        py = my + mouse_vy * lead_s
        px = max(0, min(w - 1, int(px)))
        py = max(0, min(h - 1, int(py)))
        return px, py

    # ============================================================
    # Minions (hoofden)
    # ============================================================
    START_DELAY_MS = 2000
    fight_start = pygame.time.get_ticks()

    minions_enabled = False
    wave_index = 0
    waves = [2, 3, 5]
    minions = []

    MINION_SCALE = 0.60
    FOLLOW_BASE = 3.9
    FOLLOW_JITTER = 0.25

    DASH_MIN_MS = 2500
    DASH_MAX_MS = 3000
    CHARGE_MS = 520
    DASH_MS = 560
    DASH_SPEED_BASE = 12.5
    DASH_SPEED_JITTER = 0.6

    minion_cache = {}

    def get_minion_img(size):
        if size not in minion_cache:
            minion_cache[size] = pygame.transform.scale(rinke_img_raw, (size, size)).convert_alpha()
        return minion_cache[size]

    def spawn_wave(n, now):
        nonlocal minions
        minions = []

        size = int(boss_size * MINION_SCALE)
        boss_cx = boss_x + boss_size / 2
        boss_cy = boss_y + boss_size / 2

        predict_count = 0
        if n == 3:
            predict_count = 1
        elif n == 5:
            predict_count = 2

        predict_indices = set(random.sample(range(n), predict_count))

        for i in range(n):
            sx, sy = boss_x + boss_size + 10, boss_y  # fallback
            for _ in range(40):
                ang = random.random() * 2 * math.pi
                rr = random.uniform(boss_size * 0.70, boss_size * 1.15)
                sx = boss_cx + math.cos(ang) * rr - size / 2
                sy = boss_cy + math.sin(ang) * rr - size / 2

                sx = max(LEFT_WALL_W + 10, min(orange_x - size - 10, sx))
                sy = max(TOP_WALL_H + 10, min(h - BOT_WALL_H - size - 10, sy))
                if sx + size < orange_x:
                    break

            follow_speed = random.uniform(FOLLOW_BASE - FOLLOW_JITTER, FOLLOW_BASE + FOLLOW_JITTER)
            dash_speed = random.uniform(DASH_SPEED_BASE - DASH_SPEED_JITTER, DASH_SPEED_BASE + DASH_SPEED_JITTER)

            minions.append({
                "x": float(sx),
                "y": float(sy),
                "size": size,
                "state": "follow",
                "charge_until": 0,
                "dash_until": 0,
                "vx": 0.0,
                "vy": 0.0,
                "next_dash": now + random.randint(DASH_MIN_MS, DASH_MAX_MS),
                "follow_speed": follow_speed,
                "dash_speed": dash_speed,
                "predict": (i in predict_indices),  # ✅ FIX
            })

    # ============================================================
    # Boss bullets
    # ============================================================
    bullets = []

    def spawn_bullet_from_boss(angle, speed, sprite):
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        bullets.append({
            "x": float(bx),
            "y": float(by),
            "vx": math.cos(angle) * speed,
            "vy": math.sin(angle) * speed,
            "r": sprite.get_width() / 2,
            "sprite": sprite,
        })

    spread_sprite = make_circle_sprite(rinke_img_raw, 28)

    def spawn_spread_shot(speed, sprite, mx, my):
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        ang0 = math.atan2(my - by, mx - bx)
        offs = [-0.22, -0.11, 0.0, 0.11, 0.22]
        for o in offs:
            a = ang0 + o
            bullets.append({
                "x": float(bx),
                "y": float(by),
                "vx": math.cos(a) * speed,
                "vy": math.sin(a) * speed,
                "r": sprite.get_width() / 2,
                "sprite": sprite,
            })

    # ============================================================
    # Boss phases (alleen intro/minions/move_center/phaseA/stun/phaseB)
    # ============================================================
    boss_state = "intro"
    center_target = (w / 2 - boss_size / 2, h / 2 - boss_size / 2)
    MOVE_TO_CENTER_SPEED = 2.2

    phase_end = 0
    stun_end = 0
    stun_return = None
    stun_hit_done = False

    next_random_shot = 0
    next_spread = 0

    PHASE_A_MS = 20000
    A_SHOT_INTERVAL_MS = 50
    A_BULLET_SPEED = 3.0

    PHASE_B_MS = 30000
    B_SHOT_INTERVAL_MS = 20
    B_BULLET_SPEED = 6.0

    STUN_MS = 5000
    BLINK_MS = 120

    SPREAD_EVERY_MS = 5000
    SPREAD_BULLET_SPEED = 8.0

    async def end_screen(result: str):
        if arcade_no_endscreen:
            return
        t0 = pygame.time.get_ticks()
        font_big = pygame.font.SysFont(None, 90)
        font_small = pygame.font.SysFont(None, 42)

        while True:
            for e in pygame.event.get():
                if e.type == pygame.QUIT:
                    return
                if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                    return

            screen.fill((0, 0, 0))
            msg = "Epstein is defeated" if result == "win" else "You were defeated by Epstein"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 50)))
            pygame.display.flip()
            if pygame.time.get_ticks() - t0 >= 3000:
                return
            clock.tick(60)
            await asyncio.sleep(0)

    def start_phaseA(now):
        nonlocal boss_state, phase_end, next_random_shot
        boss_state = "phaseA"
        phase_end = now + PHASE_A_MS
        next_random_shot = now

    def start_phaseB(now):
        nonlocal boss_state, phase_end, next_random_shot
        boss_state = "phaseB"
        phase_end = now + PHASE_B_MS
        next_random_shot = now

    def start_stun(now, return_phase):
        nonlocal boss_state, stun_end, stun_return, stun_hit_done
        boss_state = "stun"
        stun_end = now + STUN_MS
        stun_return = return_phase
        stun_hit_done = False

    if start_stage > 1:
        now_boot = pygame.time.get_ticks()
        fight_start = now_boot - START_DELAY_MS
        minions_enabled = False
        minions.clear()
        wave_index = 0
        bullets.clear()
        boss_x, boss_y = center_target
        start_phaseB(now_boot + 500)

    # ============================================================
    # Main loop
    # ============================================================
    while True:
        now = pygame.time.get_ticks()

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        mx, my = pygame.mouse.get_pos()
        mx = max(0, min(w - 1, mx))
        my = max(0, min(h - 1, my))

        update_mouse_velocity(now, mx, my)

        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # intro -> minions na 2s
        if boss_state == "intro":
            if now - fight_start >= START_DELAY_MS:
                boss_state = "minions"
                minions_enabled = True
                wave_index = 0
                spawn_wave(waves[wave_index], now)
                next_spread = now + SPREAD_EVERY_MS

        # Minions stage + 5-shot attack
        if boss_state == "minions":
            if now >= next_spread:
                next_spread = now + SPREAD_EVERY_MS
                spawn_spread_shot(SPREAD_BULLET_SPEED, spread_sprite, mx, my)

            for m in minions[:]:
                size = m["size"]

                if m["x"] + size >= orange_x:
                    minions.remove(m)
                    continue

                if m["predict"]:
                    tx, ty = predict_mouse(mx, my, 0.55)
                else:
                    tx, ty = mx, my

                if m["state"] == "follow":
                    cx = m["x"] + size / 2
                    cy = m["y"] + size / 2
                    dx = tx - cx
                    dy = ty - cy
                    dist = max(1.0, math.hypot(dx, dy))
                    step = m["follow_speed"]
                    m["x"] += (dx / dist) * step
                    m["y"] += (dy / dist) * step

                    if now >= m["next_dash"]:
                        m["state"] = "charge"
                        m["charge_until"] = now + CHARGE_MS

                elif m["state"] == "charge":
                    if now >= m["charge_until"]:
                        if m["predict"]:
                            dx_t, dy_t = predict_mouse(mx, my, 0.75)
                        else:
                            dx_t, dy_t = mx, my

                        cx = m["x"] + size / 2
                        cy = m["y"] + size / 2
                        dx = dx_t - cx
                        dy = dy_t - cy
                        dist = max(1.0, math.hypot(dx, dy))

                        sp = m["dash_speed"]
                        m["vx"] = (dx / dist) * sp
                        m["vy"] = (dy / dist) * sp
                        m["dash_until"] = now + DASH_MS
                        m["state"] = "dash"

                elif m["state"] == "dash":
                    m["x"] += m["vx"]
                    m["y"] += m["vy"]

                    if now >= m["dash_until"]:
                        m["state"] = "follow"
                        m["vx"] = 0.0
                        m["vy"] = 0.0
                        m["next_dash"] = now + random.randint(DASH_MIN_MS, DASH_MAX_MS)

                m["x"] = max(0, min(w - size, m["x"]))
                m["y"] = max(0, min(h - size, m["y"]))

                if m["x"] + size >= orange_x and m in minions:
                    minions.remove(m)

            if len(minions) == 0 and minions_enabled:
                if wave_index < len(waves) - 1:
                    wave_index += 1
                    spawn_wave(waves[wave_index], now)
                    next_spread = now + SPREAD_EVERY_MS
                else:
                    minions_enabled = False
                    boss_state = "move_center"

        # Move boss to center
        if boss_state == "move_center":
            tx, ty = center_target
            dx = tx - boss_x
            dy = ty - boss_y
            dist = math.hypot(dx, dy)
            if dist <= MOVE_TO_CENTER_SPEED:
                boss_x = tx
                boss_y = ty
                start_phaseA(now)
            else:
                boss_x += (dx / dist) * MOVE_TO_CENTER_SPEED
                boss_y += (dy / dist) * MOVE_TO_CENTER_SPEED

        # Phase A/B bullets
        if boss_state in ("phaseA", "phaseB"):
            if boss_state == "phaseA":
                interval = A_SHOT_INTERVAL_MS
                sp = A_BULLET_SPEED
                spr = bullet_sprite_A
            else:
                interval = B_SHOT_INTERVAL_MS
                sp = B_BULLET_SPEED
                spr = bullet_sprite_B

            while now >= next_random_shot:
                next_random_shot += interval
                ang = random.random() * 2 * math.pi
                spawn_bullet_from_boss(ang, sp, spr)

            if now >= phase_end:
                start_stun(now, boss_state)

        # Stun behavior
        if boss_state == "stun":
            if now >= stun_end:
                if not stun_hit_done:
                    if stun_return == "phaseA":
                        start_phaseA(now)
                    else:
                        start_phaseB(now)
                else:
                    if boss_hp <= 0:
                        await end_screen("win")
                        return "win"
                    if stun_return == "phaseA":
                        start_phaseB(now)
                    else:
                        start_phaseB(now)

        # Update bullets movement
        for b in bullets[:]:
            b["x"] += b["vx"]
            b["y"] += b["vy"]
            if b["x"] < -200 or b["x"] > w + 200 or b["y"] < -200 or b["y"] > h + 200:
                bullets.remove(b)

        # ============================================================
        # DRAW
        # ============================================================
        screen.fill((0, 0, 255))

        pygame.draw.rect(screen, (255, 0, 0), left_wall)
        pygame.draw.rect(screen, (255, 0, 0), top_wall)
        pygame.draw.rect(screen, (255, 0, 0), bot_wall)
        pygame.draw.rect(screen, (255, 165, 0), orange_wall)

        # name + hp bar
        name_surf = font.render(boss_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        bar_w = name_rect.width + 40
        bar_h = 18
        bx = w // 2 - bar_w // 2
        by = name_rect.bottom + 6
        pygame.draw.rect(screen, (0, 0, 0), (bx, by, bar_w, bar_h), 2)
        seg = bar_w // boss_max_hp
        for i in range(boss_hp):
            pygame.draw.rect(screen, (0, 255, 0), (bx + i * seg + 2, by + 2, seg - 4, bar_h - 4))

        # boss
        screen.blit(rinke_img, (int(boss_x), int(boss_y)))
        if boss_state == "stun" and (now // BLINK_MS) % 2 == 0:
            ov = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            ov.fill((255, 255, 0, 140))
            screen.blit(ov, (int(boss_x), int(boss_y)))

        # minions (met GELE knipper terug tijdens charge/dash)
        if boss_state == "minions" and minions_enabled:
            for m in minions:
                size = m["size"]
                img = get_minion_img(size)
                x = int(m["x"])
                y = int(m["y"])
                screen.blit(img, (x, y))
                pygame.draw.rect(screen, (255, 0, 0), pygame.Rect(x, y, size, size), 4)

                if m["state"] in ("charge", "dash") and (now // 120) % 2 == 0:
                    ov = pygame.Surface((size, size), pygame.SRCALPHA)
                    ov.fill((255, 255, 0, 140))
                    screen.blit(ov, (x, y))

        # bullets
        for b in bullets:
            spr = b["sprite"]
            x = int(b["x"] - spr.get_width() / 2)
            y = int(b["y"] - spr.get_height() / 2)
            screen.blit(spr, (x, y))

        draw_shield_pickup()
        draw_shield_indicator()

        # ============================================================
        # CHECKS
        # ============================================================
        if orange_wall.collidepoint(mx, my):
            if damage_should_kill(now):
                await end_screen("lose")
                return "lose"

        if left_wall.collidepoint(mx, my) or top_wall.collidepoint(mx, my) or bot_wall.collidepoint(mx, my):
            if damage_should_kill(now):
                await end_screen("lose")
                return "lose"

        for b in bullets[:]:
            dx = mx - b["x"]
            dy = my - b["y"]
            if dx * dx + dy * dy <= (b["r"] + 2) ** 2:
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"
                else:
                    bullets.remove(b)
                    break

        boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)
        if boss_rect.collidepoint(mx, my):
            if boss_state == "stun":
                if not stun_hit_done:
                    stun_hit_done = True
                    if arcade_hp_one:
                        boss_hp = 0
                    else:
                        boss_hp -= 1
                    if boss_hp <= 0:
                        await end_screen("win")
                        return "win"
            else:
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"

        if boss_state == "minions" and minions_enabled:
            for m in minions:
                r = pygame.Rect(int(m["x"]), int(m["y"]), m["size"], m["size"])
                if r.collidepoint(mx, my):
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"
                    break

        pygame.display.flip()
        clock.tick(60)
        await asyncio.sleep(0)








