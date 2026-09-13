import os
from typing import List

class Settings:
    PROJECT_NAME: str = "AI Emergency Ambulance Dispatch"
    API_V1_STR: str = "/api/v1"
    
    # Security Configuration via Environment Variables
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("TOKEN_EXPIRE_MINUTES", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))) # 7 days
    
    # Database URL via Environment Variables
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    
    # CORS Origins via Environment Variables (comma-separated list)
    @property
    def cors_origins(self) -> List[str]:
        raw_origins = os.getenv(
            "CORS_ORIGINS", 
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://localhost,http://localhost:80,http://127.0.0.1:80"
        )
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

settings = Settings()
