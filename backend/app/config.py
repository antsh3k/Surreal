"""Configuration management using Pydantic Settings."""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Keys
    GEMINI_API_KEY: str
    BRAVE_API_KEY: str
    MONGODB_URI: str
    MINIMAX_API_KEY: str

    # Application Settings
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Active Inference Parameters
    UNCERTAINTY_THRESHOLD: float = 0.3  # Below this = solid border, above = dashed
    PREFERENCE_LEARNING_RATE: float = 0.1
    FREE_ENERGY_WEIGHT_DIVERGENCE: float = 0.5
    FREE_ENERGY_WEIGHT_ENTROPY: float = 0.5

    # Gemini Model Configuration
    GEMINI_MODEL: str = "gemini-1.5-pro"
    GEMINI_TEMPERATURE: float = 0.7
    GEMINI_MAX_TOKENS: int = 2048

    # Embedding Configuration
    GEMINI_EMBEDDING_MODEL: str = "models/embedding-001"
    EMBEDDING_CACHE_SIZE: int = 1000
    USE_EMBEDDING_CACHE: bool = True
    EMBEDDING_DIMENSION: int = 768  # Gemini embedding-001 dimension

    # Search Configuration
    BRAVE_MAX_RESULTS: int = 5
    SEARCH_TIMEOUT_SECONDS: int = 10

    # Minimax API Configuration
    MINIMAX_API_BASE_URL: str = "https://api.minimax.io/v1"
    MINIMAX_IMAGE_MODEL: str = "image-01"
    MINIMAX_VIDEO_MODEL: str = "MiniMax-Hailuo-2.3"
    MINIMAX_VIDEO_DURATION: int = 6  # seconds (6 or 10)
    MINIMAX_VIDEO_RESOLUTION: Literal["768P", "1080P"] = "768P"
    MINIMAX_MAX_PROMPT_LENGTH_IMAGE: int = 1500  # characters
    MINIMAX_MAX_PROMPT_LENGTH_VIDEO: int = 2000  # characters
    MINIMAX_POLL_INTERVAL: int = 10  # seconds (for checking task status)
    MINIMAX_MAX_POLL_ATTEMPTS: int = 60  # max attempts (10 min for video)

    # Preference Learning Score Deltas
    SCORE_DELTA_HOVER: float = 0.02
    SCORE_DELTA_CLICK: float = 0.1
    SCORE_DELTA_EXPAND: float = 0.2
    SCORE_DELTA_SIBLING_BOOST: float = 0.1

    # Preference Thresholds
    PREFERENCE_THRESHOLD_PREFERRED: float = 0.3  # Above this = green tint
    PREFERENCE_THRESHOLD_UNCERTAIN: float = -0.2  # Below this = orange tint

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT == "production"


# Global settings instance
settings = Settings()  # type: ignore
