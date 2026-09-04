from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import engine, Base, SessionLocal
from app.db.seed_data import seed_database

# Import routers
from app.api.v1.auth import router as auth_router
from app.api.v1.emergencies import router as emergencies_router
from app.api.v1.ambulances import router as ambulances_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.dispatch import router as dispatch_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.websockets import router as websockets_router

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto seed data on application start
try:
    with SessionLocal() as db:
        seed_database(db)
except Exception as e:
    print(f"Error seeding database: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Hardened CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Auth"])
app.include_router(emergencies_router, prefix=f"{settings.API_V1_STR}/emergencies", tags=["Emergencies"])
app.include_router(ambulances_router, prefix=f"{settings.API_V1_STR}/ambulances", tags=["Ambulances"])
app.include_router(hospitals_router, prefix=f"{settings.API_V1_STR}/hospitals", tags=["Hospitals"])
app.include_router(dispatch_router, prefix=f"{settings.API_V1_STR}/dispatch", tags=["AI Dispatch Support"])
app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])
app.include_router(websockets_router, tags=["WebSockets"])

@app.get("/")
def root():
    return {
        "status": "online",
        "system": settings.PROJECT_NAME,
        "version": "1.1.1",
        "docs_url": "/docs"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "system": settings.PROJECT_NAME,
        "version": "1.1.1"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
