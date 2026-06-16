import httpx
from typing import List, Dict

HN_API = "https://hn.algolia.com/api/v1/search"
RECENT = "created_at_i>1748736000"  # after June 2026  

def fetch_hn_hiring_posts(limit: int = 30) -> List[Dict]:
    results = []

    try:
        resp = httpx.get(HN_API, params={
            "query": "we are hiring remote",
            "numericFilters": RECENT,
            "hitsPerPage": limit
        }, timeout=15)
        hits = resp.json().get("hits", [])
        for hit in hits:
            text = hit.get("comment_text") or hit.get("title") or ""
            if len(text) < 30:
                continue
            results.append({
                "text": text[:1500],
                "source_url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "signal_type": "hiring"
            })
    except Exception as e:
        print(f"HN hiring error: {e}")

    try:
        resp2 = httpx.get(HN_API, params={
            "query": "raised million seed series startup",
            "numericFilters": RECENT,
            "hitsPerPage": limit // 2
        }, timeout=15)
        hits2 = resp2.json().get("hits", [])
        for hit in hits2:
            text = hit.get("title") or hit.get("comment_text") or ""
            if len(text) < 10:
                continue
            results.append({
                "text": text[:1500],
                "source_url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "signal_type": "funding"
            })
    except Exception as e:
        print(f"HN funding error: {e}")

    try:
        resp3 = httpx.get(HN_API, params={
            "query": "sales team SDR outbound growth",
            "numericFilters": RECENT,
            "hitsPerPage": limit // 2
        }, timeout=15)
        hits3 = resp3.json().get("hits", [])
        for hit in hits3:
            text = hit.get("comment_text") or hit.get("title") or ""
            if len(text) < 30:
                continue
            results.append({
                "text": text[:1500],
                "source_url": f"https://news.ycombinator.com/item?id={hit.get('objectID')}",
                "signal_type": "growth_discussion"
            })
    except Exception as e:
        print(f"HN growth error: {e}")

    print(f"Total signals fetched: {len(results)}")
    return results