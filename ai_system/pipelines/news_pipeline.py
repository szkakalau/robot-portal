from typing import List, Dict
import os
from ..agents.trend_agent import fetch_rss_items

DEFAULT_FEEDS = [
    {"url": "https://robot.ofweek.com/rss", "source": "OFweek机器人网", "category": "industry", "lang": "zh", "tags": ["china"]},
    {"url": "https://www.jiqizhixin.com/robotics/rss", "source": "机器之心", "category": "industry", "lang": "zh", "tags": ["china"]},
    {"url": "https://www.robot35.com/feed", "source": "机器人之家", "category": "industry", "lang": "zh", "tags": ["china"]},
    {"url": "https://www.aixzd.com/feed", "source": "AI星踪岛", "category": "industry", "lang": "zh", "tags": ["china"]},
    {"url": "https://spectrum.ieee.org/robotics/rss", "source": "IEEE Spectrum Robotics", "category": "research", "lang": "en", "tags": ["ieee"]},
    {"url": "https://www.therobotreport.com/rss", "source": "The Robot Report", "category": "industry", "lang": "en"},
    {"url": "https://www.roboticsbusinessreview.com/rss", "source": "Robotics Business Review", "category": "business", "lang": "en"},
    {"url": "https://robohub.org/feed", "source": "Robohub", "category": "research", "lang": "en"},
    {"url": "https://singularityhub.com/category/robotics/feed", "source": "Singularity Hub Robotics", "category": "innovation", "lang": "en"},
    {"url": "https://news.mit.edu/rss/topic/robotics", "source": "MIT News Robotics", "category": "research", "lang": "en"},
    {"url": "https://ieeexplore.ieee.org/rss/TOC8860.XML", "source": "IEEE T-RO", "category": "academic", "lang": "en"},
    {"url": "https://ieeexplore.ieee.org/rss/TOC100.XML", "source": "IEEE RAM", "category": "academic", "lang": "en"},
    {"url": "https://rss.arxiv.org/rss/cs.RO", "source": "arXiv cs.RO", "category": "academic", "lang": "en"},
    {"url": "https://rss.arxiv.org/rss/cs.AI", "source": "arXiv cs.AI", "category": "academic", "lang": "en"},
    {"url": "https://techcrunch.com/tag/robotics/feed/", "source": "TechCrunch Robotics", "category": "industry", "lang": "en"},
    {"url": "https://www.theverge.com/rss/robotics/index.xml", "source": "The Verge Robotics", "category": "industry", "lang": "en"},
]

def run_news_pipeline(feeds: List[Dict] = None) -> List[Dict]:
    feeds = feeds or DEFAULT_FEEDS
    extra = os.getenv("RSS_EXTRA_FEEDS", "").strip()
    if extra:
        for url in [u.strip() for u in extra.split(",") if u.strip()]:
            feeds.append({"url": url, "category": "industry", "lang": "en"})
    items = fetch_rss_items(feeds)
    return items
