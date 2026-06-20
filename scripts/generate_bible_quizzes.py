import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import os
import re
import json
import random
import glob
import time
import urllib.request
import ssl

LESSONS_DIR = "lessons"
OUTPUT_DIR = "bible_questions"
INDEX_FILE = "bible_quiz_index.json"
CACHE_FILE = "scripts/bible_api_cache.json"

BIBLE_REF_REGEX = re.compile(r'\b(?:[1-3]\s+)?[A-Z][a-z\s]+\s+\d+:\d+(?:-\d+)?(?:,\s*\d+(?:-\d+)?)?\b')

if os.path.exists(CACHE_FILE):
    with open(CACHE_FILE, 'r') as f:
        cache = json.load(f)
else:
    cache = {}

def save_cache():
    with open(CACHE_FILE, 'w') as f:
        json.dump(cache, f)

def fetch_verse_api(ref):
    ref_clean = ref.strip('.,;)"\' ')
    if ref_clean in cache and cache[ref_clean] is not None:
        return cache[ref_clean]
        
    match = re.match(r'((?:[1-3]\s+)?[A-Za-z\s]+)\s+(\d+):(\d+)', ref_clean)
    if not match:
        cache[ref_clean] = None
        return None
        
    book = match.group(1).strip().lower().replace(" ", "-")
    
    # Comprehensive map of common Bible abbreviations and normalizations
    abbrev_map = {
        "gen": "genesis", "exo": "exodus", "exod": "exodus", "lev": "leviticus",
        "num": "numbers", "deut": "deuteronomy", "jos": "joshua", "josh": "joshua",
        "judg": "judges", "1sam": "1samuel", "1-sam": "1samuel", "2sam": "2samuel",
        "2-sam": "2samuel", "samuel": "1samuel", "1kgs": "1kings", "1-kgs": "1kings", "1-ki": "1kings",
        "2kgs": "2kings", "2-kgs": "2kings", "2-ki": "2kings", "kings": "1kings", "1chr": "1chronicles",
        "1-chron": "1chronicles", "2chr": "2chronicles", "2-chron": "2chronicles", "chronicles": "1chronicles",
        "ezr": "ezra", "neh": "nehemiah", "est": "esther", "esth": "esther",
        "ps": "psalms", "psalm": "psalms", "prov": "proverbs", "proverb": "proverbs",
        "eccl": "ecclesiastes", "song": "song-of-solomon", "isa": "isaiah",
        "jer": "jeremiah", "lam": "lamentations", "ezek": "ezekiel", "dan": "daniel",
        "hos": "hosea", "obad": "obadiah", "jon": "jonah", "mic": "micah",
        "nah": "nahum", "hab": "habakkuk", "zeph": "zephaniah", "hag": "haggai",
        "zech": "zechariah", "mal": "malachi", "matt": "matthew", "mat": "matthew",
        "mrk": "mark", "mar": "mark", "luk": "luke", "jhn": "john", "joh": "john",
        "act": "acts", "rom": "romans", "1cor": "1corinthians", "1-cor": "1corinthians",
        "2cor": "2corinthians", "2-cor": "2corinthians", "gal": "galatians",
        "eph": "ephesians", "phil": "philippians", "col": "colossians",
        "corinthians": "1corinthians",
        "1thess": "1thessalonians", "1-thess": "1thessalonians",
        "2thess": "2thessalonians", "2-thess": "2thessalonians",
        "thessalonians": "1thessalonians",
        "1tim": "1timothy", "1-tim": "1timothy", "2tim": "2timothy", "2-tim": "2timothy",
        "timothy": "1timothy",
        "tit": "titus", "phlm": "philemon", "heb": "hebrews", "jas": "james",
        "1pet": "1peter", "1-pet": "1peter", "2pet": "2peter", "2-pet": "2peter",
        "peter": "1peter",
        "1jhn": "1john", "1-joh": "1john", "1-jn": "1john",
        "2jhn": "2john", "2-joh": "2john", "2-jn": "2john",
        "3jhn": "3john", "3-joh": "3john", "3-jn": "3john",
        "rev": "revelation", "revelations": "revelation"
    }
    
    if book in abbrev_map:
        book = abbrev_map[book]
    elif book and book[0].isdigit():
        book = book.replace("-", "")
        
    chap = match.group(2)
    verse = match.group(3)
    
    # Switch to raw.githubusercontent.com and use the 'main' branch
    url = f"https://raw.githubusercontent.com/wldeh/bible-api/main/bibles/en-kjv/books/{book}/chapters/{chap}/verses/{verse}.json"
    
    # Bypass SSL verification for macOS Python installations
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx) as response:
            data = json.loads(response.read().decode())
            text = data.get('text', '').strip()
            text = " ".join(text.split())
            if text:
                cache[ref_clean] = text
                print(f"Fetched: {ref_clean}")
                time.sleep(0.1) # be nice to the CDN
                return text
    except Exception as e:
        print(f"Failed to fetch {ref_clean} from {url}: {e}")
        
    # Do not cache None on failure so we can retry on next run
    return None

