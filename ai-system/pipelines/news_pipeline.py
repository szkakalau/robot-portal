from typing import List, Dict
from ..agents.trend_agent import fetch_rss_items

DEFAULT_FEEDS = [
    "https://techcrunch.com/tag/robotics/feed/",
    "https://www.theverge.com/rss/robotics/index.xml"
]

def run_news_pipeline(feeds: List[str] = None) -> List[Dict]:
    feeds = feeds or DEFAULT_FEEDS
    items = fetch_rss_items(feeds)
    return items
