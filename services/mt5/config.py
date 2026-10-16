from pydantic import BaseSettings

class Settings(BaseSettings):
    MT5_ACCOUNT_ID: str | None = None
    MT5_PASSWORD: str | None = None
    MT5_SERVER: str | None = None
    MT5_LOGIN_TIMEOUT: int = 10
    MT5_RECONNECT_INTERVAL: int = 5
    MT5_HEARTBEAT_INTERVAL: int = 30
    MT5_INTERNAL_API_KEY: str | None = None
    MT5_READ_ONLY_MODE: bool = True
    MT5_LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
