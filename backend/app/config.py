from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    app_name: str = "GradPath API"
    app_env: str = "development"
    api_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:5173"

    gemini_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"

    upload_dir: str = "data/uploads"
    max_upload_mb: int = 10


@lru_cache
def get_settings() -> Settings:
    return Settings()
