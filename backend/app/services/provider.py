from app.config import settings


def get_ai_provider():
    """
    Returns the active AI provider service instance.
    Priority: Gemini (GEMINI_API_KEY) → Groq (GROQ_API_KEY).
    Raises ValueError if neither key is set.
    """
    if settings.GEMINI_API_KEY:
        from app.services.gemini_service import gemini_service
        return gemini_service
    if settings.GROQ_API_KEY:
        from app.services.groq_service import groq_service
        return groq_service
    raise ValueError(
        "No AI API key configured. "
        "Set GEMINI_API_KEY or GROQ_API_KEY in environment variables."
    )
