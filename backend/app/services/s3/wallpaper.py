from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image
import io
import os


class WallpaperService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_MB = 1
    OPTIMIZE_QUALITY = 80
    TARGET_SIZE = (1920, 1080)

    async def upload_wallpaper(self, file: UploadFile, folder="wallpapers") -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        # Resize maintaining aspect ratio
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
        print(size_mb)
        if size_mb > self.MAX_SIZE_MB:
            raise ValueError(
                f"Размерът на файла {size_mb:.2f} MB надвишава максимално разрешените {self.MAX_SIZE_MB} MB"
            )

        buffer.seek(0)
        optimized_file = UploadFile(filename=webp_filename, file=buffer)

        # Upload to S3 / MinIO using _upload from S3Base
        url = await self._upload(optimized_file, folder)
        return url

    async def delete_wallpaper(self, file_url: str):
        await self._delete(file_url)
