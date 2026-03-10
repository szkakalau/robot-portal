import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, Header
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
        if self.client:
            self.client.table("articles").upsert(article, on_conflict="slug").execute()
            return
        for idx, a in enumerate(self._articles):
            if a.slug == article.get("slug"):
                self._articles[idx] = Article(**article)
                return
        self._articles.append(Article(**article))

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

store = DataStore()
app = FastAPI(title="Robot Portal API")

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

@app.post("/tasks/run-daily")
def run_daily(request: Request, x_task_token: Optional[str] = Header(default=None, alias="X-Task-Token")):
    secret = os.getenv("TASK_TOKEN")
    if secret:
        query_token = request.query_params.get("token")
        if x_task_token != secret and query_token != secret:
            raise HTTPException(status_code=403, detail="Forbidden")
    if not (run_news_pipeline and run_article_pipeline and run_robot_pipeline):
        raise HTTPException(status_code=503, detail="Pipelines unavailable")
    items = run_news_pipeline()
    news_upserted = store.upsert_news(items)
    topics = [it.get("title", "") for it in items[:10] if it.get("title")]
    for t in topics:
        art = run_article_pipeline(t)
        store.upsert_article(art)
    robots_seed = build_top200_robot_list() if build_top200_robot_list else []
    for r in robots_seed:
        robo = run_robot_pipeline(r)
        store.upsert_robot(robo)
    return {"ok": True, "news_upserted": news_upserted, "articles_attempted": len(topics), "robots_seeded": len(robots_seed)}
