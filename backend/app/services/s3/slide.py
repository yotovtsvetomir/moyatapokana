from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image
import io


class SlideService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_MB = 5
    OPTIMIZE_QUALITY = 80

    async def upload_slide(self, file: UploadFile, folder="slides") -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        max_width, max_height = 1920, 1080
        image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

        # Save to buffer with optimization
        buffer = io.BytesIO()
        if file.content_type == "image/png":
            image.save(buffer, format="PNG", optimize=True)
        else:
            image = image.convert("RGB")
            image.save(
                buffer, format="JPEG", quality=self.OPTIMIZE_QUALITY, optimize=True
            )

        size_mb = buffer.tell() / (1024 * 1024)
        if size_mb > self.MAX_SIZE_MB:
            raise ValueError(
                f"File size {size_mb:.2f} MB exceeds max allowed {self.MAX_SIZE_MB} MB"
            )

        buffer.seek(0)
        optimized_file = UploadFile(filename=file.filename, file=buffer)

        # Upload to S3/MinIO using S3Base
        url = await self._upload(optimized_file, folder)
        return url

    async def delete_slide(self, file_url: str):
        await self._delete(file_url)
