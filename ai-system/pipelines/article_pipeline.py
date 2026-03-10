from typing import Dict
from ..agents.content_agent import generate_article
from ..agents.seo_agent import seo_fields

def run_article_pipeline(topic: str) -> Dict:
    article = generate_article(topic)
    extras = seo_fields(article["title"], article["content"])
    article.update(extras)
    return article
