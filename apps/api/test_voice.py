
import os
from pathlib import Path

from dotenv import load_dotenv
from addisai import AddisAI

# Load environment variables from apps/api/.env
load_dotenv()

api_key = os.getenv("ADDIS_API_KEY")

if not api_key:
    raise RuntimeError("ADDIS_API_KEY is missing from your .env file")

# Initialize the Addis AI client
addis = AddisAI(api_key=api_key)

# Generate Amharic speech
clip = addis.voice.generate(
    voice_id="am-hamen",
    text="ሰላም። እንደምን አለህ?",
    language="am",
    output_format="mp3_44100",
)

# Save the audio
output_dir = Path("generated_audio")
output_dir.mkdir(exist_ok=True)

output_file = output_dir / "selam_test.mp3"
clip.to_file(str(output_file))

print(f"Audio saved to: {output_file.resolve()}")
print(f"Clip ID: {clip.id}")
print(f"Duration: {clip.duration_seconds} seconds")
print(f"Usage: {clip.usage}")
