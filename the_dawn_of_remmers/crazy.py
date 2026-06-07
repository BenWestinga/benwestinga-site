import asyncio
# crazy.py
import pygame
import random
import math
from pathlib import Path
import game_settings


async def bossfight_crazy(screen, start_stage=1, arcade_hp_one=False, arcade_no_endscreen=False):
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
            msg = "Drug addict is defeated" if result == "win" else "You were defeated by Drug addict"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 55)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return
            clock.tick(60)

    # ============================================================
    # Load crazy face
    # ============================================================
    try:
        raw_face = pygame.image.load(str(Path(__file__).resolve().with_name("crazy.png"))).convert_alpha()
    except Exception:
        raw_face = pygame.Surface((120, 120), pygame.SRCALPHA)
        raw_face.fill((180, 180, 180))
        pygame.draw.rect(raw_face, (0, 0, 0), raw_face.get_rect(), 3)

    # ============================================================
    # Arena = OVAAL (blauw binnen, rood buiten = lethal)
    # ============================================================
    cx = w // 2
    cy = h // 2 + 10

    BASE_A = min(770, int(w * 0.40))   # horizontale radius
    BASE_B = min(510, int(h * 0.40))   # verticale radius

    def arena_radii():
        return float(BASE_A), float(BASE_B)

    def inside_arena(x, y):
        a, b = arena_radii()
        dx = (x - cx)
        dy = (y - cy)
        return (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1.0

    def project_inside(x, y, margin=0.999):
        a, b = arena_radii()
        dx = x - cx
        dy = y - cy
        denom = (dx * dx) / (a * a) + (dy * dy) / (b * b)
        if denom <= 1.0:
            return x, y
        s = (margin / math.sqrt(denom))
        return cx + dx * s, cy + dy * s

    def ellipse_normal(x, y):
        a, b = arena_radii()
        dx = x - cx
        dy = y - cy
        nx = dx / (a * a)
        ny = dy / (b * b)
        return normalize(nx, ny)

    def reflect_velocity(vx, vy, nx, ny):
        dot = vx * nx + vy * ny
        return vx - 2.0 * dot * nx, vy - 2.0 * dot * ny

    def apply_ellipse_bounce(obj):
        # obj: dict met x,y,vx,vy
        if inside_arena(obj["x"], obj["y"]):
            return False
        obj["x"], obj["y"] = project_inside(obj["x"], obj["y"])
        nx, ny = ellipse_normal(obj["x"], obj["y"])
        obj["vx"], obj["vy"] = reflect_velocity(obj["vx"], obj["vy"], nx, ny)
        return True

    # ============================================================
    # Shield pickup
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
            sx = random.randint(cx - int(BASE_A * 0.6), cx + int(BASE_A * 0.6))
            sy = random.randint(cy - int(BASE_B * 0.6), cy + int(BASE_B * 0.6))
            sx, sy = project_inside(sx, sy)
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
            await end_screen("lose")
            return True
        return False

    # ============================================================
    # Boss crazy
    # ============================================================
    boss_name = "Drug addict"
    boss_hp = 15
    boss_max_hp = 15
    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(boss_max_hp, start_stage))
    boss_hp = max(1, boss_max_hp - (start_stage - 1))

    boss_size = 110
    boss_img = pygame.transform.smoothscale(raw_face, (boss_size, boss_size))

    boss_anchor_idx = 0  # 0=top,1=right,2=bottom,3=left
    boss_move_next = pygame.time.get_ticks() + 30000
    boss_move_from = None
    boss_move_to = None
    boss_move_start = 0
    boss_move_end = 0

    def anchor_pos(idx):
        a, b = arena_radii()
        margin = 18
        if idx == 0:  # top
            x = cx - boss_size / 2
            y = (cy - b) + margin
        elif idx == 1:  # right
            x = (cx + a) - boss_size - margin
            y = cy - boss_size / 2
        elif idx == 2:  # bottom
            x = cx - boss_size / 2
            y = (cy + b) - boss_size - margin
        else:  # left
            x = (cx - a) + margin
            y = cy - boss_size / 2
        return float(x), float(y)

    boss_x, boss_y = anchor_pos(0)

    def start_boss_move(now, new_idx):
        nonlocal boss_move_from, boss_move_to, boss_move_start, boss_move_end, boss_anchor_idx
        boss_anchor_idx = new_idx
        boss_move_from = (boss_x, boss_y)
        boss_move_to = anchor_pos(new_idx)
        boss_move_start = now
        boss_move_end = now + 1000  # 1s smooth

    def update_boss_move(now):
        nonlocal boss_x, boss_y, boss_move_from, boss_move_to
        if boss_move_from is None:
            return
        if now >= boss_move_end:
            boss_x, boss_y = boss_move_to
            boss_move_from = None
            boss_move_to = None
            return
        t = (now - boss_move_start) / max(1, (boss_move_end - boss_move_start))
        sx, sy = boss_move_from
        tx, ty = boss_move_to
        boss_x = sx + (tx - sx) * t
        boss_y = sy + (ty - sy) * t

    # ============================================================
    # Face-in-circle cache (voor orbit balls)
    # ============================================================
    face_circle_cache = {}  # radius -> Surface

    def blit_face_in_circle(x, y, rr):
        rr = int(rr)
        if rr <= 2:
            return
        if rr not in face_circle_cache:
            size = rr * 2
            img = pygame.transform.smoothscale(raw_face, (size, size))
            surf = pygame.Surface((size, size), pygame.SRCALPHA)

            # circle mask
            mask = pygame.Surface((size, size), pygame.SRCALPHA)
            mask.fill((0, 0, 0, 0))
            pygame.draw.circle(mask, (255, 255, 255, 255), (size // 2, size // 2), rr)

            surf.blit(img, (0, 0))
            surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
            face_circle_cache[rr] = surf

        s = face_circle_cache[rr]
        screen.blit(s, (int(x - s.get_width() / 2), int(y - s.get_height() / 2)))
    
    # ============================================================
    # Face-in-shape cache (circle/square/triangle/donut)
    # ============================================================
    face_shape_cache = {}  # (shape, size, extra) -> Surface

    def get_face_in_shape(shape: str, size: int, extra=None):
        """
        shape: 'circle', 'square', 'triangle', 'donut'
        size: diameter (circle) or width/height (square/triangle)
        extra: for donut -> (outerR, innerR)
        """
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
            # fallback
            pygame.draw.rect(mask, (255, 255, 255, 255), (0, 0, S, S))

        surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
        face_shape_cache[key] = surf
        return surf


    # ============================================================
    # Hazards
    # ============================================================
    shots = []         # figure projectiles
    rings = []         # infinite bounce rings
    waves = []         # wave hazards
    walls = []         # moving walls
    orbit_systems = [] # orbit systems

    # Orbit constants
    ORBIT_CORE_R = 24
    ORBIT_SAT_R = 14
    ORBIT_RADIUS = 200          # grote radius
    ORBIT_OMEGA = 0.03        # rad per frame @60fps
    ORBIT_SPD = 7.2            # core speed richting muis

    # ============================================================
    # Boss damage -> spawn ring
    # ============================================================
    def spawn_ring(now, mx, my, boss_draw_x, boss_draw_y):
        ox = boss_draw_x + boss_size / 2
        oy = boss_draw_y + boss_size / 2
        dx, dy = normalize(mx - ox, my - oy)
        spd = 2.2
        rings.append({
            "x": float(ox),
            "y": float(oy),
            "vx": float(dx * spd),
            "vy": float(dy * spd),
            "R": 34,
            "th": 7
        })

    def boss_take_damage(now, mx, my, boss_draw_x, boss_draw_y):
        nonlocal boss_hp
        if arcade_hp_one:
            boss_hp = 0
        else:
            boss_hp -= 1
        spawn_ring(now, mx, my, boss_draw_x, boss_draw_y)
        if boss_hp <= 0:
            await end_screen("win")
            return True
        return False

    # ============================================================
    # Attacks schedule
    # ============================================================
    current_attack = None
    attack_gap_until = pygame.time.get_ticks() + 1200
    pending_attacks = []

    def gap_ms_for_hp(hp):
        return 3000 if hp >= 13 else 2000

    def plan_for_hp(hp):
        if hp >= 13:
            return ["figures"]
        if hp >= 10:
            return ["orbit", "figures"]
        if hp >= 7:
            return [random.choice(["laser", "orbit"]), "figures"]
        if hp >= 4:
            a, b = random.sample(["wave", "laser", "orbit"], 2)
            return [a, b, "figures"]
        if hp >= 1:
            a, b = random.sample(["wall", "wave", "laser", "orbit"], 2)
            return [a, b, "figures"]
        return []

    # ============================================================
    # Attack: FIGURES
    # ============================================================
    FIG_SHOTS = 20
    fig_left = 0
    fig_next_shot = 0
    fig_end_when_fired = 0
    special_index = 0
    fig_active = False

    def start_figures(now):
        nonlocal current_attack, fig_left, fig_next_shot, special_index, fig_active, fig_end_when_fired
        current_attack = "figures"
        fig_left = FIG_SHOTS
        fig_next_shot = now
        fig_active = True
        fig_end_when_fired = 0
        special_index = random.randrange(FIG_SHOTS)

    def rotate_vec(dx, dy, ang):
        ca = math.cos(ang)
        sa = math.sin(ang)
        return dx * ca - dy * sa, dx * sa + dy * ca

    def spawn_shape_shot(now, mx, my, boss_draw_x, boss_draw_y):
        ox = boss_draw_x + boss_size / 2
        oy = boss_draw_y + boss_size / 2

        dx, dy = normalize(mx - ox, my - oy)
        ang = random.uniform(-0.35, 0.35)  # ~20 graden spread
        dx, dy = rotate_vec(dx, dy, ang)

        spd = random.uniform(4.5, 6.5)
        vx = dx * spd
        vy = dy * spd

        kind = random.choice(["square", "circle", "triangle"])
        idx = FIG_SHOTS - fig_left
        is_special = (idx == special_index)

        shots.append({
            "x": float(ox),
            "y": float(oy),
            "vx": float(vx),
            "vy": float(vy),
            "r": 14,
            "kind": kind,
            "phase": "yellow" if is_special else "normal",
            "b": 0,
            "bmax": 3 if is_special else 3,     # normal = 2 bounces
            "green_b": 0,
            "green_bmax": 2,
        })


    # ============================================================
    # Attack: ORBIT (10s, 5 spawns)
    # ============================================================
    orbit_end = 0
    orbit_next = 0
    orbit_fired = 0

    def start_orbit(now):
        nonlocal current_attack, orbit_end, orbit_next, orbit_fired
        current_attack = "orbit"
        orbit_end = now + 10000
        orbit_next = now
        orbit_fired = 0

    def spawn_orbit_system(mx, my, boss_draw_x, boss_draw_y):
        ox = boss_draw_x + boss_size / 2
        oy = boss_draw_y + boss_size / 2
        dx, dy = normalize(mx - ox, my - oy)

        orbit_systems.append({
            "x": float(ox),
            "y": float(oy),
            "vx": float(dx * ORBIT_SPD),
            "vy": float(dy * ORBIT_SPD),
            "theta": random.uniform(0.0, 2.0 * math.pi),
        })

    # ============================================================
    # Attack: LASER (3 shots)
    # ============================================================
    laser_state = "idle"
    laser_shot_i = 0
    laser_phase_until = 0
    laser_dir = (1.0, 0.0)
    laser_poly = []  # [(x,y), (x,y), (x,y)] origin->bounce->end
    LASER_AIM_MS    = 200
    LASER_FREEZE_MS = 250
    LASER_FIRE_MS   = 700
    LASER_BOUNCES   = 3      # <-- 2 bounces
    LASER_SHOTS_TOTAL = 7    # <-- 3 + 5 extra = 8

    def ray_ellipse_hit(ox, oy, dx, dy):
        a, b = arena_radii()
        X = ox - cx
        Y = oy - cy
        A = (dx * dx) / (a * a) + (dy * dy) / (b * b)
        B = 2.0 * (X * dx / (a * a) + Y * dy / (b * b))
        C = (X * X) / (a * a) + (Y * Y) / (b * b) - 1.0
        D = B * B - 4 * A * C
        if D < 0:
            return None
        sqrtD = math.sqrt(D)
        t1 = (-B - sqrtD) / (2 * A)
        t2 = (-B + sqrtD) / (2 * A)
        ts = [t for t in (t1, t2) if t > 1e-6]
        if not ts:
            return None
        t = min(ts)
        return ox + dx * t, oy + dy * t

    def build_laser_poly(ox, oy, dx, dy, bounces=LASER_BOUNCES):
        pts = [(ox, oy)]
        curx, cury = ox, oy
        curdx, curdy = dx, dy

        for _ in range(bounces + 1):  # segments = bounces+1
            hit = ray_ellipse_hit(curx, cury, curdx, curdy)
            if hit is None:
                break

            hx, hy = hit
            pts.append((hx, hy))

            nx, ny = ellipse_normal(hx, hy)
            rdx, rdy = reflect_velocity(curdx, curdy, nx, ny)

            # tiny step to avoid re-hitting the same boundary point
            curx = hx + rdx * 0.001
            cury = hy + rdy * 0.001
            curdx, curdy = rdx, rdy

        return pts


    def start_laser(now):
        nonlocal current_attack, laser_state, laser_shot_i, laser_phase_until, laser_dir, laser_poly
        current_attack = "laser"
        laser_state = "aim"
        laser_shot_i = 0
        laser_phase_until = now + 1000
        laser_dir = (1.0, 0.0)
        laser_poly = []
        laser_state = "aim"
        laser_shot_i = 0
        laser_phase_until = now + LASER_AIM_MS


    def update_laser(now, mx, my, boss_draw_x, boss_draw_y):
        nonlocal current_attack, laser_state, laser_shot_i, laser_phase_until, laser_dir, laser_poly
        if current_attack != "laser":
            return

        ox = boss_draw_x + boss_size / 2
        oy = boss_draw_y + boss_size / 2

        if laser_state == "aim":
            dx, dy = normalize(mx - ox, my - oy)
            laser_dir = (dx, dy)
            if now >= laser_phase_until:
                laser_state = "freeze"
                laser_phase_until = now + LASER_FREEZE_MS
                laser_poly = build_laser_poly(ox, oy, dx, dy, LASER_BOUNCES)

        elif laser_state == "freeze":
            if now >= laser_phase_until:
                laser_state = "fire"
                laser_phase_until = now + LASER_FIRE_MS

        elif laser_state == "fire":
            if now >= laser_phase_until:
                laser_shot_i += 1
                if laser_shot_i >= LASER_SHOTS_TOTAL:
                    laser_state = "idle"
                    current_attack = None
                    laser_poly = []
                else:
                    laser_state = "aim"
                    laser_phase_until = now + LASER_AIM_MS
                    laser_poly = []


    # ============================================================
    # Attack: WAVES (20s, 12 waves)
    # ============================================================
    wave_end = 0
    wave_next = 0
    wave_spawned = 0

    def start_waves(now):
        nonlocal current_attack, wave_end, wave_next, wave_spawned
        current_attack = "waves"
        wave_end = now + 18000
        wave_next = now
        wave_spawned = 0

    def spawn_wave(now, mx, my):
        a, b = arena_radii()
        side = random.choice(["left", "right", "top", "bottom"])

        if side in ("left", "right"):
            dy = random.uniform(-0.85 * b, 0.85 * b)
            x_edge = a * math.sqrt(max(0.0, 1.0 - (dy * dy) / (b * b)))
            x0 = cx - x_edge if side == "left" else cx + x_edge
            y0 = cy + dy
        else:
            dx = random.uniform(-0.85 * a, 0.85 * a)
            y_edge = b * math.sqrt(max(0.0, 1.0 - (dx * dx) / (a * a)))
            y0 = cy - y_edge if side == "top" else cy + y_edge
            x0 = cx + dx

        dx, dy = normalize(mx - x0, my - y0)
        spd = 5.2

        amp   = random.uniform(70, 110)     # veel grotere amplitude
        k     = random.uniform(0.020, 0.035) # golf “golflengte” langs de lijn
        omega = random.uniform(7.0, 11.0)    # snelheid van de golfbeweging (tijd)

        L     = 1100                         # langere golf
        thick = random.randint(34, 52)       # VEEL breder

        waves.append({
            "t0": now,
            "life_ms": 9500,
            "headx": float(x0),
            "heady": float(y0),
            "vx": float(dx * spd),
            "vy": float(dy * spd),
            "amp": float(amp),
            "k": float(k),
            "omega": float(omega),
            "L": float(L),
            "thick": int(thick),
            "seed": random.uniform(0, 2.0 * math.pi)
        })


    # ============================================================
    # Attack: WALLS (16s, 8 walls)
    # ============================================================
    wall_end = 0
    wall_next = 0
    wall_spawned = 0

    def start_walls(now):
        nonlocal current_attack, wall_end, wall_next, wall_spawned
        current_attack = "walls"
        wall_end = now + 16000
        wall_next = now
        wall_spawned = 0

    def spawn_wall(now):
        a, b = arena_radii()
        side = random.choice(["left", "right", "top", "bottom"])
        thick = 46

        if side in ("left", "right"):
            axis = "v"
            start = cx - a if side == "left" else cx + a
            end = cx + a if side == "left" else cx - a
            speed_per_ms = (end - start) / 16000.0
            pos = start
        else:
            axis = "h"
            start = cy - b if side == "top" else cy + b
            end = cy + b if side == "top" else cy - b
            speed_per_ms = (end - start) / 16000.0
            pos = start

        walls.append({
            "t0": now,
            "axis": axis,
            "pos": float(pos),
            "speed": float(speed_per_ms),
            "thick": int(thick),
        })

    # ============================================================
    # Start attack helper
    # ============================================================
    def start_attack(name, now):
        if name == "figures":
            start_figures(now)
        elif name == "orbit":
            start_orbit(now)
        elif name == "laser":
            start_laser(now)
        elif name in ("wave", "waves"):
            start_waves(now)
        elif name in ("wall", "walls"):
            start_walls(now)

    # ============================================================
    # Fonts
    # ============================================================
    header_font = pygame.font.SysFont(None, 46)

    # ============================================================
    # Main loop
    # ============================================================
    while True:
        await asyncio.sleep(0)
        dt_ms = clock.tick(60)
        step = dt_ms / 16.6667  # 1.0 ~ 60fps
        now = pygame.time.get_ticks()

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                return
            if e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                return

        # boss move schedule
        if now >= boss_move_next:
            boss_move_next = now + 30000
            start_boss_move(now, (boss_anchor_idx + 1) % 4)

        update_boss_move(now)
        boss_draw_x, boss_draw_y = boss_x, boss_y

        mx, my = pygame.mouse.get_pos()
        mx = clamp(mx, 0, w - 1)
        my = clamp(my, 0, h - 1)

        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # lethal: buiten oval
        if not inside_arena(mx, my):
            if die(now):
                return

        # boss touch lethal
        boss_rect = pygame.Rect(int(boss_draw_x), int(boss_draw_y), boss_size, boss_size)
        if boss_rect.collidepoint(mx, my):
            if die(now):
                return

        # ============================================================
        # Attack scheduler
        # ============================================================
        if current_attack is None and now >= attack_gap_until:
            if not pending_attacks:
                pending_attacks = plan_for_hp(boss_hp)
                if not pending_attacks:
                    await end_screen("win")
                    return "win"
            nxt = pending_attacks.pop(0)
            start_attack(nxt, now)

        # ============================================================
        # Attack updates (timers/spawns)
        # ============================================================
        # FIGURES: spawn 20 shots snel achter elkaar
        if current_attack == "figures" and fig_active:
            if fig_left > 0 and now >= fig_next_shot:
                spawn_shape_shot(now, mx, my, boss_draw_x, boss_draw_y)
                fig_left -= 1
                fig_next_shot = now + 110
                if fig_left == 0:
                    fig_end_when_fired = now + 600

            if fig_left == 0 and now >= fig_end_when_fired:
                fig_active = False
                current_attack = None
                attack_gap_until = now + gap_ms_for_hp(boss_hp)

        # ORBIT: 5 keer in 10s
        if current_attack == "orbit":
            if now <= orbit_end:
                if orbit_fired < 9 and now >= orbit_next:
                    orbit_next = now + 1100
                    orbit_fired += 1
                    spawn_orbit_system(mx, my, boss_draw_x, boss_draw_y)
            else:
                current_attack = None
                attack_gap_until = now + gap_ms_for_hp(boss_hp)

        # LASER
        if current_attack == "laser":
            update_laser(now, mx, my, boss_draw_x, boss_draw_y)
            if current_attack is None:
                attack_gap_until = now + gap_ms_for_hp(boss_hp)

        # WAVES
        if current_attack == "waves":
            if now <= wave_end:
                if wave_spawned < 10 and now >= wave_next:
                    wave_next = now + int(18000 / 10)
                    wave_spawned += 1
                    spawn_wave(now, mx, my)
            else:
                current_attack = None
                attack_gap_until = now + gap_ms_for_hp(boss_hp)

        # WALLS
        if current_attack == "walls":
            if now <= wall_end:
                if wall_spawned < 8 and now >= wall_next:
                    wall_next = now + int(16000 / 8)
                    wall_spawned += 1
                    spawn_wall(now)
            else:
                current_attack = None
                attack_gap_until = now + gap_ms_for_hp(boss_hp)

        # ============================================================
        # Update FIGURE SHOTS (movement + bounce + collision)
        # ============================================================
        for s in shots[:]:
            s["x"] += s["vx"] * step
            s["y"] += s["vy"] * step

            # bounce logic (to_boss negeert arena)
            if s["phase"] != "to_boss":
                bounced = apply_ellipse_bounce(s)
                if bounced:
                    if s["phase"] == "normal":
                        s["b"] += 1
                        if s["b"] >= s["bmax"]:
                            shots.remove(s)
                            continue

                    elif s["phase"] == "yellow":
                        s["b"] += 1
                        if s["b"] >= s["bmax"]:
                            s["phase"] = "green"
                            s["green_b"] = 0

                    elif s["phase"] == "green":
                        s["green_b"] += 1
                        if s["green_b"] >= s["green_bmax"]:
                            shots.remove(s)
                            continue

            # collision met muis (circle hitbox)
            rr = s["r"]
            if ((mx - s["x"]) ** 2 + (my - s["y"]) ** 2) <= (rr * rr):
                if s["phase"] in ("normal", "yellow"):
                    if die(now):
                        return
                elif s["phase"] == "green":
                    # green is veilig: schiet naar boss
                    bx = boss_draw_x + boss_size / 2
                    by = boss_draw_y + boss_size / 2
                    dx, dy = normalize(bx - s["x"], by - s["y"])
                    s["phase"] = "to_boss"
                    s["vx"] = dx * 14.0
                    s["vy"] = dy * 14.0

            # to_boss hit boss -> damage
            if s["phase"] == "to_boss":
                bx = boss_draw_x + boss_size / 2
                by = boss_draw_y + boss_size / 2
                if (s["x"] - bx) ** 2 + (s["y"] - by) ** 2 <= (boss_size * 0.42) ** 2:
                    if boss_take_damage(now, mx, my, boss_draw_x, boss_draw_y):
                        return
                    shots.remove(s)
                    continue

                # safety cleanup
                if s["x"] < -400 or s["x"] > w + 400 or s["y"] < -400 or s["y"] > h + 400:
                    shots.remove(s)
                    continue

        # ============================================================
        # Update ORBIT SYSTEMS (move + collision) (geen bounce, gaan door rood)
        # ============================================================
        for ob in orbit_systems[:]:
            ob["x"] += ob["vx"] * step
            ob["y"] += ob["vy"] * step
            ob["theta"] += ORBIT_OMEGA * step

            # cleanup ver buiten beeld
            if ob["x"] < -600 or ob["x"] > w + 600 or ob["y"] < -600 or ob["y"] > h + 600:
                orbit_systems.remove(ob)
                continue

            # core hit
            if (mx - ob["x"]) ** 2 + (my - ob["y"]) ** 2 <= ORBIT_CORE_R ** 2:
                if die(now):
                    return

            # satellites hit
            for k in range(4):
                ang = ob["theta"] + k * (math.pi / 2)
                sx = ob["x"] + ORBIT_RADIUS * math.cos(ang)
                sy = ob["y"] + ORBIT_RADIUS * math.sin(ang)
                if (mx - sx) ** 2 + (my - sy) ** 2 <= ORBIT_SAT_R ** 2:
                    if die(now):
                        return

        # ============================================================
        # Update RINGS (infinite bounce + lethal donut)
        # ============================================================
        for r in rings:
            r["x"] += r["vx"] * step
            r["y"] += r["vy"] * step
            apply_ellipse_bounce(r)

            d = math.hypot(mx - r["x"], my - r["y"])
            if abs(d - r["R"]) <= r["th"] / 2:
                if die(now):
                    return

        # ============================================================
        # Update WAVES (move heads + collide)
        # ============================================================
        for wv in waves[:]:
            if now - wv["t0"] >= wv["life_ms"]:
                waves.remove(wv)
                continue
            wv["headx"] += wv["vx"] * step
            wv["heady"] += wv["vy"] * step

            # collision polyline
            headx = wv["headx"]
            heady = wv["heady"]
            ndx, ndy = normalize(wv["vx"], wv["vy"])
            px, py = -ndy, ndx
            tsec = (now - wv["t0"]) / 1000.0
            L = wv["L"]
            N = 18
            pts = []
            for i in range(N):
                sdist = (i / (N - 1)) * L
                wob = math.sin(wv["k"] * sdist - wv["omega"] * tsec + wv["seed"]) * wv["amp"]
                x = headx - ndx * sdist + px * wob
                y = heady - ndy * sdist + py * wob
                pts.append((x, y))

            th = wv["thick"]
            for i in range(len(pts) - 1):
                ax, ay = pts[i]
                bx2, by2 = pts[i + 1]
                if dist_point_to_segment(mx, my, ax, ay, bx2, by2) <= th / 2:
                    if die(now):
                        return
                    break

        # ============================================================
        # Update WALLS (move + collide on red ticks)
        # ============================================================
        for wl in walls[:]:
            wl["pos"] += wl["speed"] * dt_ms  # speed is per ms
            a, b = arena_radii()

            # remove when far outside ellipse bounds
            if wl["axis"] == "v":
                if wl["speed"] > 0 and wl["pos"] > cx + a + 30:
                    walls.remove(wl)
                    continue
                if wl["speed"] < 0 and wl["pos"] < cx - a - 30:
                    walls.remove(wl)
                    continue
            else:
                if wl["speed"] > 0 and wl["pos"] > cy + b + 30:
                    walls.remove(wl)
                    continue
                if wl["speed"] < 0 and wl["pos"] < cy - b - 30:
                    walls.remove(wl)
                    continue

            red_on = ((now - wl["t0"]) // 1000) % 2 == 1
            if not red_on:
                continue

            if wl["axis"] == "v":
                xline = wl["pos"]
                dx = xline - cx
                if abs(dx) <= a:
                    yext = b * math.sqrt(max(0.0, 1.0 - (dx * dx) / (a * a)))
                    if abs(mx - xline) <= wl["thick"] / 2 and (cy - yext) <= my <= (cy + yext):
                        if die(now):
                            return
            else:
                yline = wl["pos"]
                dy = yline - cy
                if abs(dy) <= b:
                    xext = a * math.sqrt(max(0.0, 1.0 - (dy * dy) / (b * b)))
                    if abs(my - yline) <= wl["thick"] / 2 and (cx - xext) <= mx <= (cx + xext):
                        if die(now):
                            return

        # ============================================================
        # Laser collision (alleen tijdens fire)
        # ============================================================
        if current_attack == "laser" and laser_state == "fire" and laser_poly and len(laser_poly) >= 2:
            for i in range(len(laser_poly) - 1):
                a1 = laser_poly[i]
                a2 = laser_poly[i + 1]
                if dist_point_to_segment(mx, my, a1[0], a1[1], a2[0], a2[1]) <= 6:
                    if die(now):
                        return
                    break

        # ============================================================
        # DRAW
        # ============================================================
        screen.fill((255, 0, 0))  # lethal background

        a, b = arena_radii()
        oval_rect = pygame.Rect(int(cx - a), int(cy - b), int(2 * a), int(2 * b))
        pygame.draw.ellipse(screen, (0, 0, 255), oval_rect)
        pygame.draw.ellipse(screen, (0, 0, 0), oval_rect, 4)

        # boss
        screen.blit(boss_img, (int(boss_draw_x), int(boss_draw_y)))

        # figure shots draw
        for s in shots:
            x = int(s["x"])
            y = int(s["y"])
            r = int(s["r"])

            if s["phase"] == "yellow":
                col = (255, 255, 0)
            elif s["phase"] in ("green", "to_boss"):
                col = (0, 200, 0)
            else:
                col = (210, 210, 210)

            draw_face = (s["phase"] == "normal")

            if s["kind"] == "circle":
                if draw_face:
                    face = get_face_in_shape("circle", 2 * r)
                    screen.blit(face, (x - r, y - r))
                    pygame.draw.circle(screen, (0, 0, 0), (x, y), r, 2)
                else:
                    pygame.draw.circle(screen, col, (x, y), r)
                    pygame.draw.circle(screen, (0, 0, 0), (x, y), r, 2)

            elif s["kind"] == "square":
                rect = pygame.Rect(x - r, y - r, 2 * r, 2 * r)
                if draw_face:
                    face = get_face_in_shape("square", 2 * r)
                    screen.blit(face, (x - r, y - r))
                    pygame.draw.rect(screen, (0, 0, 0), rect, 2, border_radius=4)
                else:
                    pygame.draw.rect(screen, col, rect, border_radius=4)
                    pygame.draw.rect(screen, (0, 0, 0), rect, 2, border_radius=4)

            else:  # triangle
                pts = [(x, y - r), (x - r, y + r), (x + r, y + r)]
                if draw_face:
                    face = get_face_in_shape("triangle", 2 * r)
                    screen.blit(face, (x - r, y - r))
                    pygame.draw.polygon(screen, (0, 0, 0), pts, 2)
                else:
                    pygame.draw.polygon(screen, col, pts)
                    pygame.draw.polygon(screen, (0, 0, 0), pts, 2)


        # orbit systems draw (face balls)
        for ob in orbit_systems:
            # core
            blit_face_in_circle(ob["x"], ob["y"], ORBIT_CORE_R)
            pygame.draw.circle(screen, (0, 0, 0), (int(ob["x"]), int(ob["y"])), ORBIT_CORE_R, 2)

            # satellites
            for k in range(4):
                ang = ob["theta"] + k * (math.pi / 2)
                sx = ob["x"] + ORBIT_RADIUS * math.cos(ang)
                sy = ob["y"] + ORBIT_RADIUS * math.sin(ang)
                blit_face_in_circle(sx, sy, ORBIT_SAT_R)
                pygame.draw.circle(screen, (0, 0, 0), (int(sx), int(sy)), ORBIT_SAT_R, 2)

        # rings draw
        for r in rings:
            x = int(r["x"])
            y = int(r["y"])
            R = int(r["R"])
            th = int(r["th"])
            innerR = max(1, R - th)

            donut = get_face_in_shape("donut", 0, extra=(R, innerR))
            screen.blit(donut, (x - donut.get_width() // 2, y - donut.get_height() // 2))

            pygame.draw.circle(screen, (0, 0, 0), (x, y), R, 2)

        # laser visuals
        if current_attack == "laser":
            ox = boss_draw_x + boss_size / 2
            oy = boss_draw_y + boss_size / 2
            dx, dy = laser_dir
            poly_preview = build_laser_poly(ox, oy, dx, dy)

            if laser_state == "aim":
                col = (170, 170, 170)
                if len(poly_preview) >= 2:
                    pygame.draw.lines(screen, col, False, poly_preview, 4)

            elif laser_state == "freeze":
                col = (170, 170, 170)
                poly = build_laser_poly(ox, oy, laser_dir[0], laser_dir[1], LASER_BOUNCES)
                if len(poly) >= 2:
                    pygame.draw.lines(screen, col, False, poly, 4)

            elif laser_state == "fire":
                col = (255, 0, 0)
                if laser_poly and len(laser_poly) >= 2:
                    pygame.draw.lines(screen, col, False, laser_poly, 3)


        # waves draw
        for wv in waves:
            headx = wv["headx"]
            heady = wv["heady"]
            ndx, ndy = normalize(wv["vx"], wv["vy"])
            px, py = -ndy, ndx
            tsec = (now - wv["t0"]) / 1000.0
            L = wv["L"]
            N = 18
            pts = []
            for i in range(N):
                sdist = (i / (N - 1)) * L
                wob = math.sin(wv["k"] * sdist - wv["omega"] * tsec + wv["seed"]) * wv["amp"]
                x = headx - ndx * sdist + px * wob
                y = heady - ndy * sdist + py * wob
                pts.append((int(x), int(y)))
            pygame.draw.lines(screen, (200, 0, 0), False, pts, wv["thick"])

        # walls draw
        for wl in walls:
            red_on = ((now - wl["t0"]) // 1000) % 2 == 1
            col = (255, 0, 0) if red_on else (170, 170, 170)
            a, b = arena_radii()

            if wl["axis"] == "v":
                xline = wl["pos"]
                dx = xline - cx
                if abs(dx) <= a:
                    yext = b * math.sqrt(max(0.0, 1.0 - (dx * dx) / (a * a)))
                    p1 = (int(xline), int(cy - yext))
                    p2 = (int(xline), int(cy + yext))
                    pygame.draw.line(screen, col, p1, p2, wl["thick"])
            else:
                yline = wl["pos"]
                dy = yline - cy
                if abs(dy) <= b:
                    xext = a * math.sqrt(max(0.0, 1.0 - (dy * dy) / (b * b)))
                    p1 = (int(cx - xext), int(yline))
                    p2 = (int(cx + xext), int(yline))
                    pygame.draw.line(screen, col, p1, p2, wl["thick"])

        # shield draw
        draw_shield_pickup()
        draw_shield_indicator()

        # boss name + HP bar
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

        pygame.display.flip()










