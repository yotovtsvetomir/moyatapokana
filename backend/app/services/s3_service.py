import os
import boto3
from botocore.exceptions import ClientError
from fastapi import UploadFile

S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
S3_ACCESS_KEY = os.getenv("S3_ACCESS_KEY")
S3_SECRET_KEY = os.getenv("S3_SECRET_KEY")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_REGION = os.getenv("S3_REGION", "eu-west-1")

s3_client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT_URL,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name=S3_REGION,
)


async def upload_file(file: UploadFile, key: str) -> str:
    try:
        s3_client.upload_fileobj(file.file, S3_BUCKET, key)
        if S3_ENDPOINT_URL.endswith("amazonaws.com"):
            url = f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"
        else:
            url = f"{S3_ENDPOINT_URL}/{S3_BUCKET}/{key}"
        return url
    except ClientError as e:
        raise RuntimeError(f"Failed to upload file: {e}")
