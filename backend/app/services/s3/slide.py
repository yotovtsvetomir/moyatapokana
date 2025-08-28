from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image
import io
import os


class SlideService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_MB = 7
    OPTIMIZE_QUALITY = 80
    TARGET_SIZE = (1920, 1080)

    async def upload_slide(self, file: UploadFile, folder="slides") -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        # Resize to TARGET_SIZE (maintaining aspect ratio)
        image.thumbnail(self.TARGET_SIZE, Image.Resampling.LANCZOS)

        # Convert to RGB for JPEG/WebP
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save as WebP to buffer
        buffer = io.BytesIO()
        webp_filename = os.path.splitext(file.filename)[0] + ".webp"
        image.save(buffer, format="WEBP", quality=self.OPTIMIZE_QUALITY, optimize=True)

        # Check size
        size_mb = buffer.tell() / (1024 * 1024)
        if size_mb > self.MAX_SIZE_MB:
            raise ValueError(
                f"File size {size_mb:.2f} MB exceeds max allowed {self.MAX_SIZE_MB} MB"
            )

        buffer.seek(0)
        optimized_file = UploadFile(filename=webp_filename, file=buffer)

        # Upload to S3/MinIO using S3Base
        url = await self._upload(optimized_file, folder)
        return url

    async def delete_slide(self, file_url: str):
        await self._delete(file_url)
