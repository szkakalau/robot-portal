import os
import httpx
import re
from typing import Dict

def build_prompt(topic: str) -> str:
    return f"""Write a professional robotics article.

Topic: {topic}

Structure:

Title
Introduction
Main sections
Conclusion

Length:
1500-2000 words

Style:
Technology news website.

Include examples of robotics companies and products."""

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

def generate_article(topic: str) -> Dict:
    api_key = os.getenv("DEEPSEEK_API_KEY")
    api_base = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com")
    prompt = build_prompt(topic)
    if not api_key:
        content = clean_content(f"Article about {topic}.")
        title = clean_title(f"{topic} Insights")
        slug = topic.lower().replace(" ", "-")[:80]
        return {"title": title, "slug": slug, "content": content, "category": "review"}
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
            slug = "-".join(title.lower().split())[:80]
            return {"title": title, "slug": slug, "content": text, "category": "review"}
    except Exception:
        content = clean_content(f"Article about {topic}.")
        title = clean_title(f"{topic} Insights")
        slug = topic.lower().replace(" ", "-")[:80]
        return {"title": title, "slug": slug, "content": content, "category": "review"}
