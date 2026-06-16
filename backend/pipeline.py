from scrapers.hn_scraper import fetch_hn_hiring_posts
from ai.enricher import enrich_company
from ai.scorer import score_lead
from models import Lead
from database import SessionLocal
import time
import html

def clean_text(text: str) -> str:
    # removes HTML tags and decodes HTML characters
    import re
    text = html.unescape(text)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def run_pipeline(limit: int = 20):
    db = SessionLocal()
    added = 0

    print("--- PIPELINE STARTING ---")
    raw_signals = fetch_hn_hiring_posts(limit=limit)
    print(f"Fetched {len(raw_signals)} signals")

    for i, signal in enumerate(raw_signals):
        try:
            clean = clean_text(signal["text"])
            print(f"\n[{i+1}] Processing: {clean[:80]}")

            enriched = enrich_company(clean, signal["signal_type"])
            print(f"    Enriched: {enriched}")

            if not enriched.get("company_name"):
                print("    SKIPPED: no company name extracted")
                continue

            existing = db.query(Lead).filter(
                Lead.company_name == enriched["company_name"]
            ).first()
            if existing:
                print(f"    SKIPPED: duplicate - {enriched['company_name']}")
                continue

            scored = score_lead(enriched)
            print(f"    Score: {scored.get('score')} / tier: {scored.get('tier')}")

            lead = Lead(
                company_name=enriched["company_name"],
                website=enriched.get("website"),
                industry=enriched.get("industry"),
                stage=enriched.get("stage"),
                signal_type=enriched.get("signal_type"),
                signal_summary=enriched.get("signal_summary"),
                intent_score=scored["score"],
                score_tier=scored["tier"],
                reasoning=scored.get("reasoning", ""),
                recommended_approach=scored.get("recommended_approach", ""),
                source_url=signal.get("source_url")
            )
            db.add(lead)
            db.commit()
            added += 1
            print(f"    SAVED: {enriched['company_name']}")
            time.sleep(0.5)

        except Exception as e:
            print(f"    ERROR: {e}")
            import traceback
            traceback.print_exc()
            continue

    db.close()
    print(f"\n--- PIPELINE DONE: {added} leads added ---")
    return added