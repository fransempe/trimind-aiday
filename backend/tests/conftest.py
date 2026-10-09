import pytest

from app.config import settings


@pytest.fixture(autouse=True)
def fake_llm(monkeypatch):
    """Los tests nunca llaman al LLM: usan las heurísticas deterministas."""
    monkeypatch.setattr(settings, "llm_mode", "fake")
    monkeypatch.setattr(settings, "fake_delay_s", 0)
