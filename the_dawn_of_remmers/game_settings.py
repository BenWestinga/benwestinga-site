import pygame

NO_SHIELDS = False


def set_no_shields(enabled):
    global NO_SHIELDS
    NO_SHIELDS = bool(enabled)


def draw_shield_icon(surface, center_pos, shield_enabled):
    cx, cy = int(center_pos[0]), int(center_pos[1])
    size = 34

    icon = pygame.Surface((size * 2, size * 2), pygame.SRCALPHA)
    center = (size, size)

    pygame.draw.circle(icon, (20, 20, 35, 140), center, size - 2)
    pygame.draw.circle(icon, (255, 255, 255, 180), center, size - 2, 2)

    shield_pts = [
        (size, int(size * 0.35)),
        (int(size * 0.60), int(size * 0.55)),
        (int(size * 0.66), int(size * 1.15)),
        (size, int(size * 1.45)),
        (int(size * 1.34), int(size * 1.15)),
        (int(size * 1.40), int(size * 0.55)),
    ]

    if shield_enabled:
        body = (95, 180, 255, 220)
        edge = (220, 245, 255, 240)
    else:
        body = (130, 130, 130, 190)
        edge = (225, 225, 225, 220)

    pygame.draw.polygon(icon, body, shield_pts)
    pygame.draw.polygon(icon, edge, shield_pts, 2)

    if not shield_enabled:
        pygame.draw.line(
            icon,
            (255, 40, 40, 245),
            (int(size * 0.34), int(size * 0.34)),
            (int(size * 1.66), int(size * 1.66)),
            4,
        )

    surface.blit(icon, (cx - size, cy - size))
