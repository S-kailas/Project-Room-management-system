import io
import uuid

from minio import Minio
from minio.error import S3Error

from app.config import settings

_client = Minio(
    settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=False,
)


def _ensure_bucket():
    try:
        if not _client.bucket_exists(settings.MINIO_BUCKET):
            _client.make_bucket(settings.MINIO_BUCKET)
    except S3Error as e:
        raise RuntimeError(f"MinIO bucket setup failed: {e}")


def upload_aadhaar(customer_id: int, file_bytes: bytes, content_type: str = "image/jpeg") -> str:
    """Upload Aadhaar image to MinIO and return the object path string."""
    _ensure_bucket()
    file_uuid = uuid.uuid4().hex
    object_name = f"{customer_id}/{file_uuid}.jpg"

    _client.put_object(
        bucket_name=settings.MINIO_BUCKET,
        object_name=object_name,
        data=io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )
    # Return just the path (bucket/object_name)
    return f"{settings.MINIO_BUCKET}/{object_name}"
