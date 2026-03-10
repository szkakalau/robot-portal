from typing import Dict
import re

def seo_fields(title: str, content: str) -> Dict:
    seo_title = title[:60]
    meta_description = " ".join(re.sub(r"\s+", " ", content).strip().split()[:30])
    slug = "-".join(re.findall(r"[a-z0-9]+", title.lower()))
    slug = slug[:80] or "article"
    return {"seo_title": seo_title, "meta_description": meta_description, "slug": slug}
