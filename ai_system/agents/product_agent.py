from typing import Dict

def normalize_robot(raw: Dict) -> Dict:
    name = raw.get("name") or raw.get("title") or ""
    return {
        "name": name,
        "company": raw.get("company"),
        "category": raw.get("category"),
        "price": raw.get("price"),
        "release_year": raw.get("release_year"),
        "description": raw.get("description") or raw.get("summary"),
        "specs": raw.get("specs") or {},
        "image_url": raw.get("image_url")
    }
