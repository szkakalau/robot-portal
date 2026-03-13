import os
import hmac
import hashlib
import re
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Request, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import httpx

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
    summary: Optional[str] = None
    category: Optional[str] = None
    lang: Optional[str] = None
    tags: Optional[List[str]] = None

class Subscription(BaseModel):
    id: Optional[str] = None
    email: str
    source: Optional[str] = None
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    meta: Optional[dict] = None

class Lead(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    email: str
    company: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = None
    page: Optional[str] = None
    created_at: Optional[datetime] = None

class Event(BaseModel):
    id: Optional[str] = None
    event: str
    source: Optional[str] = None
    page: Optional[str] = None
    meta: Optional[dict] = None
    created_at: Optional[datetime] = None

class SubscriptionIn(BaseModel):
    email: str
    source: Optional[str] = None
    page: Optional[str] = None
    meta: Optional[dict] = None

class LeadIn(BaseModel):
    name: Optional[str] = None
    email: str
    company: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = None
    page: Optional[str] = None

class EventIn(BaseModel):
    event: str
    source: Optional[str] = None
    page: Optional[str] = None
    meta: Optional[dict] = None

class DataStore:
    def __init__(self):
        raw_url = os.getenv("SUPABASE_URL") or ""
        raw_key = os.getenv("SUPABASE_KEY") or ""
        self.supabase_url = raw_url.strip().rstrip("/") or None
        self.supabase_key = raw_key.strip() or None
        self.supabase_url_len = len(self.supabase_url or "")
        self.supabase_key_len = len(self.supabase_key or "")
        self.supabase_url_has_space = any(ch.isspace() for ch in (self.supabase_url or ""))
        self.supabase_key_has_space = any(ch.isspace() for ch in (self.supabase_key or ""))
        self.supabase_key_ascii = all(ord(ch) < 128 for ch in (self.supabase_key or ""))
        self.supabase_key_hash_prefix = hashlib.sha256((self.supabase_key or "").encode("utf-8", errors="ignore")).hexdigest()[:8] if self.supabase_key else None
        self.client: Optional[Client] = None
        self.client_error: Optional[str] = None
        self.client_error_detail: Optional[str] = None
        if self.supabase_url and not re.match(r"^https://.+\.supabase\.co$", self.supabase_url):
            self.client_error = "invalid_supabase_url"
            self.client_error_detail = "url_must_end_with_supabase.co"
        elif self.supabase_key and not re.match(r"^eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$", self.supabase_key):
            self.client_error = "invalid_supabase_key"
            self.client_error_detail = "key_must_be_service_role_jwt"
        elif self.supabase_url and self.supabase_key and create_client:
            try:
                self.client = create_client(self.supabase_url, self.supabase_key)
            except Exception as exc:
                self.client = None
                self.client_error = "create_client_failed"
                self.client_error_detail = type(exc).__name__
                self.client_error_message = str(exc)[:120]
        elif self.supabase_url and not self.supabase_key:
            self.client_error = "missing_supabase_key"
        elif self.supabase_key and not self.supabase_url:
            self.client_error = "missing_supabase_url"
        elif not create_client:
            self.client_error = "supabase_sdk_unavailable"
        self._robots: List[Robot] = []
        self._articles: List[Article] = []
        self._news: List[NewsItem] = []
        self._subscriptions: List[Subscription] = []
        self._leads: List[Lead] = []
        self._events: List[Event] = []
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

    def _normalize_email(self, email: str) -> str:
        return (email or "").strip().lower()

    def upsert_subscription(self, email: str, source: Optional[str], meta: Optional[dict]) -> Subscription:
        clean = self._normalize_email(email)
        now = datetime.utcnow()
        if self.client:
            payload = {
                "email": clean,
                "source": source,
                "active": True,
                "updated_at": now.isoformat(),
                "created_at": now.isoformat(),
                "meta": meta or {},
            }
            try:
                self.client.table("subscriptions").upsert(payload, on_conflict="email").execute()
            except Exception:
                pass
            return Subscription(email=clean, source=source, active=True, created_at=now, updated_at=now, meta=meta or {})
        existing = next((s for s in self._subscriptions if s.email == clean), None)
        if existing:
            existing.active = True
            existing.updated_at = now
            existing.source = source or existing.source
            existing.meta = meta or existing.meta
            return existing
        sub = Subscription(email=clean, source=source, active=True, created_at=now, updated_at=now, meta=meta or {})
        self._subscriptions.append(sub)
        return sub

    def unsubscribe(self, email: str) -> bool:
        clean = self._normalize_email(email)
        now = datetime.utcnow()
        if self.client:
            try:
                self.client.table("subscriptions").update({"active": False, "updated_at": now.isoformat()}).eq("email", clean).execute()
                return True
            except Exception:
                return False
        existing = next((s for s in self._subscriptions if s.email == clean), None)
        if not existing:
            return False
        existing.active = False
        existing.updated_at = now
        return True

    def list_active_subscribers(self) -> List[Subscription]:
        if self.client:
            try:
                data = self.client.table("subscriptions").select("*").eq("active", True).execute().data
                return [Subscription(**r) for r in data]
            except Exception:
                return []
        return [s for s in self._subscriptions if s.active]

    def record_lead(self, lead: Lead) -> None:
        if self.client:
            try:
                self.client.table("leads").insert({
                    "name": lead.name,
                    "email": lead.email,
                    "company": lead.company,
                    "message": lead.message,
                    "source": lead.source,
                    "page": lead.page,
                    "created_at": (lead.created_at or datetime.utcnow()).isoformat(),
                }).execute()
            except Exception:
                return
        self._leads.append(lead)

    def record_event(self, event: Event) -> None:
        if self.client:
            try:
                self.client.table("events").insert({
                    "event": event.event,
                    "source": event.source,
                    "page": event.page,
                    "meta": event.meta or {},
                    "created_at": (event.created_at or datetime.utcnow()).isoformat(),
                }).execute()
            except Exception:
                return
        self._events.append(event)

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
        if not items:
            return 0
        if self.client:
            for batch_start in range(0, len(items), 50):
                batch = items[batch_start:batch_start+50]
                try:
                    self.client.table("news_sources").upsert(batch).execute()
                except Exception:
                    minimal = [
                        {
                            "title": it.get("title"),
                            "link": it.get("link"),
                            "source": it.get("source"),
                            "published_at": it.get("published_at"),
                        }
                        for it in batch
                    ]
                    self.client.table("news_sources").upsert(minimal).execute()
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
auto_articles_seeded = False
auto_seeded_db = False

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
    from ai_system.pipelines.article_pipeline import run_article_pipeline, validate_article, run_article_pipeline_with_report
    from ai_system.pipelines.robot_pipeline import run_robot_pipeline
    from ai_system.data.top200_robots import build_top200_robot_list, CATEGORY_COMPANIES
except Exception:
    run_news_pipeline = None
    run_article_pipeline = None
    validate_article = None
    run_article_pipeline_with_report = None
    run_robot_pipeline = None
    build_top200_robot_list = None
    CATEGORY_COMPANIES = {}

HIGH_WEIGHT_SOURCES = {
    "IEEE Spectrum Robotics",
    "The Robot Report",
    "Robotics Business Review",
    "Robohub",
    "Singularity Hub Robotics",
    "MIT News Robotics",
    "IEEE T-RO",
    "IEEE RAM",
    "arXiv cs.RO",
    "arXiv cs.AI",
    "机器之心",
}

@app.get("/health")
def health():
    return {"ok": True}


def _subscribe_secret() -> str:
    return os.getenv("SUBSCRIBE_SECRET") or os.getenv("TASK_TOKEN") or "change-me"


def _sign_email(email: str) -> str:
    secret = _subscribe_secret().encode("utf-8")
    return hmac.new(secret, email.encode("utf-8"), hashlib.sha256).hexdigest()


def _unsubscribe_url(email: str) -> str:
    base = os.getenv("SITE_URL") or os.getenv("NEXT_PUBLIC_SITE_URL") or "http://localhost:3000"
    token = _sign_email(email)
    return f"{base}/unsubscribe?email={email}&token={token}"


def _valid_email(email: str) -> bool:
    if not email:
        return False
    return bool(re.match(r"^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", email))


def _table_count(table: str) -> int:
    if not store.client:
        if table == "robots":
            return len(store._robots)
        if table == "articles":
            return len(store._articles)
        if table == "news_sources":
            return len(store._news)
        return 0
    resp = store.client.table(table).select("id", count="exact").execute()
    count = getattr(resp, "count", None)
    if isinstance(count, int):
        return count
    return len(resp.data or [])


@app.get("/health/storage")
def health_storage():
    try:
        return {
            "ok": True,
            "using_supabase": bool(store.client),
            "supabase_url_set": bool(store.supabase_url),
            "supabase_key_set": bool(store.supabase_key),
            "client_error": store.client_error,
            "client_error_detail": store.client_error_detail,
            "supabase_url_prefix": (store.supabase_url or "")[:32],
            "supabase_url_len": store.supabase_url_len,
            "supabase_key_len": store.supabase_key_len,
            "supabase_url_has_space": store.supabase_url_has_space,
            "supabase_key_has_space": store.supabase_key_has_space,
            "supabase_key_ascii": store.supabase_key_ascii,
            "supabase_key_hash_prefix": store.supabase_key_hash_prefix,
            "client_error_message": getattr(store, "client_error_message", None),
            "counts": {
                "robots": _table_count("robots"),
                "articles": _table_count("articles"),
                "news": _table_count("news_sources"),
            },
        }
    except Exception as exc:
        return {
            "ok": False,
            "using_supabase": bool(store.client),
            "supabase_url_set": bool(store.supabase_url),
            "error": str(exc),
        }


@app.post("/subscriptions")
def create_subscription(payload: SubscriptionIn):
    email = (payload.email or "").strip().lower()
    if not _valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    meta = payload.meta or {}
    if payload.page:
        meta["page"] = payload.page
    sub = store.upsert_subscription(email=email, source=payload.source, meta=meta)
    return {"ok": True, "email": sub.email, "unsubscribe_url": _unsubscribe_url(sub.email)}


@app.get("/unsubscribe")
def unsubscribe(email: Optional[str] = None, token: Optional[str] = None):
    if not email or not token:
        raise HTTPException(status_code=400, detail="Missing parameters")
    clean = email.strip().lower()
    if not _valid_email(clean):
        raise HTTPException(status_code=400, detail="Invalid email")
    expected = _sign_email(clean)
    if not hmac.compare_digest(expected, token):
        raise HTTPException(status_code=403, detail="Invalid token")
    ok = store.unsubscribe(clean)
    if not ok:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"ok": True, "email": clean}


