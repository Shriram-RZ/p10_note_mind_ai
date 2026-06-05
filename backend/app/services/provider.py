from app.config import settings


def get_ai_provider():
    """
    Returns the active AI provider service instance.
    Priority: Gemini → Groq → Anthropic Claude.
    Raises ValueError if no key is set.
    """
    if settings.GEMINI_API_KEY:
        from app.services.gemini_service import gemini_service
        return gemini_service
    if settings.GROQ_API_KEY:
        from app.services.groq_service import groq_service
        return groq_service
    if settings.ANTHROPIC_API_KEY:
        from app.services.anthropic_service import anthropic_service
        return anthropic_service
    raise ValueError(
        "No AI API key configured. "
        "Set GEMINI_API_KEY, GROQ_API_KEY, or ANTHROPIC_API_KEY in environment variables."
    )
