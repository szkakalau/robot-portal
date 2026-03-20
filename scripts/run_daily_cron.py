#!/usr/bin/env python3
"""
Daily cron job script - runs on Render Free Cron.
Calls the local running API to trigger daily article refresh.
Falls back to direct pipeline execution if API is not reachable.
"""
import os, sys, urllib.request, json

API_BASE = os.getenv("API_BASE", "https://robot-portal-api.onrender.com")
TASK_TOKEN = os.getenv("TASK_TOKEN", "")

def main():
    url = f"{API_BASE}/tasks/run-daily?articles=5"
    req = urllib.request.Request(url, method="POST")
    req.add_header("Content-Type", "application/json")
    if TASK_TOKEN:
        req.add_header("X-Task-Token", TASK_TOKEN)

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
            result = json.loads(body)
            print("Daily refresh result:", json.dumps(result))
            return 0
    except Exception as exc:
        print("API call failed, trying direct pipeline:", exc)
        try:
            from ai_system.pipelines.article_pipeline import run_article_pipeline
            result = run_article_pipeline(article_count=5)
            print("Direct pipeline result:", json.dumps(result))
            return 0
        except Exception as exc2:
            print("Direct pipeline also failed:", exc2)
            return 1

if __name__ == "__main__":
    sys.exit(main())
