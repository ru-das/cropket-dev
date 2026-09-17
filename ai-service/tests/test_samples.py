# Grades real onion photos if any have been dropped into samples/onion/
# (see samples/README.md). Skips instead of failing when the folder is
# empty - the 200+ labelled photo set SPEC.md §5.5 step 7 asks for is out
# of prototype scope (CLAUDE.md §9.5), so this laptop has none yet.
import glob
import os

import cv2
import pytest

from app.grading.onion import combine, grade_image

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "..", "samples", "onion")


def test_real_sample_photos_if_present():
    paths = sorted(glob.glob(os.path.join(SAMPLE_DIR, "*.jpg")))
    if not paths:
        pytest.skip("no photos in ai-service/samples/onion/ yet - see samples/README.md")

    images = [cv2.imread(p) for p in paths]
    result = combine([grade_image(img) for img in images if img is not None])
    assert result.grade in ("A", "B", "C")
    assert 0 <= result.confidence <= 100
