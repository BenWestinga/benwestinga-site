import pygame

NO_SHIELDS = False
GAME_SPEED_PERCENT = 100

_hooks_installed = False
_original_get_ticks = None
_original_clock_class = None

_base_real_ticks = 0
_base_scaled_ticks = 0.0


def _clamp_speed_percent(value):
    try:
        ivalue = int(value)
    except Exception:
        ivalue = 100
    if ivalue < 1:
        return 1
    if ivalue > 2000:
        return 2000
    return ivalue


def _time_scale():
    return GAME_SPEED_PERCENT / 100.0


def _compute_scaled_ticks(real_ticks):
    return int(_base_scaled_ticks + (real_ticks - _base_real_ticks) * _time_scale())


def _effective_fps_cap(fps):
    try:
        fps_value = float(fps)
    except Exception:
        fps_value = 0.0

    if fps_value <= 0:
        return 0

    # Keep frame-based motion in sync with simulated time scaling.
    return fps_value * _time_scale()


def set_no_shields(enabled):
    global NO_SHIELDS
    NO_SHIELDS = bool(enabled)


def set_game_speed_percent(percent):
    global GAME_SPEED_PERCENT, _base_real_ticks, _base_scaled_ticks
    new_percent = _clamp_speed_percent(percent)

    if _hooks_installed and _original_get_ticks is not None:
        real_now = _original_get_ticks()
        scaled_now = _compute_scaled_ticks(real_now)
    else:
        real_now = pygame.time.get_ticks()
        scaled_now = real_now

    GAME_SPEED_PERCENT = new_percent
    _base_real_ticks = real_now
    _base_scaled_ticks = float(scaled_now)


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


def install_runtime_hooks():
    global _hooks_installed
    global _original_get_ticks, _original_clock_class
    global _base_real_ticks, _base_scaled_ticks

    if _hooks_installed:
        return

    _original_get_ticks = pygame.time.get_ticks
    _original_clock_class = pygame.time.Clock

    _base_real_ticks = _original_get_ticks()
    _base_scaled_ticks = float(_base_real_ticks)

    def scaled_get_ticks():
        real_now = _original_get_ticks()
        return _compute_scaled_ticks(real_now)

    class ScaledClock:
        def __init__(self):
            self._clock = _original_clock_class()
            self._tick_carry = 0.0
            self._time_carry = 0.0
            self._raw_time_carry = 0.0

        def _scale_ms(self, real_ms, carry_attr):
            scaled = real_ms * _time_scale() + getattr(self, carry_attr)
            out = int(scaled)
            setattr(self, carry_attr, scaled - out)
            return out

        def tick(self, fps=0):
            real_ms = self._clock.tick(_effective_fps_cap(fps))
            return self._scale_ms(real_ms, "_tick_carry")

        def tick_busy_loop(self, fps=0):
            real_ms = self._clock.tick_busy_loop(_effective_fps_cap(fps))
            return self._scale_ms(real_ms, "_tick_carry")

        def get_time(self):
            real_ms = self._clock.get_time()
            return self._scale_ms(real_ms, "_time_carry")

        def get_rawtime(self):
            real_ms = self._clock.get_rawtime()
            return self._scale_ms(real_ms, "_raw_time_carry")

        def __getattr__(self, name):
            return getattr(self._clock, name)

    pygame.time.get_ticks = scaled_get_ticks
    pygame.time.Clock = ScaledClock

    _hooks_installed = True
