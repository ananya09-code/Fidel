"""Object storage helpers for Fidel audio files.

Uploads MP3 recordings to the project's S3-compatible bucket (Neon storage)
and provides presigned playback URLs. Configuration is read from the API
``.env`` file; credentials are never logged or embedded in error messages.
"""

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
ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

_REQUIRED_CONFIG = {
    "S3_ENDPOINT_URL": ENDPOINT_URL,
    "S3_BUCKET_NAME": BUCKET_NAME,
    "AWS_REGION": AWS_REGION,
    "AWS_ACCESS_KEY_ID": ACCESS_KEY,
    "AWS_SECRET_ACCESS_KEY": SECRET_KEY,
}

_missing = [name for name, value in _REQUIRED_CONFIG.items() if not value]

if _missing:
    raise RuntimeError(
        "Missing storage configuration in apps/api/.env: "
        + ", ".join(sorted(_missing))
    )

# --------------------------------------------------
# S3-compatible client
# --------------------------------------------------

s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT_URL,
    region_name=AWS_REGION,
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(
        signature_version="s3v4",
        s3={"addressing_style": "path"},
        retries={"max_attempts": 3, "mode": "standard"},
    ),
)

# --------------------------------------------------
# Internal helpers
# --------------------------------------------------

# Longest presigned URL lifetime allowed by the S3 signature spec (7 days).
MAX_EXPIRES_IN = 604800

_NOT_FOUND_CODES = {"404", "NoSuchKey", "NotFound", "NoSuchBucket"}


def _describe(exc: ClientError) -> str:
    """Return a credential-free description of a storage error."""
    error = exc.response.get("Error", {})
    code = error.get("Code", "Unknown")
    message = error.get("Message", "Unknown storage error")
    return f"{code}: {message}"


def _validate_storage_key(storage_key: str) -> str:
    """Validate and normalize an object key."""
    if not isinstance(storage_key, str) or not storage_key.strip():
        raise ValueError("storage_key cannot be empty")

    return storage_key.strip()


# --------------------------------------------------
# Audio storage
# --------------------------------------------------


def upload_audio(file_path: str, storage_key: str) -> str:
    """Upload an MP3 file to object storage.

    Args:
        file_path: Path to the local MP3 file.
        storage_key: Destination key inside the configured bucket.

    Returns:
        The storage key of the uploaded file.
    """
    key = _validate_storage_key(storage_key)
    path = Path(file_path)

    if not path.is_file():
        raise FileNotFoundError(f"Audio file not found: {path}")

    if path.stat().st_size == 0:
        raise ValueError(f"Audio file is empty: {path}")

    try:
        s3.upload_file(
            str(path),
            BUCKET_NAME,
            key,
            ExtraArgs={"ContentType": "audio/mpeg"},
        )
    except ClientError as exc:
        raise RuntimeError(
            f"Failed to upload audio to {key}: {_describe(exc)}"
        ) from exc

    return key


def generate_audio_url(
    storage_key: str,
    expires_in: int = 3600,
) -> str:
    """Generate a temporary presigned URL for playing an audio file.

    Args:
        storage_key: Object key inside the configured bucket.
        expires_in: URL lifetime in seconds (1 second to 7 days).

    Returns:
        A presigned URL.
    """
    key = _validate_storage_key(storage_key)

    if not isinstance(expires_in, int) or isinstance(expires_in, bool):
        raise ValueError("expires_in must be an integer")

    if not 1 <= expires_in <= MAX_EXPIRES_IN:
        raise ValueError(
            f"expires_in must be between 1 and {MAX_EXPIRES_IN} seconds"
        )

    return s3.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": BUCKET_NAME,
            "Key": key,
        },
        ExpiresIn=expires_in,
    )


def delete_audio(storage_key: str) -> None:
    """Delete an audio object from storage."""
    key = _validate_storage_key(storage_key)

    try:
        s3.delete_object(
            Bucket=BUCKET_NAME,
            Key=key,
        )
    except ClientError as exc:
        raise RuntimeError(
            f"Failed to delete audio {key}: {_describe(exc)}"
        ) from exc


def audio_exists(storage_key: str) -> bool:
    """Return whether an audio object exists in storage.

    Returns ``False`` when the object is missing. Any other storage error is
    re-raised rather than being reported as "does not exist".
    """
    key = _validate_storage_key(storage_key)

    try:
        s3.head_object(
            Bucket=BUCKET_NAME,
            Key=key,
        )
        return True
    except ClientError as exc:
        status = exc.response.get("ResponseMetadata", {}).get(
            "HTTPStatusCode"
        )
        error_code = exc.response.get("Error", {}).get("Code")

        if status == 404 or error_code in _NOT_FOUND_CODES:
            return False

        raise RuntimeError(
            f"Could not check audio object {key}: {_describe(exc)}"
        ) from exc