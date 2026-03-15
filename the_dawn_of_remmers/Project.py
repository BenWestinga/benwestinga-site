import hashlib
import json
import math
import random
from pathlib import Path

import pygame
import Bond, Did, Hottie, Joe, Man, Stein, beast, crazy, game_settings, ump

ASSET_DIR = Path(__file__).resolve().parent
DB_FILE = ASSET_DIR / "player_data.json"
SCREEN_WIDTH, SCREEN_HEIGHT = 1920, 1080
SHIELD_ICON_POS = (1624, 140)
PERCENT_POS = (1530, 140)
BACK_X_RECT = pygame.Rect(22, 22, 50, 50)

ARCADE_PLAYER_R = 8
ARCADE_SPAWN_EVERY_MS = 30000
ARCADE_ARENA = pygame.Rect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
ARCADE_SAFE_LEFT = 500
ARCADE_SAFE_TOP = 150
ARCADE_SAFE_RIGHT = 1700
ARCADE_SAFE_BOTTOM = SCREEN_HEIGHT - 150

BOSSES = [
    {"key": "joe_biden", "name": "Joe Biden", "img": "Joe.png"},
    {"key": "trump", "name": "Trump", "img": "ump.png"},
    {"key": "epstein", "name": "Epstein", "img": "Stein.png"},
    {"key": "mrbeast", "name": "Mrbeast", "img": "beast.png"},
    {"key": "hitler", "name": "Hitler", "img": "Man.png"},
    {"key": "p_diddy", "name": "P. Diddy", "img": "Did.png"},
    {"key": "drug_addict", "name": "Drug addict", "img": "crazy.png"},
    {"key": "hottie", "name": "Hot Guy", "img": "Hottie.png"},
    {"key": "james_bond", "name": "James Bond", "img": "Bond.png"},
]


def resolve_asset(name):
    p = ASSET_DIR / name
    if p.exists():
        return p
    low = name.lower()
    for c in ASSET_DIR.iterdir():
        if c.is_file() and c.name.lower() == low:
            return c
    return None


