"""
Configuration management for AI Traffic Management System
Handles environment variables and application settings
"""

import os
from functools import lru_cache
from typing import List, Optional, Union, Any

# Correct imports for Pydantic V2 and Settings
from pydantic_settings import BaseSettings
from pydantic import field_validator, AnyHttpUrl, ValidationInfo

class ApplicationSettings(BaseSettings):
    """Application configuration with environment variable support"""

    # Application Info
    application_name: str = "AI Traffic Management System"
    application_version: str = "2.0.0"
    debug_mode: bool = False

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_prefix: str = "/api"

    # CORS Settings
    # Use Union[str, List[str]] to allow either comma-separated string from env or list directly
    allowed_origins: Union[str, List[str]] = ["*"]
    allowed_methods: List[str] = ["*"]
    allowed_headers: List[str] = ["*"]

    # Database Configuration
    mongodb_connection_string: str = "mongodb://localhost:27017"
    database_name: str = "traffic_management"

    # Redis Configuration
    redis_connection_string: str = "redis://localhost:6379"
    redis_cache_ttl: int = 3600  # 1 hour

    # AI Model Configuration
    model_name: str = "yolov8n.pt"
    detection_confidence_threshold: float = 0.4
    non_max_suppression_threshold: float = 0.45
    enable_gpu_acceleration: bool = True
    model_cache_directory: str = "./models"

    # Traffic Management Settings
    default_green_signal_duration: int = 30  # seconds
    yellow_signal_duration: int = 3   # seconds
    minimum_green_duration: int = 10   # seconds
    maximum_green_duration: int = 120  # seconds

    # Emergency Response Settings
    emergency_override_duration: int = 60  # seconds
    emergency_detection_enabled: bool = True

    # Logging Configuration
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    enable_file_logging: bool = True
    log_file_path: str = "./logs/traffic_system.log"

    # Performance Settings
    max_concurrent_requests: int = 100
    request_timeout_seconds: int = 30
    websocket_heartbeat_interval: int = 30

    # Security Settings
    jwt_secret_key: Optional[str] = None # Should be set via environment variable in prod
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    # --- Updated Validators for Pydantic V2 ---

    # Use field_validator with mode='before' to handle the input string
    @field_validator("allowed_origins", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from environment variable if it's a string"""
        if isinstance(v, str) and not v.startswith("["):
            # If it's a string and doesn't look like a JSON list, split by comma
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        elif isinstance(v, list):
            # If it's already a list, return it
            return v
        # Otherwise (e.g., None or empty string), return default or handle as needed
        # Returning ["*"] if input is invalid/empty might be safer
        return ["*"] # Or handle error based on requirements

    # Use field_validator (default mode is 'after') for standard validation
    @field_validator("detection_confidence_threshold")
    @classmethod
    def validate_confidence_threshold(cls, v: float):
        """Validate confidence threshold is between 0 and 1"""
        if not 0 < v < 1:
            raise ValueError("Detection confidence threshold must be between 0 and 1 (exclusive)")
        return v

    # --- Pydantic-Settings Configuration ---
    class Settings: # Renamed from Config for pydantic-settings v2+ convention
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        env_prefix = "TRAFFIC_" # Reads TRAFFIC_DEBUG_MODE etc.


class DevelopmentSettings(ApplicationSettings):
    """Development environment configuration"""
    debug_mode: bool = True
    log_level: str = "DEBUG"
    api_host: str = "127.0.0.1"
    # Example: Override JWT secret for dev if needed
    jwt_secret_key: str = "dev_secret_key_change_me"


class ProductionSettings(ApplicationSettings):
    """Production environment configuration"""
    debug_mode: bool = False
    log_level: str = "WARNING"
    enable_file_logging: bool = True
    # Ensure JWT secret is set via environment in production
    jwt_secret_key: Optional[str] = None # Will raise error if None and used

    # Override allowed origins for production
    allowed_origins: List[str] = [
        "https://your-frontend-domain.com", # Replace with actual domain
        "https://*.vercel.app",             # Example Vercel wildcard
        "https://*.railway.app",            # Example Railway wildcard
        "https://*.render.com"             # Example Render wildcard
    ]

    @field_validator("jwt_secret_key")
    @classmethod
    def check_jwt_secret(cls, v: Optional[str]):
        if not v:
            raise ValueError("JWT_SECRET_KEY must be set in production environment!")
        return v


class TestingSettings(ApplicationSettings):
    """Testing environment configuration"""
    debug_mode: bool = True
    database_name: str = "traffic_management_test"
    redis_connection_string: str = "redis://localhost:6379/1" # Use different DB/port for tests
    log_level: str = "DEBUG"
    # Use a fixed secret for testing
    jwt_secret_key: str = "test_secret_key"


@lru_cache()
def get_application_settings() -> ApplicationSettings:
    """Get application settings based on environment"""
    environment = os.getenv("ENVIRONMENT", "development").lower()
    print(f"[⚙️] Environment detected: {environment.upper()}")

    if environment == "production":
        print("[🏭] Loading PRODUCTION settings...")
        return ProductionSettings()
    elif environment == "testing":
        print("[🧪] Loading TESTING settings...")
        return TestingSettings()
    else:
        print("[🔧] Loading DEVELOPMENT settings...")
        return DevelopmentSettings()


# Global settings instance, loaded based on ENVIRONMENT variable
settings = get_application_settings()

# Example of how to access settings elsewhere in your app:
# from app.core.config import settings
# print(settings.api_port)
