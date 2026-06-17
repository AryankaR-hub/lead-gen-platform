import httpx
from typing import List, Dict

HN_API = "https://hn.algolia.com/api/v1/search"
RECENT = "created_at_i>1748736000"

def fetch_hn_hiring_posts(limit: int = 30) -> List[Dict]:
    results = []

    try:
        resp = httpx.get(HN_API, params={
            "query": "hiring software engineer remote fulltime",
            "numericFilters": RECENT,
            "hitsPerPage": limit
        }, timeout=15)
        for hit in resp.json().get("hits", []):
            text = hit.get("comment_text") or hit.get("title") or ""
            if len(text) < 30:
                continue
            results.append({
                "text": text[:1500],
                "source_url": "https://news.ycombinator.com/item?id=" + str(hit.get("objectID")),
                "signal_type": "hiring"
            })
    except Exception as e:
        print("HN hiring error:", e)

    try:
        resp2 = httpx.get(HN_API, params={
            "query": "raised million seed series A startup funding",
            "numericFilters": RECENT,
            "hitsPerPage": limit // 2
        }, timeout=15)
        for hit in resp2.json().get("hits", []):
            text = hit.get("title") or hit.get("comment_text") or ""
            if len(text) < 10:
                continue
            results.append({
                "text": text[:1500],
                "source_url": "https://news.ycombinator.com/item?id=" + str(hit.get("objectID")),
                "signal_type": "funding"
            })
    except Exception as e:
        print("HN funding error:", e)

    try:
        resp3 = httpx.get(HN_API, params={
            "query": "sales team SDR outbound growth revenue",
            "numericFilters": RECENT,
            "hitsPerPage": limit // 2
        }, timeout=15)
        for hit in resp3.json().get("hits", []):
            text = hit.get("comment_text") or hit.get("title") or ""
            if len(text) < 30:
                continue
            results.append({
                "text": text[:1500],
                "source_url": "https://news.ycombinator.com/item?id=" + str(hit.get("objectID")),
                "signal_type": "growth_discussion"
            })
    except Exception as e:
        print("HN growth error:", e)

    print("Total signals fetched:", len(results))
    return results