import os
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# --------------------------------------------------

# Configuration

# --------------------------------------------------
API_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(API_ROOT / ".env")

ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "audio")
AWS_REGION = os.getenv("AWS_REGION")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")


def _validate_config() -> None:

"""Validate the required storage configuration."""
required = {
    "S3_ENDPOINT_URL": ENDPOINT_URL,
    "S3_BUCKET_NAME": BUCKET_NAME,
    "AWS_REGION": AWS_REGION,
    "AWS_ACCESS_KEY_ID": AWS_ACCESS_KEY_ID,
    "AWS_SECRET_ACCESS_KEY": AWS_SECRET_ACCESS_KEY,
}

```
missing = [name for name, value in required.items() if not value]

if missing:
    raise RuntimeError(
        "Missing storage configuration in apps/api/.env: "
        + ", ".join(missing)
    )
```

_validate_config()

# --------------------------------------------------

# S3-compatible client

# --------------------------------------------------

s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT_URL,
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    config=Config(
    signature_version="s3v4",
    s3={"addressing_style": "path"},
    retries={"max_attempts": 3, "mode": "standard"},
),
)

# --------------------------------------------------

# Audio storage

# --------------------------------------------------


def upload_audio(file_path: str, storage_key: str) -> str:

"""
Upload an MP3 file to object storage.

```
Args:
    file_path: Path to the local MP3 file.
    storage_key: Destination key inside the configured bucket.

Returns:
    The storage key of the uploaded file.
"""
path = Path(file_path)

if not path.is_file():
    raise FileNotFoundError(f"Audio file not found: {path}")

if path.stat().st_size == 0:
    raise ValueError(f"Audio file is empty: {path}")

try:
    s3.upload_file(
        str(path),
        BUCKET_NAME,
        storage_key,
        ExtraArgs={"ContentType": "audio/mpeg"},
    )
except ClientError as exc:
    error = exc.response.get("Error", {})
    code = error.get("Code", "Unknown")
    message = error.get("Message", "Unknown storage error")

    raise RuntimeError(
        f"Failed to upload audio (code={code}): {message}"
    ) from exc

return storage_key
```


def generate_audio_url(
    storage_key: str,
    expires_in: int = 3600,
) -> str:

"""
Generate a temporary URL for listening to or downloading audio.

```
Args:
    storage_key: Object key inside the configured bucket.
    expires_in: URL expiration time in seconds; defaults to one hour.

Returns:
    A presigned URL.
"""
if not storage_key:
    raise ValueError("storage_key cannot be empty.")

if not 1 <= expires_in <= 604800:
    raise ValueError("expires_in must be between 1 and 604800 seconds.")

return s3.generate_presigned_url(
    "get_object",
    Params={
        "Bucket": BUCKET_NAME,
        "Key": storage_key,
    },
    ExpiresIn=expires_in,
)
```


def delete_audio(storage_key: str) -> None:

"""Delete an audio object from storage."""
if not storage_key:
raise ValueError("storage_key cannot be empty.")

```
try:
    s3.delete_object(
        Bucket=BUCKET_NAME,
        Key=storage_key,
    )
except ClientError as exc:
    error = exc.response.get("Error", {})
    code = error.get("Code", "Unknown")
    message = error.get("Message", "Unknown storage error")

    raise RuntimeError(
        f"Failed to delete audio (code={code}): {message}"
    ) from exc
```


def audio_exists(storage_key: str) -> bool:

"""Return whether an audio object exists in storage."""
try:
s3.head_object(
    Bucket=BUCKET_NAME,
    Key=storage_key,
)
return True
except ClientError as exc:
code = exc.response.get("ResponseMetadata", {}).get(
    "HTTPStatusCode"
)
error_code = exc.response.get("Error", {}).get("Code")

```
   if code == 404 or error_code in {"404", "NoSuchKey", "NotFound"}:
        return False

    raise RuntimeError(
        f"Could not check audio object: {storage_key}"
    ) from exc
```
