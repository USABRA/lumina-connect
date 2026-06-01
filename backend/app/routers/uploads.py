from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from pydantic import BaseModel

from app.auth.dependencies import get_current_user_flexible
from app.config import settings
from app.models import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
MAX_IMAGE_BYTES = 2 * 1024 * 1024

_IMAGE_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    ".jpg": (b"\xff\xd8\xff",),
    ".png": (b"\x89PNG\r\n\x1a\n",),
    ".gif": (b"GIF87a", b"GIF89a"),
    ".webp": (b"RIFF",),
}


def _matches_image_signature(extension: str, content: bytes) -> bool:
    signatures = _IMAGE_SIGNATURES.get(extension, ())
    if not signatures:
        return False
    if extension == ".webp":
        return len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP"
    return any(content.startswith(sig) for sig in signatures)


class UploadResponse(BaseModel):
    url: str


def _public_base_url(request: Request) -> str:
    if settings.api_public_url:
        return settings.api_public_url.rstrip("/")
    return str(request.base_url).rstrip("/")


@router.post("/image", response_model=UploadResponse)
async def upload_image(
    request: Request,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user_flexible),
) -> UploadResponse:
    if user.company_id is None:
        raise HTTPException(status_code=400, detail="User must belong to a company")

    content_type = file.content_type or ""
    extension = ALLOWED_IMAGE_TYPES.get(content_type)
    if not extension:
        raise HTTPException(status_code=400, detail="Unsupported image type")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 2 MB)")
    if not _matches_image_signature(extension, content):
        raise HTTPException(status_code=400, detail="File content does not match image type")

    upload_root = Path(settings.upload_dir).resolve()
    company_dir = (upload_root / f"company_{user.company_id}").resolve()
    company_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    if "/" in filename or "\\" in filename or filename.startswith("."):
        raise HTTPException(status_code=400, detail="Invalid filename")

    destination = (company_dir / filename).resolve()
    if not str(destination).startswith(str(company_dir)):
        raise HTTPException(status_code=400, detail="Invalid upload path")
    destination.write_bytes(content)

    public_url = f"{_public_base_url(request)}/uploads/company_{user.company_id}/{filename}"
    return UploadResponse(url=public_url)
