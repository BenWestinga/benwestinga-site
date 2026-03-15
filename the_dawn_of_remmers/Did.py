# Did.py
import pygame
import random
import math
from pathlib import Path
import game_settings

def bossfight_Did(screen):
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
        cx = ax + t * vx
        cy = ay + t * vy
        return math.hypot(px - cx, py - cy)

    def circle_rect_intersect(cx, cy, r, rect: pygame.Rect):
        # closest point on rect to circle center
        px = clamp(cx, rect.left, rect.right)
        py = clamp(cy, rect.top, rect.bottom)
        dx = cx - px
        dy = cy - py
        return (dx * dx + dy * dy) <= (r * r)

    # ============================================================
    # Arena (Man style) + purple wall stages
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

    PURPLE_W = 16  # extreem dun
    PURPLE_X = int(clamp(PLAY_LEFT + 180, PLAY_LEFT + 80, PLAY_RIGHT - 300))
    purple_wall_rect = pygame.Rect(PURPLE_X, 0, PURPLE_W, h)

    # "left blue area becomes red"
    left_danger_rect = pygame.Rect(PLAY_LEFT, PLAY_TOP, PURPLE_X - PLAY_LEFT, PLAY_BOT - PLAY_TOP)

    # "playfield right of the purple wall"
    play_rect = pygame.Rect(PURPLE_X + PURPLE_W, PLAY_TOP, PLAY_RIGHT - (PURPLE_X + PURPLE_W), PLAY_BOT - PLAY_TOP)
    # Rage is only allowed in the blue field right of the wall (not in left_danger_rect)
    RAGE_LEFT  = play_rect.left      # == purple_wall_rect.right
    RAGE_RIGHT = PLAY_RIGHT
    RAGE_TOP   = PLAY_TOP
    RAGE_BOT   = PLAY_BOT


    # ============================================================
    # Shield pickup + indicator (exactly like beast)
    # ============================================================
    SHIELD_SPAWN_MS = 45000
    INVULN_MS = 1000
    SHIELD_RADIUS = 13
    SHIELD_COLOR = (0, 100, 0)     # pickup green
    INDICATOR_POS = (270, 160)     # dark blue dot

    shield_pos = None
    shield_active = False
    invuln_until = 0
    next_shield_spawn = pygame.time.get_ticks() + SHIELD_SPAWN_MS

    def maybe_spawn_shield(now):
        if game_settings.NO_SHIELDS:
            return
        nonlocal shield_pos, next_shield_spawn
        if shield_pos is None and now >= next_shield_spawn:
            cx, cy = play_rect.center
            r = 180
            sx = random.randint(cx - r, cx + r)
            sy = random.randint(cy - r, cy + r)
            sx = clamp(sx, PLAY_LEFT + 20, PLAY_RIGHT - 20)
            sy = clamp(sy, PLAY_TOP + 20, PLAY_BOT - 20)

            # extra: prevent spawn in the red left zone
            if sx < play_rect.left + 10:
                sx = play_rect.left + 20

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
    # Boss (1 HP bar with name Did)
    # ============================================================
    boss_name = "P. Diddy"
    boss_hp = 1
    boss_max_hp = 1

    boss_size_base = 100
    boss_size = boss_size_base

    boss_x = float(325 - boss_size // 2)
    boss_y = float(h // 2 - boss_size // 2)

    font_name = pygame.font.SysFont(None, 40)
    header_font = pygame.font.SysFont(None, 40)

    # Did sprite
    try:
        raw_face = pygame.image.load(str(Path(__file__).resolve().with_name("Did.png"))).convert_alpha()
    except:
        raw_face = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
        raw_face.fill((180, 180, 180))
        pygame.draw.rect(raw_face, (0, 0, 0), raw_face.get_rect(), 3)

    def scaled_face(sz):
        return pygame.transform.smoothscale(raw_face, (sz, sz))

    boss_img_small = scaled_face(boss_size_base)  # always use in 'stage'
    boss_img_big = None                           # only create after wall breaks


    # Card sprite (rechthoek met gezicht)
    CARD_W, CARD_H = 70, 100
    card_face = pygame.transform.smoothscale(raw_face, (CARD_W - 10, CARD_H - 10))

    def make_card_surf():
        s = pygame.Surface((CARD_W, CARD_H), pygame.SRCALPHA)
        pygame.draw.rect(s, (245, 245, 245), (0, 0, CARD_W, CARD_H), border_radius=8)
        pygame.draw.rect(s, (0, 0, 0), (0, 0, CARD_W, CARD_H), 3, border_radius=8)
        s.blit(card_face, (5, 5))
        return s

    card_surf = make_card_surf()

    # Triangle projectile sprite (klein driehoekje met klein gezicht)
    TRI_SIZE = 24
    tri_face = pygame.transform.smoothscale(raw_face, (16, 16))

    def make_tri_surf():
        s = pygame.Surface((TRI_SIZE, TRI_SIZE), pygame.SRCALPHA)
        pts = [(TRI_SIZE // 2, 0), (0, TRI_SIZE - 2), (TRI_SIZE - 2, TRI_SIZE - 2)]
        pygame.draw.polygon(s, (235, 235, 235), pts)
        pygame.draw.polygon(s, (0, 0, 0), pts, 2)
        s.blit(tri_face, (TRI_SIZE // 2 - 8, TRI_SIZE // 2 - 4))
        return s

    tri_surf = make_tri_surf()

    # ============================================================
    # Face-in-circle helper (voor balls)
    # ============================================================
    face_circle_cache = {}  # key = radius -> Surface

    def blit_face_in_circle(cx, cy, rr):
        # cache per radius
        if rr not in face_circle_cache:
            size = rr * 2 - 6
            if size <= 0:
                return

            img = pygame.transform.smoothscale(raw_face, (size, size))

            surf = pygame.Surface((size, size), pygame.SRCALPHA)
            surf.blit(img, (0, 0))

            mask = pygame.Surface((size, size), pygame.SRCALPHA)
            mask.fill((0, 0, 0, 0))
            pygame.draw.circle(mask, (255, 255, 255, 255), (size // 2, size // 2), size // 2)

            surf.blit(mask, (0, 0), special_flags=pygame.BLEND_RGBA_MULT)
            face_circle_cache[rr] = surf

        s = face_circle_cache[rr]
        screen.blit(s, (int(cx - s.get_width() / 2), int(cy - s.get_height() / 2)))


    # ============================================================
    # Purple wall lives (3 -> 2 -> 1 -> 0)
    # ============================================================
    wall_hp = 3  # geen healthbar
    wall_exists = True

    def wall_lost():
        return 3 - wall_hp  # 0,1,2

    def wall_color():
        # paars -> roze -> geel -> (kapot)
        if wall_hp >= 3:
            return (160, 0, 200)
        if wall_hp == 2:
            return (255, 80, 200)
        return (255, 230, 80)

    # ============================================================
    # Safe grid per wall stage: 2x2, 3x3, 4x4
    # ============================================================
    stage_safe_idx = 0
    safe_flash_until = 0

    def grid_n():
        return 2 + wall_lost()  # 2,3,4

    def build_grid_cells():
        n = grid_n()
        cells = []
        cw = play_rect.width / n
        ch = play_rect.height / n
        for ry in range(n):
            for cx in range(n):
                r = pygame.Rect(
                    int(play_rect.left + cx * cw),
                    int(play_rect.top + ry * ch),
                    int(math.ceil(cw)),
                    int(math.ceil(ch)),
                )
                cells.append(r)
        return cells

    def pick_new_safe_cell():
        nonlocal stage_safe_idx
        cells = build_grid_cells()
        stage_safe_idx = random.randrange(len(cells))

    pick_new_safe_cell()

    # ============================================================
    # Global hazards / projectiles lists
    # ============================================================
    explosions = []   # dict: x,y,r,until
    meteors = []      # dict: x,y,r,tele_until,danger_until
    snakes = []       # dict: pts(list of dict{x,y,vx,vy,b}), thickness, max_b
    tri_shots = []    # dict: x,y,vx,vy,until,r

    # ============================================================
    # Mouse stun (0.2s on boss hitting red wall during rage)
    # ============================================================
    mouse_stun_until = 0
    mouse_stun_pos = (w // 2, h // 2)

    def apply_mouse_stun(now, ms=200):
        nonlocal mouse_stun_until, mouse_stun_pos
        mx, my = pygame.mouse.get_pos()
        mouse_stun_pos = (int(mx), int(my))
        mouse_stun_until = now + ms

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
            msg = "P. Diddy is defeated" if result == "win" else "You were defeated by P. Diddy"
            s1 = font_big.render(msg, True, (255, 255, 255))
            s2 = font_small.render("Returning to boss select...", True, (255, 255, 255))
            screen.blit(s1, s1.get_rect(center=(w // 2, h // 2 - 30)))
            screen.blit(s2, s2.get_rect(center=(w // 2, h // 2 + 50)))
            pygame.display.flip()

            if pygame.time.get_ticks() - t0 >= 3000:
                return
            clock.tick(60)

    # ============================================================
    # Attack scheduler:
    # Per wall stage:
    # 5 random attacks = 2x lines, 2x meteors, 1x cards
    # then ALWAYS: grid -> balls
    # If wall life lost via balls: stage increments (grid grows etc) and loop repeats.
    # ============================================================
    current_attack = None
    attack_state = "idle"
    attack_until = 0

    stage_queue = []
    grid_done = False
    balls_done = False

    def new_stage_queue():
        q = ["lines", "lines", "meteors", "meteors", "cards"]
        random.shuffle(q)
        return q

    stage_queue = new_stage_queue()

    def clear_stage_hazards():
        explosions.clear()
        meteors.clear()
        snakes.clear()
        tri_shots.clear()

    # ============================================================
    # Attack: Cards (shoot N cards, explosions 3s, safe cell blinks green)
    # ============================================================
    cards = []  # dict: x,y,vx,vy,alive
    card_shots_left = 0
    card_next_shot = 0
    CARD_DELAY_MS = 900

    def start_cards(now):
        nonlocal current_attack, attack_state, card_shots_left, card_next_shot
        current_attack = "cards"
        attack_state = "firing"
        base = 5
        card_shots_left = base + wall_lost()  # +1 per wall life weg
        card_next_shot = now

    def spawn_card(now, mx, my):
        # spawn net rechts van de muur (in speelveld)
        sx = play_rect.left + 10
        sy = clamp(int(boss_y + boss_size_base / 2), play_rect.top + 30, play_rect.bottom - 30)
        dx = mx - sx
        dy = my - sy
        dx, dy = normalize(dx, dy)
        speed = 8.0 + 1.0 * wall_lost()
        cards.append({"x": float(sx), "y": float(sy), "vx": dx * speed, "vy": dy * speed})

    def make_explosion(x, y, now):
        # iets groter per wall life lost
        r = 200 + 30 * wall_lost()
        explosions.append({"x": float(x), "y": float(y), "r": float(r), "until": now + 3000})

    # ============================================================
    # Attack: Meteors (8s, every second 5 meteors; 1s gray telegraph then 3s red)
    # ============================================================
    meteor_next_wave = 0
    meteor_end = 0

    def start_meteors(now):
        nonlocal current_attack, attack_state, meteor_next_wave, meteor_end
        current_attack = "meteors"
        attack_state = "active"
        meteor_next_wave = now
        meteor_end = now + 8000

    def spawn_meteor(now):
        # random pos in play_rect
        x = random.randint(play_rect.left + 40, play_rect.right - 40)
        y = random.randint(play_rect.top + 40, play_rect.bottom - 40)
        r = 98 + 25 * wall_lost()  # groter per wall life lost
        meteors.append({"x": float(x), "y": float(y), "r": float(r),
                        "tele_until": now + 1000, "danger_until": now + 1000 + 3000})
    
    def spawn_bounce_meteors(now, count=3):
        for _ in range(count):
            spawn_meteor(now)  # zelfde meteor logic als stage

    # Kleine meteors voor rage-bounces
    RAGE_METEOR_R = 60          # kleiner
    RAGE_METEOR_TELE_MS = 700   # kortere telegraph
    RAGE_METEOR_DANGER_MS = 2000

    def spawn_meteor_small(now, center=None):
        # center = (x,y) -> spawn rondom boss; anders random in play_rect
        if center is None:
            x = random.randint(play_rect.left + 40, play_rect.right - 40)
            y = random.randint(play_rect.top + 40, play_rect.bottom - 40)
        else:
            cx, cy = center
            spread = 220
            x = int(cx + random.randint(-spread, spread))
            y = int(cy + random.randint(-spread, spread))
            x = clamp(x, play_rect.left + 40, play_rect.right - 40)
            y = clamp(y, play_rect.top + 40, play_rect.bottom - 40)

        meteors.append({
            "x": float(x), "y": float(y), "r": float(RAGE_METEOR_R),
            "tele_until": now + RAGE_METEOR_TELE_MS,
            "danger_until": now + RAGE_METEOR_TELE_MS + RAGE_METEOR_DANGER_MS
        })

    def spawn_bounce_meteors_small(now, count=3, center=None):
        for _ in range(count):
            spawn_meteor_small(now, center=center)

    # ============================================================
    # Attack: Snake Lines (10s; every 2s spawn 3 lines; bounces base 3 + wall_lost)
    # ============================================================
    line_next_wave = 0
    line_end = 0

    def start_lines(now):
        nonlocal current_attack, attack_state, line_next_wave, line_end
        current_attack = "lines"
        attack_state = "active"
        line_next_wave = now
        line_end = now + 10000

    def spawn_snake_line(mx, my, angle_offset_rad, now):
        # start net rechts van de muur
        sx = play_rect.left + 10
        sy = clamp(int(boss_y + boss_size / 2), play_rect.top + 30, play_rect.bottom - 30)

        dx = mx - sx
        dy = my - sy
        dx, dy = normalize(dx, dy)

        ca = math.cos(angle_offset_rad)
        sa = math.sin(angle_offset_rad)
        ndx = dx * ca - dy * sa
        ndy = dx * sa + dy * ca

        speed = 6.0
        vx = ndx * speed
        vy = ndy * speed

        # maak "heel veel kleine stukjes"
        count = 70
        spacing = 11.0
        pts = []
        for i in range(count):
            px = sx - ndx * (i * spacing)
            py = sy - ndy * (i * spacing)
            pts.append({"x": float(px), "y": float(py), "vx": float(vx), "vy": float(vy), "b": 0})

        snakes.append({
            "pts": pts,
            "th": 10,
            "max_b": 3 + wall_lost(),   # +1 bounce per wall life weg
            "life_end": now + 9000
        })

    # ============================================================
    # Attack: Grid (2.0s gray lines, then 1.5s red for NON-safe, then back to blue)
    # ============================================================
    grid_phase = "idle"
    grid_phase_until = 0

    def start_grid(now):
        nonlocal current_attack, grid_phase, grid_phase_until
        current_attack = "grid"
        grid_phase = "telegraph"
        grid_phase_until = now + 2000

    # ============================================================
    # Attack: Balls / magic wall-damage
    # ALWAYS after grid
    # ============================================================
    balls = []  # dict: x,y,r,is_good, phase data
    balls_phase = "idle"
    balls_phase_until = 0
    good_idx = 0
    balls_last_shot = 0
    balls_orbit_start = 0
    balls_spawn_time = 0
    balls_bounce_end = 0
    good_flash_until = 0
    balls_yellow_end = 0
    wall_damage_in_progress = False
    wall_damage_ball = None
    BLACKOUT_MS = 300
    blackout_until = 0
    blackout_times = []   # lijst met tijdstippen waarop blackout start

    def start_balls(now, mx, my):
        nonlocal current_attack, balls_phase, balls_phase_until, balls
        nonlocal good_idx, balls_last_shot, balls_orbit_start, balls_spawn_time, good_flash_until, wall_damage_in_progress, wall_damage_ball
        current_attack = "balls"
        balls_phase = "spawn_still"
        balls_phase_until = now + 1000  # 1.0s stil
        balls_orbit_start = now
        balls_spawn_time = now
        good_flash_until = 0
        balls_last_shot = now
        wall_damage_in_progress = False
        wall_damage_ball = None

        balls.clear()
        tri_shots.clear()

        # +1 bal per wall life weg: 3,4,5
        k = 3 + wall_lost()
        nonlocal blackout_until, blackout_times
        blackout_until = 0
        blackout_times = []

        if k == 5:
            # na 15s orbit: blackout, dan +3s, dan +3s
            blackout_times = [now + 12000, now + 15000, now + 28000]

        good_idx = random.randrange(k)

        # plaats ballen random in play_rect, niet dicht bij elkaar
        # equidistant placement: exact 2π/k spacing, verder van speler
        orbit_r = 380 + 40 * wall_lost()   # verder weg per stage
        # --- FIX: orbit radius mag niet groter zijn dan wat in play_rect past
        MARGIN = 40
        max_r_x = (play_rect.width  / 2) - MARGIN
        max_r_y = (play_rect.height / 2) - MARGIN
        orbit_r = min(orbit_r, max_r_x, max_r_y)
        base_ang = random.random() * 2 * math.pi
        step = (2 * math.pi) / k           # exacte spacing

        # clamp het ORBIT CENTER zodat alle ballen binnen play_rect blijven
        cx0 = clamp(mx, play_rect.left + orbit_r + 40, play_rect.right - orbit_r - 40)
        cy0 = clamp(my, play_rect.top + orbit_r + 40, play_rect.bottom - orbit_r - 40)

        for i in range(k):
            ang = base_ang + i * step
            x = cx0 + math.cos(ang) * orbit_r
            y = cy0 + math.sin(ang) * orbit_r

            balls.append({
                "x": float(x), "y": float(y),
                "r": 28,
                "is_good": (i == good_idx),
                "ang": float(ang),
                "orbit_r": float(orbit_r),
                "orbit_spd": 0.028,
                "vx": 0.0, "vy": 0.0
            })


    def spawn_triangles_from_ball(ball, mx, my, now):
        # 6 driehoekjes met spread
        bx, by = ball["x"], ball["y"]
        dx = mx - bx
        dy = my - by
        dx, dy = normalize(dx, dy)

        base_ang = math.atan2(dy, dx)
        spread = math.radians(35)  # redelijke spread
        N = 7
        for j in range(N):
            t = 0.0 if N == 1 else (j / (N - 1))
            ang = base_ang + (t * 2 - 1) * spread
            vx = math.cos(ang) * 9.0
            vy = math.sin(ang) * 9.0
            tri_shots.append({
                "x": float(bx), "y": float(by),
                "vx": float(vx), "vy": float(vy),
                "until": now + 3500,
                "r": 12
            })

    def trigger_wall_damage_from_ball(ball, now):
        nonlocal wall_damage_in_progress, wall_damage_ball
        # alle andere ballen verdwijnen
        for b in balls[:]:
            if b is not ball:
                balls.remove(b)
        tri_shots.clear()
        wall_damage_in_progress = True
        wall_damage_ball = ball

    def apply_wall_damage(now):
        nonlocal wall_hp, wall_exists, wall_damage_in_progress, wall_damage_ball
        nonlocal grid_done, balls_done, stage_queue
        nonlocal boss_size, boss_x, boss_y

        # hit -> wall_hp--
        wall_hp -= 1
        if wall_hp <= 0:
            wall_hp = 0
            wall_exists = False
        wall_damage_in_progress = False
        wall_damage_ball = None

        # nieuwe stage of rage
        clear_stage_hazards()
        stage_queue = new_stage_queue()
        pick_new_safe_cell()
        grid_done = False
        balls_done = False
        finish_attack(now)

        # als muur kapot: start rage meteen
        if not wall_exists:
            start_rage(now)

    # ============================================================
    # Rage attack (wall kapot)
    # 25s chase+bounce, then 5s yellow blink = kill boss
    # if not killed, repeat rage (no extra growth)
    # ============================================================
    phase = "stage"  # "stage" or "rage"
    rage_state = "idle"
    RAGE_LEFT_FREE_MS = 1500
    rage_left_free_until = 0
    rage_until = 0
    rage_delay_until = 0
    rage_blink_until = 0
    boss_vx = 0.0
    boss_vy = 0.0
    rage_grown_once = False
    RAGE_SPEED = 11.0                 # sneller kaatsen
    RAGE_MOUSE_STUN_MS = 200          # muis stun behouden
    RAGE_BOSS_STUN_AT_MS = 20000      # na 20s
    RAGE_BOSS_STUN_MS = 3000          # 3s stilstand

    rage_start_time = 0
    boss_stun_until = 0
    boss_saved_vx = 0.0
    boss_saved_vy = 0.0
    rage_boss_stun_triggered = False


    def start_rage(now):
        nonlocal phase, rage_state, rage_until, boss_vx, boss_vy, rage_grown_once, rage_delay_until
        nonlocal boss_size, boss_img_big, boss_x, boss_y
        phase = "rage"
        rage_state = "delay"
        rage_delay_until = now + 3000     # 3s niks
        rage_until = rage_delay_until + 25000

        # 1x groter als muur kapot gaat
        if not rage_grown_once:
            boss_size_new = int(boss_size_base * 1.65)
            boss_size = boss_size_new
            boss_img_big = scaled_face(boss_size)
            rage_grown_once = True

        # zet boss net in speelveld (rechts) zodat hij je kan pakken
        boss_x = float(clamp(play_rect.left + 40, PLAY_LEFT, PLAY_RIGHT - boss_size))
        boss_y = float(clamp(play_rect.centery - boss_size / 2, PLAY_TOP, PLAY_BOT - boss_size))

        # start velocity
        # start velocity: schiet 1x richting muis, daarna alleen bounces
        mx0, my0 = pygame.mouse.get_pos()
        dx = (mx0 - (boss_x + boss_size / 2))
        dy = (my0 - (boss_y + boss_size / 2))
        ndx, ndy = normalize(dx, dy)
        boss_vx = ndx * RAGE_SPEED
        boss_vy = ndy * RAGE_SPEED

        # reset boss-stun timer
        nonlocal rage_start_time, boss_stun_until, boss_saved_vx, boss_saved_vy, rage_boss_stun_triggered
        rage_start_time = now
        boss_stun_until = 0
        boss_saved_vx = boss_vx
        boss_saved_vy = boss_vy
        rage_boss_stun_triggered = False


    def start_rage_blink(now):
        nonlocal rage_state, rage_blink_until
        rage_state = "blink"
        rage_blink_until = now + 5000

    # ============================================================
    # Helpers for resetting attack machine
    # ============================================================
    def current_attack_reset():
        nonlocal current_attack, attack_state, attack_until
        nonlocal cards, card_shots_left, card_next_shot
        nonlocal meteor_next_wave, meteor_end
        nonlocal line_next_wave, line_end
        nonlocal grid_phase, grid_phase_until
        nonlocal balls_phase, balls_phase_until, wall_damage_in_progress, wall_damage_ball
        current_attack = None
        attack_state = "idle"
        attack_until = 0

        cards.clear()
        card_shots_left = 0
        card_next_shot = 0

        meteor_next_wave = 0
        meteor_end = 0

        line_next_wave = 0
        line_end = 0

        grid_phase = "idle"
        grid_phase_until = 0

        balls_phase = "idle"
        balls_phase_until = 0
        wall_damage_in_progress = False
        wall_damage_ball = None

    current_attack_reset()
    start_delay_until = pygame.time.get_ticks() + 2000
    attack_gap_until = start_delay_until  # begint pas na de 2s start delay

    def spawn_bounce_meteors(now, count=3):
        for _ in range(count):
            spawn_meteor(now)   # <-- random in play_rect (blauw), net als meteor aanval

    def reset_stage_loop(now):
        """Reset de stage-loop (geen wall damage). Wordt gebruikt bij 'te vroeg' aanraken van de goede bal."""
        nonlocal stage_queue, grid_done, balls_done
        balls.clear()
        tri_shots.clear()
        clear_stage_hazards()
        stage_queue = new_stage_queue()
        grid_done = False
        balls_done = False
        finish_attack(now)

    def finish_attack(now):
        nonlocal attack_gap_until
        attack_gap_until = now + 2250     # 1 seconde pauze
        current_attack_reset()



    # ============================================================
    # Death check helper
    # ============================================================
    def die(now):
        if damage_should_kill(now):
            end_screen("lose")
            return True
        return False
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

        # mouse stun lock
        if now < mouse_stun_until:
            pygame.mouse.set_pos(mouse_stun_pos)
            pygame.mouse.get_rel()

        mx, my = pygame.mouse.get_pos()
        mx = clamp(mx, 0, w - 1)
        my = clamp(my, 0, h - 1)
        maybe_spawn_shield(now)
        try_pickup_shield(mx, my)

        # ============================================================
        # LETHAL boundaries (outer red walls)
        # ============================================================
        if left_wall.collidepoint(mx, my) or top_wall.collidepoint(mx, my) or bot_wall.collidepoint(mx, my) or right_wall.collidepoint(mx, my):
            if die(now):
                return

        # left interior is red lethal too
        if left_danger_rect.collidepoint(mx, my):
            if die(now):
                return

        # purple wall lethal if exists
        if wall_exists and purple_wall_rect.collidepoint(mx, my):
            if die(now):
                return

        # ============================================================
        # Update scheduler / attacks (unless rage)
        # ============================================================
        if phase == "stage":
            # 2 seconden niks doen aan attacks/spawns
            if now < start_delay_until:
                pass
            else:
                # pick next attack if none
                if current_attack is None:
                    if now < attack_gap_until:
                        pass
                    else:
                        if stage_queue:
                            nxt = stage_queue.pop(0)
                            if nxt == "cards":
                                start_cards(now)
                            elif nxt == "meteors":
                                start_meteors(now)
                            elif nxt == "lines":
                                start_lines(now)
                        else:
                            if not grid_done:
                                start_grid(now)
                                grid_done = True
                            elif not balls_done:
                                start_balls(now, mx, my)
                                balls_done = True
                            else:
                                # balls ended without wall damage -> restart stage loop (same wall stage)
                                clear_stage_hazards()
                                stage_queue = new_stage_queue()
                                grid_done = False
                                balls_done = False
                                finish_attack(now)

        # ============================================================
        # Attack updates
        # ============================================================
        # ---- Cards attack
        if current_attack == "cards":
            if attack_state == "firing":
                if card_shots_left > 0 and now >= card_next_shot:
                    spawn_card(now, mx, my)
                    card_shots_left -= 1
                    card_next_shot = now + CARD_DELAY_MS
                cells = build_grid_cells()
                safe_cell = cells[stage_safe_idx]

                for c in cards[:]:
                    c["x"] += c["vx"]
                    c["y"] += c["vy"]

                    # hit mouse = death
                    card_rect = pygame.Rect(int(c["x"] - CARD_W / 2), int(c["y"] - CARD_H / 2), CARD_W, CARD_H)
                    if card_rect.collidepoint(mx, my):
                        if die(now):
                            return
                    if card_rect.colliderect(safe_cell):
                        safe_flash_until = max(safe_flash_until, now + 140)

                    # collide with play rect borders or (if wall exists) purple wall (from right)
                    hit = False
                    if c["x"] < play_rect.left or c["x"] > play_rect.right or c["y"] < play_rect.top or c["y"] > play_rect.bottom:
                        hit = True
                    if wall_exists and c["x"] <= (purple_wall_rect.right + 1):
                        hit = True

                    if hit:
                        make_explosion(c["x"], c["y"], now)
                        cards.remove(c)

                # attack ends when all shots fired and no flying cards left
                if card_shots_left <= 0 and not cards:
                    finish_attack(now)

        # ---- Meteors attack
        if current_attack == "meteors":
            if now <= meteor_end:
                if now >= meteor_next_wave:
                    meteor_next_wave = now + 1000
                    for _ in range(10):
                        spawn_meteor(now)
            else:
                finish_attack(now)

        # ---- Lines attack
        if current_attack == "lines":
            if now <= line_end:
                if now >= line_next_wave:
                    line_next_wave = now + 2000
                    # 3 lijnen: 0°, -35°, +35°
                    spawn_snake_line(mx, my, 0.0, now)
                    spawn_snake_line(mx, my, math.radians(-35), now)
                    spawn_snake_line(mx, my, math.radians(35), now)
            else:
                finish_attack(now)

        # ---- Grid attack
        if current_attack == "grid":
            if grid_phase == "telegraph":
                if now >= grid_phase_until:
                    grid_phase = "lethal"
                    grid_phase_until = now + 1500
            elif grid_phase == "lethal":
                if now >= grid_phase_until:
                    # done
                    finish_attack(now)

        # ---- Balls attack (damage wall)
        if current_attack == "balls":
            cells = build_grid_cells()

            # collision with balls
                        # ------------------------------------------------------------
            if balls_phase in ("spawn_still", "orbit", "bounce", "yellow") and not wall_damage_in_progress:
                for b in balls:
                    rr = b["r"]
                    if (mx - b["x"]) ** 2 + (my - b["y"]) ** 2 <= rr * rr:

                        if b["is_good"]:
                            if balls_phase == "yellow":
                                # ✅ altijd wall damage in yellow
                                trigger_wall_damage_from_ball(b, now)
                            else:
                                # ❌ goede bal raakt tijdens bewegen -> damage op speler
                                if die(now):
                                    return
                                reset_stage_loop(now)
                                continue  # terug naar main loop
                        else:
                            # ❌ verkeerde bal -> damage op speler
                            if die(now):
                                return
                            reset_stage_loop(now)
                            continue  # terug naar main loop

                        break


            # wall damage animation
            if wall_damage_in_progress and wall_damage_ball is not None:
                # vlieg naar muur (purple wall) en damage
                tx = purple_wall_rect.right + 2  # van rechts tegen muur aan
                ty = clamp(wall_damage_ball["y"], PLAY_TOP + 20, PLAY_BOT - 20)
                dx = tx - wall_damage_ball["x"]
                dy = ty - wall_damage_ball["y"]
                dx, dy = normalize(dx, dy)
                spd = 18.0
                wall_damage_ball["x"] += dx * spd
                wall_damage_ball["y"] += dy * spd

                # geraakt
                if abs(wall_damage_ball["x"] - tx) < 12:
                    apply_wall_damage(now)
                    continue  # skip rest update

            # phase machine
            if balls_phase == "spawn_still":
                if now >= balls_phase_until:
                    balls_phase = "orbit"
                    balls_orbit_start = now
                    balls_last_shot = now
                    good_flash_until = now + 3000   # <-- 3s volledig groen zodra orbit start

            elif balls_phase == "orbit":
                if blackout_times and now >= blackout_times[0]:
                    blackout_until = now + BLACKOUT_MS
                    blackout_times.pop(0)
                for i, b in enumerate(balls):
                    b["ang"] += b["orbit_spd"] * (1.0 + 0.35 * wall_lost())
                    r = b["orbit_r"]

                    cx_lo = play_rect.left + r + 40
                    cx_hi = play_rect.right - r - 40
                    cy_lo = play_rect.top + r + 40
                    cy_hi = play_rect.bottom - r - 40

                    cx0 = clamp(mx, cx_lo, cx_hi) if cx_lo <= cx_hi else play_rect.centerx
                    cy0 = clamp(my, cy_lo, cy_hi) if cy_lo <= cy_hi else play_rect.centery


                    b["x"] = float(cx0 + math.cos(b["ang"]) * r)
                    b["y"] = float(cy0 + math.sin(b["ang"]) * r)


                # elke 3s: 1 random bal schiet 6 triangles
                if now - balls_last_shot >= 3000 and balls:
                    balls_last_shot = now
                    shooter = random.choice(balls)
                    spawn_triangles_from_ball(shooter, mx, my, now)

                # na 20s -> bounce 5s
                if now - balls_orbit_start >= 20000:
                    balls_phase = "bounce"
                    balls_bounce_end = now + 5000
                    # random velocities
                    for b in balls:
                        a = random.random() * 2 * math.pi
                        b["vx"] = math.cos(a) * (9.0 + 1.5 * wall_lost())
                        b["vy"] = math.sin(a) * (9.0 + 1.5 * wall_lost())

            elif balls_phase == "bounce":
                # allemaal dodelijk nu
                for b in balls:
                    b["x"] += b["vx"]
                    b["y"] += b["vy"]

                    # bounce in play_rect + purple wall (als bestaat)
                    if b["x"] - b["r"] < play_rect.left:
                        b["x"] = play_rect.left + b["r"]
                        b["vx"] *= -1
                    if b["x"] + b["r"] > play_rect.right:
                        b["x"] = play_rect.right - b["r"]
                        b["vx"] *= -1
                    if b["y"] - b["r"] < play_rect.top:
                        b["y"] = play_rect.top + b["r"]
                        b["vy"] *= -1
                    if b["y"] + b["r"] > play_rect.bottom:
                        b["y"] = play_rect.bottom - b["r"]
                        b["vy"] *= -1

                if now >= balls_bounce_end:
                    balls_phase = "yellow"
                    balls_yellow_end = now + 5000
                    # stop waar ze zijn
                    for b in balls:
                        b["vx"] = 0.0
                        b["vy"] = 0.0

            elif balls_phase == "yellow":
                # collision wordt al boven afgehandeld (goede bal = muur, slechte = dood)
                if now >= balls_yellow_end:
                    # geen wall damage -> reset stage loop
                    balls.clear()
                    tri_shots.clear()
                    finish_attack(now)

        # ============================================================
        # Update hazards (explosions, meteors, snakes, triangles)
        # ============================================================
        # explosions
        if explosions:
            cells = build_grid_cells()
            safe_cell = cells[stage_safe_idx]

            for ex in explosions[:]:
                if now >= ex["until"]:
                    explosions.remove(ex)
                    continue
                # kill if mouse in explosion
                if (mx - ex["x"]) ** 2 + (my - ex["y"]) ** 2 <= ex["r"] ** 2:
                    if die(now):
                        return

        # meteors
        for m in meteors[:]:
            if now >= m["danger_until"]:
                meteors.remove(m)
                continue
            if now >= m["tele_until"]:
                # danger
                if (mx - m["x"]) ** 2 + (my - m["y"]) ** 2 <= m["r"] ** 2:
                    if die(now):
                        return

        # snakes
        for sn in snakes[:]:
            if now >= sn["life_end"]:
                snakes.remove(sn)
                continue

            # move particles
            pts = sn["pts"]
            max_b = sn["max_b"]
            for p in pts[:]:
                p["x"] += p["vx"]
                p["y"] += p["vy"]

                bounced = False
                # bounce inside play_rect; also bounce on purple wall from right
                if p["x"] < play_rect.left:
                    p["x"] = play_rect.left
                    p["vx"] *= -1
                    bounced = True
                if p["x"] > play_rect.right:
                    p["x"] = play_rect.right
                    p["vx"] *= -1
                    bounced = True
                if p["y"] < play_rect.top:
                    p["y"] = play_rect.top
                    p["vy"] *= -1
                    bounced = True
                if p["y"] > play_rect.bottom:
                    p["y"] = play_rect.bottom
                    p["vy"] *= -1
                    bounced = True

                if wall_exists and p["x"] <= purple_wall_rect.right:
                    p["x"] = purple_wall_rect.right + 1
                    p["vx"] *= -1
                    bounced = True

                if bounced:
                    p["b"] += 1
                    if p["b"] > max_b:
                        pts.remove(p)

            if len(pts) < 2:
                snakes.remove(sn)
                continue

            # collision with mouse (segment distance)
            th = sn["th"]
            for i in range(len(pts) - 1):
                ax, ay = pts[i]["x"], pts[i]["y"]
                bx2, by2 = pts[i + 1]["x"], pts[i + 1]["y"]
                if dist_point_to_segment(mx, my, ax, ay, bx2, by2) <= th / 2:
                    if die(now):
                        return
                    break

        # triangles
        for t in tri_shots[:]:
            if now >= t["until"]:
                tri_shots.remove(t)
                continue
            t["x"] += t["vx"]
            t["y"] += t["vy"]

            # bounce against play_rect + purple wall
            if t["x"] < play_rect.left or t["x"] > play_rect.right or t["y"] < play_rect.top or t["y"] > play_rect.bottom:
                tri_shots.remove(t)
                continue
            if wall_exists and t["x"] <= purple_wall_rect.right:
                tri_shots.remove(t)
                continue

            if (mx - t["x"]) ** 2 + (my - t["y"]) ** 2 <= (t["r"] ** 2):
                if die(now):
                    return

        # ============================================================
        # Grid lethal (during grid attack lethal phase)
        # ============================================================
        if current_attack == "grid" and grid_phase == "lethal":
            cells = build_grid_cells()
            for i, r in enumerate(cells):
                if i == stage_safe_idx:
                    continue
                if r.collidepoint(mx, my):
                    if die(now):
                        return
                    break

        # ============================================================
        # Rage phase (wall kapot)
        # ============================================================
        RAGE_LEFT = play_rect.left      # <- dit voorkomt dat hij in left_danger_rect komt
        RAGE_RIGHT = PLAY_RIGHT
        RAGE_TOP = PLAY_TOP
        RAGE_BOT = PLAY_BOT

        if phase == "rage":
            if rage_state == "delay":
                # 3s: niets gebeurt (boss staat stil / geen meteors)
                boss_vx, boss_vy = 0.0, 0.0
                if now >= rage_delay_until:
                    rage_state = "chase"
                    # schiet 1x richting muis op moment dat delay eindigt
                    mx0, my0 = pygame.mouse.get_pos()
                    dx = (mx0 - (boss_x + boss_size / 2))
                    dy = (my0 - (boss_y + boss_size / 2))
                    ndx, ndy = normalize(dx, dy)
                    boss_vx = ndx * RAGE_SPEED
                    boss_vy = ndy * RAGE_SPEED
                    rage_left_free_until = now + RAGE_LEFT_FREE_MS

            if rage_state == "chase":
                # PURE BOUNCES (geen homing)
                boss_x += boss_vx
                boss_y += boss_vy

                # eerst initialiseren!
                bounced_x = False
                bounced_y = False

                # linker grens is tijdelijk PLAY_LEFT (1.5s), daarna weer RAGE_LEFT
                left_bound = PLAY_LEFT if now < rage_left_free_until else RAGE_LEFT

                # bounce checks
                if boss_x < left_bound:
                    boss_x = left_bound
                    boss_vx *= -1
                    bounced_x = True

                if boss_x + boss_size > RAGE_RIGHT:
                    boss_x = RAGE_RIGHT - boss_size
                    boss_vx *= -1
                    bounced_x = True

                if boss_y < RAGE_TOP:
                    boss_y = RAGE_TOP
                    boss_vy *= -1
                    bounced_y = True

                if boss_y + boss_size > RAGE_BOT:
                    boss_y = RAGE_BOT - boss_size
                    boss_vy *= -1
                    bounced_y = True

                # extra clamp (BELANGRIJK: gebruik left_bound, anders werkt je 1.5s free-pass niet)
                boss_x = clamp(boss_x, left_bound, RAGE_RIGHT - boss_size)
                boss_y = clamp(boss_y, RAGE_TOP, RAGE_BOT - boss_size)

                # PER BOUNCE -> meteors + muis stun
                if bounced_x:
                    spawn_bounce_meteors(now, count=3)          # <-- random in blauw, zoals je meteor attack
                    apply_mouse_stun(now, ms=RAGE_MOUSE_STUN_MS)

                if bounced_y:
                    spawn_bounce_meteors(now, count=3)
                    apply_mouse_stun(now, ms=RAGE_MOUSE_STUN_MS)


                # extra clamp (voorkomt "doorheen lekken" als speed hoog is)
                boss_x = clamp(boss_x, RAGE_LEFT, RAGE_RIGHT - boss_size)
                boss_y = clamp(boss_y, RAGE_TOP, RAGE_BOT - boss_size)


                # per bounce -> 3 meteors + stun blijft
                if bounced_x:
                    center = (boss_x + boss_size / 2, boss_y + boss_size / 2)
                    spawn_bounce_meteors_small(now, count=3, center=center)
                    apply_mouse_stun(now, ms=RAGE_MOUSE_STUN_MS)
                if bounced_y:
                    center = (boss_x + boss_size / 2, boss_y + boss_size / 2)
                    spawn_bounce_meteors_small(now, count=3, center=center)
                    apply_mouse_stun(now, ms=RAGE_MOUSE_STUN_MS)

                # boss lethal in chase
                boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)
                if boss_rect.collidepoint(mx, my):
                    if die(now):
                        return

                # na 25s -> blink fase
                if now >= rage_until:
                    start_rage_blink(now)

            elif rage_state == "blink":
                # tijdens blink: touch boss = win (boss niet lethal)
                boss_rect = pygame.Rect(int(boss_x), int(boss_y), boss_size, boss_size)
                if boss_rect.collidepoint(mx, my):
                    end_screen("win")
                    return "win"

                # PURE BOUNCES tijdens blink
                boss_x += boss_vx
                boss_y += boss_vy

                bounced_x = False
                bounced_y = False

                if bounced_x:
                    spawn_bounce_meteors(now, count=3)
                if bounced_y:
                    spawn_bounce_meteors(now, count=3)

                # linker grens is tijdelijk PLAY_LEFT (1.5s), daarna weer RAGE_LEFT
                left_bound = PLAY_LEFT if now < rage_left_free_until else RAGE_LEFT

                if boss_x < left_bound:
                    boss_x = left_bound
                    boss_vx *= -1
                    bounced_x = True
                if boss_x + boss_size > PLAY_RIGHT:
                    boss_x = PLAY_RIGHT - boss_size
                    boss_vx *= -1
                    bounced_x = True

                if boss_y < PLAY_TOP:
                    boss_y = PLAY_TOP
                    boss_vy *= -1
                    bounced_y = True
                if boss_y + boss_size > PLAY_BOT:
                    boss_y = PLAY_BOT - boss_size
                    boss_vy *= -1
                    bounced_y = True

                # per bounce -> 3 meteors + stun blijft
                if bounced_x:
                    spawn_bounce_meteors(now, count=3)
                    apply_mouse_stun(now, ms=200)
                if bounced_y:
                    spawn_bounce_meteors(now, count=3)
                    apply_mouse_stun(now, ms=200)

                # blink voorbij -> terug naar chase
                if now >= rage_blink_until:
                    rage_state = "chase"
                    rage_until = now + 25000


        # ============================================================
        # DRAW
        # ============================================================
        # blue base
        screen.fill((0, 0, 255))

        # left interior red region
        pygame.draw.rect(screen, (255, 0, 0), left_danger_rect)

        # outer walls red
        pygame.draw.rect(screen, (255, 0, 0), left_wall)
        pygame.draw.rect(screen, (255, 0, 0), top_wall)
        pygame.draw.rect(screen, (255, 0, 0), bot_wall)
        pygame.draw.rect(screen, (255, 0, 0), right_wall)

        # purple/pink/yellow wall
        if wall_exists:
            pygame.draw.rect(screen, wall_color(), purple_wall_rect)

        # Grid visuals (telegraph)
        cells = build_grid_cells()
        safe_cell = cells[stage_safe_idx]

        # safe cell green blink (from explosions)
        if safe_flash_until > now:
            overlay = pygame.Surface((safe_cell.width, safe_cell.height), pygame.SRCALPHA)
            overlay.fill((130, 255, 130, 150))
            screen.blit(overlay, safe_cell.topleft)

        # grid lines for 2s
        if current_attack == "grid" and grid_phase == "telegraph":
            n = grid_n()
            cw = play_rect.width / n
            ch = play_rect.height / n

            # vertical lines
            for i in range(1, n):
                x = int(play_rect.left + i * cw)
                pygame.draw.line(screen, (170, 170, 170), (x, play_rect.top), (x, play_rect.bottom), 3)
            # horizontal lines
            for i in range(1, n):
                y = int(play_rect.top + i * ch)
                pygame.draw.line(screen, (170, 170, 170), (play_rect.left, y), (play_rect.right, y), 3)

        # lethal non-safe cells for 1.5s
        if current_attack == "grid" and grid_phase == "lethal":
            for i, r in enumerate(cells):
                if i == stage_safe_idx:
                    continue
                pygame.draw.rect(screen, (255, 0, 0), r)

        # Boss draw (left in stage, rage in arena)
        # Boss draw (stage = small, rage = big)
        
        # Draw cards
        for c in cards:
            r = card_surf.get_rect(center=(int(c["x"]), int(c["y"])))
            screen.blit(card_surf, r.topleft)

        # Draw explosions (red translucent circles)
        # Draw explosions (PUUR rood: zelfde kleur rand + midden)
        for ex in explosions:
            r = int(ex["r"])
            surf = pygame.Surface((2 * r, 2 * r), pygame.SRCALPHA)
            pygame.draw.circle(surf, (255, 0, 0, 255), (r, r), r)      # fill
            pygame.draw.circle(surf, (255, 0, 0, 255), (r, r), r, 4)   # outline
            screen.blit(surf, (int(ex["x"] - r), int(ex["y"] - r)))



        # Draw meteors
        for m in meteors:
            r = int(m["r"])
            if now < m["tele_until"]:
                # gevuld grijs (telegraph, nog NIET dodelijk)
                surf = pygame.Surface((2 * r, 2 * r), pygame.SRCALPHA)
                pygame.draw.circle(surf, (170, 170, 170, 90), (r, r), r)      # fill
                pygame.draw.circle(surf, (170, 170, 170, 220), (r, r), r, 4)  # outline
                screen.blit(surf, (int(m["x"] - r), int(m["y"] - r)))
            else:
                pygame.draw.circle(screen, (255, 0, 0), (int(m["x"]), int(m["y"])), r, 0)
                pygame.draw.circle(screen, (0, 0, 0), (int(m["x"]), int(m["y"])), r, 3)

        if phase == "stage":
            screen.blit(boss_img_small, (int(boss_x), int(boss_y)))
        else:
            img = boss_img_big if boss_img_big is not None else boss_img_small
            screen.blit(img, (int(boss_x), int(boss_y)))

            # rage: red tint
            red = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
            red.fill((255, 0, 0, 80))
            screen.blit(red, (int(boss_x), int(boss_y)))

            # yellow blink overlay
            if rage_state == "blink" and (now // 120) % 2 == 0:
                yel = pygame.Surface((boss_size, boss_size), pygame.SRCALPHA)
                yel.fill((255, 255, 0, 140))
                screen.blit(yel, (int(boss_x), int(boss_y)))


        # Draw snakes
        for sn in snakes:
            pts = sn["pts"]
            if len(pts) >= 2:
                draw_pts = [(int(p["x"]), int(p["y"])) for p in pts]
                pygame.draw.lines(screen, (255, 0, 0), False, draw_pts, sn["th"])

        # Draw balls
        if current_attack == "balls":
            # correct ball is green for first 3s after start
            for b in balls:
                cx, cy = int(b["x"]), int(b["y"])
                rr = int(b["r"])

                flash_green = (b["is_good"] and balls_phase == "orbit" and now < good_flash_until)

                if flash_green:
                    # 3 sec: HELE BAL donker groen (geen gezicht erover)
                    pygame.draw.circle(screen, (0, 90, 0), (cx, cy), rr)
                    pygame.draw.circle(screen, (255, 255, 255), (cx, cy), rr, 2)
                    continue

                # normaal (grijs + gezicht)
                col = (170, 170, 170)
                if balls_phase == "yellow":
                    col = (255, 255, 0)

                pygame.draw.circle(screen, col, (cx, cy), rr)
                pygame.draw.circle(screen, (255, 255, 255), (cx, cy), rr, 2)
                blit_face_in_circle(cx, cy, rr)

            # wall damage ball (fly to wall)
            if wall_damage_in_progress and wall_damage_ball is not None:
                cx, cy = int(wall_damage_ball["x"]), int(wall_damage_ball["y"])
                rr = int(wall_damage_ball["r"])
                pygame.draw.circle(screen, (0, 200, 0), (cx, cy), rr)
                pygame.draw.circle(screen, (255, 255, 255), (cx, cy), rr, 2)
                blit_face_in_circle(cx, cy, rr)

        # Draw triangles
        for t in tri_shots:
            r = tri_surf.get_rect(center=(int(t["x"]), int(t["y"])))
            screen.blit(tri_surf, r.topleft)

        draw_shield_pickup()
        draw_shield_indicator()
    
        # Boss name + HP bar (1 segment)
        name_surf = header_font.render(boss_name, True, (255, 255, 255))
        name_rect = name_surf.get_rect(midtop=(w // 2, 160))
        screen.blit(name_surf, name_rect)

        bar_w = max(220, name_rect.width + 60)
        bar_h = 20
        bx0 = w // 2 - bar_w // 2
        by0 = name_rect.bottom + 8

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

        if now < blackout_until:
            screen.fill((0, 0, 0))

        pygame.display.flip()
        clock.tick(60)







