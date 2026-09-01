"""
core/dependencies.py — FastAPI dependency functions.

These are injected via Depends() in route handlers throughout the app.
"""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db_session
from core.exceptions import InsufficientPermissionsError, TokenInvalidError
from core.security import decode_access_token

# ── Type aliases ──────────────────────────────────────────────────────────────
DbSession = Annotated[AsyncSession, Depends(get_db_session)]

_bearer = HTTPBearer(auto_error=False)
BearerToken = Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)]


# ── Token decoding ────────────────────────────────────────────────────────────
async def get_current_user_payload(
    credentials: BearerToken,
) -> dict:
    """
    Decode the JWT from the Authorization header.

    Returns the token payload dict on success. Raises HTTP 401 if the
    token is missing, malformed, or expired.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "TOKEN_MISSING", "message": "Authentication required"},
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "TOKEN_INVALID", "message": str(exc)},
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return payload


CurrentUserPayload = Annotated[dict, Depends(get_current_user_payload)]


# ── Role enforcement ──────────────────────────────────────────────────────────
def require_role(*roles: str):
    """
    Dependency factory — returns a dependency that checks the JWT role claim.

    Usage:
        @router.post("/admin-only")
        async def admin_route(
            payload: Annotated[dict, Depends(require_role("OFFICER", "ADMIN"))]
        ):
            ...
    """

    async def _check_role(payload: CurrentUserPayload) -> dict:
        user_role = payload.get("role", "")
        if user_role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error_code": "INSUFFICIENT_PERMISSIONS",
                    "message": f"Requires one of roles: {', '.join(roles)}",
                },
            )
        return payload

    return _check_role


# ── Convenience role dependencies ─────────────────────────────────────────────
FarmerOnly = Annotated[dict, Depends(require_role("FARMER"))]
OfficerOnly = Annotated[dict, Depends(require_role("OFFICER", "ADMIN"))]
AnyAuthenticatedUser = Annotated[dict, Depends(require_role("FARMER", "OFFICER", "ADMIN"))]
