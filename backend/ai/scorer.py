import json
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SCORING_PROMPT = """
You are an expert sales intelligence analyst for an outbound sales agency
that sells appointment-setting and SDR outsourcing services.

Company profile:
- Name: {company_name}
- Industry: {industry}
- Stage: {stage}
- Signal detected: {signal_type}
- Signal detail: {signal_summary}

Score this company's likelihood (0-100) to need outbound sales support RIGHT NOW.

Scoring guide:
- 80-100: Hiring SDRs/AEs + recent funding = building sales now
- 60-79: Growth signals or early sales hiring = likely need soon
- 40-59: Some signals but unclear urgency
- 0-39: Weak signals, not a good fit

Return ONLY valid JSON, no markdown:
{{
  "score": 75,
  "tier": "warm",
  "reasoning": "2-3 sentences explaining why this score",
  "recommended_approach": "one sentence on how to reach out"
}}
"""

def score_lead(enriched: dict) -> dict:
    try:
        prompt = SCORING_PROMPT.format(
            company_name=enriched.get("company_name", "Unknown"),
            industry=enriched.get("industry", "Unknown"),
            stage=enriched.get("stage", "Unknown"),
            signal_type=enriched.get("signal_type", "Unknown"),
            signal_summary=enriched.get("signal_summary", "")
        )
        response = client.models.generate_content(
            model="gemini-3.1-flash-lite",
            contents=prompt
        )
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception:
        return {
            "score": 30,
            "tier": "cold",
            "reasoning": "Could not score this lead automatically.",
            "recommended_approach": "Manual review recommended."
        }