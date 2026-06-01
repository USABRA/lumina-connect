from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql://lumina:lumina@localhost:5432/lumina_connect"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    firebase_project_id: str = ""
    firebase_client_email: str = ""
    firebase_private_key: str = ""
    jwt_secret_key: str = "dev-secret-change-in-production-use-32-chars-min"
    landing_base_url: str = "http://localhost:3000/p"

    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = ""
    lead_notify_emails: str = ""
    upload_dir: str = "uploads"
    api_public_url: str = ""
    platform_admin_emails: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def firebase_configured(self) -> bool:
        return bool(
            self.firebase_project_id
            and self.firebase_client_email
            and self.firebase_private_key
        )

    @property
    def firebase_private_key_value(self) -> str:
        return self.firebase_private_key.replace("\\n", "\n")

    @property
    def lead_notify_emails_list(self) -> list[str]:
        return [email.strip() for email in self.lead_notify_emails.split(",") if email.strip()]

    @property
    def platform_admin_emails_list(self) -> list[str]:
        return [email.strip().lower() for email in self.platform_admin_emails.split(",") if email.strip()]


settings = Settings()
