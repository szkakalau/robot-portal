#!/usr/bin/env python3
"""
验证「每天日更」与「前端能显示」的整条链路。

用法:
  # 仅检查 API 是否有数据（不触发日更）
  python3 scripts/verify_daily_and_frontend.py

  # 指定后端地址
  API_BASE=https://robot-portal-api.onrender.com python3 scripts/verify_daily_and_frontend.py

  # 触发一次日更后再检查（需配置 TASK_TOKEN）
  TASK_TOKEN=xxx python3 scripts/verify_daily_and_frontend.py --run-daily

  # 导出静态数据并检查前端目录
  python3 scripts/verify_daily_and_frontend.py --export
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

API_BASE = os.getenv("API_BASE", "https://robot-portal-api.onrender.com").rstrip("/")
TASK_TOKEN = os.getenv("TASK_TOKEN", "")
REPO_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "frontend" / "public" / "data"


def fetch_json(path: str, method: str = "GET", timeout: int = 60):
    req = urllib.request.Request(f"{API_BASE}{path}", method=method)
    req.add_header("Content-Type", "application/json")
    if TASK_TOKEN:
        req.add_header("X-Task-Token", TASK_TOKEN)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.getcode(), json.loads(resp.read().decode("utf-8", errors="ignore"))


def main():
    run_daily = "--run-daily" in sys.argv
    do_export = "--export" in sys.argv or run_daily
    ok = True

    # 1) 可选：触发日更
    if run_daily and TASK_TOKEN:
        print(">>> 触发日更: POST /tasks/run-daily?sync=1&articles=5")
        try:
            req = urllib.request.Request(
                f"{API_BASE}/tasks/run-daily?sync=1&articles=5",
                method="POST",
                data=b"",
            )
            req.add_header("Content-Type", "application/json")
            req.add_header("X-Task-Token", TASK_TOKEN)
            with urllib.request.urlopen(req, timeout=300) as resp:
                body = json.loads(resp.read().decode("utf-8", errors="ignore"))
            if body.get("ok"):
                print("    日更成功:", body.get("articles_succeeded", 0), "篇文章,", body.get("robots_seeded", 0), "条机器人")
            else:
                print("    日更返回 ok=False:", body.get("error", body))
                ok = False
        except Exception as e:
            print("    日更请求失败:", e)
            ok = False
    elif run_daily and not TASK_TOKEN:
        print(">>> 跳过日更（未设置 TASK_TOKEN）")

    # 2) 检查 API 数据是否可读（前端会请求这些接口或回退到静态文件）
    print("\n>>> 检查 API 数据")
    for name, path in [("文章", "/articles"), ("新闻", "/news"), ("机器人", "/robots?limit=500")]:
        try:
            code, data = fetch_json(path)
            if code != 200:
                print(f"    {name}: HTTP {code}")
                ok = False
            elif not isinstance(data, list):
                print(f"    {name}: 返回非列表")
                ok = False
            else:
                print(f"    {name}: {len(data)} 条")
        except Exception as e:
            print(f"    {name}: 请求失败 - {e}")
            ok = False

    # 3) 可选：导出静态数据到 frontend/public/data
    if do_export:
        print("\n>>> 导出静态数据到 frontend/public/data")
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        for name, path, filename in [
            ("articles", "/articles", "articles.json"),
            ("news", "/news", "news.json"),
            ("robots", "/robots?limit=500", "robots.json"),
        ]:
            try:
                code, data = fetch_json(path)
                if code == 200 and isinstance(data, list):
                    (DATA_DIR / filename).write_text(json.dumps(data, ensure_ascii=False, indent=2))
                    print(f"    已写入 {filename} ({len(data)} 条)")
                else:
                    print(f"    {filename}: 跳过，API 返回异常")
                    ok = False
            except Exception as e:
                print(f"    {filename}: {e}")
                ok = False

    # 4) 检查前端静态数据是否存在且非空（用于「前端能显示」的静态回退）
    print("\n>>> 检查前端静态数据（前端会优先 API，失败时用此处文件）")
    for filename in ["articles.json", "news.json", "robots.json"]:
        p = DATA_DIR / filename
        if not p.exists():
            print(f"    {filename}: 不存在（可运行 --export 从 API 导出）")
            continue
        try:
            raw = p.read_text(encoding="utf-8", errors="ignore")
            data = json.loads(raw)
            if isinstance(data, list):
                print(f"    {filename}: {len(data)} 条")
            else:
                print(f"    {filename}: 存在但非列表")
        except Exception as e:
            print(f"    {filename}: 解析失败 - {e}")
            ok = False

    print("\n" + ("[通过] 日更与前端数据链路正常" if ok else "[失败] 请根据上方输出排查"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
