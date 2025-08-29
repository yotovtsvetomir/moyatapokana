import subprocess
import tempfile
import os
from fastapi import UploadFile
from .base import S3Base

# Allowed input audio formats
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg",  # .mp3
    "audio/wav",  # .wav
    "audio/ogg",  # .ogg
}

# Accept up to 5MB raw upload
MAX_AUDIO_SIZE_MB = 5


class MusicService(S3Base):
    async def _convert_to_mp3(self, file: UploadFile, bitrate="96k") -> str:
        """
        Convert input file to compressed MP3 using ffmpeg.
        Returns path to converted file.
        """
        # Save input temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".input") as tmp_in:
            data = await file.read()
            tmp_in.write(data)
            input_path = tmp_in.name

        output_path = input_path + ".mp3"

        # Run ffmpeg compression → MP3 at 96 kbps
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                input_path,
                "-vn",  # no video
                "-ar",
                "44100",  # resample to 44.1kHz
                "-ac",
                "2",  # stereo
                "-b:a",
                bitrate,  # bitrate (controls size)
                output_path,
            ],
            check=True,
        )

        os.remove(input_path)  # cleanup input
        return output_path

    async def upload_music(self, file: UploadFile) -> str:
        if file.content_type not in ALLOWED_AUDIO_TYPES:
            raise ValueError(f"File type {file.content_type} not allowed")

        # Convert & compress first
        mp3_path = await self._convert_to_mp3(file, bitrate="96k")

        # Open as UploadFile compatible object
        with open(mp3_path, "rb") as f:
            # Create a temporary UploadFile-like object
            class TempUploadFile:
                def __init__(self, filename, file):
                    self.filename = filename
                    self.file = file
                    self.content_type = "audio/mpeg"

                async def read(self):
                    return self.file.read()

            upload_file = TempUploadFile(os.path.basename(mp3_path), f)
            url = await self._upload(
                file=upload_file,
                folder="music",
                allowed_types={"audio/mpeg"},
                max_size_mb=MAX_AUDIO_SIZE_MB,
            )

        os.remove(mp3_path)
        return url

    async def delete_music(self, file_url: str):
        """Delete audio from S3 by URL."""
        return await self._delete(file_url)