@app.post("/leads")
def create_lead(payload: LeadIn):
    email = (payload.email or "").strip().lower()
    if not _valid_email(email):
        raise HTTPException(status_code=400, detail="Invalid email")
    lead = Lead(
        name=payload.name,
        email=email,
        company=payload.company,
        message=payload.message,
        source=payload.source,
        page=payload.page,
        created_at=datetime.utcnow(),
    )
    store.record_lead(lead)
    return {"ok": True}


@app.post("/events")
def create_event(payload: EventIn):
    if not payload.event:
        raise HTTPException(status_code=400, detail="Missing event")
    event = Event(
        event=payload.event,
        source=payload.source,
        page=payload.page,
        meta=payload.meta or {},
        created_at=datetime.utcnow(),
    )
    store.record_event(event)
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
    global auto_seeded_db
    if store.client and not auto_seeded_db and build_top200_robot_list and run_robot_pipeline:
        auto_seeded_db = True
        _seed_robots()
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
def articles(background_tasks: BackgroundTasks):
    global auto_articles_seeded
    items = store.get_articles()
    if not store.client and not auto_articles_seeded and len(items) < 10:
        auto_articles_seeded = True
        background_tasks.add_task(_perform_daily, 10)
    return items

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


def _fallback_topics(limit: int) -> List[str]:
    date_tag = datetime.utcnow().strftime("%Y-%m-%d")
    base = [
        "Robot dog market update",
        "AI robot assistants for home",
        "Humanoid robots in warehouses",
        "Robot toys buying guide",
        "Personal robotics trends",
        "Robot vacuum comparison",
        "Robotics startups to watch",
        "Autonomous delivery robots",
        "Security robotics overview",
        "Industrial robotics automation",
    ]
    return [f"{topic} {date_tag}" for topic in base][:limit]


