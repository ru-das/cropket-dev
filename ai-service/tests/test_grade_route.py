# Proves POST /grade's HTTP contract (SPEC.md §5.4, §5.5): the X-Service-Key
# check, the error shape (CLAUDE.md §5), and that a happy-path response
# matches the AiGradeResult zod schema the `grade` Edge Function validates
# against (supabase/functions/_shared/domain/schemas/grade.ts).
from fastapi.testclient import TestClient

from app import main
from app.images import ImageFetchError
from synthetic import make_onion_photo

client = TestClient(main.app)

KEY = "test-service-key"
BODY = {"crop": "onion", "images": ["https://example.test/1.jpg"]}


def test_missing_key_is_rejected(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)
    resp = client.post("/grade", json=BODY)
    assert resp.status_code == 401
    assert resp.json()["code"] == "UNAUTHORIZED"


def test_wrong_key_is_rejected(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)
    resp = client.post("/grade", json=BODY, headers={"X-Service-Key": "nope"})
    assert resp.status_code == 401
    assert resp.json()["code"] == "UNAUTHORIZED"


def test_no_service_key_configured_fails_closed(monkeypatch):
    # CLAUDE.md §5: a must-have secret with no mock -> 500 SETUP_MISSING_KEY,
    # never "skip the check".
    monkeypatch.setattr(main.settings, "service_key", "")
    resp = client.post("/grade", json=BODY, headers={"X-Service-Key": "anything"})
    assert resp.status_code == 500
    assert resp.json()["code"] == "SETUP_MISSING_KEY"


def test_bad_body_is_rejected(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)
    resp = client.post("/grade", json={"crop": "onion"}, headers={"X-Service-Key": KEY})
    assert resp.status_code == 400
    assert resp.json()["code"] == "VALIDATION_FAILED"


def test_unsupported_crop_is_rejected(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)
    resp = client.post(
        "/grade",
        json={"crop": "tomato", "images": ["https://example.test/1.jpg"]},
        headers={"X-Service-Key": KEY},
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "CROP_NOT_SUPPORTED"


def test_happy_path_matches_ai_grade_result_shape(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)

    async def fake_fetch_images(urls: list[str]):
        return [make_onion_photo() for _ in urls]

    monkeypatch.setattr(main, "fetch_images", fake_fetch_images)

    resp = client.post(
        "/grade",
        json={"crop": "onion", "images": ["https://example.test/1.jpg", "https://example.test/2.jpg"]},
        headers={"X-Service-Key": KEY},
    )
    assert resp.status_code == 200
    body = resp.json()

    # Field by field against AiGradeResult - the only guard that keeps this
    # response and the zod schema on the app side from drifting apart.
    assert body["grade"] in ("A", "B", "C")
    assert isinstance(body["confidence"], int)
    assert 0 <= body["confidence"] <= 100
    assert set(body["size"]) == {"label", "mmAvg"}
    assert isinstance(body["size"]["label"], str)
    assert body["size"]["mmAvg"] is None
    assert set(body["colour"]) == {"label", "healthyPct"}
    assert isinstance(body["colour"]["label"], str)
    assert isinstance(body["colour"]["healthyPct"], (int, float))
    assert isinstance(body["damagePct"], (int, float))
    assert 0 <= body["damagePct"] <= 100
    assert body["source"] == "ai"


def test_image_fetch_failure_is_502(monkeypatch):
    monkeypatch.setattr(main.settings, "service_key", KEY)

    async def failing_fetch_images(urls: list[str]):
        raise ImageFetchError("boom")

    monkeypatch.setattr(main, "fetch_images", failing_fetch_images)

    resp = client.post("/grade", json=BODY, headers={"X-Service-Key": KEY})
    assert resp.status_code == 502
    assert resp.json()["code"] == "IMAGE_FETCH_FAILED"
