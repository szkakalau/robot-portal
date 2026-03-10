import os
from dotenv import load_dotenv
from datetime import datetime
from typing import List
from backend.app import DataStore
from ai_system.pipelines.news_pipeline import run_news_pipeline
from ai_system.pipelines.article_pipeline import run_article_pipeline
from ai_system.pipelines.robot_pipeline import run_robot_pipeline
from ai_system.data.top200_robots import build_top200_robot_list

def main():
    load_dotenv()
    store = DataStore()
    print("Start pipeline", datetime.utcnow().isoformat())
    news = run_news_pipeline()
    n = store.upsert_news(news)
    print("News upserted", n)
    topics: List[str] = [it["title"] for it in news[:3]]
    for t in topics:
        article = run_article_pipeline(t)
        store.upsert_article(article)
        print("Article upserted", article["slug"])
    robots_seed = build_top200_robot_list()
    for r in robots_seed:
        robot = run_robot_pipeline(r)
        store.upsert_robot(robot)
    print("Robots upserted", len(robots_seed))
    print("Done", datetime.utcnow().isoformat())

if __name__ == "__main__":
    main()
