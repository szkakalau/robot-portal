from typing import List, Dict, Any
import os
import re
import httpx

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
    summary = re.sub(r"<[^>]+>", " ", summary)
    return re.sub(r"\s+", " ", summary).strip()

def _truncate(text: str, limit: int = 240) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    if len(cleaned) <= limit:
        return cleaned
    return cleaned[:limit].rstrip() + "…"

def _summarize_text(title: str, summary: str) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    api_base = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    base = summary or title
    if not base:
        return ""
    if not api_key:
        return _truncate(base)
    prompt = (
        "Summarize the following robotics news in 2-3 sentences (80-120 words). "
        "Be factual and avoid hype.\n\n"
        f"Title: {title}\n\n"
        f"Content: {summary}\n\nSummary:"
    )
    try:
        url = f"{api_base}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.4
        }
        with httpx.Client(timeout=30) as client:
            r = client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            text = data["choices"][0]["message"]["content"]
            return _truncate(text, 400)
    except Exception:
        return _truncate(base)

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
                summary = _extract_summary(e)
                if feed.get("priority") == "high" and len(summary) < 120:
                    summary = _summarize_text(title, summary)
                items.append({
                    "title": title,
                    "link": getattr(e, "link", ""),
                    "source": source,
                    "published_at": getattr(e, "published", None),
                    "summary": summary,
                    "category": category,
                    "lang": lang,
                    "tags": list(dict.fromkeys(base_tags + _derive_tags(title))),
                })
        except Exception:
            pass
    return items
