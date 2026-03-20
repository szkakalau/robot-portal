#!/usr/bin/env python3
"""
Daily cron job script - runs inside the cron container on Render.
直接导入 ai_system pipeline 执行，不依赖外部 HTTP call。
"""
import os, sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BACKEND_DIR, '..'))

from ai_system.pipelines.article_pipeline import run_article_pipeline

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

def main():
    print("Starting daily article refresh...")
    try:
        result = run_article_pipeline(
            article_count=5,
            deepseek_api_key=DEEPSEEK_API_KEY,
            supabase_url=SUPABASE_URL,
            supabase_key=SUPABASE_KEY,
        )
        print("Result:", result)
        return 0
    except Exception as exc:
        print("Error:", exc)
        return 1

if __name__ == "__main__":
    sys.exit(main())
