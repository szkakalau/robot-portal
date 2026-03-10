import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
from dataclasses import dataclass


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str


def request_with_retry(url: str, method: str = "GET", headers: dict | None = None, timeout: int = 30, retries: int = 4):
    last_error: str | None = None
    for attempt in range(retries):
        try:
            cmd = ["curl", "-s", "-L", "-m", str(timeout), "-X", method, "-o", "-", "-w", "\n%{http_code}", url]
            for k, v in (headers or {}).items():
                cmd.extend(["-H", f"{k}: {v}"])
            out = subprocess.check_output(cmd, text=True)
            body, code_text = out.rsplit("\n", 1)
            status = int(code_text.strip())
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(1 + attempt)
                last_error = str(e)
                continue
            raise
        if status in {502, 503, 504} and attempt < retries - 1:
            time.sleep(1 + attempt)
            last_error = f"http status={status}"
            continue
        if status >= 400 and attempt < retries - 1:
            time.sleep(1 + attempt)
            last_error = f"http status={status}"
            continue
        if status >= 400:
            raise RuntimeError(f"http status={status}, body={body[:300]}")
        return status, body
    if last_error:
        raise RuntimeError(last_error)
    raise RuntimeError(f"request failed: {url}")


def request_json(url: str, method: str = "GET", headers: dict | None = None, timeout: int = 30, retries: int = 4):
    status, body = request_with_retry(url=url, method=method, headers=headers, timeout=timeout, retries=retries)
    return status, json.loads(body)


def request_text(url: str, method: str = "GET", headers: dict | None = None, timeout: int = 30, retries: int = 4):
    return request_with_retry(url=url, method=method, headers=headers, timeout=timeout, retries=retries)


def check(condition: bool, name: str, detail_ok: str, detail_fail: str) -> CheckResult:
    return CheckResult(name=name, ok=condition, detail=detail_ok if condition else detail_fail)


def normalize(base: str) -> str:
    return base.rstrip("/")


def wait_until_up(url: str, seconds: int = 45) -> bool:
    end = time.time() + seconds
    while time.time() < end:
        try:
            status, _ = request_text(url, timeout=5, retries=1)
            if status == 200:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False


