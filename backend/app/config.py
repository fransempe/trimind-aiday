from typing import Literal

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# LiteLLM lee las API keys (OPENROUTER_API_KEY, GEMINI_API_KEY...) del entorno del proceso.
load_dotenv(".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # live: llama al LLM. fake: opiniones heurísticas deterministas (tests y demo sin key).
    llm_mode: Literal["live", "fake"] = "live"
    # Demora simulada por agente en modo fake (segundos), para que la demo se vea trabajar.
    fake_delay_s: float = 1.5
    # Modelos free de OpenRouter que aceptan salida JSON (response_format).
    specialist_model: str = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"
    coach_model: str = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"
    # Si el modelo principal falla, se prueba este. Vacío = sin fallback.
    fallback_model: str = "openrouter/google/gemma-4-31b-it:free"
    llm_timeout_s: float = 45
    llm_max_attempts: int = 2
    max_rule_retries: int = 2

    scenario: str = "normal"
    # Cualquier puerto de localhost (demo local).
    cors_origin_regex: str = r"http://(localhost|127\.0\.0\.1)(:\d+)?"


settings = Settings()
