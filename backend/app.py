import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

try:
    from supabase import create_client, Client
except Exception:
    create_client = None
    Client = None

class Robot(BaseModel):
    id: Optional[str] = None
    name: str
    company: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    release_year: Optional[int] = None
    description: Optional[str] = None
    specs: Optional[dict] = None
    image_url: Optional[str] = None
    created_at: Optional[datetime] = None

class Article(BaseModel):
    id: Optional[str] = None
    title: str
    slug: str
    content: str
    category: str
    seo_title: Optional[str] = None
    meta_description: Optional[str] = None
    created_at: Optional[datetime] = None

class NewsItem(BaseModel):
    id: Optional[str] = None
    title: str
    link: str
    source: Optional[str] = None
    published_at: Optional[str] = None

class DataStore:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.client: Optional[Client] = None
        if self.supabase_url and self.supabase_key and create_client:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
            except Exception:
                self.client = None
        self._robots: List[Robot] = []
        self._articles: List[Article] = []
        self._news: List[NewsItem] = []
        if not self.client:
            self._seed()

    def _seed(self):
        self._robots = [
            Robot(
                id="stub-1",
                name="Unitree Go2 Robot Dog",
                company="Unitree",
                category="robot dog",
                price=3999.0,
                release_year=2023,
                description="Agile quadruped robot",
                specs={"weight": "15kg"},
                image_url="https://example.com/go2.jpg",
                created_at=datetime.utcnow(),
            ),
            Robot(
                id="stub-2",
                name="Eilik Robot Companion",
                company="Energize Lab",
                category="companion",
                price=129.0,
                release_year=2022,
                description="Desktop companion robot",
                specs={"battery": "2h"},
                image_url="https://example.com/eilik.jpg",
                created_at=datetime.utcnow(),
            ),
        ]
        self._articles = [
            Article(
                id="a-1",
                title="Robotics Trends This Week",
                slug="robotics-trends-this-week",
                content="Stub content",
                category="news",
                seo_title="Latest Robotics News",
                meta_description="Weekly robotics trends",
                created_at=datetime.utcnow(),
            ),
            Article(
                id="r-1",
                title="Unitree Go2 Review: Consumer Quadruped Breakthrough",
                slug="unitree-go2-review",
                content="Overview\n\nDesign and mobility\n\nSpecs and pricing\n\nVerdict",
                category="review",
                seo_title="Unitree Go2 Review",
                meta_description="A focused review of Unitree Go2 with specs, pricing, and who it fits.",
                created_at=datetime.utcnow(),
            ),
            Article(
                id="r-2",
                title="Robot Vacuum Buying Guide: What Matters in 2026",
                slug="robot-vacuum-buying-guide-2026",
                content="Introduction\n\nNavigation and obstacle avoidance\n\nDocking and maintenance\n\nShortlist and recommendations",
                category="guide",
                seo_title="Robot Vacuum Buying Guide 2026",
                meta_description="Key criteria to choose the right robot vacuum in 2026.",
                created_at=datetime.utcnow(),
            ),
            Article(
                id="r-3",
                title="Humanoid Robots in Warehouses: ROI and Readiness",
                slug="humanoid-robots-warehouse-roi",
                content="Background\n\nCost structure\n\nDeployment risks\n\nReadiness checklist",
                category="review",
                seo_title="Humanoid Robots Warehouse ROI",
                meta_description="A review of warehouse humanoids with ROI drivers and readiness risks.",
                created_at=datetime.utcnow(),
            )
        ]
        self._news = [
            NewsItem(
                id="n-1",
                title="TechCrunch Robotics Update",
                link="https://techcrunch.com/robotics",
                source="TechCrunch",
                published_at=datetime.utcnow().isoformat(),
            )
        ]

    def _filter_robots(
        self,
        robots: List[Robot],
        category: Optional[str] = None,
        company: Optional[str] = None,
        q: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 200,
    ) -> List[Robot]:
        items = robots
        if category:
            items = [r for r in items if (r.category or "").lower() == category.lower()]
        if company:
            items = [r for r in items if (r.company or "").lower() == company.lower()]
        if q:
            qn = q.lower()
            items = [r for r in items if qn in (r.name or "").lower() or qn in (r.description or "").lower()]
        if min_price is not None:
            items = [r for r in items if r.price is not None and r.price >= min_price]
        if max_price is not None:
            items = [r for r in items if r.price is not None and r.price <= max_price]
        return items[: max(1, min(limit, 500))]

    def get_robots(
        self,
        category: Optional[str] = None,
        company: Optional[str] = None,
        q: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        limit: int = 200,
    ) -> List[Robot]:
        if self.client:
            data = self.client.table("robots").select("*").order("created_at", desc=True).execute().data
            robots = [Robot(**r) for r in data]
            return self._filter_robots(robots, category, company, q, min_price, max_price, limit)
        return self._filter_robots(self._robots, category, company, q, min_price, max_price, limit)

    def get_robot_by_name(self, name: str) -> Robot:
        if self.client:
            data = self.client.table("robots").select("*").eq("name", name).limit(1).execute().data
            if data:
                return Robot(**data[0])
            raise KeyError("not found")
        for r in self._robots:
            if r.name == name:
                return r
        raise KeyError("not found")

    def get_articles(self) -> List[Article]:
        if self.client:
            data = self.client.table("articles").select("*").order("created_at", desc=True).execute().data
            return [Article(**r) for r in data]
        return self._articles

    def _normalize_category(self, value: Optional[str]) -> str:
        text = (value or "").strip().lower()
        if text in {"review", "guide", "news"}:
            return text
        if "guide" in text:
            return "guide"
        if "news" in text:
            return "news"
        return "review"

    def has_article_slug(self, slug: str) -> bool:
        if self.client:
            data = self.client.table("articles").select("slug").eq("slug", slug).limit(1).execute().data
            return bool(data)
        return any(a.slug == slug for a in self._articles)

    def get_news(self) -> List[NewsItem]:
        if self.client:
            data = self.client.table("news_sources").select("*").order("published_at", desc=True).execute().data
            return [NewsItem(**r) for r in data]
        return self._news

    def get_article_by_slug(self, slug: str) -> Article:
        if self.client:
            data = self.client.table("articles").select("*").eq("slug", slug).single().execute().data
            if not data:
                raise KeyError("not found")
            return Article(**data)
        for a in self._articles:
            if a.slug == slug:
                return a
        raise KeyError("not found")

    def upsert_news(self, items: List[dict]) -> int:
        if self.client:
            for batch_start in range(0, len(items), 50):
                batch = items[batch_start:batch_start+50]
                self.client.table("news_sources").upsert(batch).execute()
            return len(items)
        before = len(self._news)
        for it in items:
            exists = any(n.link == it.get("link") for n in self._news)
            if not exists:
                self._news.append(NewsItem(**it))
        return len(self._news) - before

    def upsert_article(self, article: dict) -> None:
        article["category"] = self._normalize_category(article.get("category"))
        if self.client:
            self.client.table("articles").upsert(article, on_conflict="slug").execute()
            return
        for idx, a in enumerate(self._articles):
            if a.slug == article.get("slug"):
                self._articles[idx] = Article(**article)
                return
        self._articles.append(Article(**article))

    def has_robot_name(self, name: str) -> bool:
        if self.client:
            data = self.client.table("robots").select("name").eq("name", name).limit(1).execute().data
            return bool(data)
        return any(r.name == name for r in self._robots)

    def upsert_robot(self, robot: dict) -> None:
        if self.client:
            self.client.table("robots").upsert(robot, on_conflict="name").execute()
            return
        names = [r.name for r in self._robots]
        if robot.get("name") in names:
            i = names.index(robot["name"])
            self._robots[i] = Robot(**robot)
        else:
            self._robots.append(Robot(**robot))

    def cleanup_seed(self) -> dict:
        seed_robot_ids = ["stub-1", "stub-2"]
        seed_article_ids = ["a-1", "r-1", "r-2", "r-3"]
        seed_news_ids = ["n-1"]
        removed = {"robots": 0, "articles": 0, "news": 0}
        if self.client:
            if seed_robot_ids:
                self.client.table("robots").delete().in_("id", seed_robot_ids).execute()
                removed["robots"] = len(seed_robot_ids)
            if seed_article_ids:
                self.client.table("articles").delete().in_("id", seed_article_ids).execute()
                removed["articles"] = len(seed_article_ids)
            if seed_news_ids:
                self.client.table("news_sources").delete().in_("id", seed_news_ids).execute()
                removed["news"] = len(seed_news_ids)
            return removed
        before_r = len(self._robots)
        before_a = len(self._articles)
        before_n = len(self._news)
        self._robots = [r for r in self._robots if r.id not in seed_robot_ids]
        self._articles = [a for a in self._articles if a.id not in seed_article_ids]
        self._news = [n for n in self._news if n.id not in seed_news_ids]
        removed["robots"] = before_r - len(self._robots)
        removed["articles"] = before_a - len(self._articles)
        removed["news"] = before_n - len(self._news)
        return removed

