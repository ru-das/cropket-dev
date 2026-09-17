# The only file that reads ai-service/.env (CLAUDE.md §4 "AI service: one
# settings.py (Pydantic settings)"). Everything else imports `settings`.
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Absolute path so this works the same whether uvicorn/pytest is started
# from ai-service/ or from the repo root.
_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, extra="ignore")

    # Same value the app calls AI_SERVICE_KEY (CLAUDE.md §2). Empty on a
    # laptop with no key set yet - main.py fails closed in that case rather
    # than running an unauthenticated service (CLAUDE.md §5).
    service_key: str = ""
    max_image_mb: int = 5
    log_level: str = "info"


settings = Settings()