def hash_pw(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def default_best():
    return {b["key"]: 0 for b in BOSSES}


def ensure_acc(acc):
    if not isinstance(acc, dict):
        acc = {}
    acc.setdefault("password_hash", "")

    st = acc.get("settings", {})
    if not isinstance(st, dict):
        st = {}
    st.setdefault("shield_enabled", True)
    st.setdefault("game_speed_percent", 100)
    try:
        st["game_speed_percent"] = max(1, min(2000, int(st["game_speed_percent"])))
    except Exception:
        st["game_speed_percent"] = 100
    acc["settings"] = st

    best = acc.get("best_speed_by_boss", {})
    if not isinstance(best, dict):
        best = {}
    for k, v in default_best().items():
        best.setdefault(k, v)
        try:
            best[k] = max(0, int(best[k]))
        except Exception:
            best[k] = 0
    acc["best_speed_by_boss"] = best

    ach = acc.get("achievements", {})
    if not isinstance(ach, dict):
        ach = {}
    acc["achievements"] = ach

    try:
        acc["best_arcade_seconds"] = max(0, int(acc.get("best_arcade_seconds", 0)))
    except Exception:
        acc["best_arcade_seconds"] = 0

    return acc


def load_db():
    db = {"accounts": {}}
    if DB_FILE.exists():
        try:
            d = json.loads(DB_FILE.read_text(encoding="utf-8"))
            if isinstance(d, dict):
                db.update(d)
        except Exception:
            pass

    ac = db.get("accounts", {})
    migrated_from_legacy_list = isinstance(ac, list)
    if isinstance(ac, list):
        legacy_speed = 100
        try:
            legacy_speed = max(1, min(2000, int(db.get("game_speed_percent", 100))))
        except Exception:
            legacy_speed = 100
        legacy_no_shields = bool(db.get("no_shields", False))
        legacy_accounts = {}
        for raw_name in ac:
            name = str(raw_name).strip()
            if not name:
                continue
            legacy_accounts[name] = ensure_acc(
                {
                    "password_hash": hash_pw(""),
                    "settings": {
                        "shield_enabled": not legacy_no_shields,
                        "game_speed_percent": legacy_speed,
                    },
                    "best_speed_by_boss": default_best(),
                    "achievements": {},
                    "best_arcade_seconds": 0,
                }
            )
        ac = legacy_accounts
    elif not isinstance(ac, dict):
        ac = {}

    clean = {}
    for u, a in ac.items():
        uu = str(u).strip()
        if uu:
            clean[uu] = ensure_acc(a)
    db["accounts"] = clean

    if migrated_from_legacy_list:
        save_db(db)

    return db


def save_db(db):
    tmp = DB_FILE.with_suffix(".tmp")
    try:
        tmp.write_text(json.dumps({"accounts": db.get("accounts", {})}, indent=2), encoding="utf-8")
        tmp.replace(DB_FILE)
    except Exception:
        pass


def ach_defs():
    out = []
    for b in BOSSES:
        k, n = b["key"], b["name"]
        out.append((f"beat_{k}", f"Beat {n}"))
        out.append((f"beat_no_shield_{k}", f"Beat {n} with Shield OFF"))
        out.append((f"beat_150_{k}", f"Beat {n} at 150%+ speed"))
    return out


def draw_btn(surf, rect, text, font, fill=(0, 128, 255)):
    pygame.draw.rect(surf, fill, rect)
    pygame.draw.rect(surf, (255, 255, 255), rect, 3)
    t = font.render(text, True, (255, 255, 255))
    surf.blit(t, t.get_rect(center=rect.center))


def draw_field(surf, rect, text, font, active=False, placeholder=""):
    pygame.draw.rect(surf, (15, 15, 25), rect)
    pygame.draw.rect(surf, (0, 200, 255) if active else (255, 255, 255), rect, 2)
    show = text if text else placeholder
    surf.blit(font.render(show, True, (255, 255, 255)), (rect.x + 10, rect.y + 12))


def draw_pw_field(surf, rect, text, font, active=False):
    draw_field(surf, rect, "*" * len(text), font, active)


def draw_percent_shield(surf, font, speed, shield_on):
    p = font.render(f"{speed}%", True, (255, 255, 255))
    r = p.get_rect(center=PERCENT_POS)
    b = pygame.Rect(r.x - 10, r.y - 6, r.width + 20, r.height + 12)
    pygame.draw.rect(surf, (0, 0, 0), b)
    pygame.draw.rect(surf, (255, 255, 255), b, 1)
    surf.blit(p, r)
    game_settings.draw_shield_icon(surf, SHIELD_ICON_POS, shield_on)


def draw_back_x(surf):
    pygame.draw.rect(surf, (20, 20, 20), BACK_X_RECT)
    pygame.draw.rect(surf, (255, 255, 255), BACK_X_RECT, 2)
    pygame.draw.line(surf, (220, 40, 40), (BACK_X_RECT.left + 11, BACK_X_RECT.top + 11), (BACK_X_RECT.right - 11, BACK_X_RECT.bottom - 11), 4)
    pygame.draw.line(surf, (220, 40, 40), (BACK_X_RECT.right - 11, BACK_X_RECT.top + 11), (BACK_X_RECT.left + 11, BACK_X_RECT.bottom - 11), 4)


def wrap_text(text, font, max_width):
    words = text.split()
    lines = []
    current = ""
    for w in words:
        test = w if not current else current + " " + w
        if font.size(test)[0] <= max_width:
            current = test
        else:
            if current:
                lines.append(current)
            current = w
    if current:
        lines.append(current)
    return lines


def apply_settings(acc):
    st = acc["settings"]
    game_settings.set_game_speed_percent(st["game_speed_percent"])
    game_settings.set_no_shields(not st["shield_enabled"])


def mark_win(acc, boss_key):
    st = acc["settings"]
    speed = int(st["game_speed_percent"])
    shield_on = bool(st["shield_enabled"])
    ach = acc["achievements"]
    ach[f"beat_{boss_key}"] = True
    if not shield_on:
        ach[f"beat_no_shield_{boss_key}"] = True
    if speed >= 150:
        ach[f"beat_150_{boss_key}"] = True
    acc["best_speed_by_boss"][boss_key] = max(acc["best_speed_by_boss"].get(boss_key, 0), speed)


def run_boss(i, screen):
    pygame.mouse.set_pos(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
    if i == 0:
        return Joe.bossfight_Joe(screen)
    if i == 1:
        return ump.bossfight_ump(screen)
    if i == 2:
        return Stein.bossfight_Stein(screen)
    if i == 3:
        return beast.bossfight_beast(screen)
    if i == 4:
        return Man.bossfight_Man(screen)
    if i == 5:
        return Did.bossfight_Did(screen)
    if i == 6:
        return crazy.bossfight_crazy(screen)
    if i == 7:
        return Hottie.bossfight_Hottie(screen)
    return None

def arcade_enemy_color(boss_idx):
    palette = [
        (70, 130, 255),
        (255, 180, 60),
        (170, 90, 240),
        (255, 80, 80),
        (140, 220, 90),
        (255, 120, 190),
        (100, 220, 220),
        (250, 250, 120),
        (240, 140, 60),
    ]
    return palette[boss_idx % len(palette)]


def arcade_safe_rect(arena):
    return pygame.Rect(
        ARCADE_SAFE_LEFT,
        ARCADE_SAFE_TOP,
        ARCADE_SAFE_RIGHT - ARCADE_SAFE_LEFT,
        ARCADE_SAFE_BOTTOM - ARCADE_SAFE_TOP,
    )


def new_arcade_session(now):
    return {
        "start_time": now,
        "death_time": None,
        "alive": True,
        "saved": False,
        "next_spawn": now,
        "enemies": [],
        "projectiles": [],
        "next_enemy_id": 1,
    }


def spawn_arcade_enemy(session, now, arena):
    safe = arcade_safe_rect(arena)
    boss_idx = random.randrange(len(BOSSES))
    stage = random.randint(1, 5)
    r = 19 + stage * 2
    x = random.uniform(safe.left + r, safe.right - r)
    y = random.uniform(safe.top + r, safe.bottom - r)
    ang = random.uniform(0, math.tau)
    speed = 1.8 + stage * 0.45
    enemy = {
        "id": session["next_enemy_id"],
        "boss_idx": boss_idx,
        "stage": stage,
        "x": x,
        "y": y,
        "r": r,
        "vx": math.cos(ang) * speed,
        "vy": math.sin(ang) * speed,
        "next_fire": now + random.randint(500, 1200),
        "fire_cd": max(320, 1450 - stage * 170),
    }
    session["next_enemy_id"] += 1
    session["enemies"].append(enemy)


def spawn_arcade_proj(projectiles, x, y, vx, vy, r, color, owner_id, now, life_ms=7000):
    projectiles.append(
        {
            "x": float(x),
            "y": float(y),
            "vx": float(vx),
            "vy": float(vy),
            "r": int(r),
            "color": color,
            "owner": owner_id,
            "expire": now + life_ms,
        }
    )


def spawn_arcade_attack(enemy, projectiles, now, player_pos):
    ex, ey = enemy["x"], enemy["y"]
    mx, my = player_pos
    dx, dy = mx - ex, my - ey
    dist = math.hypot(dx, dy)
    if dist < 1e-6:
        dist = 1.0
    ux, uy = dx / dist, dy / dist
    base_ang = math.atan2(uy, ux)

    stage = enemy["stage"]
    speed = 5.0 + stage * 0.7
    bullet_color = (230, 30, 30)

    if stage == 1:
        spawn_arcade_proj(projectiles, ex, ey, ux * speed, uy * speed, 7, bullet_color, enemy["id"], now)
    elif stage == 2:
        for da in (-0.24, 0.0, 0.24):
            a = base_ang + da
            spawn_arcade_proj(projectiles, ex, ey, math.cos(a) * speed, math.sin(a) * speed, 7, bullet_color, enemy["id"], now)
    elif stage == 3:
        for a in (0.0, math.pi * 0.5, math.pi, math.pi * 1.5):
            spawn_arcade_proj(projectiles, ex, ey, math.cos(a) * speed, math.sin(a) * speed, 8, bullet_color, enemy["id"], now)
    elif stage == 4:
        for i in range(8):
            a = base_ang + i * (math.tau / 8.0)
            spawn_arcade_proj(projectiles, ex, ey, math.cos(a) * (speed - 0.7), math.sin(a) * (speed - 0.7), 8, bullet_color, enemy["id"], now)
    else:
        for da in (-0.32, -0.16, 0.0, 0.16, 0.32):
            a = base_ang + da
            spawn_arcade_proj(projectiles, ex, ey, math.cos(a) * (speed + 1.0), math.sin(a) * (speed + 1.0), 9, bullet_color, enemy["id"], now)


def update_arcade(session, now, dt_ms, mouse_pos, arena):
    if not session["alive"]:
        return

    safe = arcade_safe_rect(arena)

    while now >= session["next_spawn"]:
        spawn_arcade_enemy(session, now, arena)
        session["next_spawn"] += ARCADE_SPAWN_EVERY_MS

    frame_scale = max(0.35, min(3.2, dt_ms / 16.6667))

    for enemy in session["enemies"]:
        enemy["x"] += enemy["vx"] * frame_scale
        enemy["y"] += enemy["vy"] * frame_scale

        r = enemy["r"]
        if enemy["x"] < safe.left + r:
            enemy["x"] = safe.left + r
            enemy["vx"] = abs(enemy["vx"])
        elif enemy["x"] > safe.right - r:
            enemy["x"] = safe.right - r
            enemy["vx"] = -abs(enemy["vx"])

        if enemy["y"] < safe.top + r:
            enemy["y"] = safe.top + r
            enemy["vy"] = abs(enemy["vy"])
        elif enemy["y"] > safe.bottom - r:
            enemy["y"] = safe.bottom - r
            enemy["vy"] = -abs(enemy["vy"])

        while now >= enemy["next_fire"]:
            spawn_arcade_attack(enemy, session["projectiles"], now, mouse_pos)
            enemy["next_fire"] += enemy["fire_cd"]

    dead_enemy_ids = set()
    alive_projectiles = []

    for p in session["projectiles"]:
        p["x"] += p["vx"] * frame_scale
        p["y"] += p["vy"] * frame_scale

        if now >= p["expire"]:
            continue

        if p["x"] < safe.left - 40 or p["x"] > safe.right + 40 or p["y"] < safe.top - 40 or p["y"] > safe.bottom + 40:
            continue

        hit_enemy = False
        for e in session["enemies"]:
            if e["id"] == p["owner"] or e["id"] in dead_enemy_ids:
                continue
            if math.hypot(p["x"] - e["x"], p["y"] - e["y"]) <= p["r"] + e["r"]:
                dead_enemy_ids.add(e["id"])
                hit_enemy = True
                break
        if hit_enemy:
            continue

        if math.hypot(p["x"] - mouse_pos[0], p["y"] - mouse_pos[1]) <= p["r"] + ARCADE_PLAYER_R:
            session["alive"] = False
            session["death_time"] = now
            return

        alive_projectiles.append(p)

    if dead_enemy_ids:
        session["enemies"] = [e for e in session["enemies"] if e["id"] not in dead_enemy_ids]
    session["projectiles"] = alive_projectiles

    if not safe.collidepoint(mouse_pos):
        session["alive"] = False
        session["death_time"] = now


pygame.init()
pygame.font.init()
game_settings.install_runtime_hooks()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SCALED)
clock = pygame.time.Clock()

font = pygame.font.SysFont(None, 32)
small = pygame.font.SysFont(None, 26)
mini = pygame.font.SysFont(None, 22)
mid = pygame.font.SysFont(None, 42)
head = pygame.font.SysFont(None, 72)

bgp = resolve_asset("beginscherm.png")
if bgp is not None:
    bg = pygame.image.load(str(bgp)).convert()
    bg = pygame.transform.scale(bg, (SCREEN_WIDTH, SCREEN_HEIGHT))
else:
    bg = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
    bg.fill((20, 20, 30))

previews = []
arcade_images = []
arcade_image_cache = {}
for b in BOSSES:
    try:
        p = resolve_asset(b["img"])
        if p is None:
            raise FileNotFoundError
        img = pygame.image.load(str(p)).convert_alpha()
        previews.append(pygame.transform.scale(img, (200, 100)))
        arcade_images.append(img)
    except Exception:
        s = pygame.Surface((200, 100), pygame.SRCALPHA)
        s.fill((100, 100, 100, 255))
        previews.append(s)
        fb = pygame.Surface((96, 96), pygame.SRCALPHA)
        fb.fill((180, 180, 180, 255))
        arcade_images.append(fb)

start_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 - 120, 380, 64)
mod_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 - 40, 380, 64)
ach_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 + 40, 380, 64)
arc_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 + 120, 380, 64)
lead_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 + 200, 380, 64)
acc_btn = pygame.Rect(0, 0, 260, 56)
acc_btn.center = (256, 922)

