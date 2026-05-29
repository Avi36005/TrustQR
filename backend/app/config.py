from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite:///./trustqr.db"
    environment: str = "development"
    google_safe_browsing_api_key: str = ""
    openai_api_key: str = ""
    elevenlabs_api_key: str = ""
    groq_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
