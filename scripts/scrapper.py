import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md
from datetime import datetime, timedelta
from slugify import slugify
import os
import glob
import time

BASE_URL = "https://rccgonline.org/rccg-yaya-sunday-school-students-manual-{date}/"

START_DATE = datetime(2025, 9, 7)

# Find the most recent Sunday (or today if today is Sunday)
def get_most_recent_sunday():
    d = datetime.now()
    while d.weekday() != 6:  # Sunday = 6
        d -= timedelta(days=1)
    return d

END_DATE = get_most_recent_sunday()

OUTPUT_DIR = "lessons"
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_sundays(start, end):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=7)


def format_date_for_url(date):
    # Example: 7-september-2025
    return date.strftime("%-d-%B-%Y").lower()


def fetch_page(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code == 200:
            return res.text
        elif res.status_code == 403:
            print(f"❌ Failed: {url} (Blocked by server 403)")
        elif res.status_code == 429:
            print(f"❌ Failed: {url} (Rate limited 429)")
        else:
            print(f"❌ Failed: {url} (Status: {res.status_code})")
    except Exception as e:
        print(f"⚠️ Error: {url} -> {e}")
    return None


def extract_content(html):
    soup = BeautifulSoup(html, "html.parser")

    # Adjust selector if needed
    content = soup.find("div", class_="entry-content")

    if not content:
        print("⚠️ Content not found")
        return None

    return str(content)


def html_to_markdown(html):
    return md(html, heading_style="ATX")


def extract_title(html):
    soup = BeautifulSoup(html, "html.parser")
    title = soup.find("h1")
    return title.text.strip() if title else "Untitled"


def save_markdown(date, title, markdown):
    filename = f"{date.strftime('%Y-%m-%d')}-{slugify(title)}.md"
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n")
        f.write(markdown)

    print(f"✅ Saved: {filename}")


def main():
    for sunday in generate_sundays(START_DATE, END_DATE):
        date_prefix = sunday.strftime('%Y-%m-%d')
        existing_files = glob.glob(os.path.join(OUTPUT_DIR, f"{date_prefix}-*.md"))
        
        # Check if the file already exists and has real content (> 1000 bytes)
        if any(os.path.getsize(f) > 1000 for f in existing_files):
            print(f"⏭️ Skipping {date_prefix}: Already scraped")
            continue

        date_str = format_date_for_url(sunday)
        url = BASE_URL.format(date=date_str)

        print(f"🔎 Fetching: {url}")

        html = fetch_page(url)
        time.sleep(2)  # Pause for 2 seconds to prevent rate-limiting
        
        if not html:
            continue

        content_html = extract_content(html)
        if not content_html:
            continue

        markdown = html_to_markdown(content_html)
        title = extract_title(html)

        save_markdown(sunday, title, markdown)


if __name__ == "__main__":
    main()