level_btns = []
for i in range(3):
    level_btns.append(pygame.Rect(SCREEN_WIDTH // 6 - 100, (i + 1) * SCREEN_HEIGHT // 4 - 50, 200, 100))
for i in range(3, 6):
    level_btns.append(pygame.Rect(SCREEN_WIDTH // 2 - 100, (i - 2) * SCREEN_HEIGHT // 4 - 50, 200, 100))
for i in range(6, 9):
    level_btns.append(pygame.Rect(5 * SCREEN_WIDTH // 6 - 100, (i - 5) * SCREEN_HEIGHT // 4 - 50, 200, 100))

bond_stage_btns = [
    ("Stage 1", pygame.Rect(SCREEN_WIDTH // 2 - 140, SCREEN_HEIGHT // 2 - 210, 280, 58), 1),
    ("Stage 2", pygame.Rect(SCREEN_WIDTH // 2 - 140, SCREEN_HEIGHT // 2 - 140, 280, 58), 2),
    ("Stage 3", pygame.Rect(SCREEN_WIDTH // 2 - 140, SCREEN_HEIGHT // 2 - 70, 280, 58), 3),
    ("Stage 4", pygame.Rect(SCREEN_WIDTH // 2 - 140, SCREEN_HEIGHT // 2, 280, 58), 4),
    ("Stage 5", pygame.Rect(SCREEN_WIDTH // 2 - 140, SCREEN_HEIGHT // 2 + 70, 280, 58), 5),
]

user_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 - 70, 440, 52)
pass_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 18, 440, 52)
login_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 98, 210, 56)
create_rect = pygame.Rect(SCREEN_WIDTH // 2 + 10, SCREEN_HEIGHT // 2 + 98, 210, 56)

shield_rect = pygame.Rect(SCREEN_WIDTH // 2 - 230, SCREEN_HEIGHT // 2 - 70, 460, 62)
speed_rect = pygame.Rect(SCREEN_WIDTH // 2 - 230, SCREEN_HEIGHT // 2 + 20, 460, 62)

del_pass_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 260, 440, 52)
logout_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 350, 210, 54)
delete_rect = pygame.Rect(SCREEN_WIDTH // 2 + 10, SCREEN_HEIGHT // 2 + 350, 210, 54)

lead_prev_rect = pygame.Rect(SCREEN_WIDTH // 2 - 280, 140, 70, 48)
lead_next_rect = pygame.Rect(SCREEN_WIDTH // 2 + 210, 140, 70, 48)
lead_sel = 0

db = load_db()
logged_user = None
state = "auth"
msg = "Login or create account"
usr = ""
pwd = ""
usr_act = True
pwd_act = False
speed_text = "100"
speed_act = False
achievements = ach_defs()
ach_click = []
ach_hint = None
del_pwd = ""
del_pwd_act = False
arcade = None


def current_acc():
    if logged_user is None:
        return None
    rec = db["accounts"].get(logged_user)
    if rec is None:
        return None
    rec = ensure_acc(rec)
    db["accounts"][logged_user] = rec
    return rec


def draw_user_title():
    if logged_user:
        t = head.render(logged_user, True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 140)))


def parse_and_apply_speed(acc):
    global speed_text
    try:
        value = int(speed_text)
    except Exception:
        value = acc["settings"]["game_speed_percent"]
    value = max(1, min(2000, value))
    acc["settings"]["game_speed_percent"] = value
    speed_text = str(value)
    apply_settings(acc)
    save_db(db)

running = True
while running:
    acc = current_acc()
    now = pygame.time.get_ticks()
    dt = clock.get_time()

    if state == "auth":
        screen.blit(bg, (0, 0))
        title = head.render("Account Login", True, (255, 255, 255))
        screen.blit(title, title.get_rect(center=(SCREEN_WIDTH // 2, 170)))
        screen.blit(small.render("Username", True, (255, 255, 255)), (user_rect.x, user_rect.y - 24))
        screen.blit(small.render("Password", True, (255, 255, 255)), (pass_rect.x, pass_rect.y - 24))
        draw_field(screen, user_rect, usr, font, usr_act)
        draw_pw_field(screen, pass_rect, pwd, font, pwd_act)
        draw_btn(screen, login_rect, "Login", mid)
        draw_btn(screen, create_rect, "Create", mid)
        m = small.render(msg, True, (255, 255, 255))
        screen.blit(m, m.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 194)))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    running = False
                elif e.key == pygame.K_TAB:
                    usr_act, pwd_act = (not usr_act), (not pwd_act)
                elif e.key in (pygame.K_RETURN, pygame.K_KP_ENTER):
                    u, p = usr.strip(), pwd
                    if u in db["accounts"] and db["accounts"][u]["password_hash"] == hash_pw(p):
                        logged_user = u
                        acc = current_acc()
                        apply_settings(acc)
                        speed_text = str(acc["settings"]["game_speed_percent"])
                        msg = ""
                        state = "start"
                    else:
                        msg = "Invalid username or password"
                elif e.key == pygame.K_BACKSPACE:
                    if usr_act:
                        usr = usr[:-1]
                    else:
                        pwd = pwd[:-1]
                else:
                    ch = e.unicode
                    if ch.isprintable():
                        if usr_act and len(usr) < 20:
                            usr += ch
                        elif (not usr_act) and len(pwd) < 40:
                            pwd += ch
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if user_rect.collidepoint(e.pos):
                    usr_act, pwd_act = True, False
                elif pass_rect.collidepoint(e.pos):
                    usr_act, pwd_act = False, True
                elif login_rect.collidepoint(e.pos):
                    u, p = usr.strip(), pwd
                    if u in db["accounts"] and db["accounts"][u]["password_hash"] == hash_pw(p):
                        logged_user = u
                        acc = current_acc()
                        apply_settings(acc)
                        speed_text = str(acc["settings"]["game_speed_percent"])
                        msg = ""
                        state = "start"
                    else:
                        msg = "Invalid username or password"
                elif create_rect.collidepoint(e.pos):
                    u, p = usr.strip(), pwd
                    if not u or not p:
                        msg = "Fill username and password"
                    elif u in db["accounts"]:
                        msg = "Username already exists"
                    else:
                        db["accounts"][u] = ensure_acc(
                            {
                                "password_hash": hash_pw(p),
                                "settings": {"shield_enabled": True, "game_speed_percent": 100},
                                "best_speed_by_boss": default_best(),
                                "achievements": {},
                                "best_arcade_seconds": 0,
                            }
                        )
                        save_db(db)
                        msg = "Account created. Login now"

    elif state == "start":
        if logged_user is None:
            state = "auth"
            continue
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        draw_btn(screen, start_btn, "Start", mid)
        draw_btn(screen, mod_btn, "Modifiers", mid)
        draw_btn(screen, ach_btn, "Achievements", mid)
        draw_btn(screen, arc_btn, "Arcade Mode", mid)
        draw_btn(screen, lead_btn, "Leaderboard", mid)
        draw_btn(screen, acc_btn, "Account", mid, fill=(45, 45, 60))
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                running = False
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    logged_user = None
                    usr = ""
                    pwd = ""
                    state = "auth"
                    continue
                if start_btn.collidepoint(e.pos):
                    state = "choose"
                elif mod_btn.collidepoint(e.pos):
                    speed_text = str(acc["settings"]["game_speed_percent"])
                    speed_act = False
                    state = "modifiers"
                elif ach_btn.collidepoint(e.pos):
                    ach_hint = None
                    state = "achievements"
                elif arc_btn.collidepoint(e.pos):
                    apply_settings(acc)
                    arcade = new_arcade_session(now)
                    pygame.mouse.set_pos(ARCADE_ARENA.center)
                    state = "arcade"
                elif lead_btn.collidepoint(e.pos):
                    state = "leaderboard"
                elif acc_btn.collidepoint(e.pos):
                    del_pwd = ""
                    del_pwd_act = False
                    state = "account"

    elif state == "choose":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])
        for t, x in [("EASY", SCREEN_WIDTH // 6), ("MEDIUM", SCREEN_WIDTH // 2), ("HARD", 5 * SCREEN_WIDTH // 6)]:
            s = head.render(t, True, (255, 255, 255))
            screen.blit(s, s.get_rect(center=(x, 80)))
        for i, r in enumerate(level_btns):
            n = small.render(BOSSES[i]["name"], True, (255, 255, 255))
            screen.blit(n, n.get_rect(midbottom=(r.centerx, r.top - 6)))
            pygame.draw.rect(screen, (255, 255, 255), r, 3)
            screen.blit(previews[i], r.topleft)

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                state = "start"
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    state = "start"
                    continue
                for i, r in enumerate(level_btns):
                    if r.collidepoint(e.pos):
                        apply_settings(acc)
                        if i == 8:
                            state = "bond_stage"
                        else:
                            res = run_boss(i, screen)
                            if res == "win":
                                mark_win(acc, BOSSES[i]["key"])
                                save_db(db)
                        break

    elif state == "bond_stage":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("James Bond Stage Select", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 250)))
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])
        for label, rect, stg in bond_stage_btns:
            draw_btn(screen, rect, label, mid)

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                state = "choose"
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    state = "choose"
                else:
                    for _l, rect, stg in bond_stage_btns:
                        if rect.collidepoint(e.pos):
                            apply_settings(acc)
                            res = Bond.bossfight_Bond(screen, start_stage=stg)
                            if res == "win":
                                mark_win(acc, "james_bond")
                                save_db(db)
                            state = "choose"
                            break

    elif state == "modifiers":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])
        tt = head.render("Modifiers", True, (255, 255, 255))
        screen.blit(tt, tt.get_rect(center=(SCREEN_WIDTH // 2, 220)))

        pygame.draw.rect(screen, (30, 30, 40), shield_rect)
        pygame.draw.rect(screen, (255, 255, 255), shield_rect, 2)
        sh = f"Shield: {'ON' if acc['settings']['shield_enabled'] else 'OFF'}"
        screen.blit(mid.render(sh, True, (255, 255, 255)), (shield_rect.x + 20, shield_rect.y + 14))

        screen.blit(small.render("Game Speed (%)", True, (255, 255, 255)), (speed_rect.x, speed_rect.y - 24))
        draw_field(screen, speed_rect, speed_text, font, speed_act, "100")

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    state = "start"
                elif speed_act:
                    if e.key == pygame.K_BACKSPACE:
                        speed_text = speed_text[:-1]
                    elif e.key in (pygame.K_RETURN, pygame.K_KP_ENTER):
                        parse_and_apply_speed(acc)
                    else:
                        ch = e.unicode
                        if ch.isdigit() and len(speed_text) < 4:
                            speed_text += ch
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    if speed_act:
                        parse_and_apply_speed(acc)
                        speed_act = False
                    state = "start"
                    continue
                if shield_rect.collidepoint(e.pos):
                    acc["settings"]["shield_enabled"] = not acc["settings"]["shield_enabled"]
                    apply_settings(acc)
                    save_db(db)
                if speed_rect.collidepoint(e.pos):
                    speed_act = True
                else:
                    if speed_act:
                        parse_and_apply_speed(acc)
                    speed_act = False

    elif state == "achievements":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("Achievements", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 220)))
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])

        ach_click = []
        left_margin = 140
        gap = 24
        cols = 3
        card_w = (SCREEN_WIDTH - left_margin * 2 - gap * (cols - 1)) // cols
        card_h = 74
        start_y = 280

        for idx, (aid, desc) in enumerate(achievements):
            col = idx % cols
            row = idx // cols
            x = left_margin + col * (card_w + gap)
            y = start_y + row * (card_h + 14)
            rect = pygame.Rect(x, y, card_w, card_h)
            pygame.draw.rect(screen, (20, 20, 30), rect)
            pygame.draw.rect(screen, (255, 255, 255), rect, 2)

            box = pygame.Rect(x + 10, y + 10, 20, 20)
            pygame.draw.rect(screen, (255, 255, 255), box, 2)
            if acc["achievements"].get(aid, False):
                pygame.draw.line(screen, (255, 255, 255), box.topleft, box.bottomright, 2)
                pygame.draw.line(screen, (255, 255, 255), box.topright, box.bottomleft, 2)

            lines = wrap_text(desc, mini, card_w - 46)
            if len(lines) > 2:
                lines = lines[:2]
            ty = y + 10
            for line in lines:
                screen.blit(mini.render(line, True, (255, 255, 255)), (x + 40, ty))
                ty += 23

            ach_click.append((rect, desc))

        if ach_hint:
            bar = pygame.Rect(0, 0, min(1200, SCREEN_WIDTH - 120), 64)
            bar.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
            pygame.draw.rect(screen, (0, 0, 0), bar)
            pygame.draw.rect(screen, (255, 255, 255), bar, 2)
            info = mid.render(ach_hint, True, (255, 255, 255))
            screen.blit(info, info.get_rect(center=bar.center))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                state = "start"
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    state = "start"
                else:
                    for r, d in ach_click:
                        if r.collidepoint(e.pos):
                            ach_hint = d
                            break

    elif state == "leaderboard":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("Leaderboard", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 90)))
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])

        draw_btn(screen, lead_prev_rect, "<", mid, fill=(40, 40, 55))
        draw_btn(screen, lead_next_rect, ">", mid, fill=(40, 40, 55))
        boss_name_rect = pygame.Rect(SCREEN_WIDTH // 2 - 180, 140, 360, 48)
        pygame.draw.rect(screen, (20, 20, 30), boss_name_rect)
        pygame.draw.rect(screen, (255, 255, 255), boss_name_rect, 2)
        bn = BOSSES[lead_sel]["name"]
        boss_name_surface = mid.render(bn, True, (255, 255, 255))
        screen.blit(boss_name_surface, boss_name_surface.get_rect(center=boss_name_rect.center))

        panel = pygame.Rect(300, 210, SCREEN_WIDTH - 600, SCREEN_HEIGHT - 290)
        pygame.draw.rect(screen, (20, 20, 30), panel)
        pygame.draw.rect(screen, (255, 255, 255), panel, 2)
        h = mid.render(f"Top Speeds - {bn}", True, (255, 255, 255))
        screen.blit(h, (panel.x + 20, panel.y + 16))

        rank = []
        for uname, rec in db["accounts"].items():
            rr = ensure_acc(rec)
            sc = int(rr["best_speed_by_boss"].get(BOSSES[lead_sel]["key"], 0))
            if sc > 0:
                rank.append((uname, sc))
        rank.sort(key=lambda x: x[1], reverse=True)
        rank = rank[:10]

        y = panel.y + 74
        for i, (u, s) in enumerate(rank, start=1):
            line = small.render(f"{i}. {u}  -  {s}%", True, (255, 255, 255))
            screen.blit(line, (panel.x + 20, y))
            y += 34

        if not rank:
            nt = small.render("No clear recorded yet.", True, (255, 255, 255))
            screen.blit(nt, (panel.x + 20, panel.y + 74))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                state = "start"
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    state = "start"
                elif lead_prev_rect.collidepoint(e.pos):
                    lead_sel = (lead_sel - 1) % len(BOSSES)
                elif lead_next_rect.collidepoint(e.pos):
                    lead_sel = (lead_sel + 1) % len(BOSSES)

    elif state == "arcade":
        if arcade is None:
            arcade = new_arcade_session(now)

        update_arcade(arcade, now, dt, pygame.mouse.get_pos(), ARCADE_ARENA)

        if (not arcade["alive"]) and (not arcade["saved"]):
            survive_ms = max(0, (arcade["death_time"] or now) - arcade["start_time"])
            survive_sec = survive_ms // 1000
            if survive_sec > acc["best_arcade_seconds"]:
                acc["best_arcade_seconds"] = survive_sec
                save_db(db)
            arcade["saved"] = True

        screen.fill((0, 0, 255))
        pygame.draw.rect(screen, (255, 0, 0), (0, 0, 500, SCREEN_HEIGHT))
        pygame.draw.rect(screen, (255, 0, 0), (0, 0, SCREEN_WIDTH, 150))
        pygame.draw.rect(screen, (255, 0, 0), (0, SCREEN_HEIGHT - 150, SCREEN_WIDTH, 150))
        pygame.draw.rect(screen, (255, 0, 0), (1700, 0, 150, SCREEN_HEIGHT))

        for p in arcade["projectiles"]:
            pygame.draw.circle(screen, p["color"], (int(p["x"]), int(p["y"])), p["r"])

        for e in arcade["enemies"]:
            size = max(38, int(e["r"] * 2.3))
            cache_key = (e["boss_idx"], size)
            img = arcade_image_cache.get(cache_key)
            if img is None:
                img = pygame.transform.smoothscale(arcade_images[e["boss_idx"]], (size, size))
                arcade_image_cache[cache_key] = img
            rect = img.get_rect(center=(int(e["x"]), int(e["y"])))
            screen.blit(img, rect)

        mx, my = pygame.mouse.get_pos()

        elapsed_ms = (arcade["death_time"] if not arcade["alive"] else now) - arcade["start_time"]
        elapsed_sec = max(0, elapsed_ms // 1000)
        timer_text = mid.render(f"Time: {elapsed_sec}s", True, (255, 255, 255))
        screen.blit(timer_text, timer_text.get_rect(center=(SCREEN_WIDTH // 2, 175)))

        if not arcade["alive"]:
            ov = pygame.Rect(0, 0, 700, 140)
            ov.center = (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
            pygame.draw.rect(screen, (0, 0, 0), ov)
            pygame.draw.rect(screen, (255, 255, 255), ov, 2)
            screen.blit(mid.render(f"Arcade Over - {elapsed_sec}s", True, (255, 255, 255)), (ov.x + 24, ov.y + 24))
            best_s = int(acc.get("best_arcade_seconds", 0))
            screen.blit(small.render(f"Best: {best_s}s  |  Click to return", True, (255, 255, 255)), (ov.x + 24, ov.y + 84))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN and e.key == pygame.K_ESCAPE:
                state = "start"
                arcade = None
            elif e.type == pygame.MOUSEBUTTONDOWN:

                if not arcade["alive"]:
                    state = "start"
                    arcade = None
                    continue

                if e.button == 1:
                    for idx in range(len(arcade["enemies"]) - 1, -1, -1):
                        en = arcade["enemies"][idx]
                        if math.hypot(e.pos[0] - en["x"], e.pos[1] - en["y"]) <= en["r"]:
                            arcade["enemies"].pop(idx)
                            break

    elif state == "account":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("Account", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 220)))
        draw_percent_shield(screen, small, acc["settings"]["game_speed_percent"], acc["settings"]["shield_enabled"])

        panel = pygame.Rect(SCREEN_WIDTH // 2 - 360, 280, 720, 360)
        pygame.draw.rect(screen, (20, 20, 30), panel)
        pygame.draw.rect(screen, (255, 255, 255), panel, 2)

        y = panel.y + 18
        for b in BOSSES:
            best = int(acc["best_speed_by_boss"].get(b["key"], 0))
            line = small.render(f"{b['name']}: {best}%", True, (255, 255, 255))
            screen.blit(line, (panel.x + 18, y))
            y += 28

        arcade_best = int(acc.get("best_arcade_seconds", 0))
        arc_line = small.render(f"Arcade Best: {arcade_best}s", True, (255, 255, 255))
        screen.blit(arc_line, (panel.x + 18, panel.bottom - 34))

        screen.blit(small.render("Type password to delete account", True, (255, 255, 255)), (del_pass_rect.x, del_pass_rect.y - 24))
        draw_pw_field(screen, del_pass_rect, del_pwd, font, del_pwd_act)
        draw_btn(screen, logout_rect, "Logout", mid, fill=(70, 70, 80))
        draw_btn(screen, delete_rect, "Delete Account", mid, fill=(150, 40, 40))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    state = "start"
                elif del_pwd_act:
                    if e.key == pygame.K_BACKSPACE:
                        del_pwd = del_pwd[:-1]
                    else:
                        ch = e.unicode
                        if ch.isprintable() and len(del_pwd) < 40:
                            del_pwd += ch
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    del_pwd_act = False
                    state = "start"
                    continue
                del_pwd_act = del_pass_rect.collidepoint(e.pos)
                if logout_rect.collidepoint(e.pos):
                    logged_user = None
                    usr = ""
                    pwd = ""
                    msg = "Logged out"
                    state = "auth"
                elif delete_rect.collidepoint(e.pos):
                    if acc["password_hash"] == hash_pw(del_pwd):
                        db["accounts"].pop(logged_user, None)
                        save_db(db)
                        logged_user = None
                        usr = ""
                        pwd = ""
                        del_pwd = ""
                        msg = "Account deleted"
                        state = "auth"

    pygame.display.flip()
    clock.tick(60)

pygame.quit()











