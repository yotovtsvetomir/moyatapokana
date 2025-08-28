from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image, ImageOps
import io
import os


class ProfilePictureService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_KB = 500
    TARGET_SIZE = (300, 300)  # Resize/crop to 300x300

    async def upload_profile_picture(
        self, file: UploadFile, folder="profile-images"
    ) -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        # Crop & resize to TARGET_SIZE, keeping the center
        image = ImageOps.fit(image, self.TARGET_SIZE, Image.Resampling.LANCZOS)

        # Convert to RGB for JPEG/WebP
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")

        # Save as WebP
        buffer = io.BytesIO()
        webp_filename = os.path.splitext(file.filename)[0] + ".webp"
        image.save(buffer, format="WEBP", quality=70, optimize=True)

        # Check file size
        size_kb = buffer.tell() / 1024
        if size_kb > self.MAX_SIZE_KB:
            raise ValueError(
                f"File size {size_kb:.2f} KB exceeds max allowed {self.MAX_SIZE_KB} KB"
            )

        buffer.seek(0)
        optimized_file = UploadFile(filename=webp_filename, file=buffer)

        # Upload to S3/MinIO
        url = await self._upload(optimized_file, folder)
        return url
