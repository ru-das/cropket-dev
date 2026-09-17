# Downloads the signed crop-photo URLs the `grade` Edge Function sends
# (SPEC.md §5.4). Kept separate from main.py so route tests can monkeypatch
# fetch_images() instead of hitting the network.
from __future__ import annotations

import asyncio

import cv2
import httpx
import numpy as np

from .settings import settings


class ImageFetchError(Exception):
    pass


async def fetch_images(urls: list[str]) -> list[np.ndarray]:
    async with httpx.AsyncClient(timeout=8.0) as client:
        return list(await asyncio.gather(*(_fetch_one(client, url) for url in urls)))


async def _fetch_one(client: httpx.AsyncClient, url: str) -> np.ndarray:
    try:
        resp = await client.get(url)
    except httpx.HTTPError as err:
        raise ImageFetchError(f"could not reach photo URL: {err}") from err

    if resp.status_code != 200:
        raise ImageFetchError(f"photo URL returned {resp.status_code}")

    max_bytes = settings.max_image_mb * 1024 * 1024
    if len(resp.content) > max_bytes:
        raise ImageFetchError(f"photo is over {settings.max_image_mb} MB")

    data = np.frombuffer(resp.content, dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ImageFetchError("could not decode photo as an image")
    return bgr