store = DataStore()
app = FastAPI(title="Robot Portal API")
auto_seeded = False

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*")
origins = [o.strip() for o in allowed_origins.split(",")] if allowed_origins else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    from ai_system.pipelines.news_pipeline import run_news_pipeline
    from ai_system.pipelines.article_pipeline import run_article_pipeline
    from ai_system.pipelines.robot_pipeline import run_robot_pipeline
    from ai_system.data.top200_robots import build_top200_robot_list
except Exception:
    run_news_pipeline = None
    run_article_pipeline = None
    run_robot_pipeline = None
    build_top200_robot_list = None

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/robots", response_model=List[Robot])
def robots(
    category: Optional[str] = None,
    company: Optional[str] = None,
    q: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 200,
):
    global auto_seeded
    if not store.client and not auto_seeded and build_top200_robot_list and run_robot_pipeline:
        auto_seeded = True
        robots_seed = build_top200_robot_list()
        for r in robots_seed:
            robo = run_robot_pipeline(r)
            if not store.has_robot_name(robo.get("name", "")):
                store.upsert_robot(robo)
    return store.get_robots(category=category, company=company, q=q, min_price=min_price, max_price=max_price, limit=limit)

@app.get("/robot/by-name/{name}", response_model=Robot)
def robot_by_name(name: str):
    try:
        return store.get_robot_by_name(name)
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found")

