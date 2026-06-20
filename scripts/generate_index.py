import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import os
import json

questions_dir = "questions"
output_file = "quiz_index.json"

quizzes = []

for filename in sorted(os.listdir(questions_dir)):
    if filename.endswith(".json"):
        filepath = os.path.join(questions_dir, filename)
        with open(filepath, "r") as f:
            try:
                data = json.load(f)
                if "weeks" in data and len(data["weeks"]) > 0:
                    week_data = data["weeks"][0]
                    quizzes.append({
                        "week": week_data.get("week_number"),
                        "topic": week_data.get("topic"),
                        "filename": filename
                    })
            except Exception as e:
                print(f"Error reading {filename}: {e}")

quizzes.sort(key=lambda x: x["week"])

with open(output_file, "w") as f:
    json.dump(quizzes, f, indent=2)

print(f"Generated {output_file} with {len(quizzes)} quizzes.")