def _perform_daily(article_limit: Optional[int] = None) -> dict:
    if not (run_news_pipeline and run_article_pipeline and run_robot_pipeline):
        raise HTTPException(status_code=503, detail="Pipelines unavailable")
    errors: List[str] = []
    try:
        items = run_news_pipeline()
    except Exception as exc:
        items = []
        errors.append(f"news_pipeline:{type(exc).__name__}")
    try:
        news_upserted = store.upsert_news(items)
    except Exception as exc:
        news_upserted = 0
        errors.append(f"news_upsert:{type(exc).__name__}")
    limit = _clamp_int(str(article_limit) if article_limit is not None else os.getenv("DAILY_ARTICLE_LIMIT"), 10, 1, 10)
    attempt_mult = _clamp_int(os.getenv("DAILY_ARTICLE_ATTEMPT_MULT", "4"), 6, 1, 6)
    max_attempts = max(limit, limit * attempt_mult)
    topics = [it.get("title", "") for it in items if it.get("title")]
    if len(topics) < max_attempts:
        for topic in _fallback_topics(max_attempts):
            if len(topics) >= max_attempts:
                break
            if topic not in topics:
                topics.append(topic)
    attempted = 0
    succeeded = 0
    failed = 0
    failure_reasons: Dict[str, int] = {}
    for idx, t in enumerate(topics, start=1):
        if attempted >= max_attempts or succeeded >= limit:
            break
        attempted += 1
        report = None
        if run_article_pipeline_with_report:
            art, report = run_article_pipeline_with_report(t)
        else:
            art = run_article_pipeline(t)
        if validate_article and report is None:
            ok, reasons = validate_article(t, art)
            report = {"ok": ok, "attempts": 1, "reasons": reasons}
        if isinstance(report, dict) and not report.get("ok", True):
            failed += 1
            for reason in (report.get("reasons") or [])[:8]:
                failure_reasons[str(reason)] = failure_reasons.get(str(reason), 0) + 1
            continue
        slug = (art.get("slug") or "").strip()
        if not slug:
            slug = f"article-{datetime.utcnow().strftime('%Y%m%d')}-{idx}"
            art["slug"] = slug
        try:
            if store.has_article_slug(slug):
                date_tag = datetime.utcnow().strftime("%Y%m%d")
                attempt = 1
                new_slug = f"{slug}-{date_tag}-{attempt}"
                while store.has_article_slug(new_slug):
                    attempt += 1
                    new_slug = f"{slug}-{date_tag}-{attempt}"
                art["slug"] = new_slug
                slug = new_slug
            if not store.has_article_slug(slug):
                store.upsert_article(art)
                succeeded += 1
        except Exception as exc:
            failed += 1
            errors.append(f"article_upsert:{type(exc).__name__}")
    try:
        robots_seeded = _seed_robots()
    except Exception as exc:
        robots_seeded = 0
        errors.append(f"robots_seed:{type(exc).__name__}")
    success_rate = (succeeded / attempted) if attempted else 1.0
    top_failures = sorted(failure_reasons.items(), key=lambda it: it[1], reverse=True)[:8]
    return {
        "ok": True,
        "news_upserted": news_upserted,
        "articles_target": limit,
        "articles_attempted": attempted,
        "articles_succeeded": succeeded,
        "articles_failed": failed,
        "articles_shortfall": max(0, limit - succeeded),
        "article_success_rate": round(success_rate, 3),
        "article_failure_reasons": top_failures,
        "robots_seeded": robots_seeded,
        "errors": errors[:10],
    }


