# services/s3/base.py
from minio import Minio
from minio.error import S3Error
import os
import uuid
from fastapi import UploadFile
from urllib.parse import urlparse

S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL", "http://s3_storage:9000")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY", "minioadmin")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY", "minioadmin")
S3_BUCKET = os.getenv("S3_BUCKET", "moyatapokana")

# Parse the endpoint URL
parsed_url = urlparse(S3_ENDPOINT_URL)
host = parsed_url.netloc
secure = parsed_url.scheme == "https"

minio_client = Minio(
    host,
    access_key=S3_ACCESS_KEY,
    secret_key=S3_SECRET_KEY,
    secure=secure,
)


class S3Base:
    def __init__(self, bucket: str = S3_BUCKET):
        self.bucket = bucket
        self.client = minio_client

        # Ensure bucket exists
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    async def _upload(
        self, file: UploadFile, folder: str = "", allowed_types=None, max_size_mb=None
    ) -> str:
        # Validate content type
        if allowed_types and file.content_type not in allowed_types:
            raise ValueError(f"File type {file.content_type} not allowed")

        # Validate size
        if max_size_mb:
            file.file.seek(0, 2)
            size_mb = file.file.tell() / (1024 * 1024)
            file.file.seek(0)
            if size_mb > max_size_mb:
                raise ValueError(
                    f"File size {size_mb:.2f}MB exceeds max allowed {max_size_mb}MB"
                )

        file_id = str(uuid.uuid4())
        extension = file.filename.split(".")[-1]
        object_name = (
            f"{folder}/{file_id}.{extension}" if folder else f"{file_id}.{extension}"
        )

        try:
            self.client.put_object(
                self.bucket,
                object_name,
                file.file,
                length=-1,
                part_size=10 * 1024 * 1024,
            )
        except S3Error as e:
            raise RuntimeError(f"Failed to upload file: {e}")

        return f"{S3_ENDPOINT_URL}/{self.bucket}/{object_name}"
