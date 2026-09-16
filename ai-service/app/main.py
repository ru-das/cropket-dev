# FastAPI entry point for the AI service. Stateless: called only by Supabase
# Edge Functions (grade, trip), never talks to the database itself.
from fastapi import FastAPI

app = FastAPI(title="Cropket AI service")


@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": True, "service": "cropket-ai"}