def _perform_daily_safe(article_limit: Optional[int] = None) -> None:
    try:
        _perform_daily(article_limit)
    except Exception:
        return


def _company_names() -> List[str]:
    names: List[str] = []
    for _, companies in (CATEGORY_COMPANIES or {}).items():
        names.extend(companies)
    return list(dict.fromkeys([n for n in names if n]))


def _guess_robot_from_title(title: str, companies: List[str]) -> Optional[dict]:
    if not title:
        return None
    lowered = title.lower()
    if "robot" not in lowered and not any(c.lower() in lowered for c in companies):
        return None
    core = title.split(":")[0].strip()
    tokens = re.findall(r"[A-Za-z0-9][A-Za-z0-9\-]+", core)
    if len(tokens) < 2:
        return None
    candidate = " ".join(tokens[:4]).strip()
    company = None
    for c in companies:
        if c.lower() in lowered:
            company = c
            break
    return {
        "name": candidate[:80],
        "company": company,
        "category": "robot",
        "description": core[:160],
        "specs": {"source": "rss"},
    }


def _is_high_weight_news(item: NewsItem) -> bool:
    source = (item.source or "").strip()
    if source in HIGH_WEIGHT_SOURCES:
        return True
    return False


def _perform_news_refresh() -> dict:
    if not run_news_pipeline:
        raise HTTPException(status_code=503, detail="News pipeline unavailable")
    items = run_news_pipeline()
    upserted = store.upsert_news(items)
    return {"ok": True, "news_upserted": upserted, "news_total": _table_count("news_sources")}