def blank_out_words(text):
    words = text.split()
    if len(words) < 4:
        return text, []
    
    candidates = [i for i, w in enumerate(words) if len(w.strip('.,;:"\'()')) >= 4]
    if not candidates:
        candidates = list(range(len(words)))
    
    num_to_blank = min(3, len(candidates))
    to_blank = random.sample(candidates, num_to_blank)
    
    answers = []
    for i in sorted(to_blank):
        word = words[i]
        clean_word = word.strip('.,;:"\'()')
        answers.append(clean_word)
        words[i] = word.replace(clean_word, "_____")
        
    return " ".join(words), answers

def process_file(filepath, date_week_map=None):
    with open(filepath, 'r') as f:
        content = f.read()

    topic_match = re.search(r'TOPIC:\s*(.+)', content)
    topic = topic_match.group(1).strip() if topic_match else "Unknown Topic"

    # Handle: "LESSON ONE (01)", "LESSON: FIVE (05)", "LESSON FORTY ONE (41)"
    week_match = re.search(r'LESSON:?\s+[A-Z][A-Z\s-]*\s*\((\d+)\)', content)
    week_num = int(week_match.group(1)) if week_match else 0

    # Fallback: look up week by date from general quiz_index
    if week_num == 0 and date_week_map:
        basename = os.path.basename(filepath)
        date_prefix = "-".join(basename.split("-")[:3])
        if date_prefix in date_week_map:
            week_num = date_week_map[date_prefix]
    
    raw_refs = BIBLE_REF_REGEX.findall(content)
    refs = list(set([r.strip() for r in raw_refs]))
    
    questions = []
    q_index = 1
    
    for ref in refs:
        text = fetch_verse_api(ref)
        if not text:
            continue
            
        # Generate: Where is this verse found?
        options = [ref]
        parts = ref.split()
        if len(parts) >= 2 and ':' in parts[-1]:
            book = " ".join(parts[:-1])
            chap_verse = parts[-1]
            try:
                chap, verse = chap_verse.split(':')
                v_num = int(verse.split('-')[0])
                options.append(f"{book} {chap}:{v_num+1}")
                options.append(f"{book} {int(chap)+1}:{v_num}")
                options.append(f"{book} {chap}:{v_num-1 if v_num>1 else v_num+2}")
            except:
                pass
                
        while len(options) < 4:
            options.append(f"Another book {random.randint(1,5)}:{random.randint(1,20)}")
            
        options = list(set(options))
        while len(options) < 4:
            options.append(f"Distractor {random.randint(10,99)}")
            
        random.shuffle(options)
        answer_letter = chr(65 + options.index(ref))
        opt_strings = [f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)]
        
        questions.append({
            "id": f"BW{week_num}Q{q_index}",
            "week": week_num,
            "category": "bible_reference",
            "difficulty": "medium",
            "type": "multiple_choice",
            "question": f"Where is this verse found? '{text}'",
            "options": opt_strings,
            "answer": answer_letter,
            "explanation": f"The verse '{text}' is found in {ref}.",
            "source_section": ref
        })
        q_index += 1
        
        # Generate: Fill in the blank
        blanked_text, missing_words = blank_out_words(text)
        if missing_words:
            questions.append({
                "id": f"BW{week_num}Q{q_index}",
                "week": week_num,
                "category": "bible_memorization",
                "difficulty": "hard",
                "type": "free_text",
                "question": f"Fill in the blanks for {ref}:\n{blanked_text}",
                "answer": ", ".join(missing_words),
                "keywords": missing_words,
                "explanation": f"The full text is: {text}",
                "source_section": ref
            })
            q_index += 1
            
    if not questions:
        return None

    basename = os.path.basename(filepath)
    date_prefix = "-".join(basename.split("-")[:3])
    out_filename = f"{date_prefix}-bible-lesson-{week_num:02d}.json"
    
    quiz_data = {
      "quiz_title": "Bible Mastery Quiz",
      "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
      "weeks": [
        {
          "week_number": week_num,
          "topic": topic,
          "questions": questions
        }
      ]
    }
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(OUTPUT_DIR, out_filename)
    with open(out_path, 'w') as f:
        json.dump(quiz_data, f, indent=2)
        
    return {
        "week": week_num,
        "topic": topic,
        "filename": out_filename
    }

def main():
    print(f"Starting Bible Quiz generation using API (https://cdn.jsdelivr.net/gh/wldeh/bible-api)...")

    # Build date → week fallback from general quiz_index
    date_week_map = {}
    general_index = "quiz_index.json"
    if os.path.exists(general_index):
        with open(general_index) as f:
            for entry in json.load(f):
                date_prefix = "-".join(entry["filename"].split("-")[:3])
                date_week_map[date_prefix] = entry["week"]

    index_data = []
    files = sorted(glob.glob(os.path.join(LESSONS_DIR, "*.md")))
    for i, file in enumerate(files):
        print(f"Processing {file} ({i+1}/{len(files)})")
        meta = process_file(file, date_week_map)
        if meta and meta['week'] > 0:
            index_data.append(meta)
            
    index_data.sort(key=lambda x: x["week"])
    os.makedirs(os.path.dirname(INDEX_FILE), exist_ok=True)
    with open(INDEX_FILE, 'w') as f:
        json.dump(index_data, f, indent=2)
        
    save_cache()
    print(f"Done! Generated {len(index_data)} Bible quizzes. Index saved to {INDEX_FILE}")

if __name__ == "__main__":
    main()
