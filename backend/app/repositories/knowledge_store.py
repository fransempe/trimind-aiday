"""Resumen vigente de la base de conocimiento del atleta (en memoria, como el resto del estado)."""

_CONTEXT: dict[str, str] = {"text": ""}


def get_context() -> str:
    return _CONTEXT["text"]


def set_context(text: str) -> None:
    _CONTEXT["text"] = text.strip()