def _perform_news_refresh_safe() -> None:
    try:
        _perform_news_refresh()
    except Exception:
        return


def _perform_reviews_from_news(limit: Optional[int] = None) -> dict:
    if not (run_article_pipeline and run_article_pipeline_with_report):
        raise HTTPException(status_code=503, detail="Article pipeline unavailable")
    target = _clamp_int(str(limit) if limit is not None else os.getenv("NEWS_REVIEW_LIMIT"), 3, 1, 6)
    items = store.get_news()
    topics: List[str] = []
    seen = set()
    for n in items:
        if not _is_high_weight_news(n):
            continue
        title = (n.title or "").strip()
        if not title:
            continue
        key = title.lower()
        if key in seen:
            continue
        topics.append(title)
        seen.add(key)
        if len(topics) >= target:
            break
    attempted = 0
    succeeded = 0
    failed = 0
    reasons: Dict[str, int] = {}
    for idx, t in enumerate(topics, start=1):
        attempted += 1
        topic = f"{t} implications for robotics"
        art, report = run_article_pipeline_with_report(topic)
        if isinstance(report, dict) and not report.get("ok", True) and not report.get("skipped_validation"):
            failed += 1
            for reason in (report.get("reasons") or [])[:8]:
                reasons[str(reason)] = reasons.get(str(reason), 0) + 1
            continue
        art["category"] = "review"
        slug = (art.get("slug") or "").strip()
        if not slug:
            slug = f"review-{datetime.utcnow().strftime('%Y%m%d')}-{idx}"
            art["slug"] = slug
        if store.has_article_slug(slug):
            failed += 1
            reasons["duplicate_slug"] = reasons.get("duplicate_slug", 0) + 1
            continue
        store.upsert_article(art)
        succeeded += 1
    return {
        "ok": True,
        "reviews_target": target,
        "reviews_attempted": attempted,
        "reviews_succeeded": succeeded,
        "reviews_failed": failed,
        "review_failure_reasons": sorted(reasons.items(), key=lambda it: it[1], reverse=True)[:8],
    }


def _perform_reviews_from_news_safe(limit: Optional[int] = None) -> None:
    try:
        _perform_reviews_from_news(limit)
    except Exception:
        return


def _perform_robot_associations(limit: Optional[int] = None) -> dict:
    items = store.get_news()
    robots = store.get_robots(limit=500)
    by_name = {r.name.lower(): r for r in robots if r.name}
    companies = _company_names()
    updated = 0
    created = 0
    for n in items[: max(10, min(len(items), 200))]:
        title = (n.title or "").strip()
        link = n.link or ""
        lower = title.lower()
        matched = False
        for name, robot in by_name.items():
            if name and name in lower:
                specs = robot.specs or {}
                mentions = list(specs.get("mention_links") or [])
                if link and link not in mentions:
                    mentions = [link] + mentions[:4]
                    specs["mention_count"] = int(specs.get("mention_count") or 0) + 1
                specs["mention_links"] = mentions[:5]
                specs["last_mentioned_at"] = n.published_at or datetime.utcnow().isoformat()
                data = robot.dict()
                data["specs"] = specs
                store.upsert_robot(data)
                updated += 1
                matched = True
                break
        if matched:
            continue
        candidate = _guess_robot_from_title(title, companies)
        if not candidate:
            continue
        name = candidate.get("name", "")
        if not name or store.has_robot_name(name):
            continue
        store.upsert_robot(candidate)
        by_name[name.lower()] = Robot(**candidate)
        created += 1
    return {"ok": True, "robots_updated": updated, "robots_created": created}


def _perform_robot_associations_safe(limit: Optional[int] = None) -> None:
    try:
        _perform_robot_associations(limit)
    except Exception:
        return


def _seed_robots(target_count: Optional[int] = None) -> int:
    if not (build_top200_robot_list and run_robot_pipeline):
        return 0
    target = _clamp_int(
        str(target_count) if target_count is not None else os.getenv("ROBOT_TARGET_COUNT"),
        200,
        50,
        1000,
    )
    robots_seed = build_top200_robot_list(target)
    for r in robots_seed:
        robo = run_robot_pipeline(r)
        if not store.has_robot_name(robo.get("name", "")):
            store.upsert_robot(robo)
    return len(robots_seed)


