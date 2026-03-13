create extension if not exists "pgcrypto";

create table if not exists robots (
  id text primary key default gen_random_uuid()::text,
  name text unique not null,
  company text,
  category text,
  price numeric,
  release_year integer,
  description text,
  specs jsonb,
  image_url text,
  created_at timestamptz default now()
);

create table if not exists articles (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  slug text unique not null,
  content text not null,
  category text not null,
  seo_title text,
  meta_description text,
  source_url text,
  source_title text,
  created_at timestamptz default now()
);

create table if not exists news_sources (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  link text unique not null,
  source text,
  published_at timestamptz,
  summary text,
  summary_en text,
  category text,
  lang text,
  tags jsonb
);

alter table if exists news_sources add column if not exists summary text;
alter table if exists news_sources add column if not exists summary_en text;
alter table if exists news_sources add column if not exists category text;
alter table if exists news_sources add column if not exists lang text;
alter table if exists news_sources add column if not exists tags jsonb;

alter table if exists articles add column if not exists source_url text;
alter table if exists articles add column if not exists source_title text;

create table if not exists subscriptions (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  source text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  meta jsonb
);

create table if not exists leads (
  id text primary key default gen_random_uuid()::text,
  name text,
  email text not null,
  company text,
  message text,
  source text,
  page text,
  created_at timestamptz default now()
);

create table if not exists events (
  id text primary key default gen_random_uuid()::text,
  event text not null,
  source text,
  page text,
  meta jsonb,
  created_at timestamptz default now()
);
