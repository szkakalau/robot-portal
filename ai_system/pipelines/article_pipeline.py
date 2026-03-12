from typing import Dict, Optional, Tuple, List
import os
import re
from ..agents.content_agent import generate_article
from ..agents.seo_agent import seo_fields

def _word_count(text: str) -> int:
    return len([w for w in re.split(r"\s+", (text or "").strip()) if w])

def _count_h2(text: str) -> int:
    return len([line for line in (text or "").splitlines() if line.strip().startswith("## ")])

def _has_faq(text: str) -> bool:
    if not text:
        return False
    if "## FAQ" not in text and "## Faq" not in text:
        return False
    return len(re.findall(r"^###\s+Q\s*:", text, flags=re.IGNORECASE | re.MULTILINE)) >= 3

def _summary_present(text: str) -> bool:
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    if len(lines) < 2:
        return False
    if lines[1].startswith("#"):
        return False
    return True

def _pick_primary_keyword(topic: str) -> Optional[str]:
    stop = {
        "the","a","an","and","or","to","of","in","on","for","with","from","by","at","as","is","are","was","were",
        "will","how","why","what","when","where","this","that","these","those","into","about","its","it's","their"
    }
    words = [w.lower() for w in re.findall(r"[a-zA-Z]{5,}", topic or "") if w.lower() not in stop]
    return words[0] if words else None

def _keyword_coverage(topic: str, text: str) -> bool:
    kw = _pick_primary_keyword(topic)
    if not kw:
        return True
    lines = [line.strip() for line in (text or "").splitlines() if line.strip()]
    if not lines:
        return True
    title = lines[0].lstrip("#").strip().lower()
    summary = lines[1].lower() if len(lines) > 1 else ""
    h2_lines = [line.strip().lower() for line in (text or "").splitlines() if line.strip().startswith("## ")]
    return (kw in title) and (kw in summary) and any(kw in h for h in h2_lines)

def validate_article(topic: str, article: Dict) -> Tuple[bool, List[str]]:
    reasons: List[str] = []
    title = (article.get("title") or "").strip()
    content = (article.get("content") or "").strip()
    if not title:
        reasons.append("missing_title")
    if not content:
        reasons.append("missing_content")
        return False, reasons
    wc = _word_count(content)
    if wc < 1800 or wc > 2400:
        reasons.append(f"word_count_{wc}")
    if not _summary_present(content):
        reasons.append("missing_summary")
    h2 = _count_h2(content)
    if h2 < 4:
        reasons.append(f"h2_count_{h2}")
    if not _has_faq(content):
        reasons.append("missing_faq")
    if not _keyword_coverage(topic, content):
        reasons.append("keyword_coverage_failed")
    return len(reasons) == 0, reasons

def run_article_pipeline(topic: str) -> Dict:
    if not os.getenv("DEEPSEEK_API_KEY"):
        article = generate_article(topic)
        extras = seo_fields(article.get("title") or "", article.get("content") or "", slug=article.get("slug"))
        if "seo_title" not in article or not article.get("seo_title"):
            article["seo_title"] = extras.get("seo_title")
        if "meta_description" not in article or not article.get("meta_description"):
            article["meta_description"] = extras.get("meta_description")
        if "slug" not in article or not article.get("slug"):
            article["slug"] = extras.get("slug")
        return article
    last_article: Optional[Dict] = None
    for _ in range(3):
        article = generate_article(topic)
        ok, _ = validate_article(topic, article)
        last_article = article
        if ok:
            break
    article = last_article or generate_article(topic)
    extras = seo_fields(article.get("title") or "", article.get("content") or "", slug=article.get("slug"))
    if "seo_title" not in article or not article.get("seo_title"):
        article["seo_title"] = extras.get("seo_title")
    if "meta_description" not in article or not article.get("meta_description"):
        article["meta_description"] = extras.get("meta_description")
    if "slug" not in article or not article.get("slug"):
        article["slug"] = extras.get("slug")
    return article