def _perform_robot_enrichment(target_count: Optional[int] = None) -> dict:
    seeded = _seed_robots(target_count)
    return {
        "ok": True,
        "robots_seeded": seeded,
        "robots_total": _table_count("robots"),
    }


def _perform_robot_enrichment_safe(target_count: Optional[int] = None) -> None:
    try:
        _perform_robot_enrichment(target_count)
    except Exception:
        return


def _build_digest_payload(limit: int = 6) -> dict:
    base = os.getenv("SITE_URL") or os.getenv("NEXT_PUBLIC_SITE_URL") or "http://localhost:3000"
    articles = store.get_articles()[:limit]
    news = store.get_news()[:limit]
    return {
        "subject": "Mechaverses Weekly Robotics Digest",
        "preview": "Top reviews, new robots, and industry highlights.",
        "articles": [
            {
                "title": a.title,
                "url": f"{base}/article/{a.slug}",
                "summary": a.meta_description or ""
            }
            for a in articles
        ],
        "news": [
            {
                "title": n.title,
                "url": n.link,
                "source": n.source
            }
            for n in news
        ],
        "recipients": [
            {
                "email": s.email,
                "unsubscribe_url": _unsubscribe_url(s.email)
            }
            for s in store.list_active_subscribers()
        ],
    }


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
        try:
            return _perform_daily(_clamp_int(request.query_params.get("articles"), 5, 1, 10))
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_daily_safe, _clamp_int(request.query_params.get("articles"), 5, 1, 10))
    return {"ok": True, "queued": True}


@app.post("/tasks/run-news")
def run_news(
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
        try:
            return _perform_news_refresh()
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_news_refresh_safe)
    return {"ok": True, "queued": True}


@app.post("/tasks/run-reviews-from-news")
def run_reviews_from_news(
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
    limit = _clamp_int(request.query_params.get("limit"), 3, 1, 6)
    if sync:
        try:
            return _perform_reviews_from_news(limit)
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_reviews_from_news_safe, limit)
    return {"ok": True, "queued": True}


@app.post("/tasks/run-robot-associations")
def run_robot_associations(
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
        try:
            return _perform_robot_associations()
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_robot_associations_safe)
    return {"ok": True, "queued": True}


@app.post("/tasks/run-rss-cycle")
def run_rss_cycle(
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
        try:
            news = _perform_news_refresh()
            reviews = _perform_reviews_from_news()
            robots = _perform_robot_associations()
            return {"ok": True, "news": news, "reviews": reviews, "robots": robots}
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_news_refresh_safe)
    background_tasks.add_task(_perform_reviews_from_news_safe, None)
    background_tasks.add_task(_perform_robot_associations_safe, None)
    return {"ok": True, "queued": True}


@app.post("/tasks/send-digest")
def send_digest(
    request: Request,
    x_task_token: Optional[str] = Header(default=None, alias="X-Task-Token"),
):
    secret = os.getenv("TASK_TOKEN")
    if secret:
        query_token = request.query_params.get("token")
        if x_task_token != secret and query_token != secret:
            raise HTTPException(status_code=403, detail="Forbidden")
    webhook = os.getenv("DIGEST_WEBHOOK_URL")
    payload = _build_digest_payload()
    if not webhook:
        return {"ok": True, "sent": False, "reason": "missing_webhook", "recipients": len(payload.get("recipients", []))}
    try:
        with httpx.Client(timeout=30) as client:
            resp = client.post(webhook, json=payload)
            resp.raise_for_status()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Digest webhook failed: {exc}")
    return {"ok": True, "sent": True, "recipients": len(payload.get("recipients", []))}


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
    seeded = _seed_robots(_clamp_int(request.query_params.get("target"), 200, 50, 1000))
    return {"ok": True, "robots_seeded": seeded}


@app.post("/tasks/run-robots")
def run_robots(
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
    target = _clamp_int(request.query_params.get("target"), 200, 50, 1000)
    if sync:
        try:
            return _perform_robot_enrichment(target)
        except Exception as exc:
            return {"ok": False, "error": str(exc)[:200]}
    background_tasks.add_task(_perform_robot_enrichment_safe, target)
    return {"ok": True, "queued": True}


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
