# Hottie.py
import pygame
import random
import math
from pathlib import Path
import game_settings


def bossfight_Hottie(screen):
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
        t = max(0.0, min(1.0, t))
        cx_ = ax + t * vx
        cy_ = ay + t * vy
        return math.hypot(px - cx_, py - cy_)

    # ============================================================
    # End screen
    # ============================================================
    def end_screen(result: str):
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
            msg = "hottie is defeated" if result == "win" else "You were defeated by hottie"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 55)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return
            clock.tick(60)

    # ============================================================
    # Load Hottie face
    # ============================================================
    try:
        raw_face = pygame.image.load(str(Path(__file__).resolve().with_name("Hottie.png"))).convert_alpha()
    except Exception:
        raw_face = pygame.Surface((140, 140), pygame.SRCALPHA)
        raw_face.fill((180, 180, 180))
        pygame.draw.rect(raw_face, (0, 0, 0), raw_face.get_rect(), 3)

    # ============================================================
    # Arena = VIERKANT (blauw binnen, rood buiten = lethal)
    # (met "shrink" attack die kanten in/uit schuift)
    # ============================================================
    cx = w // 2
    cy = h // 2 + 10

    # rechthoek: breder dan hoog
    BASE_HALF_X = int(min(w, h) * 0.65)  # half breedte
    BASE_HALF_Y = int(min(w, h) * 0.38)  # half hoogte

    BASE_HALF_X = max(380, min(980, BASE_HALF_X))
    BASE_HALF_Y = max(260, min(760, BASE_HALF_Y))

    # dynamic shrink amounts (px)
    shrink = {"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0}

    def arena_bounds():
        halfx = float(BASE_HALF_X)
        halfy = float(BASE_HALF_Y)

        left = cx - halfx + shrink["L"]
        right = cx + halfx - shrink["R"]
        top = cy - halfy + shrink["T"]
        bottom = cy + halfy - shrink["B"]

        # minimum size safety
        if right - left < 260:
            mid = (left + right) / 2
            left = mid - 130
            right = mid + 130
        if bottom - top < 260:
            mid = (top + bottom) / 2
            top = mid - 130
            bottom = mid + 130

        return left, top, right, bottom

    def inside_arena(x, y):
        L, T, R, B = arena_bounds()
        return (L <= x <= R) and (T <= y <= B)

    def project_inside(x, y, margin=1.0):
        L, T, R, B = arena_bounds()
        x = clamp(x, L + margin, R - margin)
        y = clamp(y, T + margin, B - margin)
        return x, y

    def apply_square_bounce(obj):
        # obj: dict x,y,vx,vy
        L, T, R, B = arena_bounds()
        bounced = False
        if obj["x"] < L:
            obj["x"] = L
            obj["vx"] *= -1
            bounced = True
        elif obj["x"] > R:
            obj["x"] = R
            obj["vx"] *= -1
            bounced = True

        if obj["y"] < T:
            obj["y"] = T
            obj["vy"] *= -1
            bounced = True
        elif obj["y"] > B:
            obj["y"] = B
            obj["vy"] *= -1
            bounced = True
        return bounced
    
    def apply_square_bounce_box(bx):
        # bounce met rekening houden met box size (x,y = center)
        L, T, R, B = arena_bounds()
        half = bx["size"] / 2
        bounced = False

        if bx["x"] - half < L:
            bx["x"] = L + half
            bx["vx"] *= -1
            bounced = True
        elif bx["x"] + half > R:
            bx["x"] = R - half
            bx["vx"] *= -1
            bounced = True

        if bx["y"] - half < T:
            bx["y"] = T + half
            bx["vy"] *= -1
            bounced = True
        elif bx["y"] + half > B:
            bx["y"] = B - half
            bx["vy"] *= -1
            bounced = True

        return bounced

    # ============================================================
    # Shield pickup (same behavior as crazy)
    # ============================================================
    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 13
    SHIELD_COLOR = (0, 100, 0)
    INDICATOR_POS = (270, 160)

    shield_pos = None
    shield_active = False
    invuln_until = 0
    next_shield_spawn = pygame.time.get_ticks() + SHIELD_SPAWN_MS

    def maybe_spawn_shield(now):
        if game_settings.NO_SHIELDS:
            return
        nonlocal shield_pos, next_shield_spawn
        if shield_pos is None and now >= next_shield_spawn:
            L, T, R, B = arena_bounds()
            sx = random.randint(int(L + 80), int(R - 80))
            sy = random.randint(int(T + 80), int(B - 80))
            shield_pos = (float(sx), float(sy))
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

    def die(now):
        if damage_should_kill(now):
            end_screen("lose")
            return True
        return False

    # ============================================================
    # Face-in-shape cache (circle/square/triangle/donut/arc)
    # ============================================================
    face_shape_cache = {}  # (shape, size, extra) -> Surface

    def get_face_in_shape(shape: str, size: int, extra=None):
        key = (shape, int(size), extra)
        if key in face_shape_cache:
            return face_shape_cache[key]

        if shape == "donut":
            outerR, innerR = extra
            outerR = int(outerR)
            innerR = int(innerR)
            S = outerR * 2 + 2
            img = pygame.transform.smoothscale(raw_face, (S, S))
            surf = pygame.Surface((S, S), pygame.SRCALPHA)
            surf.blit(img, (0, 0))

            mask = pygame.Surface((S, S), pygame.SRCALPHA)
            mask.fill((0, 0, 0, 0))
            pygame.draw.circle(mask, (255, 255, 255, 255), (S // 2, S // 2), outerR)
            pygame.draw.circle(mask, (0, 0, 0, 0), (S // 2, S // 2), innerR)
            surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)

            face_shape_cache[key] = surf
            return surf

        S = int(size)
        img = pygame.transform.smoothscale(raw_face, (S, S))
        surf = pygame.Surface((S, S), pygame.SRCALPHA)
        surf.blit(img, (0, 0))

        mask = pygame.Surface((S, S), pygame.SRCALPHA)
        mask.fill((0, 0, 0, 0))

        if shape == "circle":
            pygame.draw.circle(mask, (255, 255, 255, 255), (S // 2, S // 2), S // 2)
        elif shape == "square":
            pygame.draw.rect(mask, (255, 255, 255, 255), (0, 0, S, S), border_radius=max(6, S // 10))
        elif shape == "triangle":
            pts = [(S // 2, 0), (0, S - 1), (S - 1, S - 1)]
            pygame.draw.polygon(mask, (255, 255, 255, 255), pts)
        else:
            pygame.draw.rect(mask, (255, 255, 255, 255), (0, 0, S, S))

        surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        face_shape_cache[key] = surf
        return surf

    # ============================================================
    # Boss Hottie
    # ============================================================
    boss_name = "hottie"
    boss_hp = 4
    boss_max_hp = 4

    boss_size = 120
    boss_img = pygame.transform.smoothscale(raw_face, (boss_size, boss_size))

    def boss_pos():
        L, T, R, B = arena_bounds()
        margin = 16
        x = cx - boss_size / 2
        y = B - boss_size - margin  # onderaan spawn
        return float(x), float(y)

    BOSS_MARGIN = 16
    boss_x = float(cx - boss_size / 2)
    boss_y = float((cy + BASE_HALF_Y) - boss_size - BOSS_MARGIN)

    boss_flash_until = 0
    boss_flash_strong_until = 0

    def flash_boss(now, strong=False):
        nonlocal boss_flash_until, boss_flash_strong_until
        boss_flash_until = max(boss_flash_until, now + 240)
        if strong:
            boss_flash_strong_until = max(boss_flash_strong_until, now + 650)

    def draw_boss(now):
        # basis
        screen.blit(boss_img, (int(boss_x), int(boss_y)))

        # rode flash overlay
        if now < boss_flash_until or now < boss_flash_strong_until:
            overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            if now < boss_flash_strong_until:
                overlay.fill((255, 0, 0, 165))
            else:
                overlay.fill((255, 0, 0, 90))
            screen.blit(overlay, (int(boss_x), int(boss_y)), special_flags=pygame.BLEND_RGBA_ADD)

    def boss_rect():
        return pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)

    # ============================================================
    # Shared draw: name + HP bar
    # ============================================================
    header_font = pygame.font.SysFont(None, 46)

    def draw_boss_ui():
        name_surf = header_font.render(boss_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        bar_w = max(360, name_rect.width + 120)
        bar_h = 22
        bx0 = w // 2 - bar_w // 2
        by0 = name_rect.bottom + 10

        pygame.draw.rect(screen, (25, 25, 25), (bx0, by0, bar_w, bar_h))
        pygame.draw.rect(screen, (0, 0, 0), (bx0, by0, bar_w, bar_h), 3)

        inner_pad = 3
        inner_w = bar_w - 2 * inner_pad
        inner_h = bar_h - 2 * inner_pad
        seg = inner_w / boss_max_hp

        for i in range(boss_hp):
            sx = bx0 + inner_pad + int(i * seg)
            sw = int(seg) - 2
            pygame.draw.rect(screen, (0, 255, 0), (sx, by0 + inner_pad, sw, inner_h))

    # ============================================================
    # Hazards containers
    # ============================================================
    # Attack 1: tornado + stones
    tornado = None
    stones = []

    # Attack 2: homing blocks + trails
    homers = []
    homer_trails = []  # segments w/ lifetime

    # Attack 3: shrink controller
    shrink_attack = None

    # Attack 4: bombs
    bombs = []
    spikes = []
    red_zones = []

    # Attack 5: trailing hazard dots + line shots
    trail_dots = []
    line_shots = []

    # Attack 6: arcs + ice spikes
    arcs = []
    ice_spikes = []

    # Attack 7: spinner
    spinner = None

    # Attack 8: machinegun bullets (laatste fase)
    machinegun_active = False
    mg_next = 0
    mg_bullets = []

    # Special box + green ball
    box = None
    green_ball = None

    def boss_take_damage(now):
        nonlocal boss_hp, machinegun_active, phase_pause_until, phase_pending_setup, next_attack_time

        boss_hp -= 1
        if boss_hp <= 0:
            end_screen("win")
            return True

        # ✅ alles weg meteen
        reset_all_hazards()

        # ✅ 2 seconden pauze en dan pas nieuwe phase setup
        phase_pause_until = now + PHASE_PAUSE_MS
        phase_pending_setup = True
        next_attack_time = phase_pause_until  # scheduler pas na pauze

        machinegun_active = False
        return False

    # ============================================================
    # Helpers: collision against square arena
    # ============================================================
    def out_of_bounds(x, y, pad=0):
        L, T, R, B = arena_bounds()
        return (x < L - pad) or (x > R + pad) or (y < T - pad) or (y > B + pad)
    
    def angle_in_range(a, a0, a1):
        """Return True if angle a is in [a0,a1] on the circle (wrap-safe)."""
        twopi = 2.0 * math.pi
        a  = (a  % twopi)
        a0 = (a0 % twopi)
        a1 = (a1 % twopi)
        if a0 <= a1:
            return a0 <= a <= a1
        return a >= a0 or a <= a1

    def clip_to_arena(x, y):
        return project_inside(x, y, margin=0.0)

    # ============================================================
    # Phase / Attack scheduling
    # ============================================================
    attack_interval_base = 18000  # ms
    next_attack_time = pygame.time.get_ticks() + 1200

    phase_pool = []
    phase_started = 0
    phase_target = 5
    PHASE_PAUSE_MS = 2000
    phase_pause_until = 0
    phase_pending_setup = False

    # ✅ box krijgt eigen timer (kost geen attack-slot)
    next_box_time = 10**12      # box pas zodra cycle eindigt

    cycle_pos = 0               # hoeveel attacks in de huidige cycle
    cycle_pool = [] 
    phase4_box_armed = False   # fase4: nadat 7 attacks zijn geweest mag box spawnen
    phase4_done = False

    # phase 4: machinegun permanent + sneller over tijd
    mg_shot_ms = 90.0
    mg_speedup_next = 0



    def reset_all_hazards():
        nonlocal tornado, stones, homers, homer_trails, shrink_attack, bombs, spikes, red_zones
        nonlocal trail_dots, line_shots, arcs, ice_spikes, spinner
        nonlocal machinegun_active, mg_next, mg_bullets, box, green_ball, next_box_time

        tornado = None
        stones.clear()
        homers.clear()
        homer_trails.clear()
        shrink_attack = None
        bombs.clear()
        spikes.clear()
        red_zones.clear()
        trail_dots.clear()
        line_shots.clear()
        arcs.clear()
        ice_spikes.clear()
        spinner = None
        mg_bullets.clear()
        box = None
        green_ball = None

        machinegun_active = False
        mg_next = 0

        # ✅ box timer reset
        # ✅ box timer reset (NIET meteen spawnen)
        next_box_time = 10**12

    def setup_phase(now):
        nonlocal phase_pool, phase_started, phase_target, next_attack_time, next_box_time
        nonlocal cycle_pos, cycle_pool, machinegun_active, mg_shot_ms, mg_speedup_next, mg_next

        lives_lost = boss_max_hp - boss_hp
        phase_target = 5 + lives_lost
        phase_started = 0

        interval = attack_interval_base - lives_lost * 2000
        interval = max(12000, interval)
        next_attack_time = now + interval

        # ✅ cycle reset
        cycle_pos = 0
        cycle_pool = []
        next_box_time = 10**12   # box komt pas zodra cycle klaar is

        # ✅ fase 4: machinegun blijft aan (lives_lost == 3 bij 4 hp)
        # ✅ fase 4: machinegun nog NIET. Die gaat pas aan zodra de box spawned.
        machinegun_active = False

    def start_attack(name, now):
        nonlocal tornado, shrink_attack, spinner, machinegun_active, mg_next
        if name != "shrink":
            flash_boss(now, strong=False)


        if name == "tornado":
            # 30s, 1s warning
            tornado = {
                "t0": now,
                "t_end": now + 30000,
                "warn_end": now + 1000,
                "x": float(cx),
                "y": float(cy),
                "R": 90,
                "spawned": 0,
                "next_stone": now + 1000,  # na warning beginnen
            }

        elif name == "homing":
            # 30s, elke 10s 1 (t=0,10,20)
            homers.clear()
            homer_trails.clear()
            homers.append({"t0": now, "spawn_at": now, "spawned": 0, "t_end": now + 30000})

        elif name == "shrink":
            shrink_attack = {
                "t0": now,
                "t_end": now + 30000,
                "i": 0,
                "next_evt": now,
                "evt_side": None,
                "evt_start": 0,
                "evt_amp": 0.0,

                # ✅ 1s warning / preview
                "warn_end": 0,
                "preview_side": None,
                "preview_amp": 0.0,
            }

        elif name == "bombs":
            bombs.clear()
            spikes.clear()
            red_zones.clear()
            bombs.append({"t0": now, "t_end": now + 30000, "spawned": 0, "next": now})

        elif name == "trail":
            trail_dots.clear()
            line_shots.clear()
            trail_dots.append({"t0": now, "t_end": now + 30000, "next_dot": now, "next_line": now})

        elif name == "arcs":
            arcs.clear()
            ice_spikes.clear()
            arcs.append({"t0": now, "t_end": now + 30000, "next_arc": now, "next_ice": now + 2000, "ice_done": 0})

        elif name == "spinner":
            ang0 = random.uniform(0, math.pi)
            spinner = {
                "t0": now,
                "t_end": now + 30000,
                "warn_end": now + 1000,      # 1s preview
                "x": float(cx),
                "y": float(cy),
                "ang": float(ang0),          # current angle (zal pas na warn draaien)
                "ang0": float(ang0),         # ✅ start-hoek voor preview lijn
                "dir": 1.0,
                "pause_until": 0,
            }


        elif name == "machinegun":
            machinegun_active = True
            mg_next = now

    def start_box_special(now):
        nonlocal box
        flash_boss(now, strong=True)
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        box = {
            "x": float(bx),
            "y": float(by),
            "vx": 0.0,
            "vy": 0.0,
            "bounces": 0,
            "size": 72,
            "hp": 3,
            "state": "dash",  # dash -> yellowbounce -> dash -> ...
            "yellow_until": 0,
            "touch_cd_until": 0,
        }

    def spawn_green_ball(now, x, y):
        nonlocal green_ball
        green_ball = {
            "x": float(x),
            "y": float(y),
            "vx": 0.0,
            "vy": 0.0,
            "r": 16,
            "spawn": now,
            "arm": now + 500,
            "despawn": now + 10000,
            "homing": False,
        }

    def boss_take_damage(now):
        nonlocal boss_hp, machinegun_active, phase_pause_until, phase_pending_setup, next_attack_time

        boss_hp -= 1
        if boss_hp <= 0:
            end_screen("win")
            return True

        # ✅ alles weg meteen
        reset_all_hazards()

        # ✅ 2 seconden pauze en dan pas nieuwe phase setup
        phase_pause_until = now + PHASE_PAUSE_MS
        phase_pending_setup = True
        next_attack_time = phase_pause_until  # scheduler pas na pauze

        machinegun_active = False
        return False

    # init first phase
    reset_all_hazards()
    now0 = pygame.time.get_ticks()
    setup_phase(now0)

    # ✅ START DELAY: eerste attacks pas na 2s
    next_attack_time = now0 + 2000


    # ============================================================
    # Main loop
    # ============================================================
    while True:
        dt_ms = clock.tick(60)
        step = dt_ms / 16.6667
        now = pygame.time.get_ticks()

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        mx, my = pygame.mouse.get_pos()
        mx = clamp(mx, 0, w - 1)
        my = clamp(my, 0, h - 1)

        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # lethal outside square
        if not inside_arena(mx, my):
            if die(now):
                return

        # boss touch lethal
        if boss_rect().collidepoint(mx, my):
            if die(now):
                return

        # ============================================================
        # Attack scheduler: start elke interval, overlap toegestaan
        #  - per fase: start 5/6/7/8 verschillende attacks
        #  - daarna: box special (en in laatste fase: machinegun als 8e)
        # ============================================================
        # --- phase restart after boss hit ---
        if phase_pending_setup and now >= phase_pause_until:
            setup_phase(now)
            next_attack_time = now          # ✅ meteen weer kunnen starten na 2s pauze
            phase_pending_setup = False

        lives_lost = boss_max_hp - boss_hp
        interval = attack_interval_base - lives_lost * 1000
        interval = max(12000, interval)

        # ============================================================
        # (A) ATTACK TRACK: start elke interval ALTIJD een attack
        #     - per cycle: zonder replacement
        #     - na laatste attack van cycle: zet next_box_time = now
        # ============================================================
        lives_lost = boss_max_hp - boss_hp
        if now >= next_attack_time and now >= phase_pause_until and (not phase_pending_setup) and not (lives_lost >= 3 and phase4_done):

            lives_lost = boss_max_hp - boss_hp

            # in phase 4 willen we machinegun NIET meer als "8e attack" tellen
            # cycles zijn dan 7 attacks (tornado..spinner)
            # fase 1-3: cycle_len = 5/6/7
            cycle_len = (5 + lives_lost) if lives_lost < 3 else 7


            # vul cycle_pool als hij leeg is
            if not cycle_pool:
                cycle_pool = ["tornado", "homing", "shrink", "bombs", "trail", "arcs", "spinner"]
                random.shuffle(cycle_pool)

            # start 1 attack uit de pool
            name = cycle_pool.pop(0)
            start_attack(name, now)

            # cycle bookkeeping
            cycle_pos += 1
            if cycle_pos >= cycle_len:
                cycle_pos = 0
                cycle_pool = []

                if lives_lost >= 3:
                    # fase4: na 7 attacks -> box mag 1x spawnen, daarna stoppen we attacks
                    phase4_box_armed = True
                    next_box_time = now
                    next_attack_time = 10**12  # stop attack scheduler tot boss hit of fase reset
                else:
                    # fase1-3: elke cycle -> box spawnen en daarna gewoon doorgaan met volgende cycle
                    next_box_time = now

            next_attack_time = now + interval


        # ============================================================
        # (B) BOX TRACK: spawnt zodra cycle klaar is (next_box_time gezet)
        # ============================================================
        lives_lost = boss_max_hp - boss_hp
        if box is None and green_ball is None and now >= next_box_time and now >= phase_pause_until:
            # fase4: alleen spawnen als hij "armed" is
            if lives_lost < 3 or phase4_box_armed:
                start_box_special(now)
                next_box_time = 10**12

                if lives_lost >= 3:
                    # ✅ box spawned -> machinegun permanent aan, en verder niks meer
                    phase4_done = True
                    machinegun_active = True
                    mg_next = now
                    mg_shot_ms = 90.0
                    mg_speedup_next = now + 10000


        # ============================================================
        # Update shrink attack (als actief)
        # ============================================================
        if shrink_attack is not None:
            if now >= shrink_attack["t_end"]:
                shrink_attack = None
                shrink.update({"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0})
            else:
                # 8 changes in 30s
                if now >= shrink_attack["next_evt"]:
                    shrink_attack["i"] += 1
                    shrink_attack["next_evt"] = shrink_attack["t0"] + int(shrink_attack["i"] * (30000 / 9))
                    shrink_attack["evt_side"] = random.choices(
                        ["L", "R", "T", "B"],
                        weights=[2, 2, 2, 2]  # ✅ veel vaker links/rechts
                    )[0]
                    # ✅ 1.0s warning / preview, animatie start pas daarna
                    shrink_attack["preview_side"] = shrink_attack["evt_side"]
                    shrink_attack["preview_amp"]  = shrink_attack["evt_amp"]
                    shrink_attack["warn_end"] = now + 1000
                    shrink_attack["evt_start"] = shrink_attack["warn_end"]
                    side_tmp = shrink_attack["evt_side"]
                    if side_tmp in ("L", "R"):
                        shrink_attack["evt_amp"] = float(random.randint(900, 901))  # ✅ verder horizontaal
                    else:
                        shrink_attack["evt_amp"] = float(random.randint(500, 501))   # ✅ minder verticaal


                side = shrink_attack["evt_side"]
                # ✅ tijdens preview: nog geen shrink (alleen indicatie tekenen in DRAW)
                if side is None or now < shrink_attack["warn_end"]:
                    shrink.update({"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0})
                else:
                    t = now - shrink_attack["evt_start"]

                    # anim duur afhankelijk van side: verticaal slomer
                    anim_ms = 3000.0 if side in ("T", "B") else 1300.0
                    u = t / anim_ms

                    if u < 0:
                        a = 0.0
                    elif u < 0.5:
                        a = (u / 0.5)
                    elif u < 1.0:
                        a = (1.0 - (u - 0.5) / 0.5)
                    else:
                        a = 0.0

                    shrink.update({"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0})
                    shrink[side] = shrink_attack["evt_amp"] * a


        # ============================================================
        # Update tornado + stones
        # ============================================================
        if tornado is not None:
            if now >= tornado["t_end"]:
                tornado = None
                stones.clear()
            else:
                tx, ty = tornado["x"], tornado["y"]
                R = tornado["R"]

                # pull mouse (alleen na warning)
                if now >= tornado["warn_end"]:
                    dx = tx - mx
                    dy = ty - my
                    mx2 = mx + dx * 0.012 * step
                    my2 = my + dy * 0.012 * step
                    mx2, my2 = project_inside(mx2, my2, margin=2.0)
                    pygame.mouse.set_pos((int(mx2), int(my2)))
                    mx, my = int(mx2), int(my2)

                    # lethal tornado
                    if (mx - tx) ** 2 + (my - ty) ** 2 <= (R * 0.95) ** 2:
                        if die(now):
                            return

                # spawn stones: 30 in 30s
                if tornado["spawned"] < 72 and now >= tornado["next_stone"]:
                    tornado["spawned"] += 1
                    tornado["next_stone"] = tornado["t0"] + int(tornado["spawned"] * (30000 / 60))

                    L, T, Rb, Bb = arena_bounds()
                    side = random.choice(["L", "R", "T", "B"])
                    if side == "L":
                        x = L - 140
                        y = random.uniform(T, Bb)
                    elif side == "R":
                        x = Rb + 140
                        y = random.uniform(T, Bb)
                    elif side == "T":
                        x = random.uniform(L, Rb)
                        y = T - 140
                    else:
                        x = random.uniform(L, Rb)
                        y = Bb + 140

                    stones.append({
                        "x": float(x),
                        "y": float(y),
                        "vx": 0.0,
                        "vy": 0.0,
                        "r": 40,
                    })

                # move stones (attraction)
                for s in stones[:]:
                    dx = tx - s["x"]
                    dy = ty - s["y"]
                    ndx, ndy = normalize(dx, dy)
                    s["vx"] += ndx * 0.20 * step
                    s["vy"] += ndy * 0.20 * step
                    # cap speed
                    sp = math.hypot(s["vx"], s["vy"])
                    if sp > 8.2:
                        s["vx"] *= 8.2 / sp
                        s["vy"] *= 8.2 / sp

                    s["x"] += s["vx"] * step
                    s["y"] += s["vy"] * step

                    # stone hits tornado -> vanish
                    if (s["x"] - tx) ** 2 + (s["y"] - ty) ** 2 <= (R * 1.00) ** 2:
                        stones.remove(s)
                        continue

                    # stone hits mouse -> die (alleen na warning; voor warning kan al, maar fair: ook na warning)
                    if now >= tornado["warn_end"]:
                        rr = s["r"]
                        if (mx - s["x"]) ** 2 + (my - s["y"]) ** 2 <= rr ** 2:
                            if die(now):
                                return

        # ============================================================
        # Update homing blocks (attack 2)
        # ============================================================
        if homers:
            ctrl = homers[0]

            # 1) spawn ONLY zolang de attack loopt
            if now < ctrl["t_end"]:
                while ctrl["spawned"] < 4 and now >= (ctrl["spawn_at"] + ctrl["spawned"] * 7500):
                    ctrl["spawned"] += 1
                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2
                    homers.append({
                        "x": float(bx),
                        "y": float(by),
                        "vx": 0.0,
                        "vy": 0.0,
                        "r": 16,
                        "t_spawn": now,
                        "home_until": now + 10000,
                        "state": "home",
                        "trail_until": 0,
                        "trail_start": (0.0, 0.0),
                        "trail_end": (0.0, 0.0),
                    })

            # 2) update heads ALWAYS (ook na t_end)
            for hb in homers[1:]:
                if hb["state"] == "home":
                    dx, dy = normalize(mx - hb["x"], my - hb["y"])
                    spd = 4.8
                    hb["vx"] = dx * spd
                    hb["vy"] = dy * spd
                    hb["x"] += hb["vx"] * step
                    hb["y"] += hb["vy"] * step

                    if (mx - hb["x"]) ** 2 + (my - hb["y"]) ** 2 <= (hb["r"] * 1.05) ** 2:
                        if die(now):
                            return

                    if now >= hb["home_until"]:
                        hb["state"] = "dash"
                        hb["trail_until"] = now + 10000
                        hb["trail_start"] = (hb["x"], hb["y"])
                        hb["trail_end"] = (hb["x"], hb["y"])

                else:  # dash
                    hb["x"] += hb["vx"] * step
                    hb["y"] += hb["vy"] * step
                    hb["trail_end"] = (hb["x"], hb["y"])

                    if now <= hb["trail_until"]:
                        ax, ay = hb["trail_start"]
                        bx2, by2 = hb["trail_end"]
                        if dist_point_to_segment(mx, my, ax, ay, bx2, by2) <= 8:
                            if die(now):
                                return

                    if (mx - hb["x"]) ** 2 + (my - hb["y"]) ** 2 <= (hb["r"] * 1.05) ** 2:
                        if die(now):
                            return

                    if out_of_bounds(hb["x"], hb["y"], pad=0):
                        ax, ay = hb["trail_start"]
                        bx2, by2 = hb["trail_end"]
                        homer_trails.append({
                            "ax": float(ax), "ay": float(ay),
                            "bx": float(bx2), "by": float(by2),
                            "until": now + 10000,
                            "th": 8,
                        })
                        hb["dead"] = True

            # 3) cleanup dead heads
            alive = [hb for hb in homers[1:] if not hb.get("dead", False)]
            if alive:
                homers[:] = [ctrl] + alive
            else:
                # als de tijd voorbij is en er zijn geen heads meer -> controller weg
                if now >= ctrl["t_end"]:
                    homers.clear()
                else:
                    homers[:] = [ctrl]


        # ============================================================
        # Update bombs (attack 4)  ✅ FIX: laat uitspelen na 30s
        # ============================================================
        BOMB_COUNT = 16         # jij wilt 12
        SHRAPNEL_COUNT = 16
        SHRAPNEL_SPEED = 8.4
        REDZONE_LIFE = 15000

        if bombs:
            ctrl = bombs[0]

            # 1) spawn ALLEEN zolang de attack-tijd loopt
            if now < ctrl["t_end"] and ctrl["spawned"] < BOMB_COUNT and now >= ctrl["next"]:
                ctrl["spawned"] += 1
                ctrl["next"] = ctrl["t0"] + int(ctrl["spawned"] * (30000 / BOMB_COUNT))

                tx, ty = float(mx), float(my)
                bombs.append({
                    "x": tx,
                    "y": ty,
                    "state": "telegraph",
                    "tele_end": now + 800,
                    "boom_at": now + 800 + 2000,
                    "r": 70,
                    "blink_t0": now + 800,
                })

            # 2) update bestaande bommen ALTIJD (ook na t_end)
            for bmb in bombs[1:]:
                if bmb["state"] == "telegraph":
                    if now >= bmb["tele_end"]:
                        bmb["state"] = "armed"

                elif bmb["state"] == "armed":
                    # bom zelf lethal zodra armed
                    if (mx - bmb["x"]) ** 2 + (my - bmb["y"]) ** 2 <= (bmb["r"] ** 2):
                        if die(now):
                            return

                    if now >= bmb["boom_at"]:
                        bmb["state"] = "done"

                        # ✅ SCHRAPNELS
                        for k in range(SHRAPNEL_COUNT):
                            ang = k * (2 * math.pi / SHRAPNEL_COUNT)
                            spikes.append({
                                "x": float(bmb["x"]),
                                "y": float(bmb["y"]),
                                "vx": math.cos(ang) * SHRAPNEL_SPEED,
                                "vy": math.sin(ang) * SHRAPNEL_SPEED,
                                "r": 12,
                            })

                        # ✅ RODE ZONE (lethal)
                        red_zones.append({
                            "x": float(bmb["x"]),
                            "y": float(bmb["y"]),
                            "r": float(bmb["r"]),
                            "until": now + REDZONE_LIFE,
                        })

            # cleanup: verwijder bommen die ontploft zijn
            bombs[:] = [bombs[0]] + [b for b in bombs[1:] if b.get("state") != "done"]

            # 3) controller pas opruimen als alles echt weg is
            if now >= ctrl["t_end"] and len(bombs) == 1 and len(spikes) == 0 and len(red_zones) == 0:
                bombs.clear()

        # ---- spikes update (moet OUTSIDE bombs-if blijven) ----
        for spk in spikes[:]:
            spk["x"] += spk["vx"] * step
            spk["y"] += spk["vy"] * step
            if out_of_bounds(spk["x"], spk["y"], pad=0):
                spikes.remove(spk)
                continue
            if (mx - spk["x"]) ** 2 + (my - spk["y"]) ** 2 <= (spk["r"] ** 2):
                if die(now):
                    return

        # ---- red zones update (moet OUTSIDE bombs-if blijven) ----
        for rz in red_zones[:]:
            if now >= rz["until"]:
                red_zones.remove(rz)
                continue
            if (mx - rz["x"]) ** 2 + (my - rz["y"]) ** 2 <= (rz["r"] ** 2):
                if die(now):
                    return


        # ============================================================
        # Update trail attack (attack 5): dots + line shots
        # ============================================================
        DOT_SPAWN_MS = 500   # 100=10/s, 200=5/s, 250=4/s, 333=3/s, 500=2/s
        LINE_SHOT_MS = 1000  # line shot interval

        # losse trails (van homing) blijven altijd doorlopen
        for tr in homer_trails[:]:
            if now >= tr["until"]:
                homer_trails.remove(tr)
                continue
            if dist_point_to_segment(mx, my, tr["ax"], tr["ay"], tr["bx"], tr["by"]) <= tr["th"] / 2:
                if die(now):
                    return

        if trail_dots:
            ctrl = trail_dots[0]

            # 1) spawn ALLEEN zolang de attack loopt (na 30s geen nieuwe, maar bestaande blijven)
            if now < ctrl["t_end"]:
                # dots
                if now >= ctrl["next_dot"]:
                    ctrl["next_dot"] = now + DOT_SPAWN_MS
                    trail_dots.append({
                        "x": float(mx),
                        "y": float(my),
                        "r": 14,
                        "gray_until": now + 500,          # 0.5s warning
                        "red_until":  now + 500 + 13000,  # daarna lethal
                    })

                # line shots
                if now >= ctrl["next_line"]:
                    ctrl["next_line"] = now + LINE_SHOT_MS
                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2
                    dx, dy = normalize(mx - bx, my - by)
                    ang = random.uniform(-0.20, 0.20)
                    ca, sa = math.cos(ang), math.sin(ang)
                    dx2 = dx * ca - dy * sa
                    dy2 = dx * sa + dy * ca
                    line_shots.append({
                        "x": float(bx),
                        "y": float(by),
                        "dx": float(dx2),
                        "dy": float(dy2),
                        "spd": 10.0,
                        "len": 180.0,
                        "th": 10.0,
                    })

            # 2) update dots ALTIJD (ook na t_end)
            for d in trail_dots[1:]:
                if now <= d["gray_until"]:
                    continue
                if now <= d["red_until"]:
                    if (mx - d["x"]) ** 2 + (my - d["y"]) ** 2 <= (d["r"] ** 2):
                        if die(now):
                            return
                else:
                    d["dead"] = True

            # cleanup dots, controller behouden
            trail_dots[:] = [ctrl] + [d for d in trail_dots[1:] if not d.get("dead", False)]

            # 3) update line shots ALTIJD (ook na t_end)
            for ls in line_shots[:]:
                ls["x"] += ls["dx"] * ls["spd"] * step
                ls["y"] += ls["dy"] * ls["spd"] * step

                ex1 = ls["x"] - ls["dx"] * (ls["len"] / 2)
                ey1 = ls["y"] - ls["dy"] * (ls["len"] / 2)
                ex2 = ls["x"] + ls["dx"] * (ls["len"] / 2)
                ey2 = ls["y"] + ls["dy"] * (ls["len"] / 2)

                if out_of_bounds(ex1, ey1, pad=20) and out_of_bounds(ex2, ey2, pad=20):
                    line_shots.remove(ls)
                    continue

                if dist_point_to_segment(mx, my, ex1, ey1, ex2, ey2) <= ls["th"] / 2:
                    if die(now):
                        return

            # 4) controller opruimen pas als attack voorbij is én alles echt weg is
            if now >= ctrl["t_end"] and len(trail_dots) == 1 and len(line_shots) == 0:
                trail_dots.clear()


        # ============================================================
        # Update arcs + ice spikes (attack 6)
        # ============================================================
        if arcs:
            ctrl = arcs[0]

            # 1) spawn alleen zolang de attack-tijd loopt
            if now < ctrl["t_end"]:
                # ---- ARC SPAWN ----
                if now >= ctrl["next_arc"]:
                    ctrl["next_arc"] = now + 800  # spawn tempo

                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2

                    # richting van arc movement (projectiel richting naar muis)
                    dx, dy = normalize(mx - bx, my - by)

                    R = 80
                    th = 10
                    span = 0.60

                    # ✅ arc segment wijst naar de muis-hoek (boven = pi/2 etc.)
                    heading = math.atan2(-(my - by), (mx - bx))
                    a0 = heading - span / 2
                    a1 = heading + span / 2

                    ARC_SPD = 8.0
                    arcs.append({
                        "x": float(bx),
                        "y": float(by),
                        "vx": dx * ARC_SPD,
                        "vy": dy * ARC_SPD,
                        "R": float(R),
                        "th": float(th),
                        "a0": float(a0),
                        "a1": float(a1),
                    })

                # ---- ICE SPIKES SPAWN ----
                ICE_COUNT = 25
                if ctrl["ice_done"] < ICE_COUNT and now >= ctrl["next_ice"]:
                    ctrl["ice_done"] += 1
                    ctrl["next_ice"] = ctrl["t0"] + int(ctrl["ice_done"] * (30000 / ICE_COUNT))

                    L, T, Rb, Bb = arena_bounds()

                    dL = abs(mx - L)
                    dR = abs(Rb - mx)
                    dT = abs(my - T)
                    dB = abs(Bb - my)
                    side = min([("L", dL), ("R", dR), ("T", dT), ("B", dB)], key=lambda z: z[1])[0]

                    if side == "L":
                        x0 = L
                        y0 = clamp(my, T + 30, Bb - 30)
                        nx, ny = 1.0, 0.0
                    elif side == "R":
                        x0 = Rb
                        y0 = clamp(my, T + 30, Bb - 30)
                        nx, ny = -1.0, 0.0
                    elif side == "T":
                        x0 = clamp(mx, L + 30, Rb - 30)
                        y0 = T
                        nx, ny = 0.0, 1.0
                    else:  # "B"
                        x0 = clamp(mx, L + 30, Rb - 30)
                        y0 = Bb
                        nx, ny = 0.0, -1.0

                    ice_spikes.append({
                        "t0": now,                 # spawn moment (telegraph start)
                        "rise_start": now + 250,    # ✅ 0.25s indicator
                        "side": side,
                        "x0": float(x0),
                        "y0": float(y0),
                        "nx": float(nx),
                        "ny": float(ny),
                        "len_max": 640.0,
                        "th": 38.0,
                        "life": 2200,              # animatie NA rise_start
                    })

            # 2) arcs bewegen/killen altijd door (ook na t_end)
            for a in arcs[1:]:
                a["x"] += a["vx"] * step
                a["y"] += a["vy"] * step

                if out_of_bounds(a["x"], a["y"], pad=0):
                    a["dead"] = True
                    continue

                dxm = mx - a["x"]
                dym = my - a["y"]
                dist = math.hypot(dxm, dym)

                if abs(dist - a["R"]) <= a["th"] / 2:
                    angm = math.atan2(-(my - a["y"]), (mx - a["x"]))  # of: angm = math.atan2(-dym, dxm)
                    if angle_in_range(angm, a["a0"], a["a1"]):
                        if die(now):
                            return

            arcs[:] = [arcs[0]] + [a for a in arcs[1:] if not a.get("dead", False)]

            # 3) spikes lopen ook door en verdwijnen vanzelf
            for sp in ice_spikes[:]:
                if now < sp["rise_start"]:
                    continue  # ✅ nog geen damage tijdens indicator

                t = now - sp["rise_start"]
                if t >= sp["life"]:
                    ice_spikes.remove(sp)
                    continue

                u = t / sp["life"]
                if u < 0.5:
                    Lcur = sp["len_max"] * (u / 0.5)
                else:
                    Lcur = sp["len_max"] * (1.0 - (u - 0.5) / 0.5)

                ax, ay = sp["x0"], sp["y0"]
                bx2 = ax + sp["nx"] * Lcur
                by2 = ay + sp["ny"] * Lcur

                if dist_point_to_segment(mx, my, ax, ay, bx2, by2) <= sp["th"] / 2:
                    if die(now):
                        return

        # ============================================================
        # Update spinner (attack 7)
        # ============================================================
        if spinner is not None:
            if now >= spinner["t_end"]:
                spinner = None
            else:
                if now < spinner["warn_end"]:
                    # ✅ 1s warning: NIET draaien, NIET lethal (alleen preview in draw)
                    pass
                else:
                    # direction switches at 10s and 20s with a pause
                    rel = now - spinner["t0"]
                    if abs(rel - 10000) < 30 or abs(rel - 20000) < 30:
                        spinner["dir"] *= -1.0
                        spinner["pause_until"] = now + 400

                    if now >= spinner["pause_until"]:
                        spinner["ang"] += spinner["dir"] * 0.023 * step

                    # lethal rotating line
                    ang = spinner["ang"]
                    dx, dy = math.cos(ang), math.sin(ang)
                    x0, y0 = spinner["x"], spinner["y"]
                    p1 = (x0 - dx * 4000, y0 - dy * 4000)
                    p2 = (x0 + dx * 4000, y0 + dy * 4000)
                    if dist_point_to_segment(mx, my, p1[0], p1[1], p2[0], p2[1]) <= 10:
                        if die(now):
                            return


        # ============================================================
        # Machinegun (attack 8, laatste fase)
        # ============================================================
        if machinegun_active:
            # ✅ elke 10s 2% sneller (kleinere interval)
            if now >= mg_speedup_next:
                mg_speedup_next = now + 10000
                mg_shot_ms *= 0.98
                if mg_shot_ms < 25:   # safety cap
                    mg_shot_ms = 25

            if now >= mg_next:
                mg_next = now + int(mg_shot_ms)
                bx = boss_x + boss_size / 2
                by = boss_y + boss_size / 2
                dx, dy = normalize(mx - bx, my - by)
                ang = random.uniform(-0.10, 0.10)
                ca, sa = math.cos(ang), math.sin(ang)
                dx2 = dx * ca - dy * sa
                dy2 = dx * sa + dy * ca
                mg_bullets.append({
                    "x": float(bx),
                    "y": float(by),
                    "vx": dx2 * 12.5,
                    "vy": dy2 * 12.5,
                    "r": 12,
                })


        for b in mg_bullets[:]:
            b["x"] += b["vx"] * step
            b["y"] += b["vy"] * step
            if out_of_bounds(b["x"], b["y"], pad=0):
                mg_bullets.remove(b)
                continue
            if (mx - b["x"]) ** 2 + (my - b["y"]) ** 2 <= (b["r"] ** 2):
                if die(now):
                    return

        # ============================================================
        # Box special + green ball
        # ============================================================
        if box is not None:
            # box moves always
            if box["state"] == "dash":
                # re-aim at start of dash (if no velocity)
                if abs(box["vx"]) < 1e-6 and abs(box["vy"]) < 1e-6:
                    dx, dy = normalize(mx - box["x"], my - box["y"])
                    spd = 12.0
                    box["vx"], box["vy"] = dx * spd, dy * spd

                box["x"] += box["vx"] * step
                box["y"] += box["vy"] * step

                if out_of_bounds(box["x"], box["y"], pad=0):
                    box["x"], box["y"] = project_inside(box["x"], box["y"], margin=1.0)
                    apply_square_bounce_box(box)

                    box["bounces"] += 1

                    # ✅ pas na 5 kaatses wordt hij geel/hittable
                    if box["bounces"] >= 5:
                        box["state"] = "yellow"
                        box["yellow_until"] = now + 5000
                        box["touch_cd_until"] = 0

            else:  # yellow
                # keep moving + bounce
                # als geel klaar is -> terug naar dash, opnieuw 5 bounces nodig
                if now >= box["yellow_until"]:
                    box["state"] = "dash"
                    box["yellow_until"] = 0
                    box["vx"] = 0.0
                    box["vy"] = 0.0
                    box["bounces"] = 0   # ✅ opnieuw 5 bounces nodig

                box["x"] += box["vx"] * step
                box["y"] += box["vy"] * step
                apply_square_bounce_box(box)

                # touching reduces hp -> DIRECT terug naar dash + 0.5s invuln voor muis
                half = box["size"] / 2
                rect = pygame.Rect(int(box["x"] - half), int(box["y"] - half), int(box["size"]), int(box["size"]))

                if now >= box["touch_cd_until"]:
                    hit_rect = rect.inflate(18, 18)
                    if hit_rect.collidepoint(mx, my):
                        box["hp"] -= 1
                        box["touch_cd_until"] = now + 200

                        # ✅ muis 0.5s niet te hitten
                        invuln_until = max(invuln_until, now + 500)

                        # ✅ direct uit geel: terug naar dash en opnieuw aimen
                        box["state"] = "dash"
                        box["bounces"] = 0   # ✅ reset zodat hij weer 5x moet bouncen
                        box["yellow_until"] = 0
                        box["vx"] = 0.0
                        box["vy"] = 0.0

                        flash_boss(now, strong=True)

                        if box["hp"] <= 0:
                            gx, gy = box["x"], box["y"]
                            box = None
                            spawn_green_ball(now, gx, gy)
                        # belangrijk: niet ook nog yellow-timer checken deze frame
                        # (dus gewoon door naar volgende update)


        # Green ball update
        if green_ball is not None:
            if now >= green_ball["despawn"]:
                green_ball = None
                next_box_time = now + 2500
            else:
                green_ball["x"] += green_ball["vx"] * step
                green_ball["y"] += green_ball["vy"] * step
                # ✅ lichte homing naar boss (alleen NA muis-touch)
                if green_ball.get("homing", False):
                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2

                    dx, dy = normalize(bx - green_ball["x"], by - green_ball["y"])

                    HOMING = 0.18
                    green_ball["vx"] += dx * HOMING * step
                    green_ball["vy"] += dy * HOMING * step

                # cap speed zodat hij niet insane wordt
                MAX_SPD = 12.5
                sp = math.hypot(green_ball["vx"], green_ball["vy"])
                if sp > MAX_SPD:
                    green_ball["vx"] *= MAX_SPD / sp
                    green_ball["vy"] *= MAX_SPD / sp

                # despawn on wall hit
                if out_of_bounds(green_ball["x"], green_ball["y"], pad=0):
                    green_ball = None
                    next_box_time = now + 2500
                else:
                    # kick by mouse (after arm)
                    if now >= green_ball["arm"]:
                        rr = green_ball["r"]
                        if (mx - green_ball["x"]) ** 2 + (my - green_ball["y"]) ** 2 <= (rr + 6) ** 2:
                            dx, dy = normalize(green_ball["x"] - mx, green_ball["y"] - my)
                            spd = 10.2
                            green_ball["vx"] = dx * spd
                            green_ball["vy"] = dy * spd
                            green_ball["homing"] = True   # ✅ NIEUW: vanaf nu homing

                    # hit boss -> damage
                    br = boss_rect()
                    if br.collidepoint(int(green_ball["x"]), int(green_ball["y"])):
                        green_ball = None
                        if boss_take_damage(now):
                            return

        # ============================================================
        # DRAW
        # ============================================================
        screen.fill((255, 0, 0))  # lethal background

        L, T, Rb, Bb = arena_bounds()
        arena_rect = pygame.Rect(int(L), int(T), int(Rb - L), int(Bb - T))
        pygame.draw.rect(screen, (0, 0, 255), arena_rect)
        pygame.draw.rect(screen, (0, 0, 0), arena_rect, 4)

        # ✅ shrink preview: alleen de muur highlighten (1.0s)
        if (
            shrink_attack is not None
            and shrink_attack.get("preview_side") is not None
            and now < shrink_attack.get("warn_end", 0)
        ):
            side = shrink_attack["preview_side"]

            # blink effect (mooi/duidelijk)
            blink = ((now // 120) % 2) == 0
            col = (255, 255, 0) if blink else (200, 200, 0)

            # teken net BINNEN de arena zodat je zwarte outline zichtbaar blijft
            L, T, Rb, Bb = arena_bounds()
            inset = 3
            thick = 10

            if side == "L":
                x = int(L) + inset
                pygame.draw.line(screen, col, (x, int(T) + inset), (x, int(Bb) - inset), thick)
            elif side == "R":
                x = int(Rb) - inset
                pygame.draw.line(screen, col, (x, int(T) + inset), (x, int(Bb) - inset), thick)
            elif side == "T":
                y = int(T) + inset
                pygame.draw.line(screen, col, (int(L) + inset, y), (int(Rb) - inset, y), thick)
            else:  # "B"
                y = int(Bb) - inset
                pygame.draw.line(screen, col, (int(L) + inset, y), (int(Rb) - inset, y), thick)

        # boss
        draw_boss(now)

        # tornado draw
        if tornado is not None:
            tx, ty = tornado["x"], tornado["y"]
            R = tornado["R"]

            if now < tornado["warn_end"]:
                # ✅ 1s warning: grijs blokje ZONDER foto
                pygame.draw.circle(screen, (170, 170, 170), (int(tx), int(ty)), int(R))
                pygame.draw.circle(screen, (0, 0, 0), (int(tx), int(ty)), int(R), 4)
            else:
                # actief: face circle + jitter
                jitter = random.randint(-3, 3)
                face = get_face_in_shape("circle", 2 * int(R))
                screen.blit(face, (int(tx - R + jitter), int(ty - R + jitter)))
                pygame.draw.circle(screen, (0, 0, 0), (int(tx + jitter), int(ty + jitter)), int(R), 4)


        # stones draw
        for s in stones:
            rr = int(s["r"])
            face = get_face_in_shape("circle", 2 * rr)
            screen.blit(face, (int(s["x"] - rr), int(s["y"] - rr)))
            pygame.draw.circle(screen, (0, 0, 0), (int(s["x"]), int(s["y"])), rr, 3)

        # homing blocks + trails draw
        for hb in homers[1:]:
            rr = hb["r"]
            face = get_face_in_shape("square", 2 * rr)
            screen.blit(face, (int(hb["x"] - rr), int(hb["y"] - rr)))
            pygame.draw.rect(screen, (0, 0, 0), pygame.Rect(int(hb["x"] - rr), int(hb["y"] - rr), 2 * rr, 2 * rr), 2, border_radius=4)

            if hb["state"] == "dash" and now <= hb["trail_until"]:
                ax, ay = hb["trail_start"]
                bx2, by2 = hb["trail_end"]
                pygame.draw.line(screen, (255, 0, 0), (int(ax), int(ay)), (int(bx2), int(by2)), 6)

        # losse trails tekenen
        for tr in homer_trails:
            pygame.draw.line(screen, (255, 0, 0), (int(tr["ax"]), int(tr["ay"])), (int(tr["bx"]), int(tr["by"])), 6)


        # bombs draw
        for bmb in bombs[1:]:
            if bmb["state"] == "telegraph":
                pygame.draw.circle(screen, (170, 170, 170), (int(bmb["x"]), int(bmb["y"])), int(bmb["r"]))
            else:
                # blinking bomb
                blink = ((now - bmb["blink_t0"]) // 150) % 2 == 0
                rr = int(bmb["r"])  # zelfde als rode zone radius
                face = get_face_in_shape("circle", 2 * rr)
                screen.blit(face, (int(bmb["x"] - rr), int(bmb["y"] - rr)))
                pygame.draw.circle(screen, (255, 0, 0) if blink else (0, 0, 0), (int(bmb["x"]), int(bmb["y"])), rr, 4)

        # spikes draw
        for spk in spikes:
            rr = int(spk["r"])
            face = get_face_in_shape("circle", 2 * rr)
            screen.blit(face, (int(spk["x"] - rr), int(spk["y"] - rr)))
            pygame.draw.circle(screen, (0, 0, 0), (int(spk["x"]), int(spk["y"])), rr, 2)

        # red zones draw
        for rz in red_zones:
            pygame.draw.circle(screen, (255, 0, 0), (int(rz["x"]), int(rz["y"])), int(rz["r"]), 0)
            pygame.draw.circle(screen, (0, 0, 0), (int(rz["x"]), int(rz["y"])), int(rz["r"]), 2)

        # trail dots draw
        for d in trail_dots[1:]:
            if now <= d["gray_until"]:
                pygame.draw.circle(screen, (170, 170, 170), (int(d["x"]), int(d["y"])), int(d["r"]))
            elif now <= d["red_until"]:
                pygame.draw.circle(screen, (255, 0, 0), (int(d["x"]), int(d["y"])), int(d["r"]))
                pygame.draw.circle(screen, (0, 0, 0), (int(d["x"]), int(d["y"])), int(d["r"]), 2)

        # line shots draw
        for ls in line_shots:
            ex1 = ls["x"] - ls["dx"] * (ls["len"] / 2)
            ey1 = ls["y"] - ls["dy"] * (ls["len"] / 2)
            ex2 = ls["x"] + ls["dx"] * (ls["len"] / 2)
            ey2 = ls["y"] + ls["dy"] * (ls["len"] / 2)
            pygame.draw.line(screen, (255, 0, 0), (int(ex1), int(ey1)), (int(ex2), int(ey2)), int(ls["th"]))

        # arcs draw (upper arc of circle)
        # arcs draw (teken ALLEEN het rode boog-segment, met wrap-fix)
        for a in arcs[1:]:
            R = int(a["R"])
            rect = pygame.Rect(int(a["x"] - R), int(a["y"] - R), 2 * R, 2 * R)

            a0 = a["a0"] % (2 * math.pi)
            a1 = a["a1"] % (2 * math.pi)

            if a1 >= a0:
                pygame.draw.arc(screen, (255, 0, 0), rect, a0, a1, int(a["th"]))
                pygame.draw.arc(screen, (0, 0, 0), rect, a0, a1, 2)
            else:
                # wrap-around: teken [a0..2pi] en [0..a1]
                pygame.draw.arc(screen, (255, 0, 0), rect, a0, 2 * math.pi, int(a["th"]))
                pygame.draw.arc(screen, (255, 0, 0), rect, 0, a1, int(a["th"]))
                pygame.draw.arc(screen, (0, 0, 0), rect, a0, 2 * math.pi, 2)
                pygame.draw.arc(screen, (0, 0, 0), rect, 0, a1, 2)


        for sp in ice_spikes:
            ax, ay = sp["x0"], sp["y0"]

            if now < sp["rise_start"]:
                # ✅ 0.25s indicator: klein stukje waar hij omhoog komt
                tipx = ax + sp["nx"] * 60
                tipy = ay + sp["ny"] * 60
                pygame.draw.line(screen, (170, 170, 170), (int(ax), int(ay)), (int(tipx), int(tipy)), int(sp["th"]))
                continue

            t = now - sp["rise_start"]
            u = t / sp["life"]
            if u < 0:
                continue
            if u < 0.5:
                Lcur = sp["len_max"] * (u / 0.5)
            else:
                Lcur = sp["len_max"] * (1.0 - (u - 0.5) / 0.5)

            bx2 = ax + sp["nx"] * Lcur
            by2 = ay + sp["ny"] * Lcur
            pygame.draw.line(screen, (255, 0, 0), (int(ax), int(ay)), (int(bx2), int(by2)), int(sp["th"]))


        # spinner draw
        if spinner is not None:
            x0, y0 = spinner["x"], spinner["y"]
            size = 64
            rect = pygame.Rect(int(x0 - size / 2), int(y0 - size / 2), size, size)
            if now < spinner["warn_end"]:
                # grijs blokje
                pygame.draw.rect(screen, (170, 170, 170), rect, border_radius=8)

                # ✅ grijze preview lijn op beginhoek (niet lethal)
                ang = spinner.get("ang0", spinner["ang"])
                dx, dy = math.cos(ang), math.sin(ang)
                p1 = (x0 - dx * 4000, y0 - dy * 4000)
                p2 = (x0 + dx * 4000, y0 + dy * 4000)
                pygame.draw.line(screen, (170, 170, 170), (int(p1[0]), int(p1[1])), (int(p2[0]), int(p2[1])), 8)
            else:
                face = get_face_in_shape("square", size)
                screen.blit(face, rect.topleft)
                pygame.draw.rect(screen, (0, 0, 0), rect, 3, border_radius=8)

                ang = spinner["ang"]
                dx, dy = math.cos(ang), math.sin(ang)
                p1 = (x0 - dx * 4000, y0 - dy * 4000)
                p2 = (x0 + dx * 4000, y0 + dy * 4000)
                pygame.draw.line(screen, (255, 0, 0), (int(p1[0]), int(p1[1])), (int(p2[0]), int(p2[1])), 8)

        # machinegun bullets draw
        for b in mg_bullets:
            rr = int(b["r"])
            face = get_face_in_shape("circle", 2 * rr)
            screen.blit(face, (int(b["x"] - rr), int(b["y"] - rr)))
            pygame.draw.circle(screen, (0, 0, 0), (int(b["x"]), int(b["y"])), rr, 2)

        # box draw
        if box is not None:
            half = box["size"] / 2
            rect = pygame.Rect(int(box["x"] - half), int(box["y"] - half), int(box["size"]), int(box["size"]))
            face = get_face_in_shape("square", int(box["size"]))
            screen.blit(face, rect.topleft)
            if box["state"] == "yellow":
                blink = ((now // 120) % 2) == 0
                pygame.draw.rect(screen, (255, 255, 0) if blink else (200, 200, 0), rect, 4, border_radius=6)
            else:
                pygame.draw.rect(screen, (0, 0, 0), rect, 3, border_radius=6)

        # green ball draw
        if green_ball is not None:
            rr = green_ball["r"]
            face = get_face_in_shape("circle", 2 * rr)
            screen.blit(face, (int(green_ball["x"] - rr), int(green_ball["y"] - rr)))
            blink = False
            if now >= green_ball["spawn"] + 15000:
                blink = ((now // 140) % 2) == 0
            col = (0, 255, 0) if (now >= green_ball["arm"]) else (170, 170, 170)
            if blink:
                col = (0, 200, 0)
            pygame.draw.circle(screen, col, (int(green_ball["x"]), int(green_ball["y"])), rr, 4)

        # shield
        draw_shield_pickup()
        draw_shield_indicator()

        # UI
        draw_boss_ui()

        pygame.display.flip()







