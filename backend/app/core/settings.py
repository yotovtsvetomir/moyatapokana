import os


class Settings:
    # General
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default-secret-key")
    PEPPER: str | None = os.getenv("PEPPER")

    # Frontend
    FRONTEND_BASE_URL: str = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")
    REDIRECT_URI: str = f"{FRONTEND_BASE_URL}/social-redirect"

    # Session & Cookies
    SESSION_EXPIRE_SECONDS: int = int(os.getenv("SESSION_EXPIRE_SECONDS", 604800))
    SESSION_COOKIE_SECURE: bool = (
        os.getenv("ENVIRONMENT", "development") == "production"
    )
    ADMIN_SESSION_COOKIE_NAME: str = os.getenv(
        "ADMIN_SESSION_COOKIE_NAME", "admin_session_id"
    )
    ANONYMOUS_SESSION_COOKIE_NAME: str = os.getenv(
        "ANONYMOUS_SESSION_COOKIE_NAME", "anonymous_session_id"
    )
    RESET_TOKEN_EXPIRE_SECONDS: int = 900

    # Database / Celery
    DATABASE_URL_WRITER: str | None = os.getenv("DATABASE_URL_WRITER")
    DATABASE_URL_READER: str | None = os.getenv("DATABASE_URL_READER")
    CELERY_DATABASE_URL_WRITER: str | None = os.getenv("DATABASE_URL_WRITER")
    CELERY_DATABASE_URL_READER: str | None = os.getenv("DATABASE_URL_READER")

    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://redis:6379")

    # Mail
    MAIL_HOST: str = os.getenv("MAIL_HOST", "localhost")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 1025))
    MAIL_FROM: str = os.getenv("MAIL_FROM", "noreply@example.com")
    MAIL_USER: str | None = os.getenv("MAIL_USER")
    MAIL_PASS: str | None = os.getenv("MAIL_PASS")

    # S3
    S3_ENDPOINT_URL: str | None = os.getenv("S3_ENDPOINT_URL")
    S3_ACCESS_KEY: str | None = os.getenv("S3_ACCESS_KEY")
    S3_SECRET_KEY: str | None = os.getenv("S3_SECRET_KEY")
    S3_BUCKET: str | None = os.getenv("S3_BUCKET")
    S3_REGION: str | None = os.getenv("S3_REGION")
    S3_SECURE: bool = os.getenv("S3_SECURE", "false").lower() == "true"

    # Google OAuth
    GOOGLE_CLIENT_ID: str | None = os.getenv("GOOGLE_CLIENT_ID")


settings = Settings()
