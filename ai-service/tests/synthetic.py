# Builds fake "onion crate" photos so tests/test_grading.py and
# tests/test_grade_route.py don't need real photos on disk to run (CI has
# none). See samples/README.md for the optional real-photo test.
from __future__ import annotations

import cv2
import numpy as np

ONION_BGR = (30, 130, 210)  # golden-brown skin -> HSV hue ~17, well inside onion.py's range
BACKGROUND_BGR = (90, 140, 90)  # greenish crate/ground -> HSV hue ~60, well outside it
DAMAGE_BGR = (10, 10, 10)  # near-black rot patch


def make_onion_photo(
    size: tuple[int, int] = (640, 640),
    n_onions: int = 3,
    radius_frac: float = 0.08,
    damage: float = 0.0,
    blurred: bool = False,
    dark: bool = False,
    seed: int = 0,
) -> np.ndarray:
    """A crate-of-onions stand-in: `n_onions` filled circles on a plain
    background, with optional blur/darkness/a dark "rot" patch so tests can
    check the grader reacts the right way to each problem independently.

    `damage`: 0-1, the share of each onion's own area painted as a dark
    patch (a rough stand-in for a rotten spot).
    """
    h, w = size
    img = np.full((h, w, 3), BACKGROUND_BGR, dtype=np.uint8)
    noise = np.random.default_rng(seed).normal(0, 6, (h, w, 3))
    img = np.clip(img.astype(np.int16) + noise, 0, 255).astype(np.uint8)

    radius = int(min(h, w) * radius_frac)
    for i in range(n_onions):
        cx = int(w * (i + 1) / (n_onions + 1))
        cy = h // 2
        cv2.circle(img, (cx, cy), radius, ONION_BGR, -1)
        if damage > 0:
            patch_r = int(radius * (damage**0.5))
            if patch_r > 0:
                cv2.circle(img, (cx, cy), patch_r, DAMAGE_BGR, -1)

    if blurred:
        img = cv2.GaussianBlur(img, (21, 21), 0)
    if dark:
        img = (img.astype(np.float32) * 0.25).astype(np.uint8)
    return img
