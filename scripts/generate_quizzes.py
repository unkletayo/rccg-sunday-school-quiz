import os; os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import os
import glob
import time
import json
from google import genai
from google.genai import types

# To use this script, you MUST set your API key as an environment variable:
# export GEMINI_API_KEY="your_api_key_here"

# Initialize the Gemini client
client = genai.Client()

def process_lessons():
    os.makedirs("questions", exist_ok=True)
    
    # Read the master prompt we saved earlier
    with open("master_prompt.txt", "r", encoding="utf-8") as f:
        master_prompt = f.read()

    lesson_files = sorted(glob.glob("lessons/*.md"))
    week_counter = 1
    
    for file_path in lesson_files:
        basename = os.path.basename(file_path)
        # Extract the date part (first 10 chars, e.g. 2025-09-07)
        date_prefix = basename[:10]
        output_path = f"questions/{date_prefix}-lesson-{week_counter:02d}.json"
        
        if os.path.exists(output_path):
            print(f"⏭️ Skipping {basename}, already processed.")
            week_counter += 1
            continue
            
        print(f"⏳ Processing Week {week_counter}: {basename}...")
        
        with open(file_path, "r", encoding="utf-8") as f:
            lesson_content = f.read()
            
        # Combine the master prompt with the specific lesson content
        # We explicitly tell it which week number it is to help with the JSON numbering
        prompt = master_prompt + f"\n\n--- LESSON CONTENT (Treat this as Week {week_counter}) ---\n" + lesson_content
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # We use gemini-2.0-flash which is very stable and has high capacity
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.2, # Low temperature for factual consistency
                    )
                )
                
                # Parse and validate the JSON
                result_json = response.text
                parsed = json.loads(result_json)
                
                # Save the JSON file
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(parsed, f, indent=2)
                    
                print(f"✅ Successfully generated {output_path}")
                
                # Pause to avoid hitting rate limits on the Free Tier
                time.sleep(5) 
                break # Success, exit retry loop
                
            except Exception as e:
                print(f"⚠️ Error on attempt {attempt + 1} for {basename}: {e}")
                if attempt < max_retries - 1:
                    print("Retrying in 10 seconds...")
                    time.sleep(10)
                else:
                    print(f"❌ Failed to process {basename} after {max_retries} attempts.")
                    print("Stopping to prevent further errors.")
                    return # Stop processing entirely
            
        week_counter += 1

if __name__ == "__main__":
    print("Starting Sunday School Quiz Generator...")
    process_lessons()
    print("Done!")
