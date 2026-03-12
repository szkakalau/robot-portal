from typing import Dict, Optional
import re

def seo_fields(title: str, content: str, slug: Optional[str] = None) -> Dict:
    clean_title = re.sub(r"\s+", " ", (title or "").strip())
    seo_title = clean_title[:60] if clean_title else "Mechaverses Article"
    text = re.sub(r"\s+", " ", (content or "").strip())
    meta = text[:160].strip()
    if len(meta) > 160:
        meta = meta[:160].strip()
    if len(meta) < 150 and len(text) >= 150:
        meta = text[:160].strip()
        if len(meta) > 160:
            meta = meta[:160].strip()
    if meta and meta[-1] not in ".!?":
        if len(meta) >= 160:
            meta = meta[:159].rstrip()
        meta = f"{meta}."
    computed_slug = "-".join(re.findall(r"[a-z0-9]+", clean_title.lower()))
    computed_slug = computed_slug[:80] or "article"
    return {"seo_title": seo_title, "meta_description": meta, "slug": (slug or computed_slug)}
