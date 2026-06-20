import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from datetime import datetime, timedelta
from slugify import slugify
import os
import time
import random

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

BASE_URL = "https://rccgonline.org/rccg-yaya-sunday-school-students-manual-{date}/"

START_DATE = datetime(2025, 9, 7)

OUTPUT_DIR = "sunday_school_lessons"
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_CONSECUTIVE_FAILURES = 5

session = requests.Session()

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


# ─────────────────────────────────────────────
# DATE HELPERS
# ─────────────────────────────────────────────

def generate_sundays(start):
    current = start
    while True:
        yield current
        current += timedelta(days=7)


def format_date_for_url(date):
    return f"{date.day}-{date.strftime('%B').lower()}-{date.year}"


# ─────────────────────────────────────────────
# FETCH
# ─────────────────────────────────────────────

def fetch_page(url, retries=3):
    for attempt in range(retries):
        try:
            res = session.get(url, headers=HEADERS, timeout=15)

            print(f"Status: {res.status_code}")

            if res.status_code == 200:
                time.sleep(random.uniform(1, 2))
                return res.text

        except Exception as e:
            print(f"⚠️ Error: {e}")

        time.sleep(2)

    return None


# ─────────────────────────────────────────────
# EXTRACT CONTENT
# ─────────────────────────────────────────────

def extract_content(html):
    soup = BeautifulSoup(html, "html.parser")

    selectors = [
        ("div", "entry-content"),
        ("div", "td-post-content"),
        ("div", "post-content"),
        ("article", None),
    ]

    for tag, cls in selectors:
        if cls:
            content = soup.find(tag, class_=cls)
        else:
            content = soup.find(tag)

        if content:
            text = content.get_text(separator=" ", strip=True)

            # ── smarter validation ──
            keywords = ["lesson", "memory verse", "bible", "text", "study"]

            if len(text) > 150 and any(k in text.lower() for k in keywords):
                return str(content)

    return None


# ─────────────────────────────────────────────
# TITLE
# ─────────────────────────────────────────────

def extract_title(html):
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    return h1.text.strip() if h1 else "Untitled"


# ─────────────────────────────────────────────
# CONVERT
# ─────────────────────────────────────────────

def html_to_markdown(html):
    return md(html, heading_style="ATX")


# ─────────────────────────────────────────────
# SAVE
# ─────────────────────────────────────────────

def save_markdown(date, title, markdown):
    filename = f"{date.strftime('%Y-%m-%d')}-{slugify(title)}.md"
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(markdown)

    print(f"✅ Saved: {filename}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    fail_count = 0

    for sunday in generate_sundays(START_DATE):
        url = BASE_URL.format(date=format_date_for_url(sunday))

        print(f"\n🔎 Fetching: {url}")

        html = fetch_page(url)

        if not html:
            fail_count += 1
            if fail_count >= MAX_CONSECUTIVE_FAILURES:
                print("\n🛑 Stopping — likely end of published lessons.")
                break
            continue

        content_html = extract_content(html)

        if not content_html:
            print("⚠️ No valid lesson content found")
            fail_count += 1
            continue

        markdown = html_to_markdown(content_html)

        title = extract_title(html)

        save_markdown(sunday, title, markdown)

        fail_count = 0  # reset on success


if __name__ == "__main__":
    main()