import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../..'))
import os
import glob
import re
import json

LESSONS_DIR = "lessons"
OUTPUT_FILE = "quiz-app/topics_memory_data.json"

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Match Topic
    topic_match = re.search(r'TOPIC:\s*(.+)', content)
    topic = topic_match.group(1).strip() if topic_match else "Unknown Topic"

    # Match Week Number — handles "LESSON ONE (01)", "LESSON: FIVE (05)", "LESSON FORTY ONE (41)"
    week_match = re.search(r'LESSON:?\s+[A-Z][A-Z\s-]*\s*\((\d+)\)', content)
    week_num = int(week_match.group(1)) if week_match else 0

    # Match Memory Verse
    mv_text = "Unknown Text"
    mv_ref = "Unknown Ref"

    # Standard format: MEMORY VERSE: “text” Ref.
    mv_match = re.search(r'MEMORY VERSE:\s*[“"”](.+?)[“"”]\s*(.+?)\.', content, re.IGNORECASE)
    
    if mv_match:
        mv_text = mv_match.group(1).strip()
        mv_ref = mv_match.group(2).strip()
    else:
        # Fallback if quotes are missing or malformed
        mv_match_fallback = re.search(r'MEMORY VERSE:\s*(.+)', content, re.IGNORECASE)
        if mv_match_fallback:
            raw = mv_match_fallback.group(1).strip()
            # Try to split by the last quote
            if '”' in raw:
                parts = raw.rsplit('”', 1)
                mv_text = parts[0].strip('“"” ')
                mv_ref = parts[1].strip('. ')
            elif '"' in raw:
                parts = raw.rsplit('"', 1)
                mv_text = parts[0].strip('“"” ')
                mv_ref = parts[1].strip('. ')
            else:
                # Can't easily separate text from ref
                mv_text = raw
                mv_ref = ""
                
    # Clean up the reference (remove trailing (KJV), (NKJV), etc.)
    mv_ref = re.sub(r'\s*\([A-Z]+\)$', '', mv_ref).strip()

    return {
        "week": week_num,
        "topic": topic,
        "memory_verse_text": mv_text,
        "memory_verse_ref": mv_ref
    }

def main():
    files = sorted(glob.glob(os.path.join(LESSONS_DIR, "*.md")))
    data = []

    for file in files:
        res = process_file(file)
        if res['week'] > 0:
            data.append(res)
            
    # Sort by week
    data = sorted(data, key=lambda x: x['week'])

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(data, f, indent=4)

    print(f"Successfully generated {OUTPUT_FILE} with {len(data)} weeks of data.")

if __name__ == "__main__":
    main()
