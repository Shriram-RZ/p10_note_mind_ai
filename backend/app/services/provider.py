from app.config import settings


def get_ai_provider():
    """
    Returns the active AI provider service instance.
    NoteMind AI uses Groq as its sole AI provider.
    Raises ValueError if no key is set.
    """
    if settings.GROQ_API_KEY:
        from app.services.groq_service import groq_service
        return groq_service
    raise ValueError(
        "No AI API key configured. Set GROQ_API_KEY in environment variables."
    )
