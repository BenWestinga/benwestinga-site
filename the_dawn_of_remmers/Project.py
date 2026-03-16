import hashlib
import json
from pathlib import Path

import pygame
import Bond, Did, Hottie, Joe, Man, Stein, beast, crazy, game_settings, ump

ASSET_DIR = Path(__file__).resolve().parent
DB_FILE = ASSET_DIR / "player_data.json"
SCREEN_WIDTH, SCREEN_HEIGHT = 1920, 1080
SHIELD_ICON_POS = (1624, 140)
BACK_X_RECT = pygame.Rect(22, 22, 50, 50)

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


def ensure_acc(acc):
    if not isinstance(acc, dict):
        acc = {}
    acc.setdefault("password_hash", "")

    st = acc.get("settings", {})
    if not isinstance(st, dict):
        st = {}
    st.setdefault("shield_enabled", True)
    # Legacy cleanup from removed gamespeed feature.
    st.pop("game_speed_percent", None)
    acc["settings"] = st

    ach = acc.get("achievements", {})
    if not isinstance(ach, dict):
        ach = {}
    for k in [key for key in ach.keys() if str(key).startswith("beat_150_")]:
        ach.pop(k, None)
    acc["achievements"] = ach

    acc.pop("best_speed_by_boss", None)

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
                    },
                    "achievements": {},
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


def draw_shield_only(surf, shield_on):
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
    game_settings.set_no_shields(not st["shield_enabled"])


def mark_win(acc, boss_key):
    st = acc["settings"]
    shield_on = bool(st["shield_enabled"])
    ach = acc["achievements"]
    ach[f"beat_{boss_key}"] = True
    if not shield_on:
        ach[f"beat_no_shield_{boss_key}"] = True


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
    if i == 8:
        return Bond.bossfight_Bond(screen, start_stage=1)
    return None

pygame.init()
pygame.font.init()
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
for b in BOSSES:
    try:
        p = resolve_asset(b["img"])
        if p is None:
            raise FileNotFoundError
        img = pygame.image.load(str(p)).convert_alpha()
        previews.append(pygame.transform.scale(img, (200, 100)))
    except Exception:
        s = pygame.Surface((200, 100), pygame.SRCALPHA)
        s.fill((100, 100, 100, 255))
        previews.append(s)

