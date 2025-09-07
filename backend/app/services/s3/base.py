from minio import Minio
from minio.error import S3Error
from urllib.parse import urlparse
from app.core.settings import settings
import uuid
from fastapi import UploadFile
import io

minio_client = Minio(
    endpoint="minio.local:9000",
    access_key=settings.S3_ACCESS_KEY,
    secret_key=settings.S3_SECRET_KEY,
    secure=settings.S3_SECURE,
    region=settings.S3_REGION,
)


# ----------------------------
# S3 Base Class
# ----------------------------
class S3Base:
    def __init__(self, bucket: str = settings.S3_BUCKET):
        self.bucket = bucket
        self.client = minio_client
        # Create bucket if it doesn't exist (skip errors in prod)
        if not self.client.bucket_exists(bucket):
            try:
                self.client.make_bucket(bucket)
            except S3Error as e:
                print(f"Bucket creation skipped: {e}")

    async def _upload(
        self, file: UploadFile, folder: str = "", allowed_types=None, max_size_mb=None
    ) -> str:
        # Validate content type
        if allowed_types and file.content_type not in allowed_types:
            raise ValueError(f"File type {file.content_type} not allowed")

        # Read file data
        data = await file.read()
        size_mb = len(data) / (1024 * 1024)
        if max_size_mb and size_mb > max_size_mb:
            raise ValueError(
                f"File size {size_mb:.2f}MB exceeds max allowed {max_size_mb}MB"
            )

        buffer = io.BytesIO(data)
        file_id = str(uuid.uuid4())
        extension = file.filename.split(".")[-1]
        object_name = (
            f"{folder}/{file_id}.{extension}" if folder else f"{file_id}.{extension}"
        )

        # Upload to S3 / MinIO
        try:
            self.client.put_object(
                self.bucket,
                object_name,
                buffer,
                length=len(data),
                part_size=5 * 1024 * 1024,
            )
        except S3Error as e:
            raise RuntimeError(f"Failed to upload file: {e}")

        # Return presigned URL (works for local MinIO or AWS S3)
        try:
            url = f"http://localhost:9000/{self.bucket}/{object_name}"
            return url
        except S3Error:
            # Fallback for public buckets
            scheme = "https" if settings.S3_SECURE else "http"
            url = f"{scheme}://{settings.S3_ENDPOINT_URL}/{self.bucket}/{object_name}"

        return url

    async def _delete(self, file_url: str):
        parsed = urlparse(file_url)
        object_name = None

        # Handle virtual-host style: bucket in hostname
        if parsed.netloc.startswith(self.bucket):
            object_name = parsed.path.lstrip("/")
        else:
            # Handle path-style: /bucket/object
            path_parts = parsed.path.lstrip("/").split("/", 1)
            if len(path_parts) == 2 and path_parts[0] == self.bucket:
                object_name = path_parts[1]

        if object_name:
            try:
                self.client.remove_object(self.bucket, object_name)
            except S3Error as e:
                print(f"Failed to delete {object_name}: {e}")
        else:
            print(f"Cannot determine object key from URL: {file_url}")

    async def _copy(self, file_url: str, folder: str = "") -> str:
        """
        Copy an existing object in S3 / MinIO by downloading + re-uploading.
        Returns a new URL.
        """
        parsed = urlparse(file_url)
        object_name = parsed.path.lstrip("/").split("/", 1)[-1]

        # Download the object
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
        except S3Error as e:
            raise RuntimeError(f"Failed to download object for copy: {e}")

        # Wrap in UploadFile-like object
        buffer = io.BytesIO(data)
        buffer.seek(0)
        filename = f"{uuid.uuid4()}.{object_name.split('.')[-1]}"
        upload_file = UploadFile(filename=filename, file=buffer)

        # Re-upload and return new URL
        return await self._upload(upload_file, folder=folder)