def run() -> int:
    project_root = os.path.dirname(os.path.abspath(__file__))
    default_frontend_dir = os.path.join(project_root, "frontend")
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-base", default=os.getenv("PRECHECK_API_BASE", "http://localhost:8000"))
    parser.add_argument("--frontend-base", default=os.getenv("PRECHECK_FRONTEND_BASE", "http://localhost:3000"))
    parser.add_argument("--task-token", default=os.getenv("TASK_TOKEN", ""))
    parser.add_argument("--skip-build", action="store_true")
    parser.add_argument("--frontend-dir", default=default_frontend_dir)
    parser.add_argument("--serve-port", type=int, default=3100)
    args = parser.parse_args()

    api_base = normalize(args.api_base)
    frontend_base = normalize(args.frontend_base)
    results: list[CheckResult] = []

    try:
        headers = {"X-Task-Token": args.task_token} if args.task_token else {}
        status, daily = request_json(f"{api_base}/tasks/run-daily", method="POST", headers=headers)
        results.append(check(status == 200, "run-daily HTTP", f"status={status}", f"status={status}"))
        results.append(
            check(
                bool(daily.get("ok")),
                "run-daily ok",
                f"robots_seeded={daily.get('robots_seeded')}, articles_attempted={daily.get('articles_attempted')}, news_upserted={daily.get('news_upserted')}",
                f"payload={daily}",
            )
        )
        results.append(
            check(
                daily.get("robots_seeded") == 200,
                "Top200 seeded",
                "robots_seeded=200",
                f"robots_seeded={daily.get('robots_seeded')}",
            )
        )
    except Exception as e:
        results.append(CheckResult(name="run-daily HTTP", ok=False, detail=str(e)))

    robots: list[dict] = []
    articles: list[dict] = []
    news: list[dict] = []

    try:
        status, robots = request_json(f"{api_base}/robots?limit=500")
        results.append(check(status == 200, "GET /robots", f"count={len(robots)}", f"status={status}"))
        results.append(check(len(robots) >= 200, "robots volume", f"count={len(robots)}", f"count={len(robots)}"))
    except Exception as e:
        results.append(CheckResult(name="GET /robots", ok=False, detail=str(e)))

    try:
        status, news = request_json(f"{api_base}/news")
        results.append(check(status == 200, "GET /news", f"count={len(news)}", f"status={status}"))
        results.append(check(len(news) > 0, "news volume", f"count={len(news)}", f"count={len(news)}"))
    except Exception as e:
        results.append(CheckResult(name="GET /news", ok=False, detail=str(e)))

    try:
        status, articles = request_json(f"{api_base}/articles")
        results.append(check(status == 200, "GET /articles", f"count={len(articles)}", f"status={status}"))
        results.append(check(len(articles) > 0, "articles volume", f"count={len(articles)}", f"count={len(articles)}"))
    except Exception as e:
        results.append(CheckResult(name="GET /articles", ok=False, detail=str(e)))

    frontend_process = None
    effective_frontend_base = frontend_base
    if not args.skip_build:
        try:
            completed = subprocess.run(
                ["npm", "run", "build"],
                cwd=args.frontend_dir,
                text=True,
                capture_output=True,
                check=False,
            )
            ok = completed.returncode == 0
            tail = (completed.stdout + "\n" + completed.stderr)[-1000:]
            results.append(check(ok, "frontend build", "npm run build passed", tail))
            if ok:
                frontend_process = subprocess.Popen(
                    ["npm", "run", "start", "--", "--port", str(args.serve_port)],
                    cwd=args.frontend_dir,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    text=True,
                )
                effective_frontend_base = f"http://localhost:{args.serve_port}"
                started = wait_until_up(f"{effective_frontend_base}/", seconds=45)
                results.append(
                    check(
                        started,
                        "frontend start",
                        f"next start ready at {effective_frontend_base}",
                        f"failed to start at {effective_frontend_base}",
                    )
                )
        except Exception as e:
            results.append(CheckResult(name="frontend build", ok=False, detail=str(e)))

    try:
        status, home = request_text(f"{effective_frontend_base}/")
        results.append(check(status == 200, "GET /", "status=200", f"status={status}"))
        results.append(check("<title>" in home and "Robot Portal" in home, "home title", "contains Robot Portal", "missing Robot Portal in title"))
    except Exception as e:
        results.append(CheckResult(name="GET /", ok=False, detail=str(e)))

    try:
        status, robots_page = request_text(f"{effective_frontend_base}/robots?page=2")
        results.append(check(status == 200, "GET /robots?page=2", "status=200", f"status={status}"))
        results.append(
            check(
                "Robot Database" in robots_page and "canonical" in robots_page,
                "robots SEO signals",
                "title/canonical present",
                "title/canonical missing",
            )
        )
    except Exception as e:
        results.append(CheckResult(name="GET /robots?page=2", ok=False, detail=str(e)))

    try:
        status, sitemap_xml = request_text(f"{effective_frontend_base}/sitemap.xml")
        results.append(check(status == 200, "GET /sitemap.xml", "status=200", f"status={status}"))
        results.append(check("/robots?" in sitemap_xml or "/robots/" in sitemap_xml, "sitemap robots URLs", "found", "not found"))
    except Exception as e:
        results.append(CheckResult(name="GET /sitemap.xml", ok=False, detail=str(e)))
        sitemap_xml = ""

    try:
        status, robots_txt = request_text(f"{effective_frontend_base}/robots.txt")
        results.append(check(status == 200, "GET /robots.txt", "status=200", f"status={status}"))
        results.append(
            check(
                "User-Agent: *" in robots_txt and "Sitemap:" in robots_txt,
                "robots.txt signals",
                "User-Agent and Sitemap present",
                "signals missing",
            )
        )
    except Exception as e:
        results.append(CheckResult(name="GET /robots.txt", ok=False, detail=str(e)))

    first_slug = ""
    if articles:
        first_slug = str(articles[0].get("slug") or "")
    if first_slug:
        encoded = urllib.parse.quote(first_slug, safe="")
        article_url = f"{effective_frontend_base}/article/{encoded}"
        try:
            status, article_html = request_text(article_url)
            results.append(check(status == 200, f"GET /article/{first_slug}", "status=200", f"status={status}"))
            canonical_match = re.search(r'rel="canonical"\s+href="([^"]+)"', article_html)
            canonical_ok = bool(canonical_match and f"/article/{encoded}" in canonical_match.group(1))
            results.append(check(canonical_ok, "article canonical", "canonical matches slug", "canonical mismatch"))
            results.append(
                check(
                    '"@type":"Article"' in article_html and '"@type":"BreadcrumbList"' in article_html,
                    "article JSON-LD",
                    "Article & BreadcrumbList present",
                    "missing JSON-LD",
                )
            )
            if sitemap_xml:
                results.append(
                    check(
                        f"/article/{encoded}" in sitemap_xml,
                        "sitemap article URL",
                        "article present in sitemap",
                        "article missing in sitemap",
                    )
                )
        except Exception as e:
            results.append(CheckResult(name=f"GET /article/{first_slug}", ok=False, detail=str(e)))
    else:
        results.append(CheckResult(name="article sample", ok=False, detail="no article slug found from /articles"))

    if frontend_process:
        frontend_process.terminate()

    print("=== Preflight Check Results ===")
    pass_count = 0
    for r in results:
        tag = "PASS" if r.ok else "FAIL"
        if r.ok:
            pass_count += 1
        print(f"[{tag}] {r.name} -> {r.detail}")
    total = len(results)
    print(f"Summary: {pass_count}/{total} passed")
    all_ok = all(r.ok for r in results)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(run())