start_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 - 120, 380, 64)
mod_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 - 40, 380, 64)
ach_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 + 40, 380, 64)
lead_btn = pygame.Rect(SCREEN_WIDTH // 2 - 190, SCREEN_HEIGHT // 2 + 120, 380, 64)
acc_btn = pygame.Rect(0, 0, 260, 56)
acc_btn.center = (256, 922)

level_btns = []
for i in range(3):
    level_btns.append(pygame.Rect(SCREEN_WIDTH // 6 - 100, (i + 1) * SCREEN_HEIGHT // 4 - 50, 200, 100))
for i in range(3, 6):
    level_btns.append(pygame.Rect(SCREEN_WIDTH // 2 - 100, (i - 2) * SCREEN_HEIGHT // 4 - 50, 200, 100))
for i in range(6, 9):
    level_btns.append(pygame.Rect(5 * SCREEN_WIDTH // 6 - 100, (i - 5) * SCREEN_HEIGHT // 4 - 50, 200, 100))

user_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 - 70, 440, 52)
pass_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 18, 440, 52)
login_rect = pygame.Rect(SCREEN_WIDTH // 2 - 220, SCREEN_HEIGHT // 2 + 98, 210, 56)
create_rect = pygame.Rect(SCREEN_WIDTH // 2 + 10, SCREEN_HEIGHT // 2 + 98, 210, 56)

shield_rect = pygame.Rect(SCREEN_WIDTH // 2 - 230, SCREEN_HEIGHT // 2 - 70, 460, 62)

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
achievements = ach_defs()
ach_click = []
ach_hint = None
del_pwd = ""
del_pwd_act = False


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
                                "settings": {"shield_enabled": True},
                                "achievements": {},
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
        draw_btn(screen, lead_btn, "Leaderboard", mid)
        draw_btn(screen, acc_btn, "Account", mid, fill=(45, 45, 60))
        draw_shield_only(screen, acc["settings"]["shield_enabled"])

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
                    state = "modifiers"
                elif ach_btn.collidepoint(e.pos):
                    ach_hint = None
                    state = "achievements"
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
        draw_shield_only(screen, acc["settings"]["shield_enabled"])
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
                        res = run_boss(i, screen)
                        if res == "win":
                            mark_win(acc, BOSSES[i]["key"])
                            save_db(db)
                        break

    elif state == "modifiers":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        draw_shield_only(screen, acc["settings"]["shield_enabled"])
        tt = head.render("Modifiers", True, (255, 255, 255))
        screen.blit(tt, tt.get_rect(center=(SCREEN_WIDTH // 2, 220)))

        pygame.draw.rect(screen, (30, 30, 40), shield_rect)
        pygame.draw.rect(screen, (255, 255, 255), shield_rect, 2)
        sh = f"Shield: {'ON' if acc['settings']['shield_enabled'] else 'OFF'}"
        screen.blit(mid.render(sh, True, (255, 255, 255)), (shield_rect.x + 20, shield_rect.y + 14))

        for e in pygame.event.get():
            if e.type == pygame.QUIT:
                running = False
            elif e.type == pygame.KEYDOWN:
                if e.key == pygame.K_ESCAPE:
                    state = "start"
            elif e.type == pygame.MOUSEBUTTONDOWN:
                if BACK_X_RECT.collidepoint(e.pos):
                    state = "start"
                    continue
                if shield_rect.collidepoint(e.pos):
                    acc["settings"]["shield_enabled"] = not acc["settings"]["shield_enabled"]
                    apply_settings(acc)
                    save_db(db)

    elif state == "achievements":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("Achievements", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 220)))
        draw_shield_only(screen, acc["settings"]["shield_enabled"])

        ach_click = []
        # Keep the 3-column grid inside a centered safe area for windowed play.
        safe_w = min(1360, SCREEN_WIDTH - 160)
        left_margin = (SCREEN_WIDTH - safe_w) // 2
        gap = 20
        cols = 3
        card_w = (safe_w - gap * (cols - 1)) // cols
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
        draw_shield_only(screen, acc["settings"]["shield_enabled"])

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
        h = mid.render(f"Clears - {bn}", True, (255, 255, 255))
        screen.blit(h, (panel.x + 20, panel.y + 16))

        rank = []
        boss_key = BOSSES[lead_sel]["key"]
        beat_key = f"beat_{boss_key}"
        for uname, rec in db["accounts"].items():
            rr = ensure_acc(rec)
            if rr.get("achievements", {}).get(beat_key, False):
                rank.append(uname)
        rank.sort()
        rank = rank[:10]

        y = panel.y + 74
        for i, u in enumerate(rank, start=1):
            line = small.render(f"{i}. {u}", True, (255, 255, 255))
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

    elif state == "account":
        screen.blit(bg, (0, 0))
        draw_user_title()
        draw_back_x(screen)
        t = head.render("Account", True, (255, 255, 255))
        screen.blit(t, t.get_rect(center=(SCREEN_WIDTH // 2, 220)))
        draw_shield_only(screen, acc["settings"]["shield_enabled"])

        panel = pygame.Rect(SCREEN_WIDTH // 2 - 360, 280, 720, 360)
        pygame.draw.rect(screen, (20, 20, 30), panel)
        pygame.draw.rect(screen, (255, 255, 255), panel, 2)

        y = panel.y + 18
        for b in BOSSES:
            beat = bool(acc["achievements"].get(f"beat_{b['key']}", False))
            status = "Defeated" if beat else "Not Defeated"
            line = small.render(f"{b['name']}: {status}", True, (255, 255, 255))
            screen.blit(line, (panel.x + 18, y))
            y += 28

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















