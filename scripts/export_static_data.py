import json
import os
import pathlib
import urllib.request


API_BASE = os.getenv("API_BASE", "https://robot-portal-api.onrender.com").rstrip("/")
OUTPUT_DIR = pathlib.Path(__file__).resolve().parents[1] / "frontend" / "public" / "data"


def fetch_json(path: str):
    with urllib.request.urlopen(f"{API_BASE}{path}", timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8", errors="ignore"))


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    articles = fetch_json("/articles")
    news = fetch_json("/news")
    robots = fetch_json("/robots?limit=500")
    (OUTPUT_DIR / "articles.json").write_text(json.dumps(articles, ensure_ascii=False, indent=2))
    (OUTPUT_DIR / "news.json").write_text(json.dumps(news, ensure_ascii=False, indent=2))
    (OUTPUT_DIR / "robots.json").write_text(json.dumps(robots, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
