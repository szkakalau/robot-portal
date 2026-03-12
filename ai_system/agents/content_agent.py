import os
import httpx
import re
from typing import Dict

def build_prompt(topic: str) -> str:
    return f"""Write a long-form, SEO-optimized robotics article in English.

Topic: {topic}

Requirements:

- Length: about 2000 words
- Use Markdown headings: H2 as "## Heading", H3 as "### Heading"
- Include the main keyword in the title, first paragraph, and at least one H2
- Output format:
  - Line 1: Title only (no "Title:" prefix)
  - Line 2+: One concise summary paragraph (120-160 words), no heading
  - Then the body with multiple H2/H3 sections
- Use short paragraphs and varied sentence length for readability
- Cite real companies, products, and market context
- End with:
  - "## Conclusion"
  - "## Key Takeaways" with 3-5 bullet points
  - "## FAQ" with 3-5 questions formatted as "### Q: ..." followed by "A: ..."

Style:
- Professional, authoritative, and factual
- Written for a technology news site audience
"""

def clean_title(value: str) -> str:
    text = re.sub(r"^\s*title\s*:\s*", "", value, flags=re.IGNORECASE)
    text = text.replace("**", "").strip()
    return re.sub(r"\s+", " ", text)

def clean_content(value: str) -> str:
    text = value.replace("**", "")
    lines = [line for line in text.splitlines() if line.strip()]
    if lines and re.match(r"^\s*title\s*:\s*", lines[0], flags=re.IGNORECASE):
        lines = lines[1:]
    return "\n".join(lines).strip()

def classify_category(value: str) -> str:
    text = (value or "").lower()
    guide_keywords = ["guide", "how to", "how", "best", "tips", "buying", "review", "comparison", "vs", "price"]
    news_keywords = ["funding", "raises", "launch", "partnership", "announces", "report", "trends", "investment", "acquires"]
    if any(k in text for k in guide_keywords):
        return "guide"
    if any(k in text for k in news_keywords):
        return "news"
    return "review"

def generate_article(topic: str) -> Dict:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    api_base = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    prompt = build_prompt(topic)
    if not api_key:
        content = clean_content(f"Article about {topic}.")
        title = clean_title(f"{topic} Insights")
        slug = topic.lower().replace(" ", "-")[:80]
        return {"title": title, "slug": slug, "content": content, "category": classify_category(topic)}
    try:
        url = f"{api_base}/chat/completions"
        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        payload = {
            "model": os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        with httpx.Client(timeout=60) as client:
            r = client.post(url, headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            text = data["choices"][0]["message"]["content"]
            raw_title = text.splitlines()[0].strip("# ").strip()[:120] or f"{topic} Article"
            title = clean_title(raw_title)
            text = clean_content(text)
            slug = "-".join(re.findall(r"[a-z0-9]+", title.lower()))[:80]
            return {"title": title, "slug": slug, "content": text, "category": classify_category(f"{title} {topic}")}
    except Exception:
        content = clean_content(f"Article about {topic}.")
        title = clean_title(f"{topic} Insights")
        slug = topic.lower().replace(" ", "-")[:80]
        return {"title": title, "slug": slug, "content": content, "category": classify_category(topic)}
