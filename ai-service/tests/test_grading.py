# Proves the pure grading pipeline (app/grading/onion.py) reacts the right
# way to each photo problem it's meant to catch (SPEC.md §5.5). Uses
# synthetic images (tests/synthetic.py), not real photos, so this runs
# anywhere including CI - see samples/README.md for the real-photo test.
import numpy as np
import pytest

from app.grading.onion import combine, grade_image


def test_clean_photo_is_confident(onion_photo):
    result = combine([grade_image(onion_photo()) for _ in range(3)])
    assert result.confidence >= 70
    assert result.grade in ("A", "B")


def test_dark_photo_is_not_confident(onion_photo):
    clean = combine([grade_image(onion_photo()) for _ in range(3)])
    dark = combine([grade_image(onion_photo(dark=True)) for _ in range(3)])
    assert dark.confidence < 70
    assert dark.confidence < clean.confidence


def test_blurred_scores_lower_than_sharp(onion_photo):
    sharp = grade_image(onion_photo())
    blurred = grade_image(onion_photo(blurred=True))
    assert blurred.quality < sharp.quality


def test_damage_patch_raises_damage_and_worsens_grade(onion_photo):
    clean = grade_image(onion_photo())
    damaged = grade_image(onion_photo(damage=0.3))
    assert damaged.damage_pct > clean.damage_pct
    # "A" < "B" < "C" as plain strings, so >= means "same grade or worse".
    assert damaged.grade >= clean.grade


def test_disagreeing_photos_score_lower_than_agreeing(onion_photo):
    agree = combine([grade_image(onion_photo()) for _ in range(3)])
    disagree = combine(
        [
            grade_image(onion_photo()),
            grade_image(onion_photo(dark=True)),
            grade_image(onion_photo(damage=0.5)),
        ]
    )
    assert disagree.confidence < agree.confidence


def test_percentages_stay_in_bounds(onion_photo):
    result = grade_image(onion_photo(damage=0.4))
    assert 0 <= result.damage_pct <= 100
    assert 0 <= result.healthy_pct <= 100


def test_size_label_reacts_to_onion_size(onion_photo):
    small = grade_image(onion_photo(n_onions=1, radius_frac=0.05))
    large = grade_image(onion_photo(n_onions=1, radius_frac=0.20))
    assert small.size_label == "small"
    assert large.size_label == "large"


def test_no_onion_in_frame_gives_a_low_confidence_result_not_a_crash():
    blank = np.full((400, 400, 3), (90, 140, 90), dtype="uint8")  # background only, no onions
    result = grade_image(blank)
    assert result.grade == "C"
    assert "no onion detected" in result.reasons


def test_combine_rejects_an_empty_list():
    with pytest.raises(ValueError):
        combine([])
