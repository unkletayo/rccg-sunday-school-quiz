import subprocess
import sys
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

PIPELINE = [
    ("Scrape lessons",              "scrapper.py"),
    ("Generate quizzes (Gemini)",   "generate_quizzes.py"),
    ("Build quiz index",            "generate_index.py"),
    ("Generate Bible quizzes",      "generate_bible_quizzes.py"),
    ("Generate topics/memory data", "generate_topics_memory_data.py"),
]


def run_step(label, script):
    script_path = os.path.join(SCRIPTS_DIR, script)
    print(f"\n{'=' * 60}")
    print(f"▶  {label}")
    print(f"   {script}")
    print("=" * 60)
    result = subprocess.run([sys.executable, script_path])
    if result.returncode != 0:
        print(f"\n❌ Step failed: {label} (exit code {result.returncode})")
        sys.exit(result.returncode)
    print(f"✅ Done: {label}")


if __name__ == "__main__":
    print("🚀 Starting full pipeline...")
    for label, script in PIPELINE:
        run_step(label, script)
    print("\n🎉 All steps complete.")
