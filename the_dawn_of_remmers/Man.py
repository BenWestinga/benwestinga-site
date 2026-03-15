# Man.py
import pygame
import random
import math
from pathlib import Path
import game_settings

def bossfight_Man(screen):
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
            msg = "Hitler is defeated" if result == "win" else "You were defeated by Hitler"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 50)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return

            clock.tick(60)

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
        cx = ax + t * vx
        cy = ay + t * vy
        return math.hypot(px - cx, py - cy)

    def ray_intersect_play_rect(px, py, dx, dy, L, R, T, B):
        eps = 1e-9
        t_candidates = []

        if abs(dx) > eps:
            tL = (L - px) / dx
            tR = (R - px) / dx
            if tL > eps:
                y = py + tL * dy
                if T - 1e-6 <= y <= B + 1e-6:
                    t_candidates.append((tL, "L"))
            if tR > eps:
                y = py + tR * dy
                if T - 1e-6 <= y <= B + 1e-6:
                    t_candidates.append((tR, "R"))

        if abs(dy) > eps:
            tT = (T - py) / dy
            tB = (B - py) / dy
            if tT > eps:
                x = px + tT * dx
                if L - 1e-6 <= x <= R + 1e-6:
                    t_candidates.append((tT, "T"))
            if tB > eps:
                x = px + tB * dx
                if L - 1e-6 <= x <= R + 1e-6:
                    t_candidates.append((tB, "B"))

        if not t_candidates:
            return px, py, "C"

        t_candidates.sort(key=lambda z: z[0])
        tmin, hit = t_candidates[0]
        ix = px + tmin * dx
        iy = py + tmin * dy
        return ix, iy, hit

    def compute_bounce_segments(start_x, start_y, dir_x, dir_y, bounces, L, R, T, B):
        segments = []
        px, py = start_x, start_y
        dx, dy = normalize(dir_x, dir_y)

        for i in range(bounces + 1):
            ix, iy, hit = ray_intersect_play_rect(px, py, dx, dy, L, R, T, B)
            segments.append((px, py, ix, iy))

            if i == bounces:
                break

            if hit in ("L", "R"):
                dx *= -1
            elif hit in ("T", "B"):
                dy *= -1

            px = ix + dx * 0.01
            py = iy + dy * 0.01

        return segments

    # ============================================================
    # Arena exactly like beast
    # ============================================================
    LEFT_WALL_W = 385
    TOP_WALL_H = 110
    BOT_WALL_H = 110
    RIGHT_WALL_W = 100

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
    # Shield (universeel)
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
    # Boss sprite + HP
    # ============================================================
    boss_name = "Hitler"
    boss_size = 100

    # start position like Joe/beast
    boss_x = float(325 - boss_size // 2)
    boss_y = float(h // 2 - boss_size // 2)

    boss_max_hp = 3
    boss_hp = boss_max_hp

    font = pygame.font.SysFont(None, 40)

    try:
        raw = pygame.image.load(str(Path(__file__).resolve().with_name("Man.png"))).convert_alpha()
    except:
        raw = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
        raw.fill((180, 180, 180))
        pygame.draw.rect(raw, (0, 0, 0), raw.get_rect(), 3)

    boss_img = pygame.transform.scale(raw, (boss_size, boss_size))

    # ============================================================
    # Loop path (LT -> RT -> RB -> LB -> repeat) binnen blauw
    # ============================================================
    margin = 70
    loop_points = [
        (PLAY_LEFT + margin, PLAY_TOP + margin),
        (PLAY_RIGHT - margin - boss_size, PLAY_TOP + margin),
        (PLAY_RIGHT - margin - boss_size, PLAY_BOT - margin - boss_size),
        (PLAY_LEFT + margin, PLAY_BOT - margin - boss_size),
    ]
    loop_index = 0
    loop_speed = 4.5

    def current_loop_target():
        return loop_points[loop_index]

    def advance_loop():
        nonlocal loop_index
        loop_index = (loop_index + 1) % len(loop_points)

    def move_towards(tx, ty, speed):
        nonlocal boss_x, boss_y
        dx = tx - boss_x
        dy = ty - boss_y
        dist = math.hypot(dx, dy)
        if dist <= speed:
            boss_x = tx
            boss_y = ty
            return True
        boss_x += (dx / dist) * speed
        boss_y += (dy / dist) * speed
        return False

    def resync_loop_index_to_nearest():
        """Keeps the boss synced to the nearest loop target after attacks."""
        nonlocal loop_index
        best_i = 0
        best_d = 1e18
        for i, (tx, ty) in enumerate(loop_points):
            d = (boss_x - tx) ** 2 + (boss_y - ty) ** 2
            if d < best_d:
                best_d = d
                best_i = i
        loop_index = best_i

    # eerst naar loop start (als hij nog niet mooi in het pad zit)
    entering_loop = True
    loop_ready = False
    loop_ready_time = 0  # moment dat we "klaar" zijn met instappen

    # ============================================================
    # Attack scheduler:
    # - pas starten NADAT hij echt in het loop-pad zit
    # - elke attack ongeveer 10s na eind vorige
    # - 4 random attacks -> daarna special
    # ============================================================
    
    ATTACK_GAP_MS = 1000  # ✅ 2 seconden na een attack direct weer een nieuwe

    next_attack_time = 10**18
    random_attacks_done = 0
    attack = "none"

    attack_bag = []
    def pick_next_attack():
        nonlocal attack_bag
        if not attack_bag:
            attack_bag = ["raygun", "rings", "squares"]
            random.shuffle(attack_bag)
        return attack_bag.pop()


    # ============================================================
    # Scaling per verloren leven
    # ============================================================
    def lives_lost():
        return boss_max_hp - boss_hp

    # ============================================================
    # Attack 1: Raygun (aim 2s, freeze 1s, warn 1s, lethal 2s)
    # lethal: 4 lijnen = 3 bounces (+ extra per life lost)
    # ============================================================
    ray_phase = "idle"
    ray_phase_until = 0
    ray_dir = (1.0, 0.0)
    ray_segments = []
    ray_lethal_until = 0

    RAY_AIM_MS = 2000
    RAY_FREEZE_MS = 1000
    RAY_WARN_MS = 1000
    RAY_LETHAL_MS = 2000
    RAY_THICKNESS = 13
    RAY_BASE_BOUNCES = 7

    # ============================================================
    # Attack 2: Center rings met echte opening (gap)
    # base 5, +2 per leven verloren
    # ============================================================
    rings = []
    ring_attack_state = "idle"  # move_center / spawn / return
    ring_spawn_count = 0
    ring_next_spawn = 0
    ring_origin_pos = (0.0, 0.0)

    ring_prev_gap_center = None
    RING_GAP_MIN_SEP = math.radians(70)   # ✅ min 70° verschil met vorige opening

    RING_BASE_SPAWNS = 7
    RING_SPAWN_INTERVAL_MS = 1250
    RING_SPEED = 1.25
    RING_THICKNESS = 11.2                      # dikte van de rode omtrek
    RING_GAP_WIDTH = math.radians(30)        # kleiner gat
    RING_GAP_SAFETY = math.radians(10)       # collision-gat iets groter -> geen bug deaths
    RING_STEP = 0.06                         # tekenstap (rad) voor polylines


    # ============================================================
    # Attack 3: Rotating square shots (2 gaps opposite)
    # base 5 shots, +2 per leven verloren, spin +5% per leven verloren
    # ============================================================
    squares = []
    square_attack_state = "idle"  # firing / done_wait
    square_shots_left = 0
    square_next_shot = 0
    square_done_until = 0

    SQUARE_BASE_SHOTS = 12
    SQUARE_INTERVAL_MS = 920
    SQUARE_SPEED = 6.6
    SQUARE_SIZE = 280
    SQUARE_BORDER = 12
    SQUARE_GAP_HALF = 55
    SQUARE_BASE_ROT = 0.01

    # ============================================================
    # Mouse stun (like ump: lock mouse position)
    # ============================================================
    MOUSE_STUN_MS = 600
    mouse_stun_until = 0
    mouse_stun_pos = (w // 2, h // 2)


    # ============================================================
    # Special attack (ump-style):
    # 3s: grijze telegraph volgt cursor (boss "in de lucht")
    # 1s: telegraph krimpt (positie fixed)
    # landing: boss verschijnt daar, stun muis, schiet special ring
    # 5s: boss yellow blink -> muis kan 1x hitten
    # daarna: boss loopt terug naar loop start (geen teleport terug)
    # ============================================================
    special_state = "idle"   # idle / air / shrink / stun / return_to_top
    special_until = 0
    special_hit_used = False

    boss_invuln_until = 0
    BOSS_INVULN_AFTER_HIT_MS = 10000

    special_ring = None
    SPECIAL_RING_SPEED = 4.2
    SPECIAL_RING_THICK = 12
    SPECIAL_RING_GAP_WIDTH = math.radians(45)

    SPECIAL_AIR_MS = 3000
    SPECIAL_SHRINK_MS = 1000
    SPECIAL_STUN_MS = 5000

    tele_center = (w // 2, h // 2)     # center van telegraph (volgt muis)
    tele_lock_center = (w // 2, h // 2) # fixed center na air-phase
    tele_rect_size = boss_size

    # ============================================================
    # Spawn helpers
    # ============================================================
    def start_raygun(now, mx, my):
        nonlocal attack, ray_phase, ray_phase_until, ray_segments
        attack = "raygun"
        ray_phase = "aim"
        ray_phase_until = now + RAY_AIM_MS
        ray_segments = []

    def draw_ring_outline(screen, ring):
        cx, cy = ring["cx"], ring["cy"]
        r = ring["r"]
        thickness = int(ring["thickness"])   # ✅ HIER: float -> int
        gap_center = ring["gap_center"]
        gap_half = ring["gap_width"] / 2

        pts = []
        a = 0.0
        while a <= 2 * math.pi + RING_STEP:
            dphi = (a - gap_center + math.pi) % (2 * math.pi) - math.pi
            in_gap = abs(dphi) <= gap_half

            if in_gap:
                if len(pts) >= 2:
                    pygame.draw.lines(screen, (255, 0, 0), False, pts, thickness)
                pts = []
            else:
                x = cx + math.cos(a) * r
                y = cy + math.sin(a) * r
                pts.append((int(x), int(y)))  # ✅ HIER: punten ook ints (veilig)

            a += RING_STEP

        if len(pts) >= 2:
            pygame.draw.lines(screen, (255, 0, 0), False, pts, thickness)



    def start_rings(now):
        nonlocal attack, ring_attack_state, ring_spawn_count, ring_next_spawn, ring_origin_pos
        nonlocal rings, ring_prev_gap_center  # ✅ belangrijk

        attack = "rings"
        ring_attack_state = "move_center"
        ring_spawn_count = 0
        ring_next_spawn = 0
        rings = []  # ✅ reset nu echt
        ring_origin_pos = (boss_x, boss_y)

        ring_prev_gap_center = None  # ✅ reset anti-repeat (zie FIX 3)

    def pick_gap_center(prev):
        """Random opening, but not too close to the previous one."""
        if prev is None:
            return random.random() * 2 * math.pi

        for _ in range(40):
            g = random.random() * 2 * math.pi
            d = (g - prev + math.pi) % (2 * math.pi) - math.pi
            if abs(d) >= RING_GAP_MIN_SEP:
                return g

        # fallback als hij 40x pech had
        return random.random() * 2 * math.pi

    def start_squares(now):
        nonlocal attack, square_attack_state, square_shots_left, square_next_shot, square_done_until
        attack = "squares"
        square_attack_state = "firing"
        square_shots_left = SQUARE_BASE_SHOTS + 2 * lives_lost()
        square_next_shot = now
        square_done_until = 0

    def start_special(now, mx, my):
        nonlocal attack, special_state, special_until, special_hit_used
        nonlocal special_ring, tele_center, tele_lock_center, tele_rect_size
        attack = "special"
        special_state = "air"
        special_until = now + SPECIAL_AIR_MS
        special_hit_used = False
        special_ring = None
        tele_center = (float(mx), float(my))
        tele_lock_center = tele_center
        tele_rect_size = boss_size

    def spawn_ring(center_x, center_y, speed, thickness, gap_width, gap_center):
        rings.append({
            "cx": float(center_x),
            "cy": float(center_y),
            "r": 0.0,
            "speed": float(speed),
            "thickness": float(thickness),
            "gap_center": float(gap_center),
            "gap_width": float(gap_width),
        })

    def spawn_special_ring(center_x, center_y):
        nonlocal special_ring
        special_ring = {
            "cx": float(center_x),
            "cy": float(center_y),
            "r": 0.0,
            "speed": float(SPECIAL_RING_SPEED),
            "thickness": float(SPECIAL_RING_THICK),
            "gap_center": float(random.random() * 2 * math.pi),
            "gap_width": float(SPECIAL_RING_GAP_WIDTH),
        }


    def spawn_square_shot(mx, my):
        bx = boss_x + boss_size / 2
        by = boss_y + boss_size / 2
        dx = mx - bx
        dy = my - by
        dx, dy = normalize(dx, dy)

        gap_mode = random.choice(["LR", "TB"])
        rot_mult = 1.0 + 0.05 * lives_lost()

        squares.append({
            "x": float(bx),
            "y": float(by),
            "vx": dx * SQUARE_SPEED,
            "vy": dy * SQUARE_SPEED,
            "size": float(SQUARE_SIZE),
            "border": float(SQUARE_BORDER),
            "rot": 0.0,
            "rot_speed": float(SQUARE_BASE_ROT * rot_mult),
            "gap_mode": gap_mode,
            "gap_half": float(SQUARE_GAP_HALF),
            "life_end": pygame.time.get_ticks() + 10000,
        })

    # ============================================================
    # Ring collision + ring draw met echte opening
    # ============================================================
    def ring_hits_mouse(ring, mx, my):
        cx, cy = ring["cx"], ring["cy"]
        dx = mx - cx
        dy = my - cy
        dist = math.hypot(dx, dy)

        # ✅ alleen omtrek is lethal (niet binnenkant)
        if abs(dist - ring["r"]) > (ring["thickness"] / 2 + 3):
            return False

        ang = math.atan2(dy, dx)
        dphi = (ang - ring["gap_center"] + math.pi) % (2 * math.pi) - math.pi

        # ✅ collision opening iets groter dan getekende opening
        if abs(dphi) <= (ring["gap_width"] / 2 + RING_GAP_SAFETY):
            return False

        return True



    def draw_ring_with_gap(color, ring):
        rr = int(ring["r"])
        if rr <= 0:
            return

        cx = int(ring["cx"])
        cy = int(ring["cy"])
        thick = int(ring["thick"])

        # gap interval
        two_pi = 2 * math.pi
        gap_start = (ring["gap_center"] - ring["gap_width"] / 2) % two_pi
        gap_end = (ring["gap_center"] + ring["gap_width"] / 2) % two_pi

        rect = pygame.Rect(cx - rr, cy - rr, 2 * rr, 2 * rr)

        # draw arcs excluding the gap
        if gap_start < gap_end:
            # gap does NOT wrap: visible is [gap_end, 2pi] and [0, gap_start]
            if gap_end < two_pi - 1e-6:
                pygame.draw.arc(screen, color, rect, gap_end, two_pi, thick)
            if gap_start > 1e-6:
                pygame.draw.arc(screen, color, rect, 0.0, gap_start, thick)
        else:
            # gap wraps around 0: visible is [gap_end, gap_start]
            pygame.draw.arc(screen, color, rect, gap_end, gap_start, thick)

    # ============================================================
    # Square collision + draw
    # ============================================================
    def square_hits_mouse(sq, mx, my):
        cx, cy = sq["x"], sq["y"]
        size = sq["size"]
        half = size / 2
        border = sq["border"]
        gap_half = sq["gap_half"]
        rot = sq["rot"]

        dx = mx - cx
        dy = my - cy
        cr = math.cos(-rot)
        sr = math.sin(-rot)
        lx = dx * cr - dy * sr
        ly = dx * sr + dy * cr

        ax = abs(lx)
        ay = abs(ly)

        on_vertical = (abs(ax - half) <= border) and (ay <= half + border)
        on_horizontal = (abs(ay - half) <= border) and (ax <= half + border)

        if not (on_vertical or on_horizontal):
            return False

        if sq["gap_mode"] == "LR":
            if (abs(ax - half) <= border) and (abs(ly) <= gap_half):
                return False
        else:
            if (abs(ay - half) <= border) and (abs(lx) <= gap_half):
                return False

        return True

    def draw_rot_square(sq):
        cx, cy = sq["x"], sq["y"]
        half = sq["size"] / 2
        rot = sq["rot"]
        border = int(sq["border"])
        gap_half = sq["gap_half"]

        def rot_pt(x, y):
            cr = math.cos(rot)
            sr = math.sin(rot)
            return (cx + x * cr - y * sr, cy + x * sr + y * cr)

        c0 = rot_pt(-half, -half)
        c1 = rot_pt(half, -half)
        c2 = rot_pt(half, half)
        c3 = rot_pt(-half, half)
        corners = [c0, c1, c2, c3]

        gap_sides = {1, 3} if sq["gap_mode"] == "LR" else {0, 2}

        for i in range(4):
            pA = corners[i]
            pB = corners[(i + 1) % 4]

            if i in gap_sides:
                mx2 = (pA[0] + pB[0]) / 2
                my2 = (pA[1] + pB[1]) / 2
                vx = pB[0] - pA[0]
                vy = pB[1] - pA[1]
                Ls = math.hypot(vx, vy)
                if Ls < 1e-6:
                    continue
                ux = vx / Ls
                uy = vy / Ls

                g1 = (mx2 - ux * gap_half, my2 - uy * gap_half)
                g2 = (mx2 + ux * gap_half, my2 + uy * gap_half)

                pygame.draw.line(screen, (255, 0, 0), (int(pA[0]), int(pA[1])), (int(g1[0]), int(g1[1])), border)
                pygame.draw.line(screen, (255, 0, 0), (int(g2[0]), int(g2[1])), (int(pB[0]), int(pB[1])), border)
            else:
                pygame.draw.line(screen, (255, 0, 0), (int(pA[0]), int(pA[1])), (int(pB[0]), int(pB[1])), border)

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
        mx = clamp(mx, 0, w - 1)
        my = clamp(my, 0, h - 1)

        # ✅ muis stun toepassen
        if now < mouse_stun_until:
            pygame.mouse.set_pos(mouse_stun_pos)
            pygame.mouse.get_rel()
            mx, my = mouse_stun_pos


        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # ------------------------------------------------------------
        # Enter loop first (no attacks during this)
        # ------------------------------------------------------------
        if entering_loop:
            tx, ty = loop_points[0]
            reached = move_towards(tx, ty, loop_speed)
            if reached:
                entering_loop = False
                loop_ready = True
                loop_ready_time = now
                resync_loop_index_to_nearest()
                # start attacks later (NOT immediately)
                next_attack_time = now + ATTACK_GAP_MS
        else:
            # --------------------------------------------------------
            # Attack scheduler (only when no active attack)
            # --------------------------------------------------------
            if attack == "none" and loop_ready and now >= next_attack_time:
                if random_attacks_done >= 4:
                    start_special(now, mx, my)
                    random_attacks_done = 0
                else:
                    choice = pick_next_attack()
                    if choice == "raygun":
                        start_raygun(now, mx, my)
                    elif choice == "rings":
                        start_rings(now)
                    else:
                        start_squares(now)
                    random_attacks_done += 1

            # --------------------------------------------------------
            # Default loop movement (overrides exist per attack)
            # --------------------------------------------------------
            if attack == "rings" and ring_attack_state in ("move_center", "spawn", "return"):
                # ring-state moves boss explicitly
                pass
            elif attack == "special" and special_state in ("dash", "stun", "return_to_top"):
                # special-state moves boss explicitly
                pass
            else:
                tx, ty = current_loop_target()
                if move_towards(tx, ty, loop_speed):
                    advance_loop()

        boss_x = clamp(boss_x, PLAY_LEFT, PLAY_RIGHT - boss_size)
        boss_y = clamp(boss_y, PLAY_TOP, PLAY_BOT - boss_size)

        # ============================================================
        # Attack 1: Raygun
        # ============================================================
        if attack == "raygun":
            bx = boss_x + boss_size / 2
            by = boss_y + boss_size / 2

            if ray_phase == "aim":
                dx = mx - bx
                dy = my - by
                dx, dy = normalize(dx, dy)
                ray_dir = (dx, dy)

                if now >= ray_phase_until:
                    ray_phase = "freeze"
                    ray_phase_until = now + RAY_FREEZE_MS

            elif ray_phase == "freeze":
                if now >= ray_phase_until:
                    ray_phase = "warn"
                    ray_phase_until = now + RAY_WARN_MS

            elif ray_phase == "warn":
                if now >= ray_phase_until:
                    dx, dy = ray_dir
                    bounces = RAY_BASE_BOUNCES + lives_lost()  # ✅ scaling
                    ray_segments = compute_bounce_segments(
                        bx, by, dx, dy, bounces,
                        PLAY_LEFT, PLAY_RIGHT, PLAY_TOP, PLAY_BOT
                    )
                    ray_phase = "lethal"
                    ray_lethal_until = now + RAY_LETHAL_MS

            elif ray_phase == "lethal":
                if now >= ray_lethal_until:
                    ray_phase = "idle"
                    ray_segments = []
                    attack = "none"
                    resync_loop_index_to_nearest()
                    next_attack_time = now + ATTACK_GAP_MS

        # ============================================================
        # Attack 2: Rings (move to center, spawn N rings, return)
        # ============================================================
        if attack == "rings":
            center_tx = (PLAY_LEFT + PLAY_RIGHT) / 2 - boss_size / 2
            center_ty = (PLAY_TOP + PLAY_BOT) / 2 - boss_size / 2

            ring_target_spawns = RING_BASE_SPAWNS + 2 * lives_lost()  # ✅ scaling

            if ring_attack_state == "move_center":
                reached = move_towards(center_tx, center_ty, 3.2)
                if reached:
                    ring_attack_state = "spawn"
                    ring_spawn_count = 0
                    ring_next_spawn = now

            elif ring_attack_state == "spawn":
                if ring_spawn_count < ring_target_spawns and now >= ring_next_spawn:
                    ring_next_spawn = now + RING_SPAWN_INTERVAL_MS
                    ring_spawn_count += 1
                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2
                    gap = pick_gap_center(ring_prev_gap_center)
                    ring_prev_gap_center = gap

                    spawn_ring(
                        bx, by,
                        RING_SPEED,
                        RING_THICKNESS,
                        RING_GAP_WIDTH,
                        gap
                    )

                if ring_spawn_count >= ring_target_spawns:
                    ring_attack_state = "return"

            elif ring_attack_state == "return":
                ox, oy = ring_origin_pos
                reached = move_towards(ox, oy, 3.0)
                if reached:
                    ring_attack_state = "idle"
                    attack = "none"
                    resync_loop_index_to_nearest()
                    next_attack_time = now + ATTACK_GAP_MS

        # ============================================================
        # Attack 3: Squares
        # ============================================================
        if attack == "squares":
            if square_attack_state == "firing":
                if square_shots_left > 0 and now >= square_next_shot:
                    spawn_square_shot(mx, my)
                    square_shots_left -= 1
                    square_next_shot = now + SQUARE_INTERVAL_MS

                if square_shots_left <= 0:
                    square_attack_state = "done_wait"
                    square_done_until = now + 2500

            elif square_attack_state == "done_wait":
                if now >= square_done_until:
                    square_attack_state = "idle"
                    attack = "none"
                    resync_loop_index_to_nearest()
                    next_attack_time = now + ATTACK_GAP_MS

        # ============================================================
        # Special attack
        # ============================================================
        # ============================================================
        # Special attack (ump-style update)
        # ============================================================
        in_yellow = (attack == "special" and special_state == "stun")

        if attack == "special":
            if special_state == "air":
                # telegraph volgt muis 3s
                tele_center = (float(mx), float(my))
                if now >= special_until:
                    # lock positie op einde van 3s
                    tele_lock_center = tele_center
                    special_state = "shrink"
                    special_until = now + SPECIAL_SHRINK_MS
                    tele_rect_size = boss_size

            elif special_state == "shrink":
                # krimpt 1s op vaste plek
                t = 1.0 - (special_until - now) / max(1, SPECIAL_SHRINK_MS)
                t = clamp(t, 0.0, 1.0)
                tele_rect_size = int(boss_size * (1.0 - t))

                if now >= special_until:
                    # landing!
                    cx, cy = tele_lock_center
                    tx = clamp(cx - boss_size / 2, PLAY_LEFT, PLAY_RIGHT - boss_size)
                    ty = clamp(cy - boss_size / 2, PLAY_TOP, PLAY_BOT - boss_size)

                    boss_x = float(tx)
                    boss_y = float(ty)

                    # stun muis
                    mouse_stun_until = now + MOUSE_STUN_MS
                    mouse_stun_pos = (int(mx), int(my))
                    pygame.mouse.set_pos(mouse_stun_pos)
                    pygame.mouse.get_rel()

                    # spawn ring vanaf landing
                    bx = boss_x + boss_size / 2
                    by = boss_y + boss_size / 2
                    spawn_special_ring(bx, by)

                    special_state = "stun"
                    special_until = now + SPECIAL_STUN_MS
                    special_hit_used = False

            elif special_state == "stun":
                if now >= special_until:
                    special_state = "return_to_top"

            elif special_state == "return_to_top":
                tx, ty = loop_points[0]
                if move_towards(tx, ty, 3.2):
                    special_state = "idle"
                    attack = "none"
                    resync_loop_index_to_nearest()
                    next_attack_time = now + ATTACK_GAP_MS

        # ============================================================
        # Update rings expansion
        # ============================================================
        max_r = math.hypot(w, h) + 200

        for r in rings[:]:
            r["r"] += r["speed"]
            if r["r"] > max_r:
                rings.remove(r)

        if special_ring is not None:
            special_ring["r"] += special_ring["speed"]
            if special_ring["r"] > max_r:
                special_ring = None

        # ============================================================
        # Update squares movement / rotation
        # ============================================================
        for s in squares[:]:
            s["x"] += s["vx"]
            s["y"] += s["vy"]
            s["rot"] += s["rot_speed"]

            if now >= s["life_end"]:
                squares.remove(s)
                continue
            if s["x"] < -2000 or s["x"] > w + 2000 or s["y"] < -2000 or s["y"] > h + 2000:
                squares.remove(s)


        # ============================================================
        # CHECKS (death)
        # ============================================================
        # Walls lethal
        if left_wall.collidepoint(mx, my) or top_wall.collidepoint(mx, my) or bot_wall.collidepoint(mx, my) or right_wall.collidepoint(mx, my):
            if damage_should_kill(now):
                end_screen("lose")
                return "lose"

        # Boss collision lethal EXCEPT during yellow stun (then mouse can hit once)
        boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)
        if boss_rect.collidepoint(mx, my):
            if in_yellow:
                if (not special_hit_used) and (now >= boss_invuln_until):
                    boss_hp -= 1
                    special_hit_used = True
                    boss_invuln_until = now + BOSS_INVULN_AFTER_HIT_MS
                    if boss_hp <= 0:
                        end_screen("win")
                        return "win"
            else:
                if damage_should_kill(now):
                    end_screen("lose")
                    return "lose"

        # Raygun lethal
        if attack == "raygun" and ray_phase == "lethal":
            for (ax, ay, bx2, by2) in ray_segments:
                if dist_point_to_segment(mx, my, ax, ay, bx2, by2) <= RAY_THICKNESS / 2:
                    if damage_should_kill(now):
                        end_screen("lose")
                        return "lose"
                    break

        # Rings lethal (outline except gap)
        for r in rings:
            if ring_hits_mouse(r, mx, my):
                if damage_should_kill(now):
                    end_screen("lose")
                    return "lose"
                break

        if special_ring is not None and ring_hits_mouse(special_ring, mx, my):
            if damage_should_kill(now):
                end_screen("lose")
                return "lose"

        # Squares lethal
        for s in squares:
            if square_hits_mouse(s, mx, my):
                if damage_should_kill(now):
                    end_screen("lose")
                    return "lose"
                break

        # ============================================================
        # DRAW
        # ============================================================
        screen.fill((0, 0, 255))

        # red walls
        pygame.draw.rect(screen, (255, 0, 0), left_wall)
        pygame.draw.rect(screen, (255, 0, 0), top_wall)
        pygame.draw.rect(screen, (255, 0, 0), bot_wall)
        pygame.draw.rect(screen, (255, 0, 0), right_wall)

        # boss sprite
        # boss zichtbaar behalve tijdens special air/shrink (dan is hij "in de lucht")
        boss_hidden = (attack == "special" and special_state in ("air", "shrink"))
        if not boss_hidden:
            screen.blit(boss_img, (int(boss_x), int(boss_y)))

        # special telegraph (grijs vlak boven cursor)
        if attack == "special" and special_state in ("air", "shrink"):
            if special_state == "air":
                cx, cy = tele_center
                size = boss_size
            else:
                cx, cy = tele_lock_center
                size = max(0, int(tele_rect_size))

            if size > 0:
                rx = int(cx - size / 2)
                ry = int(cy - size / 2)
                pygame.draw.rect(screen, (160, 160, 160), pygame.Rect(rx, ry, size, size), 0)
                pygame.draw.rect(screen, (255, 255, 255), pygame.Rect(rx, ry, size, size), 3)

        # yellow blink in special stun
        if in_yellow and (now // 120) % 2 == 0:
            ov = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            ov.fill((255, 255, 0, 140))
            screen.blit(ov, (int(boss_x), int(boss_y)))

        # Name + HP bar (like beast)
        name_surf = font.render(boss_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        bar_w = max(220, name_rect.width + 60)
        bar_h = 20
        bx = w // 2 - bar_w // 2
        by = name_rect.bottom + 8

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

        # Shield
        draw_shield_pickup()
        draw_shield_indicator()

        # Raygun visuals
        if attack == "raygun":
            bx2 = boss_x + boss_size / 2
            by2 = boss_y + boss_size / 2

            if ray_phase in ("aim", "freeze", "warn"):
                if ray_phase == "aim":
                    dx = mx - bx2
                    dy = my - by2
                    dx, dy = normalize(dx, dy)
                else:
                    dx, dy = ray_dir

                ix, iy, _ = ray_intersect_play_rect(bx2, by2, dx, dy, PLAY_LEFT, PLAY_RIGHT, PLAY_TOP, PLAY_BOT)

                if ray_phase in ("aim", "freeze"):
                    color = (160, 160, 160)
                else:
                    color = (255, 160, 160)

                pygame.draw.line(screen, color, (int(bx2), int(by2)), (int(ix), int(iy)), 6)

            elif ray_phase == "lethal":
                for (ax, ay, cx, cy) in ray_segments:
                    pygame.draw.line(screen, (255, 0, 0), (int(ax), int(ay)), (int(cx), int(cy)), RAY_THICKNESS)

        # Rings draw (with real gap)
        for r in rings:
            draw_ring_outline(screen, r)

        if special_ring is not None:
            draw_ring_outline(screen, special_ring)


        # Squares draw
        for s in squares:
            draw_rot_square(s)

        pygame.display.flip()
        clock.tick(60)









