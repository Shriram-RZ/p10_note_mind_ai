from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/notemind_db"
    SECRET_KEY: str = "super-secret-key-change-in-production-minimum-32-characters"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    # Tokens-per-minute budget for a single request. Groq free tier caps
    # llama-3.1-8b-instant at 6000 TPM; raise this after upgrading the plan.
    GROQ_TPM_LIMIT: int = 6000
    REDIS_URL: str = "redis://localhost:6379"
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    MAX_FILE_SIZE_MB: int = 100
    ENVIRONMENT: str = "development"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
