from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
