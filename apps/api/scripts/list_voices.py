from dotenv import load_dotenv
from addisai import AddisAI

load_dotenv()

addis = AddisAI()
voices = addis.voices.list(language="om")

for voice in voices:
    print(voice)
