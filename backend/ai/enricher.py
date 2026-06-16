import json
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

ENRICHMENT_PROMPT = """
You are a B2B sales intelligence analyst.

Given this raw text from a job post or news article, extract company information.

Text: {text}

Return ONLY valid JSON, no markdown, no explanation:
{{
  "company_name": "string or null",
  "website": "best guess domain or null",
  "industry": "string or null",
  "stage": "early-stage / growth / enterprise / unknown",
  "signal_type": "hiring / funding / growth_discussion",
  "signal_summary": "one sentence describing the signal"
}}
"""

def enrich_company(text: str, signal_type: str) -> dict:
    try:
        prompt = ENRICHMENT_PROMPT.format(text=text[:1200])
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
    except Exception as e:
        return {
            "company_name": None,
            "website": None,
            "industry": None,
            "stage": "unknown",
            "signal_type": signal_type,
            "signal_summary": text[:200]
        }