from app.services.s3.base import S3Base

class CopyService(S3Base):
    async def copy_file(self, file_url: str, folder: str = "") -> str:
        """
        Copy a file in S3 / MinIO by using the S3Base _copy method.
        Returns a new URL without modifying the original file.
        """
        return await self._copy(file_url, folder=folder)