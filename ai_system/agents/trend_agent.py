from typing import List, Dict, Any
import re

KEYWORD_TAGS = {
    "humanoid": ["humanoid", "biped"],
    "quadruped": ["quadruped", "robot dog", "robotic dog", "spot", "unitree"],
    "warehouse": ["warehouse", "logistics", "fulfillment"],
    "funding": ["funding", "raises", "series", "investment", "financing"],
    "research": ["paper", "study", "research", "arxiv", "preprint"],
    "agriculture": ["agriculture", "farm", "crop", "harvest"],
    "security": ["security", "patrol", "surveillance"],
    "healthcare": ["medical", "hospital", "surgery", "healthcare"],
    "consumer": ["consumer", "home", "vacuum", "toy"],
}

def _extract_summary(entry: Any) -> str:
    summary = getattr(entry, "summary", "") or getattr(entry, "description", "") or ""
    return re.sub(r"\s+", " ", summary).strip()

def _derive_tags(title: str) -> List[str]:
    text = (title or "").lower()
    tags: List[str] = []
    for tag, keywords in KEYWORD_TAGS.items():
        if any(k in text for k in keywords):
            tags.append(tag)
    return tags[:6]

def fetch_rss_items(feeds: List[Dict]) -> List[Dict]:
    items = []
    for feed in feeds:
        try:
            import importlib
            feedparser = importlib.import_module("feedparser")
            url = feed.get("url")
            if not url:
                continue
            d = feedparser.parse(url)
            source = feed.get("source") or d.feed.get("title", "")
            category = feed.get("category")
            lang = feed.get("lang")
            base_tags = feed.get("tags") or []
            for e in d.entries[:20]:
                title = getattr(e, "title", "")
                items.append({
                    "title": title,
                    "link": getattr(e, "link", ""),
                    "source": source,
                    "published_at": getattr(e, "published", None),
                    "summary": _extract_summary(e),
                    "category": category,
                    "lang": lang,
                    "tags": list(dict.fromkeys(base_tags + _derive_tags(title))),
                })
        except Exception:
            pass
    return items
