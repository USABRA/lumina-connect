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

    upload_root = Path(settings.upload_dir)
    company_dir = upload_root / f"company_{user.company_id}"
    company_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = company_dir / filename
    destination.write_bytes(content)

    public_url = f"{_public_base_url(request)}/uploads/company_{user.company_id}/{filename}"
    return UploadResponse(url=public_url)
