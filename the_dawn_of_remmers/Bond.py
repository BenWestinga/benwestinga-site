import math
import random
from pathlib import Path
import game_settings

import pygame


def bossfight_Bond(screen, start_stage=1):
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

    def angle_distance(a, b):
        return abs((a - b + math.pi) % math.tau - math.pi)

    def lerp(a, b, t):
        return a + (b - a) * t

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
            msg = "James Bond is defeated" if result == "win" else "You were defeated by James Bond"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 55)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 2500:
                return
            clock.tick(60)

    # ============================================================
    # Load Bond image
    # ============================================================
    try:
        raw_face = pygame.image.load(str(Path(__file__).resolve().with_name("Bond.png"))).convert_alpha()
    except Exception:
        raw_face = pygame.Surface((140, 140), pygame.SRCALPHA)
        raw_face.fill((180, 180, 180))
        pygame.draw.rect(raw_face, (0, 0, 0), raw_face.get_rect(), 3)

    # ============================================================
    # Arena
    # ============================================================
    cx = w // 2
    cy = h // 2 + 10

    base_half_x = int(min(w, h) * 0.65)
    base_half_y = int(min(w, h) * 0.38)
    base_half_x = max(380, min(980, base_half_x))
    base_half_y = max(260, min(760, base_half_y))

    shrink = {"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0}
    temp_shrink = {"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0}
    final_shrink = {"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0}

    def arena_bounds():
        halfx = float(base_half_x)
        halfy = float(base_half_y)

        left = cx - halfx + shrink["L"] + temp_shrink["L"] + final_shrink["L"]
        right = cx + halfx - shrink["R"] - temp_shrink["R"] - final_shrink["R"]
        top = cy - halfy + shrink["T"] + temp_shrink["T"] + final_shrink["T"]
        bottom = cy + halfy - shrink["B"] - temp_shrink["B"] - final_shrink["B"]

        if right - left < 260:
            mid = (left + right) / 2.0
            left = mid - 130
            right = mid + 130
        if bottom - top < 260:
            mid = (top + bottom) / 2.0
            top = mid - 130
            bottom = mid + 130

        return left, top, right, bottom

    def inside_arena(x, y):
        left, top, right, bottom = arena_bounds()
        return left <= x <= right and top <= y <= bottom

    def project_inside(x, y, margin=1.0):
        left, top, right, bottom = arena_bounds()
        x = clamp(x, left + margin, right - margin)
        y = clamp(y, top + margin, bottom - margin)
        return x, y

    def touches_arena_wall(x, y, radius):
        left, top, right, bottom = arena_bounds()
        return x - radius <= left or x + radius >= right or y - radius <= top or y + radius >= bottom

    def bounce_ball(ball):
        left, top, right, bottom = arena_bounds()
        rr = ball["r"]
        bounced = False

        if ball["x"] - rr <= left:
            ball["x"] = left + rr
            ball["vx"] = abs(ball["vx"])
            bounced = True
        elif ball["x"] + rr >= right:
            ball["x"] = right - rr
            ball["vx"] = -abs(ball["vx"])
            bounced = True

        if ball["y"] - rr <= top:
            ball["y"] = top + rr
            ball["vy"] = abs(ball["vy"])
            bounced = True
        elif ball["y"] + rr >= bottom:
            ball["y"] = bottom - rr
            ball["vy"] = -abs(ball["vy"])
            bounced = True

        return bounced

    def bounce_endpoint(x, y, vx, vy, pad):
        left, top, right, bottom = arena_bounds()
        bounced = 0

        if x <= left + pad:
            x = left + pad
            vx = abs(vx)
            bounced += 1
        elif x >= right - pad:
            x = right - pad
            vx = -abs(vx)
            bounced += 1

        if y <= top + pad:
            y = top + pad
            vy = abs(vy)
            bounced += 1
        elif y >= bottom - pad:
            y = bottom - pad
            vy = -abs(vy)
            bounced += 1

        return x, y, vx, vy, bounced

    # ============================================================
    # Shield pickup
    # ============================================================
    shield_spawn_ms = 45000
    invuln_ms = 1000
    shield_radius = 13
    shield_color = (0, 100, 0)
    indicator_pos = (270, 160)

    shield_pos = None
    shield_active = False
    invuln_until = 0
    next_shield_spawn = pygame.time.get_ticks() + shield_spawn_ms

    def maybe_spawn_shield(now):
        if game_settings.NO_SHIELDS:
            return
        nonlocal shield_pos, next_shield_spawn
        if shield_pos is None and now >= next_shield_spawn:
            left, top, right, bottom = arena_bounds()
            sx = random.randint(int(left + 80), int(right - 80))
            sy = random.randint(int(top + 80), int(bottom - 80))
            shield_pos = (float(sx), float(sy))
            next_shield_spawn = now + shield_spawn_ms

    def try_pickup_shield(mx, my):
        nonlocal shield_pos, shield_active
        if shield_pos is None:
            return
        sx, sy = shield_pos
        if (mx - sx) ** 2 + (my - sy) ** 2 <= shield_radius ** 2:
            shield_active = True
            shield_pos = None

    def draw_shield_pickup():
        if shield_pos is not None:
            pygame.draw.circle(screen, shield_color, (int(shield_pos[0]), int(shield_pos[1])), shield_radius)
            pygame.draw.circle(screen, (255, 255, 255), (int(shield_pos[0]), int(shield_pos[1])), shield_radius, 2)

    def draw_shield_indicator():
        if shield_active:
            pygame.draw.circle(screen, (0, 0, 139), indicator_pos, 12)
            pygame.draw.circle(screen, (255, 255, 255), indicator_pos, 12, 2)

    def damage_should_kill(now):
        nonlocal shield_active, invuln_until
        if now < invuln_until:
            return False
        if shield_active:
            shield_active = False
            invuln_until = now + invuln_ms
            return False
        return True

    def die(now):
        if damage_should_kill(now):
            end_screen("lose")
            return True
        return False

    # ============================================================
    # Boss
    # ============================================================
    boss_name = "James Bond"
    boss_hp = 5
    boss_max_hp = 5

    boss_size = 120
    boss_img = pygame.transform.smoothscale(raw_face, (boss_size, boss_size))

    boss_margin = 16
    boss_x = float(cx - boss_size / 2)
    boss_y = float((cy + base_half_y) - boss_size - boss_margin)

    def boss_rect():
        return pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)

    def boss_center():
        return boss_x + boss_size / 2, boss_y + boss_size / 2

    boss_flash_until = 0
    boss_black_until = 0
    boss_pause_until = 0
    boss_pending_move = None

    stage2_active = False
    stage3_active = False
    stage4_active = False
    stage5_active = False

    final_phase_active = False
    final_phase_state = "idle"
    final_phase_started_at = 0
    final_phase_lock_angle = 0.0
    final_phase_aim_angle = 0.0
    final_phase_beam = None
    final_phase_shrink_target = {"L": 0.0, "R": 0.0, "T": 0.0, "B": 0.0}

    phase2_next_attack_start = 0
    phase2_wait_for_damage = False

    stage3_next_attack_start = 0
    stage3_wait_for_damage = False
    stage3_attack_pool = []

    def flash_boss(now):
        nonlocal boss_flash_until
        boss_flash_until = max(boss_flash_until, now + 240)

    def draw_boss(now):
        if now < boss_black_until:
            dark = boss_img.copy()
            dark.fill((0, 0, 0, 255), special_flags=pygame.BLEND_RGBA_MULT)
            screen.blit(dark, (int(boss_x), int(boss_y)))
        else:
            screen.blit(boss_img, (int(boss_x), int(boss_y)))

        if now < boss_flash_until:
            overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            overlay.fill((255, 0, 0, 90))
            screen.blit(overlay, (int(boss_x), int(boss_y)), special_flags=pygame.BLEND_RGBA_ADD)

    def set_boss_size(new_size):
        nonlocal boss_size, boss_img, boss_x, boss_y
        cxb, cyb = boss_center()
        boss_size = int(clamp(new_size, 56, 420))
        boss_img = pygame.transform.smoothscale(raw_face, (boss_size, boss_size))
        boss_x = float(cxb - boss_size / 2)
        boss_y = float(cyb - boss_size / 2)

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
    # Render helpers
    # ============================================================
    face_cache = {}
    tinted_face_cache = {}
    black_face_cache = {}

    def get_face_sprite(radius):
        diameter = max(12, int(radius * 2))
        if diameter not in face_cache:
            face_cache[diameter] = pygame.transform.smoothscale(raw_face, (diameter, diameter))
        return face_cache[diameter]

    def get_tinted_face_sprite(radius, tint_rgb):
        diameter = max(12, int(radius * 2))
        tr, tg, tb = int(tint_rgb[0]), int(tint_rgb[1]), int(tint_rgb[2])
        key = (diameter, tr, tg, tb)
        if key not in tinted_face_cache:
            sprite = get_face_sprite(radius).copy()
            tint = pygame.Surface((diameter, diameter), pygame.SRCALPHA)
            tint.fill((tr, tg, tb, 0))
            sprite.blit(tint, (0, 0), special_flags=pygame.BLEND_RGBA_ADD)
            tinted_face_cache[key] = sprite
        return tinted_face_cache[key]

    def get_black_face_sprite(radius):
        diameter = max(12, int(radius * 2))
        if diameter not in black_face_cache:
            sprite = get_face_sprite(radius).copy()
            sprite.fill((0, 0, 0, 255), special_flags=pygame.BLEND_RGBA_MULT)
            black_face_cache[diameter] = sprite
        return black_face_cache[diameter]

    def draw_face_ball(x, y, radius, glow=None, outline=None, tint=None, alpha=255, black=False):
        if glow is not None:
            pygame.draw.circle(screen, glow, (int(x), int(y)), int(radius))
        if black:
            sprite = get_black_face_sprite(radius)
        elif tint is not None:
            sprite = get_tinted_face_sprite(radius, tint)
        else:
            sprite = get_face_sprite(radius)
        if alpha < 255:
            sprite = sprite.copy()
            sprite.set_alpha(max(0, min(255, int(alpha))))
        rect = sprite.get_rect(center=(int(x), int(y)))
        screen.blit(sprite, rect)
        if outline is not None:
            pygame.draw.circle(screen, outline, (int(x), int(y)), int(radius), 2)

    def circle_hits_player(px, py, pr, mx, my):
        return (mx - px) ** 2 + (my - py) ** 2 <= pr ** 2

    def square_hits_player(px, py, half_side, mx, my):
        return abs(mx - px) <= half_side and abs(my - py) <= half_side

    def draw_soft_circle(x, y, radius, color):
        rr = int(max(1, radius))
        surf = pygame.Surface((rr * 2 + 4, rr * 2 + 4), pygame.SRCALPHA)
        pygame.draw.circle(surf, color, (rr + 2, rr + 2), rr)
        screen.blit(surf, (int(x) - rr - 2, int(y) - rr - 2))

    def triangle_vertices(x, y, vx, vy, size):
        ang = math.atan2(vy, vx) if abs(vx) + abs(vy) > 1e-9 else 0.0
        a0 = ang
        a1 = ang + 2.45
        a2 = ang - 2.45
        return [
            (x + math.cos(a0) * size, y + math.sin(a0) * size),
            (x + math.cos(a1) * size, y + math.sin(a1) * size),
            (x + math.cos(a2) * size, y + math.sin(a2) * size),
        ]

    def point_in_triangle(px, py, tri):
        (x1, y1), (x2, y2), (x3, y3) = tri
        den = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3)
        if abs(den) < 1e-9:
            return False
        a = ((y2 - y3) * (px - x3) + (x3 - x2) * (py - y3)) / den
        b = ((y3 - y1) * (px - x3) + (x1 - x3) * (py - y3)) / den
        c = 1.0 - a - b
        return a >= 0.0 and b >= 0.0 and c >= 0.0

    # ============================================================
    # Containers / params
    # ============================================================
    homing_attackers = []
    homing_shots = []
    ring_attackers = []
    ring_balls = []
    trail_balls = []
    trail_segments = []
    gravity_attackers = []
    gravity_clusters = []
    splitter_balls = []
    sentry_attackers = []
    sentry_wave_attackers = []
    sentry_shots = []

    lethal_zones = []
    visual_pulses = []

    damage_balls = []
    damage_orbs = []
    damage_radial_shots = []

    phase2_line_shots = []
    phase2_stream_balls = []
    phase2_giant_homing_balls = []
    phase2_shrink_rings = []
    phase2_bouncy_lines = []

    phase2_line_attackers = []
    phase2_stream_attackers = []
    phase2_giant_attackers = []
    phase2_shrink_attackers = []
    phase2_bouncy_line_attackers = []

    stage3_active_attacks = []
    stage3_hole_walls = []
    stage3_laser_sequences = []
    stage3_laser_beams = []
    stage3_laser_balls = []
    stage3_swing_lines = []
    stage3_trap_rings = []

    stage3_minibosses = []
    stage3_grow_balls = []
    stage3_craters = []
    spiral_anchors = []

    # Stage 4 containers
    stage4_line_shots = []
    stage4_line_trails = []
    stage4_bounce_balls = []
    stage4_small_balls = []
    stage4_triangles = []

    # Stage 5 containers
    stage5_a1_trails = []
    stage5_a1_shots = []
    stage5_a2_big_squares = []
    stage5_a2_small_squares = []
    stage5_a2_small_circles = []
    stage5_a2_triangles = []
    stage5_jump_markers = []
    stage5_meteors = []
    stage5_meteor_shards = []
    stage5_a4_circles = []

    attack_queue = []
    next_attack_time = pygame.time.get_ticks() + 1800
    attack_interval_ms = 12000

    phase2_attack_queue = []
    phase2_attack_start_interval_ms = 12000
    phase2_attack_duration_ms = 30000

    phase2_line_shot_interval_ms = 2000
    phase2_line_speed = 8.2

    phase2_stream_speed = 8.2
    phase2_stream_spawn_min_ms = 120
    phase2_stream_spawn_max_ms = 280
    phase2_stream_burst_on_ms = 30000
    phase2_stream_burst_off_ms = 0
    phase2_stream_ball_lifetime_ms = 6000

    phase2_giant_homing_speed = 2.3
    phase2_giant_spawn_interval_ms = 4000

    phase2_shrink_spawn_interval_ms = int(30000 / 18)
    phase2_shrink_ring_lifetime_ms = 3400

    phase2_bouncy_line_spawn_interval_ms = int(30000 / 10)
    phase2_bouncy_line_speed = 6.4
    phase2_bouncy_line_width = 14

    stage3_attack_interval_ms = 13000
    stage3_attack_duration_ms = 25000

    stage3_grow_spawn_interval_ms = 4000
    stage4_attack_duration_ms = 40000
    stage4_attack_overlap_start_ms = 0
    stage4_wait_for_damage = False
    stage4_cycle_start = 0
    stage4_attack1 = None
    stage4_attack2 = None
    stage4_attack1_start_at = 0
    stage4_attack2_start_at = 0
    stage4_cycle_end_at = 0
    stage4_attack1_started = False
    stage4_attack2_started = False

    stage5_attack_duration_ms = 25000
    stage5_attack_rest_ms = 1000
    stage5_wait_for_damage = False
    stage5_attack_pool = []
    stage5_current_attack = 0
    stage5_attack_start = 0
    stage5_attack_end = 0
    stage5_rest_until = 0

    stage5_boss_vx = 0.0
    stage5_boss_vy = 0.0
    stage5_a1_last_trail = 0
    stage5_a1_growth_ready_at = 0
    stage5_a1_next_shot = 0

    stage5_a2_angle = 0.0
    stage5_a2_next_sub = 0

    stage5_jump_mode = "idle"
    stage5_jump_land_at = 0
    stage5_jump_next_at = 0
    stage5_jump_target = (0.0, 0.0)
    stage5_jump_count = 0
    stage5_jump_max = 11
    stage5_a4_angle = 0.0
    stage5_a4_next_circle = 0
    stage5_a4_dash = None

    stun_until = 0
    stun_hold = [w * 0.5, h * 0.5]

    cursor_prev = [w * 0.5, h * 0.5]
    cursor_vel = [0.0, 0.0]
    arena_safe_until = pygame.time.get_ticks() + 900

    def clear_stage1_attacks():
        homing_attackers.clear()
        homing_shots.clear()
        ring_attackers.clear()
        ring_balls.clear()
        trail_balls.clear()
        trail_segments.clear()
        gravity_attackers.clear()
        gravity_clusters.clear()
        splitter_balls.clear()
        sentry_attackers.clear()
        sentry_wave_attackers.clear()
        sentry_shots.clear()
        lethal_zones.clear()
        damage_balls.clear()
        damage_orbs.clear()
        damage_radial_shots.clear()
        visual_pulses.clear()
        attack_queue.clear()

    def clear_phase2_attacks():
        phase2_line_shots.clear()
        phase2_stream_balls.clear()
        phase2_giant_homing_balls.clear()
        phase2_shrink_rings.clear()
        phase2_bouncy_lines.clear()
        phase2_line_attackers.clear()
        phase2_stream_attackers.clear()
        phase2_giant_attackers.clear()
        phase2_shrink_attackers.clear()
        phase2_bouncy_line_attackers.clear()

    def clear_stage3_nonpersistent_attacks():
        stage3_active_attacks.clear()
        stage3_hole_walls.clear()
        stage3_laser_sequences.clear()
        stage3_laser_beams.clear()
        stage3_laser_balls.clear()
        stage3_swing_lines.clear()
        stage3_trap_rings.clear()

    def clear_stage4_attacks():
        stage4_line_shots.clear()
        stage4_line_trails.clear()
        stage4_bounce_balls.clear()
        stage4_small_balls.clear()
        stage4_triangles.clear()

    def clear_stage5_attacks():
        stage5_a1_trails.clear()
        stage5_a1_shots.clear()
        stage5_a2_big_squares.clear()
        stage5_a2_small_squares.clear()
        stage5_a2_small_circles.clear()
        stage5_a2_triangles.clear()
        stage5_jump_markers.clear()
        stage5_meteors.clear()
        stage5_meteor_shards.clear()
        stage5_a4_circles.clear()

    def trigger_stun(now, dur_ms, mx, my):
        nonlocal stun_until
        stun_until = max(stun_until, now + int(dur_ms))
        stun_hold[0] = float(mx)
        stun_hold[1] = float(my)

    def start_final_phase(now):
        nonlocal stage2_active, stage3_active, stage4_active, stage5_active
        nonlocal phase2_wait_for_damage, stage3_wait_for_damage, stage4_wait_for_damage, stage5_wait_for_damage
        nonlocal final_phase_active, final_phase_state, final_phase_started_at, final_phase_lock_angle
        nonlocal final_phase_aim_angle, final_phase_beam, final_phase_shrink_target
        nonlocal boss_x, boss_y, boss_pause_until, boss_black_until

        stage2_active = False
        stage3_active = False
        stage4_active = False
        stage5_active = False

        phase2_wait_for_damage = False
        stage3_wait_for_damage = False
        stage4_wait_for_damage = False
        stage5_wait_for_damage = False

        clear_stage1_attacks()
        clear_phase2_attacks()
        clear_stage3_nonpersistent_attacks()
        clear_stage4_attacks()
        clear_stage5_attacks()
        stage3_minibosses.clear()
        stage3_grow_balls.clear()
        stage3_craters.clear()
        damage_balls.clear()
        damage_orbs.clear()
        damage_radial_shots.clear()

        final_phase_active = True
        final_phase_state = "charge"
        final_phase_started_at = now
        final_phase_lock_angle = 0.0
        final_phase_aim_angle = 0.0
        final_phase_beam = None

        left, top, right, bottom = arena_bounds()
        mid_y = (top + bottom - boss_size) / 2.0
        boss_x = float(clamp(left + boss_margin, left + 2, right - boss_size - 2))
        boss_y = float(clamp(mid_y, top + 2, bottom - boss_size - 2))

        aw = max(1.0, right - left)
        ah = max(1.0, bottom - top)
        final_shrink["L"] = 0.0
        final_shrink["R"] = 0.0
        final_shrink["T"] = 0.0
        final_shrink["B"] = 0.0
        final_phase_shrink_target = {
            "L": -aw * 0.45,
            "R": -aw * 0.45,
            "T": -ah * 0.45,
            "B": -ah * 0.45,
        }

        boss_black_until = 0
        boss_pause_until = now + 400

    def init_stage4_cycle(now):
        nonlocal stage4_cycle_start, stage4_wait_for_damage, stage4_attack1, stage4_attack2
        nonlocal stage4_attack1_start_at, stage4_attack2_start_at, stage4_cycle_end_at
        nonlocal stage4_attack1_started, stage4_attack2_started
        stage4_wait_for_damage = False
        stage4_cycle_start = now
        stage4_attack1 = None
        stage4_attack2 = None

        first_delay = random.randint(0, 6000)
        gap_delay = random.randint(3500, 11000)
        if random.choice((1, 2)) == 1:
            stage4_attack1_start_at = now + first_delay
            stage4_attack2_start_at = stage4_attack1_start_at + gap_delay
        else:
            stage4_attack2_start_at = now + first_delay
            stage4_attack1_start_at = stage4_attack2_start_at + gap_delay

        stage4_attack1_started = False
        stage4_attack2_started = False
        stage4_cycle_end_at = max(stage4_attack1_start_at, stage4_attack2_start_at) + stage4_attack_duration_ms
        clear_stage4_attacks()

    def init_stage5_cycle(now):
        nonlocal stage5_wait_for_damage, stage5_attack_pool, stage5_current_attack
        nonlocal stage5_attack_start, stage5_attack_end, stage5_rest_until, stage5_a1_growth_ready_at, stage5_a1_next_shot
        nonlocal stage5_jump_count
        stage5_wait_for_damage = False
        stage5_attack_pool = [1, 2, 3]
        random.shuffle(stage5_attack_pool)
        stage5_current_attack = 0
        stage5_attack_start = 0
        stage5_attack_end = 0
        stage5_rest_until = now
        stage5_a1_growth_ready_at = 0
        stage5_a1_next_shot = 0
        stage5_jump_count = 0
        clear_stage5_attacks()

    def stage5_prepare_jump(now):
        nonlocal stage5_jump_mode, stage5_jump_land_at, stage5_jump_target
        nonlocal boss_black_until
        left, top, right, bottom = arena_bounds()
        tx = random.uniform(left + 100, right - 100)
        ty = random.uniform(top + 100, bottom - 100)
        stage5_jump_target = (tx, ty)
        stage5_jump_land_at = now + 1000
        stage5_jump_mode = "prep"
        stage5_jump_markers.append({
            "kind": "boss",
            "x": tx,
            "y": ty,
            "size": max(56.0, boss_size * 1.3),
            "start": now,
            "end": stage5_jump_land_at,
            "shrink": True,
        })
        boss_black_until = stage5_jump_land_at
    def phase2_line_segment(shot):
        left, top, right, bottom = arena_bounds()
        x = clamp(shot["x"], left + 2, right - 2)
        if shot["line_dir"] < 0:
            ax = x
            ay = shot["y"] - shot["r"]
            bx = x
            by = top
        else:
            ax = x
            ay = shot["y"] + shot["r"]
            bx = x
            by = bottom
        return ax, ay, bx, by

    def phase2_shrink_radius(ring, now):
        total = max(1, ring["end_time"] - ring["spawn_time"])
        t = clamp((now - ring["spawn_time"]) / total, 0.0, 1.0)
        return ring["start_r"] + (ring["end_r"] - ring["start_r"]) * t

    def phase2_shrink_profile(ring, now):
        rr = phase2_shrink_radius(ring, now)
        th = max(8, int(ring["thickness"]))
        gap_angle = ring["gap_angle"]
        gap_half = ring["gap_half"]
        a1 = gap_angle - gap_half
        a2 = gap_angle + gap_half
        while a2 < a1:
            a2 += math.tau
        arc_start = a2
        arc_end = a1 + math.tau
        inner_r = max(0.0, rr - th * 0.5)
        outer_r = rr + th * 0.5
        return rr, th, gap_angle, gap_half, arc_start, arc_end, inner_r, outer_r
    def spawn_phase2_line_shot(now, px, py):
        bx, by = boss_center()
        dx, dy = normalize(px - bx, py - by)
        phase2_line_shots.append({
            "x": float(bx),
            "y": float(by),
            "vx": dx * phase2_line_speed,
            "vy": dy * phase2_line_speed,
            "r": 18,
            "line_dir": random.choice((-1, 1)),
            "line_width": 12,
            "expire_time": now + 5000,
        })

    def spawn_phase2_stream_ball(now):
        left, top, right, bottom = arena_bounds()
        r = max(42, int(boss_size * 0.45))
        sx = random.uniform(left + r, right - r)
        from_top = random.random() < 0.5

        if from_top:
            sy = top - r + 4.0
            vy = phase2_stream_speed
        else:
            sy = bottom + r - 4.0
            vy = -phase2_stream_speed

        phase2_stream_balls.append({
            "x": float(sx),
            "y": float(sy),
            "vx": random.uniform(-1.6, 1.6),
            "vy": float(vy),
            "r": float(r),
            "expire_time": now + phase2_stream_ball_lifetime_ms,
        })

    def spawn_phase2_giant_homing_ball(now):
        if phase2_giant_homing_balls:
            return
        bx, by = boss_center()
        left, _, _, _ = arena_bounds()
        sx = max(left + boss_size * 0.55, bx - boss_size * 0.9)
        sy = by
        dx, dy = normalize(0.0, 1.0)
        phase2_giant_homing_balls.append({
            "x": float(sx),
            "y": float(sy),
            "vx": dx * phase2_giant_homing_speed,
            "vy": dy * phase2_giant_homing_speed,
            "r": float(max(106, int(boss_size * 1.10))),
            "end_time": now + 30000,
        })

    def spawn_phase2_shrink_ring(now):
        left, top, right, bottom = arena_bounds()
        cx_ring = (left + right) * 0.5
        cy_ring = (top + bottom) * 0.5
        max_r = math.hypot(max(cx_ring - left, right - cx_ring), max(cy_ring - top, bottom - cy_ring)) + 60.0

        phase2_shrink_rings.append({
            "cx": float(cx_ring),
            "cy": float(cy_ring),
            "start_r": float(max_r),
            "end_r": 10.0,
            "thickness": float(max(5, min(10, int(min(right - left, bottom - top) * 0.014)))),
            "gap_angle": random.uniform(0.0, math.tau),
            "gap_half": 0.50,
            "spawn_time": now,
            "end_time": now + phase2_shrink_ring_lifetime_ms,
        })

    def spawn_phase2_bouncy_line(now, px, py):
        bx, by = boss_center()
        dx, dy = normalize(px - bx, py - by)
        pdx, pdy = -dy, dx
        half_len = random.uniform(180.0, 280.0)

        x1, y1 = project_inside(bx + pdx * half_len, by + pdy * half_len, margin=8)
        x2, y2 = project_inside(bx - pdx * half_len, by - pdy * half_len, margin=8)

        s1 = random.uniform(-2.6, 2.6)
        s2 = random.uniform(-2.6, 2.6)

        phase2_bouncy_lines.append({
            "x1": float(x1),
            "y1": float(y1),
            "x2": float(x2),
            "y2": float(y2),
            "vx1": dx * phase2_bouncy_line_speed + pdx * s1,
            "vy1": dy * phase2_bouncy_line_speed + pdy * s1,
            "vx2": dx * phase2_bouncy_line_speed + pdx * s2,
            "vy2": dy * phase2_bouncy_line_speed + pdy * s2,
            "width": phase2_bouncy_line_width,
            "bounces_left": 7,
            "end_time": now + 30000,
        })

    def miniboss_is_blinking(miniboss, now):
        elapsed = now - miniboss["spawn_time"]
        cycle_pos = elapsed % 20000
        return cycle_pos >= 18000

    def spawn_damage_radial(center_x, center_y, count, speed, life_ms, now):
        for i in range(count):
            ang = (i / max(1, count)) * math.tau
            damage_radial_shots.append({
                "x": float(center_x),
                "y": float(center_y),
                "vx": math.cos(ang) * speed,
                "vy": math.sin(ang) * speed,
                "half": 8.0,
                "expire_time": now + life_ms,
            })

    # Explosion zones now have a clear warning window before they become lethal.
    def spawn_lethal_zone(now, x, y, radius, life_ms, warn_ms=450):
        warn_ms = int(max(0, warn_ms))
        lethal_zones.append({
            "x": float(x),
            "y": float(y),
            "r": float(radius),
            "active_time": now + warn_ms,
            "end_time": now + warn_ms + int(life_ms),
            "color": (255, 0, 0),
            "solid": True,
        })

    def spawn_stage3_miniboss(kind, now):
        bx, by = boss_center()
        mb = {
            "kind": kind,
            "x": float(bx),
            "y": float(by),
            "r": 34.0,
            "spawn_time": now,
            "next_attack": now,
            "attack_type": None,
            "attack_end": now,
            "beam_angle": random.uniform(0.0, math.tau),
            "beam_safe_until": now,
            "next_dash": now,
            "target_x": float(bx),
            "target_y": float(by),
            "dash_vx": 0.0,
            "dash_vy": 0.0,
            "dash_end": now,
            "next_charge": now + 1800,
            "pre_dash_until": now,
            "charge_end": now,
            "charge_vx": 0.0,
            "charge_vy": 0.0,
            "grow_target_x": float(bx),
            "grow_target_y": float(by),
            "next_spawn": now + 8000,
        }
        if kind == "predictive":
            mb["next_charge"] = now + 11800
        elif kind == "grow":
            left, top, right, bottom = arena_bounds()
            grow_idx = sum(1 for existing in stage3_minibosses if existing["kind"] == "grow")
            lane_count = 1
            lane = grow_idx % lane_count
            lane_y = top + (lane + 1) * ((bottom - top) / (lane_count + 1))
            fixed_x = left + mb["r"] + 4.0
            mb["x"] = float(clamp(fixed_x, left + mb["r"] + 4.0, right - mb["r"] - 4.0))
            mb["y"] = float(clamp(lane_y, top + mb["r"] + 4.0, bottom - mb["r"] - 4.0))
            mb["grow_target_x"] = mb["x"]
            mb["grow_target_y"] = mb["y"]
            mb["next_spawn"] = now + stage3_grow_spawn_interval_ms
        stage3_minibosses.append(mb)

    def init_stage3_cycle(now):
        nonlocal stage3_next_attack_start, stage3_wait_for_damage, stage3_attack_pool
        stage3_attack_pool = [2, 4, 5, 6, 7, 8]
        random.shuffle(stage3_attack_pool)
        stage3_next_attack_start = now
        stage3_wait_for_damage = False
        clear_stage3_nonpersistent_attacks()

    def stage3_conflicts_with_active(attack_id):
        return False

    def try_pick_stage3_attack():
        for idx, atk_id in enumerate(stage3_attack_pool):
            if not stage3_conflicts_with_active(atk_id):
                stage3_attack_pool.pop(idx)
                return atk_id
        return None

    def spawn_stage3_attack(attack_id, now, px, py):
        left, top, right, bottom = arena_bounds()
        atk = {"id": attack_id, "start": now, "end": now + stage3_attack_duration_ms}

        if attack_id == 2:
            atk["next_wall"] = now
        elif attack_id == 3:
            atk["spawned0"] = False
            atk["spawned12"] = False
        elif attack_id == 4:
            stage3_laser_sequences.append({"start": now, "locked": False, "fired": False, "lock_angle": 0.0})
            stage3_laser_sequences.append({"start": now + 10000, "locked": False, "fired": False, "lock_angle": 0.0})
        elif attack_id == 5:
            spawn_stage3_miniboss("predictive", now)
        elif attack_id == 6:
            stage3_swing_lines.append({"start": now, "end": now + stage3_attack_duration_ms, "width": 24.0, "hole_half": 70.0})
        elif attack_id == 7:
            spawn_stage3_miniboss("grow", now)
        elif attack_id == 8:
            thickness = 24.0
            lock_r_max = min((right - left) * 0.5, (bottom - top) * 0.5) - 14.0
            lock_r = max(170.0, lock_r_max * 0.92)
            safe_r = max(40.0, lock_r)
            spawn_x = clamp(px, left + safe_r, right - safe_r)
            spawn_y = clamp(py, top + safe_r, bottom - safe_r)
            stage3_trap_rings.append({
                "x": float(spawn_x),
                "y": float(spawn_y),
                "r": lock_r + thickness * 0.5 + 6.0,
                "thickness": thickness,
                "vx": random.choice((-1, 1)) * random.uniform(1.8, 2.6),
                "vy": random.choice((-1, 1)) * random.uniform(1.8, 2.6),
                "safe_until": now + 1200,
                "end": now + stage3_attack_duration_ms,
            })

        stage3_active_attacks.append(atk)

    def refresh_stage3_temp_shrink(now):
        temp_shrink["L"] = 0.0
        temp_shrink["R"] = 0.0
        temp_shrink["T"] = 0.0
        temp_shrink["B"] = 0.0

    def fill_phase2_attack_queue():
        phase2_attack_queue.clear()
        order = ["phase2_line", "phase2_stream", "phase2_giant_homing", "phase2_bouncy_line"]
        random.shuffle(order)
        phase2_attack_queue.extend(order)
        phase2_attack_queue.append("damage")
    def start_phase2_attack(now, px, py):
        nonlocal phase2_wait_for_damage

        if not phase2_attack_queue:
            fill_phase2_attack_queue()

        attack_name = phase2_attack_queue.pop(0)

        if attack_name == "phase2_line":
            phase2_line_attackers.append({"end_time": now + phase2_attack_duration_ms, "next_shot": now})
        elif attack_name == "phase2_stream":
            phase2_stream_attackers.append({"start_time": now, "end_time": now + phase2_attack_duration_ms, "next_spawn": now})
        elif attack_name == "phase2_giant_homing":
            if not phase2_giant_homing_balls:
                spawn_phase2_giant_homing_ball(now)
        elif attack_name == "phase2_bouncy_line":
            phase2_bouncy_line_attackers.append({"end_time": now + phase2_attack_duration_ms, "next_spawn": now, "spawns_left": 10})
        else:
            spawn_damage_attack(now, px, py)
            phase2_wait_for_damage = False

    def fill_attack_queue():
        attack_queue.clear()
        order = ["homing", "ring", "trail", "gravity", "splitter", "sentry"]
        random.shuffle(order)
        attack_queue.extend(order)
        attack_queue.append("damage")

    def spawn_homing_attack(now):
        homing_attackers.append({"end_time": now + 20000, "next_shot": now, "shots_left": 10})

    def spawn_ring_attack(now, px, py):
        ring_attackers.append({"end_time": now + 20000, "next_burst": now, "bursts_left": 5, "aim_x": px, "aim_y": py})

    def spawn_trail_attack(now, px, py):
        bx, by = boss_center()
        dx, dy = normalize(px - bx, py - by)
        trail_balls.append({
            "x": float(bx), "y": float(by), "vx": dx * 5.0, "vy": dy * 5.0,
            "r": 18, "end_time": now + 20000, "next_trail": now, "trail_gap_ms": 200,
        })

    def spawn_gravity_attack(now):
        gravity_attackers.append({"end_time": now + 20000, "next_spawn": now, "spawns_left": 6})

    def spawn_splitter_attack(now, px, py):
        bx, by = boss_center()
        dx, dy = normalize(px - bx, py - by)
        splitter_balls.append({
            "x": float(bx), "y": float(by), "vx": dx * 4.8, "vy": dy * 4.8,
            "r": 18, "bounces_left": 4, "spawn_lock_until": now + 500, "expire_time": now + 30000,
        })

    def spawn_sentry_attack(now, px, py):
        sentry_wave_attackers.append({
            "end_time": now + 20000,
            "next_spawn": now,
        })

    def spawn_damage_attack(now, px, py):
        bx, by = boss_center()
        dx, dy = normalize(px - bx, py - by)
        damage_balls.append({
            "x": float(bx), "y": float(by), "vx": dx * 5.8, "vy": dy * 5.8,
            "r": 34, "spawn_time": now, "explode_time": now + 40000, "next_radial": now + 3000,
        })

    def start_stage_attack(now, px, py):
        if not attack_queue:
            fill_attack_queue()
        attack_name = attack_queue.pop(0)

        if attack_name == "homing":
            spawn_homing_attack(now)
        elif attack_name == "ring":
            spawn_ring_attack(now, px, py)
        elif attack_name == "trail":
            spawn_trail_attack(now, px, py)
        elif attack_name == "gravity":
            spawn_gravity_attack(now)
        elif attack_name == "splitter":
            spawn_splitter_attack(now, px, py)
        elif attack_name == "sentry":
            spawn_sentry_attack(now, px, py)
        else:
            spawn_damage_attack(now, px, py)

    def boss_take_damage(now):
        nonlocal boss_hp, boss_x, boss_y
        nonlocal stage2_active, stage3_active, stage4_active, stage5_active
        nonlocal boss_pause_until, boss_black_until, boss_pending_move
        nonlocal phase2_next_attack_start, phase2_wait_for_damage
        nonlocal stage3_wait_for_damage, stage3_next_attack_start
        nonlocal stage4_wait_for_damage, stage5_wait_for_damage
        nonlocal arena_safe_until

        hp_before = boss_hp
        boss_hp -= 1
        flash_boss(now)
        if boss_hp <= 0:
            boss_hp = 0
            end_screen("win")
            return True

        pause_ms = 2000
        target_mode = "right"
        center_after_black = False

        if hp_before == 5:
            stage2_active = True
            stage3_active = False
            stage4_active = False
            stage5_active = False
            phase2_wait_for_damage = False
            clear_stage1_attacks()
            clear_phase2_attacks()
            fill_phase2_attack_queue()
            target_mode = "left"
        elif hp_before == 4:
            stage2_active = False
            stage3_active = True
            stage4_active = False
            stage5_active = False
            clear_phase2_attacks()
            phase2_wait_for_damage = False
            init_stage3_cycle(now)
            target_mode = "right"
        elif hp_before == 3:
            stage2_active = False
            stage3_active = False
            stage4_active = True
            stage5_active = False
            stage3_wait_for_damage = False
            stage3_attack_pool.clear()
            clear_stage3_nonpersistent_attacks()
            stage3_minibosses.clear()
            stage3_grow_balls.clear()
            stage3_craters.clear()
            init_stage4_cycle(now + 700)
            target_mode = "center"
            boss_black_until = max(boss_black_until, now + 1200)
        elif hp_before == 2:
            stage2_active = False
            stage3_active = False
            stage4_active = False
            stage5_active = True
            stage4_wait_for_damage = False
            clear_stage4_attacks()
            init_stage5_cycle(now + 700)
            target_mode = "top"
        boss_pause_until = max(boss_pause_until, now + pause_ms)
        arena_safe_until = max(arena_safe_until, now + 900)
        phase2_next_attack_start = max(phase2_next_attack_start, boss_pause_until)
        stage3_next_attack_start = max(stage3_next_attack_start, boss_pause_until)

        left, top, right, bottom = arena_bounds()
        arena_w = right - left
        arena_h = bottom - top
        shrink["L"] += arena_w * 0.04
        shrink["R"] += arena_w * 0.04
        shrink["T"] += arena_h * 0.04
        shrink["B"] += arena_h * 0.04

        left, top, right, bottom = arena_bounds()
        mid_x = (left + right - boss_size) / 2.0
        mid_y = (top + bottom - boss_size) / 2.0

        if center_after_black:
            boss_black_until = max(boss_black_until, now + 1000)
            boss_pending_move = {"x": float(mid_x), "y": float(mid_y), "at": now + 1000}
        else:
            boss_pending_move = None
            if target_mode == "left":
                nx = left + boss_margin
                ny = mid_y
            elif target_mode == "top":
                nx = mid_x
                ny = top + boss_margin
            elif target_mode == "center":
                nx = mid_x
                ny = mid_y
            else:
                nx = right - boss_size - boss_margin
                ny = mid_y
            boss_x = float(clamp(nx, left + 2, right - boss_size - 2))
            boss_y = float(clamp(ny, top + 2, bottom - boss_size - 2))
            if stage4_active:
                safe_px = int(clamp(left + (right - left) * 0.18, 0, w - 1))
                safe_py = int(clamp((top + bottom) * 0.5, 0, h - 1))
                pygame.mouse.set_pos((safe_px, safe_py))
                cursor_prev[0] = safe_px
                cursor_prev[1] = safe_py

        return False

    try:
        start_stage = int(start_stage)
    except Exception:
        start_stage = 1
    start_stage = max(1, min(5, start_stage))

    if start_stage > 1:
        now_boot = pygame.time.get_ticks()
        clear_stage1_attacks()
        clear_phase2_attacks()
        clear_stage3_nonpersistent_attacks()
        clear_stage4_attacks()
        clear_stage5_attacks()
        stage3_minibosses.clear()
        stage3_grow_balls.clear()
        stage3_craters.clear()
        damage_balls.clear()
        damage_orbs.clear()
        damage_radial_shots.clear()

        phase2_wait_for_damage = False
        stage3_wait_for_damage = False
        stage4_wait_for_damage = False
        stage5_wait_for_damage = False

        stage3_attack_pool = []
        boss_pending_move = None

        hits_taken = start_stage - 1
        boss_hp = max(1, boss_max_hp - hits_taken)

        for _ in range(hits_taken):
            left, top, right, bottom = arena_bounds()
            arena_w = right - left
            arena_h = bottom - top
            shrink["L"] += arena_w * 0.04
            shrink["R"] += arena_w * 0.04
            shrink["T"] += arena_h * 0.04
            shrink["B"] += arena_h * 0.04

        stage2_active = (start_stage == 2)
        stage3_active = (start_stage == 3)
        stage4_active = (start_stage == 4)
        stage5_active = (start_stage == 5)

        phase2_attack_queue.clear()
        fill_phase2_attack_queue()
        phase2_next_attack_start = now_boot + 900

        if stage3_active:
            init_stage3_cycle(now_boot + 700)
            stage3_next_attack_start = now_boot + 700
        else:
            stage3_next_attack_start = 0

        if stage4_active:
            init_stage4_cycle(now_boot + 700)

        if stage5_active:
            init_stage5_cycle(now_boot + 700)

        left, top, right, bottom = arena_bounds()
        mid_x = (left + right - boss_size) / 2.0
        mid_y = (top + bottom - boss_size) / 2.0

        if start_stage == 2:
            nx = left + boss_margin
            ny = mid_y
        elif start_stage == 3:
            nx = right - boss_size - boss_margin
            ny = mid_y
        elif start_stage == 4:
            nx = mid_x
            ny = mid_y
        else:
            nx = mid_x
            ny = top + boss_margin

        boss_x = float(clamp(nx, left + 2, right - boss_size - 2))
        boss_y = float(clamp(ny, top + 2, bottom - boss_size - 2))

        boss_pause_until = now_boot + 600
        arena_safe_until = max(arena_safe_until, now_boot + 900)
        if start_stage == 4:
            boss_black_until = max(boss_black_until, now_boot + 1400)
            safe_px = int(clamp(left + (right - left) * 0.18, 0, w - 1))
            safe_py = int(clamp((top + bottom) * 0.5, 0, h - 1))
            pygame.mouse.set_pos((safe_px, safe_py))
            cursor_prev[0] = safe_px
            cursor_prev[1] = safe_py

    # Main loop
    # ============================================================
    while True:
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

        if now < stun_until:
            mx = stun_hold[0]
            my = stun_hold[1]
            cursor_vel[0] = 0.0
            cursor_vel[1] = 0.0
            pygame.mouse.set_pos((int(mx), int(my)))
        else:
            cursor_vel[0] = (mx - cursor_prev[0]) / max(1.0, step)
            cursor_vel[1] = (my - cursor_prev[1]) / max(1.0, step)
            cursor_prev[0] = mx
            cursor_prev[1] = my

        if final_phase_active:
            pass
        elif stage5_active:
            if stage5_wait_for_damage and not damage_balls and not damage_orbs:
                init_stage5_cycle(now + 700)

            if now >= boss_pause_until and not stage5_wait_for_damage:
                if stage5_current_attack == 0 and now >= stage5_rest_until:
                    if not stage5_attack_pool:
                        spawn_damage_attack(now, mx, my)
                        init_stage5_cycle(now + 700)
                    else:
                        idx = random.randrange(len(stage5_attack_pool))
                        stage5_current_attack = stage5_attack_pool.pop(idx)
                        set_boss_size(120)
                        stage5_attack_start = now
                        stage5_attack_end = now + stage5_attack_duration_ms

                        if True:
                            bx_tmp, by_tmp = boss_center()
                            if not inside_arena(bx_tmp, by_tmp):
                                left, top, right, bottom = arena_bounds()
                                mid_x = (left + right - boss_size) * 0.5
                                boss_x = float(clamp(mid_x, left + 2, right - boss_size - 2))
                                boss_y = float(clamp(top + boss_margin, top + 2, bottom - boss_size - 2))

                        if stage5_current_attack == 1:
                            dx, dy = normalize(mx - boss_x, my - boss_y)
                            stage5_boss_vx = dx * 7.6
                            stage5_boss_vy = dy * 7.6
                            stage5_a1_last_trail = now
                            stage5_a1_growth_ready_at = now
                            stage5_a1_next_shot = now + 5000
                        elif stage5_current_attack == 2:
                            stage5_a2_angle = random.uniform(0.0, math.tau)
                            stage5_a2_next_sub = now
                        elif stage5_current_attack == 3:
                            stage5_jump_mode = "idle"
                            stage5_jump_next_at = now
                            stage5_jump_count = 0
                            stage5_jump_markers.clear()

                if stage5_current_attack != 0 and now >= stage5_attack_end:
                    if stage5_current_attack == 3:
                        left, top, right, bottom = arena_bounds()
                        mid_x = (left + right - boss_size) / 2.0
                        boss_x = float(clamp(mid_x, left + 2, right - boss_size - 2))
                        boss_y = float(clamp(top + boss_margin, top + 2, bottom - boss_size - 2))
                        stage5_jump_mode = "idle"
                    stage5_current_attack = 0
                    set_boss_size(120)
                    stage5_rest_until = now + stage5_attack_rest_ms

        elif stage4_active:
            if stage4_wait_for_damage and not damage_balls and not damage_orbs:
                init_stage4_cycle(now + 700)

            if now >= boss_pause_until and not stage4_wait_for_damage:
                if (not stage4_attack1_started) and stage4_attack1 is None and now >= stage4_attack1_start_at:
                    stage4_attack1 = {
                        "start": now,
                        "end": now + stage4_attack_duration_ms,
                        "next_line": now,
                        "next_ball": now,
                    }
                    stage4_attack1_started = True
                if (not stage4_attack2_started) and stage4_attack2 is None and now >= stage4_attack2_start_at:
                    stage4_attack2 = {
                        "start": now,
                        "end": now + stage4_attack_duration_ms,
                        "next_small": now,
                        "next_tri": now,
                    }
                    stage4_attack2_started = True
                if now >= stage4_cycle_end_at and stage4_attack1_started and stage4_attack2_started and stage4_attack1 is None and stage4_attack2 is None:
                    if not stage4_wait_for_damage:
                        spawn_damage_attack(now, mx, my)
                        stage4_wait_for_damage = True

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
                        init_stage3_cycle(now + 700)
                        stage3_next_attack_start = now + 700
        elif stage2_active:
            if now >= boss_pause_until:
                while now >= phase2_next_attack_start:
                    start_phase2_attack(now, mx, my)
                    phase2_next_attack_start += phase2_attack_start_interval_ms
        else:
            while now >= next_attack_time:
                start_stage_attack(now, mx, my)
                next_attack_time += attack_interval_ms

        # Stage 3 active attack timelines (25s windows, can overlap).
        for atk in stage3_active_attacks[:]:
            if atk["id"] == 2:
                while now >= atk["next_wall"] and now < atk["end"]:
                    left, top, right, bottom = arena_bounds()
                    thickness = max(36.0, min(72.0, (right - left) * 0.05))
                    gap_half = max(56.0, min(90.0, (bottom - top) * 0.13))
                    mid_y = (top + bottom) * 0.5
                    gap_span = max(24.0, (bottom - top) * 0.12)
                    gap_y = clamp(mid_y + random.uniform(-gap_span, gap_span), top + gap_half + 24.0, bottom - gap_half - 24.0)
                    speed = max(4.2, min(8.4, (right - left) / 160.0)) * 1.15
                    stage3_hole_walls.append({
                        "x": left - thickness * 0.85,
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
                    "r": 216,
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
                    "r": 272,
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

            if age >= 10000 and not ball["shattered"]:
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
        for wave in sentry_wave_attackers[:]:
            while now >= wave["next_spawn"] and now < wave["end_time"]:
                sentry_attackers.append({
                    "x": float(mx),
                    "y": float(my),
                    "r": 30,
                    "spawn_time": now,
                    "safe_until": now + 1000,
                    "end_time": now + 20000,
                    "next_shot": now + 1000,
                })
                wave["next_spawn"] += 5000
            if now >= wave["end_time"]:
                sentry_wave_attackers.remove(wave)

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
                spawn_damage_radial(ball["x"], ball["y"], 8, 5.8, 7000, now)
                ball["next_radial"] += 3000

            if now >= ball["explode_time"]:
                spawn_damage_radial(ball["x"], ball["y"], 32, 6.2, 7600, now)
                damage_orbs.append({
                    "x": ball["x"],
                    "y": ball["y"],
                    "vx": 0.0,
                    "vy": 0.0,
                    "r": 18,
                    "state": "idle",
                    "expire_time": now + 10000,
                })
                damage_balls.remove(ball)

        # Stage 4 updates.
        if stage4_attack1 is not None:
            while now >= stage4_attack1["next_line"] and now < stage4_attack1["end"]:
                bx, by = boss_center()
                ang = random.uniform(0.0, math.tau)
                stage4_line_shots.append({
                    "x": bx,
                    "y": by,
                    "vx": math.cos(ang) * 8.0,
                    "vy": math.sin(ang) * 8.0,
                    "r": 10.0,
                    "end_time": now + 9000,
                })
                stage4_attack1["next_line"] += 1333

            while now >= stage4_attack1["next_ball"] and now < stage4_attack1["end"]:
                bx, by = boss_center()
                ang = random.uniform(0.0, math.tau)
                stage4_bounce_balls.append({
                    "x": bx,
                    "y": by,
                    "vx": math.cos(ang) * 7.0,
                    "vy": math.sin(ang) * 7.0,
                    "r": 22.0,
                    "bounces": 0,
                    "next_grow": now,
                })
                stage4_attack1["next_ball"] += 3000

            if now >= stage4_attack1["end"]:
                stage4_attack1 = None

        if stage4_attack2 is not None:
            while now >= stage4_attack2["next_small"] and now < stage4_attack2["end"]:
                bx, by = boss_center()
                ang = random.uniform(0.0, math.tau)
                speed = random.uniform(1.8, 2.8)
                stage4_small_balls.append({
                    "x": bx,
                    "y": by,
                    "vx": math.cos(ang) * speed,
                    "vy": math.sin(ang) * speed,
                    "r": 11.0,
                    "expire_time": now + 22000,
                })
                stage4_attack2["next_small"] += 20

            while now >= stage4_attack2["next_tri"] and now < stage4_attack2["end"]:
                bx, by = boss_center()
                dx, dy = normalize(mx - bx, my - by)
                stage4_triangles.append({
                    "x": bx,
                    "y": by,
                    "vx": dx * 7.5,
                    "vy": dy * 7.5,
                    "size": 39.0,
                })
                stage4_attack2["next_tri"] += 3500

            if now >= stage4_attack2["end"]:
                stage4_attack2 = None

        for shot in stage4_line_shots[:]:
            old_x = shot["x"]
            old_y = shot["y"]
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step
            stage4_line_trails.append({
                "ax": old_x,
                "ay": old_y,
                "bx": shot["x"],
                "by": shot["y"],
                "width": 8.0,
                "end_time": now + 5000,
            })
            if now >= shot["end_time"] or not inside_arena(shot["x"], shot["y"]):
                stage4_line_shots.remove(shot)

        for ball in stage4_bounce_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            bounced = bounce_ball(ball)
            if bounced:
                ball["bounces"] += 1
                if ball["bounces"] >= 11:
                    stage4_bounce_balls.remove(ball)
                    continue
                if now >= ball.get("next_grow", 0):
                    ball["r"] *= 1.25
                    ball["next_grow"] = now + 500

        for ball in stage4_small_balls[:]:
            ball["x"] += ball["vx"] * step
            ball["y"] += ball["vy"] * step
            if now >= ball["expire_time"] or not inside_arena(ball["x"], ball["y"]):
                stage4_small_balls.remove(ball)

        for tri in stage4_triangles[:]:
            tri["x"] += tri["vx"] * step
            tri["y"] += tri["vy"] * step
            if not inside_arena(tri["x"], tri["y"]):
                trigger_stun(now, 300, mx, my)
                stage4_triangles.remove(tri)

        # Stage 5 updates.
        if stage5_current_attack == 1:
            bx, by = boss_center()
            desired_dx, desired_dy = normalize(mx - bx, my - by)
            cur_dx, cur_dy = normalize(stage5_boss_vx, stage5_boss_vy)
            turn = min(0.045 * step, 0.14)
            mix_dx = cur_dx * (1.0 - turn) + desired_dx * turn
            mix_dy = cur_dy * (1.0 - turn) + desired_dy * turn
            mix_dx, mix_dy = normalize(mix_dx, mix_dy)
            speed = max(0.01, math.hypot(stage5_boss_vx, stage5_boss_vy))
            stage5_boss_vx = mix_dx * speed
            stage5_boss_vy = mix_dy * speed

            boss_x += stage5_boss_vx * step
            boss_y += stage5_boss_vy * step
            left, top, right, bottom = arena_bounds()
            bounced = False
            if boss_x <= left + 2:
                boss_x = left + 2
                stage5_boss_vx = abs(stage5_boss_vx)
                bounced = True
            elif boss_x + boss_size >= right - 2:
                boss_x = right - boss_size - 2
                stage5_boss_vx = -abs(stage5_boss_vx)
                bounced = True
            if boss_y <= top + 2:
                boss_y = top + 2
                stage5_boss_vy = abs(stage5_boss_vy)
                bounced = True
            elif boss_y + boss_size >= bottom - 2:
                boss_y = bottom - boss_size - 2
                stage5_boss_vy = -abs(stage5_boss_vy)
                bounced = True

            if bounced:
                trigger_stun(now, 100, mx, my)
                if now >= stage5_a1_growth_ready_at:
                    set_boss_size(int(boss_size * 1.1))
                    stage5_a1_growth_ready_at = now + 3000
            while now >= stage5_a1_next_shot and now < stage5_attack_end:
                cx_b, cy_b = boss_center()
                tx = mx + random.uniform(-18.0, 18.0)
                ty = my + random.uniform(-18.0, 18.0)
                dx, dy = normalize(tx - cx_b, ty - cy_b)
                stage5_a1_shots.append({
                    "x": cx_b,
                    "y": cy_b,
                    "vx": dx * 8.8,
                    "vy": dy * 8.8,
                    "r": 7.0,
                    "expire_time": now + 9000,
                })
                stage5_a1_next_shot += 5000
            if now >= stage5_a1_last_trail:
                cx_b, cy_b = boss_center()
                stage5_a1_trails.append({"x": cx_b, "y": cy_b, "r": 28.0, "end_time": now + 4500})
                stage5_a1_last_trail = now + 180
        elif stage5_current_attack == 2:
            left, top, right, bottom = arena_bounds()
            stage5_a2_angle += 0.05 * step
            tx = mx + math.cos(stage5_a2_angle) * 170.0
            ty = my + math.sin(stage5_a2_angle) * 145.0
            tx, ty = project_inside(tx, ty, margin=boss_size * 0.6)
            dx, dy = normalize(tx - boss_x, ty - boss_y)
            boss_x += dx * 3.9 * step
            boss_y += dy * 3.9 * step

            while now >= stage5_a2_next_sub and now < stage5_attack_end:
                bx, by = boss_center()
                pick = random.randint(1, 3)
                if pick == 1:
                    dx, dy = normalize(mx - bx, my - by)
                    stage5_a2_big_squares.append({"x": bx, "y": by, "vx": dx * 6.0, "vy": dy * 6.0, "half": 24.0})
                elif pick == 2:
                    aim = math.atan2(my - by, mx - bx)
                    for _ in range(15):
                        ang = aim + random.uniform(-0.75, 0.75)
                        spd = random.uniform(3.0, 5.5)
                        stage5_a2_small_circles.append({"x": bx, "y": by, "vx": math.cos(ang) * spd, "vy": math.sin(ang) * spd, "r": 7.0})
                else:
                    aim = math.atan2(my - by, mx - bx)
                    for _ in range(5):
                        ang = aim + random.uniform(-0.55, 0.55)
                        spd = random.uniform(5.8, 7.4)
                        stage5_a2_triangles.append({"x": bx, "y": by, "vx": math.cos(ang) * spd, "vy": math.sin(ang) * spd, "size": 15.0, "bounces": 0})
                stage5_a2_next_sub += 1000

        elif stage5_current_attack == 3:
            if stage5_jump_mode == "idle" and now >= stage5_jump_next_at and stage5_jump_count < stage5_jump_max:
                stage5_prepare_jump(now)

            if stage5_jump_mode == "prep" and now >= stage5_jump_land_at:
                tx, ty = stage5_jump_target
                left, top, right, bottom = arena_bounds()
                boss_x = float(clamp(tx - boss_size * 0.5, left + 2, right - boss_size - 2))
                boss_y = float(clamp(ty - boss_size * 0.5, top + 2, bottom - boss_size - 2))
                trigger_stun(now, 500, mx, my)
                boss_black_until = now

                for _ in range(8):
                    lx = random.uniform(left + 60, right - 60)
                    ly = random.uniform(top + 60, bottom - 60)
                    stage5_meteors.append({"x": lx, "y": ly, "r": random.uniform(20.0, 28.0), "state": "warn", "land_at": now + 1000, "end_time": 0})
                    stage5_jump_markers.append({"kind": "meteor", "x": lx, "y": ly, "size": 36.0, "start": now, "end": now + 1000, "shrink": False})

                stage5_jump_count += 1
                stage5_jump_mode = "wait"
                stage5_jump_next_at = now + 1000

            if stage5_jump_mode == "wait" and now >= stage5_jump_next_at and stage5_jump_count < stage5_jump_max:
                stage5_jump_mode = "idle"

        # Stage 5 common projectile updates.
        for tr in stage5_a1_trails[:]:
            if now >= tr["end_time"]:
                stage5_a1_trails.remove(tr)

        for shot in stage5_a1_shots[:]:
            shot["x"] += shot["vx"] * step
            shot["y"] += shot["vy"] * step
            if now >= shot["expire_time"] or not inside_arena(shot["x"], shot["y"]):
                stage5_a1_shots.remove(shot)
        for sq in stage5_a2_big_squares[:]:
            sq["x"] += sq["vx"] * step
            sq["y"] += sq["vy"] * step
            if not inside_arena(sq["x"], sq["y"]):
                trigger_stun(now, 250, mx, my)
                for _ in range(5):
                    ang = random.uniform(0.0, math.tau)
                    spd = random.uniform(3.8, 6.0)
                    stage5_a2_small_squares.append({"x": sq["x"], "y": sq["y"], "vx": math.cos(ang) * spd, "vy": math.sin(ang) * spd, "half": 14.0})
                stage5_a2_big_squares.remove(sq)

        for sq in stage5_a2_small_squares[:]:
            sq["x"] += sq["vx"] * step
            sq["y"] += sq["vy"] * step
            if not inside_arena(sq["x"], sq["y"]):
                stage5_a2_small_squares.remove(sq)

        for c in stage5_a2_small_circles[:]:
            c["x"] += c["vx"] * step
            c["y"] += c["vy"] * step
            if not inside_arena(c["x"], c["y"]):
                stage5_a2_small_circles.remove(c)

        for tri in stage5_a2_triangles[:]:
            tri["x"] += tri["vx"] * step
            tri["y"] += tri["vy"] * step
            pseudo = {"x": tri["x"], "y": tri["y"], "vx": tri["vx"], "vy": tri["vy"], "r": tri["size"]}
            bounced = bounce_ball(pseudo)
            tri["x"], tri["y"], tri["vx"], tri["vy"] = pseudo["x"], pseudo["y"], pseudo["vx"], pseudo["vy"]
            if bounced:
                tri["bounces"] += 1
            if tri["bounces"] >= 4:
                stage5_a2_triangles.remove(tri)

        for met in stage5_meteors[:]:
            if met["state"] == "warn" and now >= met["land_at"]:
                met["state"] = "live"
                met["end_time"] = now + 8000
                for _ in range(5):
                    kind = random.choice(("circle", "square", "triangle"))
                    ang = random.uniform(0.0, math.tau)
                    spd = random.uniform(3.8, 6.0)
                    stage5_meteor_shards.append({"kind": kind, "x": met["x"], "y": met["y"], "vx": math.cos(ang) * spd, "vy": math.sin(ang) * spd, "size": 9.0})
            elif met["state"] == "live" and now >= met["end_time"]:
                stage5_meteors.remove(met)

        for sh in stage5_meteor_shards[:]:
            sh["x"] += sh["vx"] * step
            sh["y"] += sh["vy"] * step
            if not inside_arena(sh["x"], sh["y"]):
                stage5_meteor_shards.remove(sh)

        # Final phase updates.
        if final_phase_active:
            bx, by = boss_center()
            if final_phase_state == "charge":
                t = clamp((now - final_phase_started_at) / 10000.0, 0.0, 1.0)
                for k in ("L", "R", "T", "B"):
                    final_shrink[k] = final_phase_shrink_target[k] * t
                final_phase_aim_angle = math.atan2(my - by, mx - bx)
                if now >= final_phase_started_at + 10000:
                    final_phase_state = "blink"
                    final_phase_started_at = now
                    final_phase_lock_angle = final_phase_aim_angle
            elif final_phase_state == "blink":
                if now >= final_phase_started_at + 1000:
                    beam_len = max(w, h) * 2.2
                    ex = bx + math.cos(final_phase_lock_angle) * beam_len
                    ey = by + math.sin(final_phase_lock_angle) * beam_len
                    final_phase_beam = {"ax": bx, "ay": by, "bx": ex, "by": ey, "width": 650.0, "end_time": now + 5000}
                    final_phase_state = "beam"
            elif final_phase_state == "beam":
                if final_phase_beam is not None and now >= final_phase_beam["end_time"]:
                    final_phase_beam = None
                    final_phase_state = "vulnerable"

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
                    "start_time": now,
                    "end_time": now + 18000,
                    "next_ball": now + 1000,
                })
                seq["fired"] = True

            if age >= 3000 and seq["fired"]:
                stage3_laser_sequences.remove(seq)

        for beam in stage3_laser_beams[:]:
            while now >= beam["next_ball"] and now < beam["end_time"]:
                for _ in range(6):
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

            life = ((now - swing["start"]) / 1000.0) / 2.1
            left, top, right, bottom = arena_bounds()
            length = max(right - left, bottom - top) * 1.45
            ang = math.sin(life * 2.6) * 1.2 + math.pi
            ax, ay = boss_center()
            ux = math.cos(ang)
            uy = math.sin(ang)

            hole_center = length * 0.48 + math.sin(life * 1.70) * length * 0.16
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
                    "safe_until": swing["start"] + 1000,
                })
            if h1 < length - 4.0:
                swing_segments.append({
                    "ax": ax + ux * h1,
                    "ay": ay + uy * h1,
                    "bx": ax + ux * length,
                    "by": ay + uy * length,
                    "width": swing["width"],
                    "safe_until": swing["start"] + 1000,
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
                    tx, ty = random.choice(corners)
                    dx, dy = normalize(tx - mb["x"], ty - mb["y"])
                    mb["dash_vx"] = dx * 13.2
                    mb["dash_vy"] = dy * 13.2
                    mb["dash_end"] = now + 520
                    mb["target_x"] = tx
                    mb["target_y"] = ty
                    mb["next_dash"] = now + 1500

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
                    mb["beam_safe_until"] = now + 1000
                    mb["next_attack"] = now + 10000

                if mb["attack_type"] is not None and now < mb["attack_end"]:
                    aim_ang = math.atan2(my - mb["y"], mx - mb["x"])
                    da = ((aim_ang - mb["beam_angle"] + math.pi) % math.tau) - math.pi
                    mb["beam_angle"] += da * min(1.0, 0.05 * step)
                    beam_len = max(w, h) * 2.0
                    bx2 = mb["x"] + math.cos(mb["beam_angle"]) * beam_len
                    by2 = mb["y"] + math.sin(mb["beam_angle"]) * beam_len
                    mb["beam_visible"] = True
                    mb["beam_ax"] = mb["x"]
                    mb["beam_ay"] = mb["y"]
                    mb["beam_bx"] = bx2
                    mb["beam_by"] = by2
                    mb["beam_width"] = 20.0

                    if now >= mb.get("beam_safe_until", 0) and dist_point_to_segment(mx, my, mb["x"], mb["y"], bx2, by2) <= 10.0:
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
                    mb["pre_dash_until"] = now + 500
                    mb["charge_end"] = mb["pre_dash_until"] + 420
                    mb["next_charge"] = now + 4000

                if now < mb.get("pre_dash_until", 0):
                    pass
                elif now < mb["charge_end"]:
                    mb["x"] += mb["charge_vx"] * step
                    mb["y"] += mb["charge_vy"] * step
                else:
                    dx, dy = normalize(pred_x - mb["x"], pred_y - mb["y"])
                    mb["x"] += dx * 5.16 * step
                    mb["y"] += dy * 5.16 * step

            elif mb["kind"] == "grow":
                left, top, right, bottom = arena_bounds()
                fixed_x = left + mb["r"] + 4.0
                fixed_y = (top + bottom) * 0.5
                mb["x"] = clamp(fixed_x, left + mb["r"] + 4.0, right - mb["r"] - 4.0)
                mb["y"] = clamp(fixed_y, top + mb["r"] + 4.0, bottom - mb["r"] - 4.0)
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
                    mb["next_spawn"] += stage3_grow_spawn_interval_ms
            mb["x"], mb["y"] = project_inside(mb["x"], mb["y"], margin=mb["r"] + 4)

        for gb in stage3_grow_balls[:]:
            if gb["state"] == "grow":
                dx, dy = normalize(mx - gb["x"], my - gb["y"])
                gb["vx"] = dx * 3.8
                gb["vy"] = dy * 3.8
                gb["x"] += gb["vx"] * step
                gb["y"] += gb["vy"] * step
                gb["x"], gb["y"] = project_inside(gb["x"], gb["y"], margin=8)
                t = clamp((now - gb["spawn_time"]) / 6500.0, 0.0, 1.0)
                gb["r"] = 8.0 + t * 52.0
                if now >= gb["spawn_time"] + 6500:
                    gb["state"] = "blink"
                    gb["blink_start"] = now
            elif gb["state"] == "blink":
                if now >= gb["blink_start"] + 1000:
                    stage3_craters.append({
                        "x": gb["x"],
                        "y": gb["y"],
                        "r": max(105.0, gb["r"] * 2.0),
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

        for seg in stage4_line_trails[:]:
            if now >= seg["end_time"]:
                stage4_line_trails.remove(seg)

        for mk in stage5_jump_markers[:]:
            if now >= mk["end"]:
                stage5_jump_markers.remove(mk)

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

        if final_phase_active and final_phase_state == "vulnerable" and boss_rect().collidepoint(mx, my):
            end_screen("win")
            return "win"

        if (not (final_phase_active and final_phase_state == "vulnerable")) and now >= boss_black_until and boss_rect().collidepoint(mx, my):
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

        for atk in sentry_attackers:
            if now < atk["safe_until"]:
                continue
            if circle_hits_player(atk["x"], atk["y"], atk["r"], mx, my):
                if die(now):
                    return

        for shot in sentry_shots:
            if square_hits_player(shot["x"], shot["y"], shot["half"], mx, my):
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

        for shot in damage_radial_shots:
            if square_hits_player(shot["x"], shot["y"], shot["half"], mx, my):
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

        for line in phase2_bouncy_lines:
            if dist_point_to_segment(mx, my, line["x1"], line["y1"], line["x2"], line["y2"]) <= (line["width"] * 0.5):
                if die(now):
                    return

        for wall in stage3_hole_walls:
            wx0 = wall["x"] - wall["thickness"] * 0.5
            wx1 = wall["x"] + wall["thickness"] * 0.5
            in_gap = (wall["gap_y"] - wall["gap_half"]) <= my <= (wall["gap_y"] + wall["gap_half"])
            if wx0 <= mx <= wx1 and not in_gap:
                if die(now):
                    return

        for beam in stage3_laser_beams:
            beam_age = now - beam.get("start_time", now)
            beam_active = beam_age >= 2000
            if beam_active and dist_point_to_segment(mx, my, beam["ax"], beam["ay"], beam["bx"], beam["by"]) <= (beam["width"] * 0.5):
                if die(now):
                    return

        for ball in stage3_laser_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for seg in swing_segments:
            if now < seg.get("safe_until", 0):
                continue
            if dist_point_to_segment(mx, my, seg["ax"], seg["ay"], seg["bx"], seg["by"]) <= (seg["width"] * 0.5):
                if die(now):
                    return

        for ring in stage3_trap_rings:
            if now < ring.get("safe_until", 0):
                continue
            dist = math.hypot(mx - ring["x"], my - ring["y"])
            lock_r = ring["r"] - ring["thickness"] * 0.5 - 6.0
            if dist > (lock_r + 3.0):
                if die(now):
                    return

        for mb in stage3_minibosses:
            if not miniboss_is_blinking(mb, now) and circle_hits_player(mb["x"], mb["y"], mb["r"], mx, my):
                if die(now):
                    return

        for gb in stage3_grow_balls:
            if circle_hits_player(gb["x"], gb["y"], gb["r"], mx, my):
                if die(now):
                    return

        for crater in stage3_craters:
            if circle_hits_player(crater["x"], crater["y"], crater["r"], mx, my):
                if die(now):
                    return

        for shot in stage4_line_shots:
            if circle_hits_player(shot["x"], shot["y"], shot["r"], mx, my):
                if die(now):
                    return

        for seg in stage4_line_trails:
            if dist_point_to_segment(mx, my, seg["ax"], seg["ay"], seg["bx"], seg["by"]) <= seg["width"]:
                if die(now):
                    return

        for ball in stage4_bounce_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for ball in stage4_small_balls:
            if circle_hits_player(ball["x"], ball["y"], ball["r"], mx, my):
                if die(now):
                    return

        for tri in stage4_triangles:
            tri_pts = triangle_vertices(tri["x"], tri["y"], tri["vx"], tri["vy"], tri["size"])
            if point_in_triangle(mx, my, tri_pts):
                if die(now):
                    return

        for tr in stage5_a1_trails:
            if circle_hits_player(tr["x"], tr["y"], tr["r"], mx, my):
                if die(now):
                    return

        for shot in stage5_a1_shots:
            if circle_hits_player(shot["x"], shot["y"], shot["r"], mx, my):
                if die(now):
                    return
        for sq in stage5_a2_big_squares:
            if square_hits_player(sq["x"], sq["y"], sq["half"], mx, my):
                if die(now):
                    return

        for sq in stage5_a2_small_squares:
            if square_hits_player(sq["x"], sq["y"], sq["half"], mx, my):
                if die(now):
                    return

        for c in stage5_a2_small_circles:
            if circle_hits_player(c["x"], c["y"], c["r"], mx, my):
                if die(now):
                    return

        for tri in stage5_a2_triangles:
            tri_pts = triangle_vertices(tri["x"], tri["y"], tri["vx"], tri["vy"], tri["size"])
            if point_in_triangle(mx, my, tri_pts):
                if die(now):
                    return

        for met in stage5_meteors:
            if met["state"] == "live" and circle_hits_player(met["x"], met["y"], met["r"], mx, my):
                if die(now):
                    return

        for sh in stage5_meteor_shards:
            if sh["kind"] == "circle":
                if circle_hits_player(sh["x"], sh["y"], sh["size"], mx, my):
                    if die(now):
                        return
            elif sh["kind"] == "square":
                if square_hits_player(sh["x"], sh["y"], sh["size"], mx, my):
                    if die(now):
                        return
            else:
                tri_pts = triangle_vertices(sh["x"], sh["y"], sh["vx"], sh["vy"], sh["size"])
                if point_in_triangle(mx, my, tri_pts):
                    if die(now):
                        return
        if final_phase_active and final_phase_state == "beam" and final_phase_beam is not None:
            if dist_point_to_segment(mx, my, final_phase_beam["ax"], final_phase_beam["ay"], final_phase_beam["bx"], final_phase_beam["by"]) <= (final_phase_beam["width"] * 0.5):
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

        for wall in stage3_hole_walls:
            wx = wall["x"] - wall["thickness"] * 0.5
            ww = wall["thickness"]
            gap_top = wall["gap_y"] - wall["gap_half"]
            gap_bottom = wall["gap_y"] + wall["gap_half"]
            if gap_top > top:
                rect_top = pygame.Rect(int(wx), int(top), max(1, int(ww)), max(1, int(gap_top - top)))
                pygame.draw.rect(screen, (255, 40, 40), rect_top)
            if gap_bottom < bottom:
                rect_bottom = pygame.Rect(int(wx), int(gap_bottom), max(1, int(ww)), max(1, int(bottom - gap_bottom)))
                pygame.draw.rect(screen, (255, 40, 40), rect_bottom)

        for seq in stage3_laser_sequences:
            age = now - seq["start"]
            if age < 0 or age >= 3000:
                continue
            bx, by = boss_center()
            if seq.get("locked"):
                ang = seq.get("lock_angle", 0.0)
            else:
                ang = seq.get("aim_angle", math.atan2(my - by, mx - bx))
            beam_len = max(w, h) * 1.9
            ex = bx + math.cos(ang) * beam_len
            ey = by + math.sin(ang) * beam_len
            if age < 2000:
                color = (255, 130, 130)
                width = 3
            else:
                color = (255, 0, 0)
                width = 7
            pygame.draw.line(screen, color, (int(bx), int(by)), (int(ex), int(ey)), width)

        for beam in stage3_laser_beams:
            beam_age = now - beam.get("start_time", now)
            beam_active = beam_age >= 2000
            beam_color = (255, 0, 0) if beam_active else (255, 225, 90)
            pygame.draw.line(
                screen,
                beam_color,
                (int(beam["ax"]), int(beam["ay"])),
                (int(beam["bx"]), int(beam["by"])),
                max(2, int(beam["width"])),
            )

        for ball in stage3_laser_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"], tint=(255, 70, 70))

        for seg in swing_segments:
            seg_color = (150, 150, 150) if now < seg.get("safe_until", 0) else (255, 60, 60)
            pygame.draw.line(
                screen,
                seg_color,
                (int(seg["ax"]), int(seg["ay"])),
                (int(seg["bx"]), int(seg["by"])),
                max(2, int(seg["width"])),
            )

        for ring in stage3_trap_rings:
            pygame.draw.circle(
                screen,
                (255, 70, 70),
                (int(ring["x"]), int(ring["y"])),
                int(ring["r"]),
                max(2, int(ring["thickness"])),
            )

        for crater in stage3_craters:
            pygame.draw.circle(screen, (255, 0, 0), (int(crater["x"]), int(crater["y"])), int(crater["r"]))

        for gb in stage3_grow_balls:
            if gb["state"] == "blink" and ((now // 120) % 2) == 1:
                continue
            side = int(gb["r"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(gb["x"]), int(gb["y"]))
            sprite = pygame.transform.smoothscale(raw_face, (side, side))
            screen.blit(sprite, rect)

        for mb in stage3_minibosses:
            blink = miniboss_is_blinking(mb, now)
            side = int(mb["r"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(mb["x"]), int(mb["y"]))
            if blink:
                sprite = pygame.transform.smoothscale(raw_face, (side, side))
                screen.blit(sprite, rect)
                if ((now // 110) % 2) == 0:
                    overlay = pygame.Surface((side, side), pygame.SRCALPHA)
                    overlay.fill((255, 255, 0, 145))
                    screen.blit(overlay, rect.topleft, special_flags=pygame.BLEND_RGBA_ADD)
                    pygame.draw.rect(screen, (255, 255, 0), rect, 3)
            else:
                if mb["kind"] == "predictive" and now < mb.get("pre_dash_until", 0) and ((now // 90) % 2) == 1:
                    pygame.draw.rect(screen, (0, 0, 0), rect)
                else:
                    sprite = pygame.transform.smoothscale(raw_face, (side, side))
                    screen.blit(sprite, rect)

            if mb.get("beam_visible"):
                beam_color = (255, 170, 70)
                if now < mb.get("beam_safe_until", 0):
                    beam_color = (255, 225, 90)
                elif mb.get("attack_type") == 1:
                    beam_color = (255, 70, 70)
                elif mb.get("attack_type") == 2:
                    beam_color = (120, 200, 255)
                elif mb.get("attack_type") == 3:
                    beam_color = (255, 255, 255)
                pygame.draw.line(
                    screen,
                    beam_color,
                    (int(mb["beam_ax"]), int(mb["beam_ay"])),
                    (int(mb["beam_bx"]), int(mb["beam_by"])),
                    max(2, int(mb["beam_width"])),
                )

        for shot in stage4_line_shots:
            draw_face_ball(shot["x"], shot["y"], shot["r"], tint=(255, 70, 70))

        for seg in stage4_line_trails:
            pygame.draw.line(
                screen,
                (255, 0, 0),
                (int(seg["ax"]), int(seg["ay"])),
                (int(seg["bx"]), int(seg["by"])),
                max(2, int(seg["width"] * 2.0)),
            )

        for ball in stage4_bounce_balls:
            draw_face_ball(ball["x"], ball["y"], ball["r"])

        for ball in stage4_small_balls:
            pygame.draw.circle(screen, (255, 0, 0), (int(ball["x"]), int(ball["y"])), int(ball["r"]))

        for tri in stage4_triangles:
            pts = triangle_vertices(tri["x"], tri["y"], tri["vx"], tri["vy"], tri["size"])
            pygame.draw.polygon(screen, (255, 0, 0), [(int(x), int(y)) for x, y in pts])

        for tr in stage5_a1_trails:
            pygame.draw.circle(screen, (255, 0, 0), (int(tr["x"]), int(tr["y"])), int(tr["r"]))
        for shot in stage5_a1_shots:
            pygame.draw.circle(screen, (255, 0, 0), (int(shot["x"]), int(shot["y"])), int(shot["r"]))

        for sq in stage5_a2_big_squares:
            side = int(sq["half"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(sq["x"]), int(sq["y"]))
            sprite = pygame.transform.smoothscale(raw_face, (side, side))
            screen.blit(sprite, rect)
            pygame.draw.rect(screen, (255, 0, 0), rect, 2)

        for sq in stage5_a2_small_squares:
            side = int(sq["half"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(sq["x"]), int(sq["y"]))
            sprite = pygame.transform.smoothscale(raw_face, (side, side))
            screen.blit(sprite, rect)
            pygame.draw.rect(screen, (255, 60, 60), rect, 2)

        for c in stage5_a2_small_circles:
            pygame.draw.circle(screen, (255, 30, 30), (int(c["x"]), int(c["y"])), int(c["r"]))

        for tri in stage5_a2_triangles:
            pts = triangle_vertices(tri["x"], tri["y"], tri["vx"], tri["vy"], tri["size"])
            pygame.draw.polygon(screen, (255, 70, 70), [(int(x), int(y)) for x, y in pts])

        for mk in stage5_jump_markers:
            t = clamp((now - mk["start"]) / max(1.0, (mk["end"] - mk["start"])), 0.0, 1.0)
            size = mk["size"] * (1.0 - t) if mk["shrink"] else mk["size"]
            rect = pygame.Rect(0, 0, int(size * 2), int(size * 2))
            rect.center = (int(mk["x"]), int(mk["y"]))
            pygame.draw.rect(screen, (0, 0, 0), rect)

        for met in stage5_meteors:
            if met["state"] == "warn":
                pygame.draw.circle(screen, (0, 0, 0), (int(met["x"]), int(met["y"])), int(met["r"] + 8), 2)
            else:
                pygame.draw.circle(screen, (255, 0, 0), (int(met["x"]), int(met["y"])), int(met["r"]))

        for sh in stage5_meteor_shards:
            if sh["kind"] == "circle":
                pygame.draw.circle(screen, (255, 40, 40), (int(sh["x"]), int(sh["y"])), int(sh["size"]))
            elif sh["kind"] == "square":
                rect = pygame.Rect(0, 0, int(sh["size"] * 2), int(sh["size"] * 2))
                rect.center = (int(sh["x"]), int(sh["y"]))
                pygame.draw.rect(screen, (255, 60, 60), rect)
            else:
                pts = triangle_vertices(sh["x"], sh["y"], sh["vx"], sh["vy"], sh["size"])
                pygame.draw.polygon(screen, (255, 80, 80), [(int(x), int(y)) for x, y in pts])

        if final_phase_active and final_phase_state in ("charge", "blink"):
            bx, by = boss_center()
            ang = final_phase_aim_angle if final_phase_state == "charge" else final_phase_lock_angle
            ex = bx + math.cos(ang) * max(w, h) * 1.9
            ey = by + math.sin(ang) * max(w, h) * 1.9
            if final_phase_state == "charge":
                t = clamp((now - final_phase_started_at) / 10000.0, 0.0, 1.0)
                lw = max(1, int(2 + t * 26))
                pygame.draw.line(screen, (140, 140, 140), (int(bx), int(by)), (int(ex), int(ey)), lw)
                if ((now // 90) % 2) == 0:
                    overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                    overlay.fill((255, 255, 255, 110))
                    screen.blit(overlay, (int(boss_x), int(boss_y)), special_flags=pygame.BLEND_RGBA_ADD)
            else:
                lw = 28
                pygame.draw.line(screen, (190, 190, 190), (int(bx), int(by)), (int(ex), int(ey)), lw)
                overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                overlay.fill((random.randint(20, 255), random.randint(20, 255), random.randint(20, 255), 120))
                screen.blit(overlay, (int(boss_x), int(boss_y)), special_flags=pygame.BLEND_RGBA_ADD)

        if final_phase_active and final_phase_state == "beam" and final_phase_beam is not None:
            pygame.draw.line(
                screen,
                (220, 220, 220),
                (int(final_phase_beam["ax"]), int(final_phase_beam["ay"])),
                (int(final_phase_beam["bx"]), int(final_phase_beam["by"])),
                int(final_phase_beam["width"]),
            )

        if final_phase_active and final_phase_state == "vulnerable":
            if ((now // 180) % 2) == 0:
                overlay = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                overlay.fill((255, 255, 0, 140))
                screen.blit(overlay, (int(boss_x), int(boss_y)), special_flags=pygame.BLEND_RGBA_ADD)

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
            if 10000 <= age < 12000 and ((now // 120) % 2) == 1:
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

        for atk in sentry_attackers:
            if now < atk["safe_until"]:
                side = int(atk["r"] * 2)
                rect = pygame.Rect(0, 0, side, side)
                rect.center = (int(atk["x"]), int(atk["y"]))
                pygame.draw.rect(screen, (0, 0, 0), rect)
            else:
                draw_face_ball(atk["x"], atk["y"], atk["r"], tint=(0, 70, 0), alpha=190)

        for shot in sentry_shots:
            side = int(shot["half"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(shot["x"]), int(shot["y"]))
            pygame.draw.rect(screen, (255, 0, 0), rect)
            pygame.draw.rect(screen, (0, 0, 0), rect, 1)

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
            warning = now >= ball["explode_time"] - 3000
            blink_on = warning and ((now // 120) % 2) == 1
            square.fill((255, 0, 0) if blink_on else (90, 20, 140))
            face = get_face_sprite(ball["r"])
            square.blit(face, (0, 0))
            if not blink_on:
                tint = pygame.Surface((side, side), pygame.SRCALPHA)
                tint.fill((70, 0, 110, 120))
                square.blit(tint, (0, 0), special_flags=pygame.BLEND_RGBA_ADD)
            screen.blit(square, square.get_rect(center=(int(ball["x"]), int(ball["y"]))))

        for shot in damage_radial_shots:
            side = int(shot["half"] * 2)
            rect = pygame.Rect(0, 0, side, side)
            rect.center = (int(shot["x"]), int(shot["y"]))
            pygame.draw.rect(screen, (255, 0, 0), rect)
            pygame.draw.rect(screen, (0, 0, 0), rect, 1)

        for orb in damage_orbs:
            pygame.draw.circle(screen, (0, 190, 0), (int(orb["x"]), int(orb["y"])), int(orb["r"]))

        draw_shield_pickup()
        draw_shield_indicator()
        draw_boss_ui()

        stage_number = boss_max_hp - boss_hp + 1
        stage_surf = header_font.render(f"Stage {stage_number}", True, (255, 255, 255))
        screen.blit(stage_surf, stage_surf.get_rect(topright=(w - 80, 145)))

        pygame.display.flip()















































