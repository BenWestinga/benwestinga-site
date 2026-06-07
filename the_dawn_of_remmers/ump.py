import asyncio
# ump.py
import pygame
import math
from pathlib import Path
import random
import game_settings

async def bossfight_ump(screen, start_stage=1, arcade_hp_one=False, arcade_no_endscreen=False):
    w, h = screen.get_size()
    clock = pygame.time.Clock()
    pygame.mouse.set_pos(w // 2, h // 2)

    # ----------------------------
    # Shield powerup (universeel)
    # ----------------------------
    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 12
    SHIELD_COLOR = (0, 100, 0)  # donkergroen

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
            r = 180  # "in de buurt van het midden"
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
            if not shield_active:  # stackt niet
                shield_active = True
            shield_pos = None

    def draw_shield_pickup():
        if shield_pos is not None:
            pygame.draw.circle(screen, SHIELD_COLOR, shield_pos, SHIELD_RADIUS)

    def draw_shield_indicator():
        # Donkerblauw stipje linksboven = shield actief
        if shield_active:
            pygame.draw.circle(screen, (0, 0, 139), (270, 160), 12)
            pygame.draw.circle(screen, (255, 255, 255), (30, 30), 12, 2)



    def damage_should_kill(now):
        """
        True  -> je moet dood (geen shield/invuln)
        False -> damage geabsorbed/ignored
        """
        nonlocal shield_active, invuln_until
        if now < invuln_until:
            return False
        if shield_active:
            shield_active = False
            invuln_until = now + INVULN_MS
            return False
        return True

    # ----------------------------
    # Arena: BLUE oval safe zone, everything else is lava (red)
    # Safe-zone check via ellipse-formula (niet via pixelkleur)
    # ----------------------------
    OVERSIZE = 10

    base_cx = w / 2.0
    base_cy = h / 2.0
    base_rx0 = (w + 2 * OVERSIZE) / 2.0
    base_ry0 = (h + 2 * OVERSIZE) / 2.0

    safe_rx = base_rx0
    safe_ry = base_ry0

    def in_safe_zone(px: int, py: int) -> bool:
        dx = (px - base_cx) / safe_rx
        dy = (py - base_cy) / safe_ry
        return (dx * dx + dy * dy) <= 1.0

    def current_safe_rect():
        return pygame.Rect(
            int(base_cx - safe_rx),
            int(base_cy - safe_ry),
            int(2 * safe_rx),
            int(2 * safe_ry),
        )

    # ----------------------------
    # Boss setup
    # ----------------------------
    boss_size = 100
    boss_x = float(325 - boss_size // 2)
    boss_y = float(h // 2 - boss_size // 2)
    boss_name = "Trump"

    boss_max_hp = 3
    boss_hp = 3
    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(boss_max_hp, start_stage))
    boss_hp = max(1, boss_max_hp - (start_stage - 1))

    lost_flash_index = None
    lost_flash_until = 0
    LOST_FLASH_MS = 350

    boss_damage_cooldown_until = 0
    BOSS_DAMAGE_COOLDOWN_MS = 450

    boss_invuln_until = 0
    BOSS_INVULN_MS = 10000

    lives_lost = 0
    head_bounces_allowed = 0

    ump_img = pygame.image.load(str(Path(__file__).resolve().with_name("ump.png"))).convert_alpha()
    ump_img = pygame.transform.scale(ump_img, (boss_size, boss_size))

    # ----------------------------
    # Dash-squares (projectiles met plaatje)
    # ----------------------------
    SQUARE_SIZE = 45
    SQUARE_COUNT = 16
    SQUARE_SPEED = 10.5

    square_img = pygame.transform.scale(ump_img, (SQUARE_SIZE, SQUARE_SIZE))
    dash_squares = []

    def spawn_dash_squares(cx, cy, b_override=None):
        nonlocal dash_squares
        start_x = cx - SQUARE_SIZE / 2
        start_y = cy - SQUARE_SIZE / 2
        b = head_bounces_allowed if b_override is None else int(b_override)
        for i in range(SQUARE_COUNT):
            ang = 2 * math.pi * (i / SQUARE_COUNT)
            vx = math.cos(ang) * SQUARE_SPEED
            vy = math.sin(ang) * SQUARE_SPEED
            dash_squares.append({"x": start_x, "y": start_y, "vx": vx, "vy": vy, "b": b})

    def update_and_draw_squares():
        for s in dash_squares[:]:
            s["x"] += s["vx"]
            s["y"] += s["vy"]

            hit_wall = False

            if s["x"] < 0:
                hit_wall = True
                if s["b"] > 0:
                    s["x"] = 0
                    s["vx"] *= -1
                else:
                    dash_squares.remove(s)
                    continue
            elif s["x"] + SQUARE_SIZE > w:
                hit_wall = True
                if s["b"] > 0:
                    s["x"] = w - SQUARE_SIZE
                    s["vx"] *= -1
                else:
                    dash_squares.remove(s)
                    continue

            if s["y"] < 0:
                hit_wall = True
                if s["b"] > 0:
                    s["y"] = 0
                    s["vy"] *= -1
                else:
                    dash_squares.remove(s)
                    continue
            elif s["y"] + SQUARE_SIZE > h:
                hit_wall = True
                if s["b"] > 0:
                    s["y"] = h - SQUARE_SIZE
                    s["vy"] *= -1
                else:
                    dash_squares.remove(s)
                    continue

            if hit_wall and s in dash_squares and s["b"] > 0:
                s["b"] -= 1

            screen.blit(square_img, (int(s["x"]), int(s["y"])))

    def squares_hit_mouse(mx, my):
        for s in dash_squares:
            r = pygame.Rect(int(s["x"]), int(s["y"]), SQUARE_SIZE, SQUARE_SIZE)
            if r.collidepoint(mx, my):
                return True
        return False

    # ----------------------------
    # Movement / timing
    # ----------------------------
    FOLLOW_SPEED = 3.0

    ATTACK_INTERVAL_MS = 2500
    CHARGE_MS = 1000
    DASH_SPEED = 14.0
    DASH_MAX_MS = 650

    POST_BOUNCE_FOLLOW_MS = 2000

    AIR_RED_BLINK_MS = 800
    BLINK_TOGGLE_MS = 120

    TELE_HOLD_MS = 3000
    TELE_SHRINK_MS = 1000

    MOUSE_STUN_MS = 1000
    BOSS_YELLOW_STUN_MS = 5000

    mouse_stun_until = 0
    mouse_stun_pos = (w // 2, h // 2)

    boss_hidden = False

    tele_center = (w // 2, h // 2)
    tele_base_size = boss_size
    tele_rect_size = boss_size
    tele_hold_until = 0
    tele_shrink_start = 0
    tele_shrink_until = 0

    post_follow_until = 0
    air_red_until = 0
    boss_yellow_stun_until = 0

    next_attack_time = pygame.time.get_ticks() + ATTACK_INTERVAL_MS
    state = "follow"
    charge_until = 0
    dash_until = 0
    dash_vx = 0.0
    dash_vy = 0.0

    attackA_done = 0
    pending_bounce = False
    current_attack = "normal"

    bounces_in_cycle = 0

    BOUNCE_BASE_HITS = 5
    bounce_hits = 0
    bounce_max_hits_current = BOUNCE_BASE_HITS

    font = pygame.font.SysFont(None, 40)

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
            msg = "Trump is defeated" if result == "win" else "You were defeated by Trump"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))

            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 50)))

            pygame.display.flip()
            if pygame.time.get_ticks() - t0 >= 3000:
                return
            clock.tick(60)

    def apply_scaling_after_hit():
        nonlocal lives_lost, safe_rx, safe_ry, head_bounces_allowed, bounce_max_hits_current
        lives_lost = boss_max_hp - boss_hp
        shrink_factor = (0.8 ** lives_lost)
        safe_rx = base_rx0 * shrink_factor
        safe_ry = base_ry0 * shrink_factor
        head_bounces_allowed = lives_lost
        bounce_max_hits_current = BOUNCE_BASE_HITS + 5 * lives_lost

    def boss_take_damage():
        nonlocal boss_hp, lost_flash_index, lost_flash_until
        nonlocal boss_damage_cooldown_until, boss_invuln_until

        now2 = pygame.time.get_ticks()

        if now2 < boss_invuln_until:
            return
        if now2 < boss_damage_cooldown_until:
            return

        if arcade_hp_one:
            boss_hp = 0
        else:
            boss_hp -= 1
        lost_flash_index = max(0, boss_hp)
        lost_flash_until = now2 + LOST_FLASH_MS
        boss_damage_cooldown_until = now2 + BOSS_DAMAGE_COOLDOWN_MS

        if boss_hp <= 0:
            await end_screen("win")
            raise SystemExit

        boss_invuln_until = now2 + BOSS_INVULN_MS
        apply_scaling_after_hit()

    safe_rx = base_rx0
    safe_ry = base_ry0
    head_bounces_allowed = 0
    bounce_max_hits_current = BOUNCE_BASE_HITS
    lives_lost = 0
    apply_scaling_after_hit()

    # ----------------------------
    # Main loop
    # ----------------------------
    try:
        while True:
            await asyncio.sleep(0)
            now = pygame.time.get_ticks()

            for e in pygame.event.get():
                if e.type == pygame.QUIT:
                    return
                if e.type == pygame.KEYDOWN:
                    if e.key == pygame.K_ESCAPE:
                        await end_screen("lose")
                        return "lose"
                    if e.key == pygame.K_SPACE:
                        await end_screen("win")
                        return "win"

            mx, my = pygame.mouse.get_pos()
            mx = max(0, min(w - 1, mx))
            my = max(0, min(h - 1, my))

            # shield update
            maybe_spawn_shield(now)
            try_pickup_shield(mx, my)

            # Mouse stun
            if now < mouse_stun_until:
                pygame.mouse.set_pos(mouse_stun_pos)
                pygame.mouse.get_rel()
                mx, my = mouse_stun_pos

            # ----------------------------
            # State machine
            # ----------------------------
            if state == "follow":
                if now >= next_attack_time:
                    current_attack = "bounce" if pending_bounce else "normal"
                    state = "charge"
                    charge_until = now + CHARGE_MS

            elif state == "charge":
                if now >= charge_until:
                    boss_cx = boss_x + boss_size / 2
                    boss_cy = boss_y + boss_size / 2
                    dx = mx - boss_cx
                    dy = my - boss_cy
                    dist = max(1.0, math.hypot(dx, dy))

                    speed_mult = 1.0
                    if current_attack == "bounce":
                        speed_mult = 1.0 + 0.3 * lives_lost

                    dash_vx = (dx / dist) * (DASH_SPEED * speed_mult)
                    dash_vy = (dy / dist) * (DASH_SPEED * speed_mult)

                    if current_attack == "bounce":
                        state = "bounce_dash"
                        bounce_hits = 0
                    else:
                        state = "dash"
                        dash_until = now + DASH_MAX_MS

            elif state == "dash":
                boss_cx = boss_x + boss_size / 2
                boss_cy = boss_y + boss_size / 2
                if now >= dash_until or math.hypot(mx - boss_cx, my - boss_cy) < 18:
                    spawn_dash_squares(boss_cx, boss_cy)

                    state = "follow"
                    dash_vx = 0.0
                    dash_vy = 0.0

                    attackA_done += 1

                    if attackA_done >= 2:
                        pending_bounce = True
                        attackA_done = 0
                        next_attack_time = now + ATTACK_INTERVAL_MS
                    else:
                        next_attack_time = now + ATTACK_INTERVAL_MS

            elif state == "post_bounce_follow":
                if now >= post_follow_until:
                    state = "air_red"
                    air_red_until = now + AIR_RED_BLINK_MS

            elif state == "air_red":
                if now >= air_red_until:
                    boss_hidden = True

                    tx = max(boss_size / 2, min(w - boss_size / 2, mx))
                    ty = max(boss_size / 2, min(h - boss_size / 2, my))
                    tele_center = (tx, ty)

                    tele_rect_size = tele_base_size
                    tele_hold_until = now + TELE_HOLD_MS
                    state = "tele_hold"

            elif state == "tele_hold":
                tx = max(boss_size / 2, min(w - boss_size / 2, mx))
                ty = max(boss_size / 2, min(h - boss_size / 2, my))
                tele_center = (tx, ty)
                tele_rect_size = tele_base_size

                if now >= tele_hold_until:
                    tele_shrink_start = now
                    tele_shrink_until = now + TELE_SHRINK_MS
                    state = "tele_shrink"

            elif state == "tele_shrink":
                t = (now - tele_shrink_start) / max(1, TELE_SHRINK_MS)
                t = max(0.0, min(1.0, t))
                tele_rect_size = int(tele_base_size * (1.0 - t))

                if now >= tele_shrink_until:
                    boss_hidden = False

                    cx, cy = tele_center
                    boss_x = float(cx - boss_size / 2)
                    boss_y = float(cy - boss_size / 2)
                    boss_x = max(0, min(w - boss_size, boss_x))
                    boss_y = max(0, min(h - boss_size, boss_y))

                    spawn_dash_squares(boss_x + boss_size / 2, boss_y + boss_size / 2)

                    mouse_stun_until = now + MOUSE_STUN_MS
                    mouse_stun_pos = (int(mx), int(my))
                    pygame.mouse.set_pos(mouse_stun_pos)
                    pygame.mouse.get_rel()

                    boss_yellow_stun_until = now + BOSS_YELLOW_STUN_MS
                    state = "boss_stun"

            elif state == "boss_stun":
                if now >= boss_yellow_stun_until:
                    state = "follow"
                    next_attack_time = now + ATTACK_INTERVAL_MS

            elif state == "bounce_dash":
                next_x = boss_x + dash_vx
                next_y = boss_y + dash_vy

                hit_wall = False

                if next_x <= 0:
                    next_x = 0
                    dash_vx *= -1
                    hit_wall = True
                elif next_x >= (w - boss_size):
                    next_x = (w - boss_size)
                    dash_vx *= -1
                    hit_wall = True

                if next_y <= 0:
                    next_y = 0
                    dash_vy *= -1
                    hit_wall = True
                elif next_y >= (h - boss_size):
                    next_y = (h - boss_size)
                    dash_vy *= -1
                    hit_wall = True

                boss_x, boss_y = next_x, next_y

                if hit_wall:
                    boss_cx = boss_x + boss_size / 2
                    boss_cy = boss_y + boss_size / 2
                    spawn_dash_squares(boss_cx, boss_cy, b_override=0)

                    bounce_hits += 1

                    if bounce_hits >= bounce_max_hits_current:
                        pending_bounce = False
                        current_attack = "normal"
                        dash_vx = 0.0
                        dash_vy = 0.0

                        bounces_in_cycle += 1

                        if bounces_in_cycle >= 2:
                            bounces_in_cycle = 0
                            attackA_done = 0
                            state = "post_bounce_follow"
                            post_follow_until = now + POST_BOUNCE_FOLLOW_MS
                        else:
                            state = "follow"
                            next_attack_time = now + ATTACK_INTERVAL_MS

            # ----------------------------
            # Boss movement per state
            # ----------------------------
            if state == "dash":
                boss_x += dash_vx
                boss_y += dash_vy
            elif state == "bounce_dash":
                pass
            elif state in ("air_red", "tele_hold", "tele_shrink", "boss_stun"):
                pass
            else:
                boss_cx = boss_x + boss_size / 2
                boss_cy = boss_y + boss_size / 2
                dx = mx - boss_cx
                dy = my - boss_cy
                dist = math.hypot(dx, dy)
                if dist > 1:
                    step = min(FOLLOW_SPEED, dist)
                    boss_x += (dx / dist) * step
                    boss_y += (dy / dist) * step

            boss_x = max(0, min(w - boss_size, boss_x))
            boss_y = max(0, min(h - boss_size, boss_y))
            boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)

            # ----------------------------
            # Draw map
            # ----------------------------
            screen.fill((255, 0, 0))
            pygame.draw.ellipse(screen, (0, 0, 255), current_safe_rect())

            if state in ("tele_hold", "tele_shrink"):
                cx, cy = tele_center
                size = max(0, int(tele_rect_size))
                if size > 0:
                    rx = int(cx - size / 2)
                    ry = int(cy - size / 2)
                    tele_rect = pygame.Rect(rx, ry, size, size)
                    pygame.draw.rect(screen, (160, 160, 160), tele_rect)

            # Name
            name_surf = font.render(boss_name, True, (255, 255, 255))
            name_rect = name_surf.get_rect(midtop=(w // 2, 160))
            screen.blit(name_surf, name_rect)

            # HP bar
            bar_width = name_rect.width + 40
            bar_height = 18
            bar_x = w // 2 - bar_width // 2
            bar_y = name_rect.bottom + 6

            pygame.draw.rect(screen, (0, 0, 0), (bar_x, bar_y, bar_width, bar_height), 2)
            segment_width = bar_width // boss_max_hp

            for i in range(boss_hp):
                pygame.draw.rect(
                    screen, (0, 255, 0),
                    (bar_x + i * segment_width + 2, bar_y + 2, segment_width - 4, bar_height - 4)
                )

            if lost_flash_index is not None and pygame.time.get_ticks() < lost_flash_until:
                i = lost_flash_index
                if 0 <= i < boss_max_hp:
                    pygame.draw.rect(
                        screen, (255, 0, 0),
                        (bar_x + i * segment_width + 2, bar_y + 2, segment_width - 4, bar_height - 4)
                    )

            # Boss sprite
            if not boss_hidden:
                screen.blit(ump_img, (int(boss_x), int(boss_y)))

                if state == "air_red" and (now // BLINK_TOGGLE_MS) % 2 == 0:
                    red_overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                    red_overlay.fill((255, 0, 0, 140))
                    screen.blit(red_overlay, (int(boss_x), int(boss_y)))

                if state == "boss_stun" and (now // BLINK_TOGGLE_MS) % 2 == 0:
                    y_overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                    y_overlay.fill((255, 255, 0, 140))
                    screen.blit(y_overlay, (int(boss_x), int(boss_y)))

            update_and_draw_squares()

            if state == "charge":
                overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                overlay.fill((0, 255, 0, 140))
                screen.blit(overlay, (int(boss_x), int(boss_y)))

            # ----------------------------
            # Checks
            # ----------------------------
            if not in_safe_zone(mx, my):
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"

            if squares_hit_mouse(mx, my):
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"

            if (not boss_hidden) and boss_rect.collidepoint(mx, my):
                if state == "boss_stun":
                    boss_take_damage()
                else:
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"
            
            draw_shield_pickup()
            draw_shield_indicator()

            pygame.display.flip()
            clock.tick(60)

    except SystemExit:
        return "win"













