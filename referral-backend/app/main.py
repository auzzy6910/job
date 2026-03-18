import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.database import init_db
from app.routers import users, referrals, spin, stars, microtasks, booster, leaderboard

app = FastAPI(title="Referral Site API")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(users.router)
app.include_router(referrals.router)
app.include_router(spin.router)
app.include_router(stars.router)
app.include_router(microtasks.router)
app.include_router(booster.router)
app.include_router(leaderboard.router)

@app.on_event("startup")
def startup():
    init_db()

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

# Serve frontend static files
STATIC_DIR = Path(__file__).parent.parent / "static"
if STATIC_DIR.exists():
    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        file_path = STATIC_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(STATIC_DIR / "index.html")

    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="static-assets")