@app.get("/articles", response_model=List[Article])
def articles():
    return store.get_articles()

@app.get("/news", response_model=List[NewsItem])
def news():
    return store.get_news()

@app.get("/article/{slug}", response_model=Article)
def article(slug: str):
    try:
        return store.get_article_by_slug(slug)
    except KeyError:
        raise HTTPException(status_code=404, detail="Not found")

def _clamp_int(value: Optional[str], default: int, minimum: int, maximum: int) -> int:
    try:
        parsed = int(value or default)
    except Exception:
        parsed = default
    return max(minimum, min(maximum, parsed))


def _perform_daily(article_limit: Optional[int] = None) -> dict:
    if not (run_news_pipeline and run_article_pipeline and run_robot_pipeline):
        raise HTTPException(status_code=503, detail="Pipelines unavailable")
    items = run_news_pipeline()
    news_upserted = store.upsert_news(items)
    limit = _clamp_int(str(article_limit) if article_limit is not None else os.getenv("DAILY_ARTICLE_LIMIT"), 10, 1, 10)
    topics = [it.get("title", "") for it in items[:limit] if it.get("title")]
    for t in topics:
        art = run_article_pipeline(t)
        if not store.has_article_slug(art.get("slug", "")):
            store.upsert_article(art)
    robots_seeded = _seed_robots()
    return {"ok": True, "news_upserted": news_upserted, "articles_attempted": len(topics), "robots_seeded": robots_seeded}


def _seed_robots() -> int:
    if not (build_top200_robot_list and run_robot_pipeline):
        return 0
    robots_seed = build_top200_robot_list()
    for r in robots_seed:
        robo = run_robot_pipeline(r)
        if not store.has_robot_name(robo.get("name", "")):
            store.upsert_robot(robo)
    return len(robots_seed)


@app.post("/tasks/run-daily")
def run_daily(
    request: Request,
    background_tasks: BackgroundTasks,
    x_task_token: Optional[str] = Header(default=None, alias="X-Task-Token"),
):
    secret = os.getenv("TASK_TOKEN")
    if secret:
        query_token = request.query_params.get("token")
        if x_task_token != secret and query_token != secret:
            raise HTTPException(status_code=403, detail="Forbidden")
    sync = request.query_params.get("sync") == "1"
    if sync:
        return _perform_daily(_clamp_int(request.query_params.get("articles"), 5, 1, 10))
    background_tasks.add_task(_perform_daily, _clamp_int(request.query_params.get("articles"), 5, 1, 10))
    return {"ok": True, "queued": True}


@app.post("/tasks/seed-robots")
def seed_robots(
    request: Request,
    x_task_token: Optional[str] = Header(default=None, alias="X-Task-Token"),
):
    secret = os.getenv("TASK_TOKEN")
    if secret:
        query_token = request.query_params.get("token")
        if x_task_token != secret and query_token != secret:
            raise HTTPException(status_code=403, detail="Forbidden")
    seeded = _seed_robots()
    return {"ok": True, "robots_seeded": seeded}


@app.post("/tasks/cleanup-seed")
def cleanup_seed(
    request: Request,
    x_task_token: Optional[str] = Header(default=None, alias="X-Task-Token"),
):
    secret = os.getenv("TASK_TOKEN")
    if secret:
        query_token = request.query_params.get("token")
        if x_task_token != secret and query_token != secret:
            raise HTTPException(status_code=403, detail="Forbidden")
    removed = store.cleanup_seed()
    return {"ok": True, "removed": removed}
