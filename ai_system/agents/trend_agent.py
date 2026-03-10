from typing import List, Dict

def fetch_rss_items(feeds: List[str]) -> List[Dict]:
    items = []
    for url in feeds:
        try:
            import importlib
            feedparser = importlib.import_module("feedparser")
            d = feedparser.parse(url)
            for e in d.entries[:20]:
                items.append({
                    "title": getattr(e, "title", ""),
                    "link": getattr(e, "link", ""),
                    "source": d.feed.get("title", ""),
                    "published_at": getattr(e, "published", None)
                })
        except Exception:
            pass
    return items
