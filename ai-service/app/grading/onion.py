# Onion grading v1 (SPEC.md §5.5), called by POST /grade (app/main.py) and
# driven directly by tests/test_grading.py. Pure OpenCV/numpy on decoded
# images - no FastAPI, no settings, no network - so it can be tested and
# tuned without a running server.
#
# ponytail: no ₹10-coin detection, so `mmAvg` is always None and size is a
# relative label only (small/medium/large by area) - SPEC.md §10.4 already
# describes this as the fallback when no coin is in frame. Add coin-based
# mm sizing (cv2.HoughCircles, known 27 mm) if farmers start asking for a
# real size number instead of a label.
from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field
from statistics import mean

import cv2
import numpy as np

Grade = str  # "A" | "B" | "C"


@dataclass(frozen=True)
class Thresholds:
    """All the tuning numbers in one place - the team will need to tune
    these against real onion photos, so they must not be scattered through
    the code (CLAUDE.md "handoff" rule)."""

    max_side: int = 1024

    # Onion skin colour, in OpenCV HSV (H: 0-179, S/V: 0-255). Picked to
    # match a golden-brown/copper onion skin, not a green crate or dark soil.
    hue_low: int = 5
    hue_high: int = 32
    sat_low: int = 40

    # A colour-mask blob smaller than this share of the photo is noise, not
    # an onion.
    min_onion_area_frac: float = 0.001

    # Inside an onion's contour: bright + saturated pixels count as healthy
    # skin, very dark pixels count as damage (rot / bruising / black spots).
    healthy_value_min: int = 120
    healthy_sat_min: int = 60
    damage_value_max: int = 60

    # Photo-quality signals (SPEC.md §5.5 step 1).
    blur_floor: float = 40.0
    blur_ceiling: float = 150.0
    dark_floor: float = 35.0
    dark_ceiling: float = 150.0

    # Size label cut points, as a share of the photo area per onion.
    size_small_max: float = 0.01
    size_large_min: float = 0.05

    # A/B/C rules (SPEC.md §5.5 step 6).
    grade_a_damage_max: float = 5.0
    grade_a_healthy_min: float = 80.0
    grade_b_damage_max: float = 15.0
    grade_b_healthy_min: float = 55.0


DEFAULT = Thresholds()


@dataclass(frozen=True)
class ImageGrade:
    """One photo's result. `quality` (0-1) feeds combine()'s confidence -
    it is not shown to the farmer on its own."""

    grade: Grade
    quality: float
    size_label: str
    healthy_pct: float
    damage_pct: float
    reasons: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class OnionGrade:
    """The combined result across all photos of one scan - this is what
    app/main.py turns into the POST /grade response body."""

    grade: Grade
    confidence: int
    size_label: str
    healthy_pct: float
    damage_pct: float
    reasons: list[str]


def _clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def _quality(blur_var: float, brightness: float, t: Thresholds) -> float:
    blur_q = _clamp01((blur_var - t.blur_floor) / (t.blur_ceiling - t.blur_floor))
    bright_q = _clamp01((brightness - t.dark_floor) / (t.dark_ceiling - t.dark_floor))
    return blur_q * bright_q


def _size_label(area_frac: float, t: Thresholds) -> str:
    if area_frac >= t.size_large_min:
        return "large"
    if area_frac <= t.size_small_max:
        return "small"
    return "medium"


def _grade_from(damage_pct: float, healthy_pct: float, t: Thresholds) -> Grade:
    if damage_pct <= t.grade_a_damage_max and healthy_pct >= t.grade_a_healthy_min:
        return "A"
    if damage_pct <= t.grade_b_damage_max and healthy_pct >= t.grade_b_healthy_min:
        return "B"
    return "C"


def grade_image(bgr: np.ndarray, t: Thresholds = DEFAULT) -> ImageGrade:
    """SPEC.md §5.5 steps 1, 3-6 for one photo: resize -> blur/brightness
    check -> segment onions by colour -> healthy %/damage % inside each
    contour -> A/B/C."""
    h, w = bgr.shape[:2]
    scale = t.max_side / max(h, w)
    if scale < 1:
        bgr = cv2.resize(bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    brightness = float(gray.mean())
    quality = _quality(blur_var, brightness, t)

    reasons: list[str] = []
    if blur_var < t.blur_floor:
        reasons.append("photo blurry")
    if brightness < t.dark_floor:
        reasons.append("photo dark")

    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    h_ch, s_ch, v_ch = cv2.split(hsv)
    colour_mask = ((h_ch >= t.hue_low) & (h_ch <= t.hue_high) & (s_ch >= t.sat_low)).astype(np.uint8) * 255

    # Small close: bridges JPEG-noise gaps at an onion's edge. A real rotten
    # patch stays a hole in this mask on purpose - findContours below with
    # RETR_EXTERNAL only keeps the *outer* boundary of each blob, so a dark
    # patch surrounded by healthy skin still counts as "inside the onion",
    # matching SPEC.md step 5 ("damage inside each onion contour").
    kernel = np.ones((9, 9), np.uint8)
    closed = cv2.morphologyEx(colour_mask, cv2.MORPH_CLOSE, kernel)

    total_px = bgr.shape[0] * bgr.shape[1]
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = [c for c in contours if cv2.contourArea(c) >= total_px * t.min_onion_area_frac]

    if not contours:
        reasons.append("no onion detected")
        return ImageGrade(
            grade="C", quality=quality, size_label="medium", healthy_pct=0.0, damage_pct=100.0, reasons=reasons
        )

    region_mask = np.zeros_like(closed)
    cv2.drawContours(region_mask, contours, -1, 255, thickness=cv2.FILLED)
    region = region_mask > 0
    onion_px = int(region.sum())

    healthy_px = int((region & (v_ch >= t.healthy_value_min) & (s_ch >= t.healthy_sat_min)).sum())
    damage_px = int((region & (v_ch < t.damage_value_max)).sum())
    healthy_pct = 100.0 * healthy_px / onion_px
    damage_pct = 100.0 * damage_px / onion_px

    avg_area_frac = mean(cv2.contourArea(c) for c in contours) / total_px
    size_label = _size_label(avg_area_frac, t)

    grade = _grade_from(damage_pct, healthy_pct, t)
    if grade == "C":
        reasons.append(f"damage {damage_pct:.0f}%")

    return ImageGrade(
        grade=grade,
        quality=quality,
        size_label=size_label,
        healthy_pct=round(healthy_pct, 1),
        damage_pct=round(damage_pct, 1),
        reasons=reasons,
    )


def combine(images: list[ImageGrade]) -> OnionGrade:
    """SPEC.md §5.5 step 6: "Confidence = photo quality × agreement between
    the 3 photos." Majority grade wins; a photo that disagrees just lowers
    confidence rather than being dropped."""
    if not images:
        raise ValueError("combine() needs at least one image")

    majority, count = Counter(g.grade for g in images).most_common(1)[0]
    agreement = count / len(images)
    quality = mean(g.quality for g in images)
    confidence = max(0, min(100, round(100 * quality * agreement)))

    return OnionGrade(
        grade=majority,
        confidence=confidence,
        size_label=Counter(g.size_label for g in images).most_common(1)[0][0],
        healthy_pct=round(mean(g.healthy_pct for g in images), 1),
        damage_pct=round(mean(g.damage_pct for g in images), 1),
        reasons=sorted({r for g in images for r in g.reasons}),
    )
