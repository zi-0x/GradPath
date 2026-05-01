import httpx
from .config import get_settings


def _gemini_headers() -> dict[str, str]:
    return {"Content-Type": "application/json"}


async def gemini_generate(prompt: str) -> str:
    settings = get_settings()
    if not settings.gemini_api_key:
        return "Gemini key is not configured. Please set GEMINI_API_KEY in backend/.env"

    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
    )
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(endpoint, headers=_gemini_headers(), json=payload)
        response.raise_for_status()
        data = response.json()

    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return "Unable to parse Gemini response."


async def generate_sop(name: str, program: str, university_type: str, achievements: list[str], motivation: str, long_term_goal: str) -> str:
    prompt = f"""
    You are an expert admissions consultant.
    Write a polished, authentic Statement of Purpose in first person.
    Student name: {name}
    Program: {program}
    University type: {university_type}
    Achievements: {', '.join(achievements)}
    Motivation: {motivation}
    Long term goal: {long_term_goal}

    Requirements:
    - 650 to 850 words
    - Professional but personal tone
    - Clear structure: background, motivation, fit, goals
    - No clichés
    """
    return await gemini_generate(prompt)


async def mentor_reply(message: str, context: dict | None = None) -> str:
    context_str = context or {}
    if not get_settings().gemini_api_key:
        stage = str(context_str.get("stage", "planning"))
        program = str(context_str.get("program", context_str.get("target", "your program")))
        budget = context_str.get("budget") or context_str.get("budget_usd")
        countries = context_str.get("preferred_countries") or context_str.get("countries") or []
        country_text = ", ".join(countries) if countries else "your preferred destinations"
        reply_parts = [
            f"You are in the {stage} stage for {program}.",
            f"Keep your shortlist aligned with {country_text} and a realistic budget.",
        ]
        if budget:
            reply_parts.append(f"Your current budget signal is about ${budget}.")
        reply_parts.append("Next steps: compare fit, funding, deadlines, and one backup option before you commit.")
        return " ".join(reply_parts)
    prompt = f"""
    You are GradPath AI Mentor, helping students with study abroad planning.
    Be specific, practical, and encouraging.
    Context: {context_str}
    Student message: {message}
    """
    return await gemini_generate(prompt)
