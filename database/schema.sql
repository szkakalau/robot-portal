create table if not exists robots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  category text,
  price numeric,
  release_year int,
  description text,
  specs jsonb,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content text not null,
  category text not null,
  seo_title text,
  meta_description text,
  created_at timestamptz not null default now()
);

create index if not exists articles_slug_idx on articles(slug);
create index if not exists articles_category_idx on articles(category);

create table if not exists news_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  link text not null,
  source text,
  published_at timestamptz
);

create index if not exists news_sources_published_idx on news_sources(published_at);
