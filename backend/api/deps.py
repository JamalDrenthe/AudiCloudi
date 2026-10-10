"""
CloudiAudi FastAPI Security & RBAC Dependencies.
Enforces role-based access control, tenant isolation, and Firebase token verification.
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import Depends, Header, HTTPException, status
from backend.core.auth_claims import UserRole, verify_id_token_claims, validate_user_scope


async def get_current_token_claims(
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> Dict[str, Any]:
    """
    Extracts Bearer token from header and verifies using Firebase Admin SDK.
    Falls back to mock claims in development mode if token is test token.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
        )

    token = authorization.split("Bearer ")[1].strip()
    try:
        claims = verify_id_token_claims(token)
        return claims
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase ID Token: {str(exc)}",
        )


def require_role(allowed_roles: list[UserRole]):
    """FastAPI dependency factory to enforce user role."""
    async def role_checker(claims: Dict[str, Any] = Depends(get_current_token_claims)) -> Dict[str, Any]:
        user_role_str = claims.get("role", UserRole.GUEST_VISITOR.value)
        try:
            user_role = UserRole(user_role_str)
        except ValueError:
            user_role = UserRole.GUEST_VISITOR

        if UserRole.SUPER_ADMIN in allowed_roles and user_role == UserRole.SUPER_ADMIN:
            return claims

        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}, user role: {user_role.value}",
            )
        return claims

    return role_checker


def require_scope(required_scope: str):
    """FastAPI dependency factory to enforce specific permission scope."""
    async def scope_checker(claims: Dict[str, Any] = Depends(get_current_token_claims)) -> Dict[str, Any]:
        if not validate_user_scope(claims, required_scope):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Missing required permission scope: '{required_scope}'",
            )
        return claims

    return scope_checker
