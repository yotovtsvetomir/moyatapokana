# app/services/s3/presentation_image.py
from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image
import io
import os

class PresentationImageService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_MB = 1
    OPTIMIZE_QUALITY = 80
    TARGET_SIZE = (800, 600)

    async def upload_image(self, file: UploadFile, folder="presentation_images") -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        # Resize maintaining aspect ratio
        image.thumbnail(self.TARGET_SIZE, Image.Resampling.LANCZOS)

        # Convert to RGB
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save to buffer as WebP
        buffer = io.BytesIO()
        webp_filename = os.path.splitext(file.filename)[0] + ".webp"
        image.save(buffer, format="WEBP", quality=self.OPTIMIZE_QUALITY, optimize=True)

        # Check size
        size_mb = buffer.tell() / (1024 * 1024)
        if size_mb > self.MAX_SIZE_MB:
            raise ValueError(f"File too large ({size_mb:.2f} MB), max {self.MAX_SIZE_MB} MB")

        buffer.seek(0)
        optimized_file = UploadFile(filename=webp_filename, file=buffer)

        # Upload using S3Base
        url = await self._upload(optimized_file, folder)
        return url

    async def delete_image(self, file_url: str):
        await self._delete(file_url)
