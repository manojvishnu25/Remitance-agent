import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .routes import dashboard, remittance, drafts, goals, activity, demo


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and seed demo data if needed
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db, reset=False)
    yield


app = FastAPI(
    title="Remittance & Goal Planner API",
    description="SAFE SIMULATION: Prototype backend for comparing corridors, scheduling send windows, and protecting goal savings.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

cors_env = os.getenv("CORS_ORIGINS")
if cors_env:
    for o in cors_env.split(","):
        cleaned = o.strip()
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint providing links to documentation and health check."""
    return {
        "message": "Remittance & Goal Planner API is running!",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "health_check": "/api/health"
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """System health check endpoint."""
    return {
        "status": "healthy",
        "system": "Remittance & Goal Planner (Simulation Engine)",
        "simulation_mode": True,
        "live_banking_connected": False
    }


# Include Routers
app.include_router(dashboard.router)
app.include_router(remittance.router)
app.include_router(drafts.router)
app.include_router(goals.router)
app.include_router(activity.router)
app.include_router(demo.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
