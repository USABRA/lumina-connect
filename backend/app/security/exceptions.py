from __future__ import annotations

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings

_PUBLIC_PREFIXES = (
    "/leads",
    "/track/",
    "/meetings/join/",
    "/auth/login",
    "/auth/register",
    "/auth/status",
    "/health",
)


def _is_public_route(path: str) -> bool:
    return any(path == p.rstrip("/") or path.startswith(p) for p in _PUBLIC_PREFIXES)


def _generic_message(status_code: int) -> str:
    if status_code == 404:
        return "Not found"
    if status_code == 403:
        return "Forbidden"
    if status_code == 401:
        return "Unauthorized"
    if status_code == 429:
        return "Too many requests"
    if status_code >= 500:
        return "Internal server error"
    return "Request failed"


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        detail = exc.detail
        if settings.is_production and _is_public_route(request.url.path):
            if isinstance(detail, str):
                detail = _generic_message(exc.status_code)
            elif isinstance(detail, dict):
                detail = {"message": _generic_message(exc.status_code)}
        return JSONResponse(status_code=exc.status_code, content={"detail": detail})

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        if settings.is_production and _is_public_route(request.url.path):
            return JSONResponse(
                status_code=422,
                content={"detail": "Invalid request"},
            )
        return JSONResponse(status_code=422, content={"detail": exc.errors()})

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        if settings.debug:
            raise exc
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error"
                if _is_public_route(request.url.path) or settings.is_production
                else str(exc)
            },
        )
