import asyncio
# Joe.py
import pygame
import random
from pathlib import Path
import game_settings

async def bossfight_Joe(screen, start_stage=1, arcade_hp_one=False, arcade_no_endscreen=False):
    """
    Runs the Joe bossfight on the given screen.
    Returns to caller after showing a WIN/LOSE screen for 3 seconds.
    """

    # ---------- helpers ----------
    def draw_text_center(text, y, size=72):
        f = pygame.font.SysFont(None, size)
        surf = f.render(text, True, (255, 255, 255))
        rect = surf.get_rect(center=(w // 2, y))
        screen.blit(surf, rect)

    async def end_screen(result: str):
        if arcade_no_endscreen:
            return
        """result: 'win' or 'lose'"""
        t0 = pygame.time.get_ticks()
        while True:
            await asyncio.sleep(0)
            for e in pygame.event.get():
                if e.type == pygame.QUIT:
                    return
                if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                    return

            screen.fill((0, 0, 0))
            if result == "win":
                draw_text_center("You defeated Joe Biden! WOOHOOOOOOOOO!", h // 2 - 30, size=90)
                draw_text_center("wait...", h // 2 + 50, size=42)
            else:
                draw_text_center("You could not defeat Joe Biden! L bozo!", h // 2 - 30, size=90)
                draw_text_center("wait...", h // 2 + 50, size=42)

            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return

            clock.tick(60)

    # ---------- init ----------
    w, h = screen.get_size()
    clock = pygame.time.Clock()
    pygame.mouse.set_pos(w // 2, h // 2)

    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 13
    SHIELD_COLOR = (0, 255, 0)  # fel groen voor test


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
            shield_active = True      # altijd true zetten is prima (stackt niet)
            shield_pos = None


    def draw_shield_pickup():
        if shield_pos is not None:
            pygame.draw.circle(screen, SHIELD_COLOR, (int(shield_pos[0]), int(shield_pos[1])), int(SHIELD_RADIUS))
            pygame.draw.circle(screen, (255, 255, 255), (int(shield_pos[0]), int(shield_pos[1])), int(SHIELD_RADIUS), 2)


    def draw_shield_indicator():
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

    stefan_img = pygame.image.load(str(Path(__file__).resolve().with_name("Joe.png"))).convert_alpha()
    stefan_size = 100
    stefan_img = pygame.transform.scale(stefan_img, (stefan_size, stefan_size))

    stefan_x = 325 - stefan_size // 2
    stefan_y = h // 2 - stefan_size // 2

    stefan_base_y = stefan_y
    stefan_target_y = stefan_y
    stefan_speed = 2

    stefan_name = "Joe Biden"
    stefan_max_hp = 5
    stefan_hp = 5
    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(stefan_max_hp, start_stage))
    stefan_hp = max(1, stefan_max_hp - (start_stage - 1))

    font = pygame.font.SysFont(None, 40)

    # Movement timer
    move_timer = 0
    move_interval = 600  # frames (60fps -> 10 sec)

    # Circle attack system
    circle_attacks = []
    circle_timer = 0
    circle_interval = 900  # frames (60fps -> 15 sec)

    drop_count = 0
    drop_delay = 60  # frames (1 sec)
    drop_timer = 0

    circle_radius = 100
    circle_duration = 120  # frames visible total

    # One green orb max
    GREEN_RADIUS = 12
    HOMING_FORCE = 0.08
    green_orb = None  # dict or None

    # Bullets
    bullets = []
    bullet_speed = 7
    bullet_size = 40
    bullet_img = pygame.transform.scale(stefan_img, (bullet_size, bullet_size))

    shoot_timer = 0
    shoot_delay = 55

    # Clearer warning: RED blinking + "!" above boss
    circle_warning = False
    circle_warning_timer = 0
    circle_warning_duration = 60  # frames (1 sec)

    BASE_SHOOT_DELAY = shoot_delay
    BASE_CIRCLE_RADIUS = circle_radius
    BASE_BULLET_HOMING = 0.0
    bullet_homing = BASE_BULLET_HOMING

    def update_difficulty():
        nonlocal shoot_delay, circle_radius, bullet_homing
        lost_hp = stefan_max_hp - stefan_hp

        # faster shooting (min 10 frames)
        shoot_delay = max(10, BASE_SHOOT_DELAY - lost_hp * 9)

        # circle grows strongly with lost HP (your original was huge; keep but slightly toned)
        circle_radius = int(BASE_CIRCLE_RADIUS * (1 + 0.75 * lost_hp))

        # bullets homing increases
        bullet_homing = lost_hp * 0.01

    update_difficulty()

    warn_font = pygame.font.SysFont(None, 80)

    # ---------- main fight loop ----------
    while True:
        await asyncio.sleep(0)
        # ----- events -----
        now = pygame.time.get_ticks()
        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        # Pak muispositie 1x per frame (en clamp)
        mx, my = pygame.mouse.get_pos()
        mx = max(0, min(w - 1, mx))
        my = max(0, min(h - 1, my))

        # Shield update 1x per frame
        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # ----- boss movement -----
        move_timer += 1
        if move_timer == move_interval:
            stefan_target_y = stefan_base_y + random.choice([-200, 200])
        if move_timer == move_interval * 2:
            stefan_target_y = stefan_base_y
        if move_timer >= move_interval * 3:
            move_timer = 0

        if stefan_y < stefan_target_y:
            stefan_y += stefan_speed
        elif stefan_y > stefan_target_y:
            stefan_y -= stefan_speed

        # ----- circle warning & drops -----
        circle_timer += 1

        # start warning
        if circle_timer >= circle_interval and not circle_warning and drop_count == 0:
            circle_warning = True
            circle_warning_timer = circle_warning_duration

        # warning runs
        if circle_warning:
            circle_warning_timer -= 1
            if circle_warning_timer <= 0:
                circle_warning = False
                circle_timer = 0
                drop_count = 3
                drop_timer = 0

        # make drops
        if drop_count > 0:
            drop_timer += 1
            if drop_timer >= drop_delay:
                drop_timer = 0
                drop_count -= 1

                # gebruik huidige mx,my (cursorpositie op dit moment)
                is_last = (drop_count == 0)

                circle_attacks.append({
                    "x": mx,
                    "y": my,
                    "timer": circle_duration,
                    "state": "warning",
                    "state_timer": 60,  # 1 sec warning per circle
                    "last": is_last
                })

        # ----- shooting -----
        shoot_timer += 1
        if shoot_timer >= shoot_delay:
            shoot_timer = 0

            sx = stefan_x + stefan_size // 2
            sy = stefan_y + stefan_size // 2
            dx = mx - sx
            dy = my - sy
            dist = max(1, (dx * dx + dy * dy) ** 0.5)

            bullets.append({
                "x": float(sx),
                "y": float(sy),
                "vx": dx / dist * bullet_speed,
                "vy": dy / dist * bullet_speed
            })

        # ----- draw arena -----
        screen.fill((0, 0, 255))  # blue background
        # red walls (hazard)
        pygame.draw.rect(screen, (255, 0, 0), (0, 0, 500, h))
        pygame.draw.rect(screen, (255, 0, 0), (0, 0, w, 150))
        pygame.draw.rect(screen, (255, 0, 0), (0, h - 150, w, 150))
        pygame.draw.rect(screen, (255, 0, 0), (1700, 0, 150, 1080))


        # name top center
        name_surf = font.render(stefan_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        # hp bar under name
        bar_width = name_rect.width + 40
        bar_height = 18
        bar_x = w // 2 - bar_width // 2
        bar_y = name_rect.bottom + 6

        pygame.draw.rect(screen, (0, 0, 0), (bar_x, bar_y, bar_width, bar_height), 2)
        segment_width = bar_width // stefan_max_hp

        for i in range(stefan_hp):
            pygame.draw.rect(
                screen, (0, 255, 0),
                (bar_x + i * segment_width + 2, bar_y + 2, segment_width - 4, bar_height - 4)
            )

        # ----- boss draw + clearer global warning indicator -----
        screen.blit(stefan_img, (stefan_x, stefan_y))

        if circle_warning:
            # blinking red exclamation above boss
            if (now // 150) % 2 == 0:
                ex = warn_font.render("!", True, (255, 50, 50))
                ex_rect = ex.get_rect(center=(stefan_x + stefan_size // 2, stefan_y - 20))
                screen.blit(ex, ex_rect)

        # ----- circles update/draw -----
        for c in circle_attacks[:]:
            if c["state"] == "warning":
                # clearer warning: RED outline + blinking
                c["state_timer"] -= 1
                blink = (now // 120) % 2 == 0
                color = (255, 60, 60) if blink else (200, 0, 0)
                pygame.draw.circle(screen, color, (c["x"], c["y"]), circle_radius, 5)

                if c["state_timer"] <= 0:
                    c["state"] = "active"
            else:
                # active: solid bright red (kill)
                pygame.draw.circle(screen, (255, 0, 0), (c["x"], c["y"]), circle_radius)

                # only kill when active
                if ((mx - c["x"]) ** 2 + (my - c["y"]) ** 2) ** 0.5 <= circle_radius:
                    if damage_should_kill(now):
                        await end_screen("lose")
                        return "lose"

            c["timer"] -= 1
            if c["timer"] <= 0:
                if c["last"]:
                    # only one orb can exist -> despawn old
                    green_orb = {
                        "x": float(c["x"]),
                        "y": float(c["y"]),
                        "vx": 0.0,
                        "vy": 0.0,
                        "active": False
                    }
                circle_attacks.remove(c)

        # ----- bullets update/draw -----
        for b in bullets[:]:
            if bullet_homing > 0:
                dx = mx - b["x"]
                dy = my - b["y"]
                dist = max(1, (dx * dx + dy * dy) ** 0.5)
                b["vx"] += dx / dist * bullet_homing
                b["vy"] += dy / dist * bullet_homing

            b["x"] += b["vx"]
            b["y"] += b["vy"]

            bx, by = int(b["x"]), int(b["y"])
            if bx < 0 or bx >= w or by < 0 or by >= h:
                bullets.remove(b)
                continue

            screen.blit(bullet_img, (b["x"], b["y"]))

            if pygame.Rect(int(b["x"]), int(b["y"]), bullet_size, bullet_size).collidepoint(mx, my):
                if damage_should_kill(now):
                    await end_screen("lose")
                    return "lose"

        # ----- green orb (max 1) update/draw -----
        if green_orb is not None:
            g = green_orb

            # activate when mouse touches orb
            if not g["active"]:
                if ((mx - g["x"]) ** 2 + (my - g["y"]) ** 2) ** 0.5 < GREEN_RADIUS:
                    sx = stefan_x + stefan_size // 2
                    sy = stefan_y + stefan_size // 2
                    dx = sx - g["x"]
                    dy = sy - g["y"]
                    dist = max(1, (dx * dx + dy * dy) ** 0.5)
                    g["vx"] = dx / dist * 8
                    g["vy"] = dy / dist * 8
                    g["active"] = True

            # move + attraction
            if g["active"]:
                sx = stefan_x + stefan_size // 2
                sy = stefan_y + stefan_size // 2
                dx = sx - g["x"]
                dy = sy - g["y"]
                dist = max(1, (dx * dx + dy * dy) ** 0.5)

                g["vx"] += dx / dist * HOMING_FORCE
                g["vy"] += dy / dist * HOMING_FORCE

                g["x"] += g["vx"]
                g["y"] += g["vy"]

            # hit boss -> damage
            stefan_rect = pygame.Rect(stefan_x, stefan_y, stefan_size, stefan_size)
            if stefan_rect.collidepoint(g["x"], g["y"]):
                if arcade_hp_one:
                    stefan_hp = 0
                else:
                    stefan_hp -= 1
                green_orb = None

                if stefan_hp <= 0:
                    await end_screen("win")
                    return "win"
                update_difficulty()

            # off-screen -> despawn
            if green_orb is not None:
                if g["x"] < 0 or g["x"] > w or g["y"] < 0 or g["y"] > h:
                    green_orb = None

            # draw orb
            if green_orb is not None:
                pygame.draw.circle(
                    screen,
                    (0, 255, 0),
                    (int(green_orb["x"]), int(green_orb["y"])),
                    GREEN_RADIUS
                )

        # ----- wall collision: mouse on red -> lose -----
        # guard for out-of-bounds mouse coords
        x = mx
        y = my
        if screen.get_at((x, y))[:3] == (255, 0, 0):
            if damage_should_kill(now):
                await end_screen("lose")
                return "lose"
        
        draw_shield_pickup()
        draw_shield_indicator()

        dbg = font.render(f"shield_active={shield_active}", True, (255, 255, 255))
        screen.blit(dbg, (60, 10))


        pygame.display.flip()
        clock.tick(60)












