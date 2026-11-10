"""List available Addis voices without generating or billing audio."""
import argparse
import json
import sys
from pathlib import Path

API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))
from app.services.speech import list_available_voices

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--language", choices=["om", "am", "ti"], default="om")
    args = parser.parse_args()
    print(json.dumps(list_available_voices(args.language), ensure_ascii=False, indent=2))
