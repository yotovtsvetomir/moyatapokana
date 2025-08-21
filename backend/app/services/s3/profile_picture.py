from app.services.s3.base import S3Base
from fastapi import UploadFile
from PIL import Image
import io


class ProfilePictureService(S3Base):
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]
    MAX_SIZE_KB = 500

    async def upload_profile_picture(
        self, file: UploadFile, folder="profile_images"
    ) -> str:
        if file.content_type not in self.ALLOWED_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        image = Image.open(file.file)

        buffer = io.BytesIO()
        if file.content_type == "image/png":
            image.save(buffer, format="PNG", quality=70, optimize=True)
        else:
            image = image.convert("RGB")
            image.save(buffer, format="JPEG", quality=70, optimize=True)

        size_kb = buffer.tell() / 1024
        if size_kb > self.MAX_SIZE_KB:
            raise ValueError(
                f"File size {size_kb:.2f} KB exceeds max allowed {self.MAX_SIZE_KB} KB"
            )

        buffer.seek(0)

        optimized_file = UploadFile(
            filename=file.filename, file=buffer, content_type=file.content_type
        )

        url = await self._upload(optimized_file, folder)
        return url
