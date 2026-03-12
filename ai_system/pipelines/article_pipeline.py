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
    if wc < 1800 or wc > 2200:
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

def _validate_seo(article: Dict) -> List[str]:
    reasons: List[str] = []
    seo_title = (article.get("seo_title") or "").strip()
    meta = (article.get("meta_description") or "").strip()
    if seo_title and len(seo_title) > 60:
        reasons.append("seo_title_too_long")
    if meta and (len(meta) < 150 or len(meta) > 160):
        reasons.append(f"meta_description_len_{len(meta)}")
    return reasons

def run_article_pipeline_with_report(topic: str) -> Tuple[Dict, Dict]:
    if not os.getenv("DEEPSEEK_API_KEY"):
        article = generate_article(topic)
        extras = seo_fields(article.get("title") or "", article.get("content") or "", slug=article.get("slug"))
        if "seo_title" not in article or not article.get("seo_title"):
            article["seo_title"] = extras.get("seo_title")
        if "meta_description" not in article or not article.get("meta_description"):
            article["meta_description"] = extras.get("meta_description")
        if "slug" not in article or not article.get("slug"):
            article["slug"] = extras.get("slug")
        report = {
            "ok": False,
            "skipped_validation": True,
            "attempts": 1,
            "reasons": ["missing_deepseek_api_key"],
        }
        return article, report
    last_article: Optional[Dict] = None
    attempt_reports: List[Dict] = []
    for attempt in range(1, 4):
        article = generate_article(topic)
        ok, reasons = validate_article(topic, article)
        last_article = article
        attempt_reports.append({
            "attempt": attempt,
            "ok": ok,
            "reasons": reasons,
            "word_count": _word_count(article.get("content") or ""),
            "h2_count": _count_h2(article.get("content") or ""),
            "has_faq": _has_faq(article.get("content") or ""),
        })
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
    ok, reasons = validate_article(topic, article)
    seo_reasons = _validate_seo(article)
    reasons = reasons + seo_reasons
    report = {
        "ok": ok and len(seo_reasons) == 0,
        "attempts": len(attempt_reports) if attempt_reports else 1,
        "reasons": reasons,
        "word_count": _word_count(article.get("content") or ""),
        "h2_count": _count_h2(article.get("content") or ""),
        "has_faq": _has_faq(article.get("content") or ""),
        "meta_len": len((article.get("meta_description") or "").strip()),
        "seo_title_len": len((article.get("seo_title") or "").strip()),
        "attempt_reports": attempt_reports,
    }
    return article, report

def run_article_pipeline(topic: str) -> Dict:
    article, _ = run_article_pipeline_with_report(topic)
    return article
