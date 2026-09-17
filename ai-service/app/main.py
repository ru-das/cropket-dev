# FastAPI entry point for the AI service. Stateless: called only by Supabase
# Edge Functions (grade, trip), never talks to the database itself.
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .grading.onion import combine, grade_image
from .images import ImageFetchError, fetch_images
from .settings import settings

app = FastAPI(title="Cropket AI service")


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "service": "cropket-ai"}


def require_service_key(x_service_key: str = Header(default="")) -> None:
    # CLAUDE.md §5: a must-have secret with no mock fails closed - an empty
    # SERVICE_KEY on this laptop must never be treated as "no check needed".
    if not settings.service_key:
        raise HTTPException(status_code=500, detail={"code": "SETUP_MISSING_KEY", "detail": "SERVICE_KEY not set"})
    if not secrets.compare_digest(x_service_key, settings.service_key):
        raise HTTPException(status_code=401, detail={"code": "UNAUTHORIZED", "detail": "bad X-Service-Key"})


class GradeRequest(BaseModel):
    crop: str
    images: list[str] = Field(min_length=1, max_length=3)


class SizeResult(BaseModel):
    label: str
    mmAvg: float | None


class ColourResult(BaseModel):
    label: str
    healthyPct: float


class GradeResponse(BaseModel):
    # Field names and shape must match AiGradeResult
    # (supabase/functions/_shared/domain/schemas/grade.ts) exactly - that
    # zod schema validates this response on the Edge Function side.
    grade: str
    confidence: int
    size: SizeResult
    colour: ColourResult
    damagePct: float
    reasons: list[str]
    source: str = "ai"


# integrations/ai/mock.ts uses "good"/"medium"/etc as its label strings -
# same set here so the app's grade-result screen (1.5) maps one vocabulary
# for both mock and real grades.
COLOUR_LABEL_BY_GRADE = {"A": "good", "B": "fair", "C": "poor"}


@app.post("/grade", response_model=GradeResponse, dependencies=[Depends(require_service_key)])
async def grade(body: GradeRequest) -> GradeResponse:
    if body.crop != "onion":
        # SPEC.md §5.5 v1 is onion-only. Reusing onion HSV ranges on a
        # tomato would produce a confident, wrong grade - CLAUDE.md §5's
        # honesty rule forbids that, so this is a clean 400 instead.
        raise HTTPException(status_code=400, detail={"code": "CROP_NOT_SUPPORTED", "detail": body.crop})

    try:
        images = await fetch_images(body.images)
    except ImageFetchError as err:
        raise HTTPException(status_code=502, detail={"code": "IMAGE_FETCH_FAILED", "detail": str(err)}) from err

    result = combine([grade_image(img) for img in images])
    return GradeResponse(
        grade=result.grade,
        confidence=result.confidence,
        size=SizeResult(label=result.size_label, mmAvg=None),
        colour=ColourResult(label=COLOUR_LABEL_BY_GRADE[result.grade], healthyPct=result.healthy_pct),
        damagePct=result.damage_pct,
        reasons=result.reasons,
        source="ai",
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    # CLAUDE.md §5 error shape - a bad request body is 400 VALIDATION_FAILED,
    # not FastAPI's default 422.
    return JSONResponse(status_code=400, content={"code": "VALIDATION_FAILED", "detail": exc.errors()})


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        return JSONResponse(status_code=exc.status_code, content=detail)
    return JSONResponse(status_code=exc.status_code, content={"code": "ERROR", "detail": detail})
