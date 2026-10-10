"""
CloudiAudi RBAC & Firebase Authentication Custom Claims Manager.
Handles programmatic assignment, verification, and scope validation for all 5 roles:
- super_admin
- record_label
- artist_producer
- listener_user
- guest_visitor
"""

from __future__ import annotations

import argparse
import sys
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from firebase_admin import auth
from backend.core.config import get_firebase_app


class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    RECORD_LABEL = "record_label"
    ARTIST_PRODUCER = "artist_producer"
    LISTENER_USER = "listener_user"
    GUEST_VISITOR = "guest_visitor"


# Definitive RBAC Scope Matrix
ROLE_PERMISSIONS: Dict[UserRole, List[str]] = {
    UserRole.SUPER_ADMIN: [
        "*",
        "admin:hyperparameters",
        "admin:editorial_override",
        "admin:observability",
        "admin:users_manage",
        "label:*",
        "artist:*",
        "stream:*",
        "marketplace:*",
    ],
    UserRole.RECORD_LABEL: [
        "label:read",
        "label:manage_roster",
        "label:analytics",
        "label:revenue_split",
        "tracks:read_tenant",
        "stream:play",
    ],
    UserRole.ARTIST_PRODUCER: [
        "artist:manage_tracks",
        "artist:diagnostics",
        "artist:pricing",
        "artist:splits",
        "tracks:write_own",
        "tracks:read_own",
        "stream:play",
        "social:interact",
    ],
    UserRole.LISTENER_USER: [
        "stream:play",
        "social:comment",
        "social:repost",
        "social:like",
        "marketplace:purchase",
        "tracks:read_public",
    ],
    UserRole.GUEST_VISITOR: [
        "stream:preview",
        "tracks:read_public",
    ],
}


class CustomClaimsPayload(BaseModel):
    role: UserRole
    tenant_id: Optional[str] = Field(default=None, description="Label/Tenant ID for artists and labels")
    permissions: List[str] = Field(default_factory=list)
    email_verified: bool = Field(default=False)
    credit_tier: str = Field(default="free", description="Subscribed tier: free, artist, label")


def assign_user_custom_claims(
    uid: str,
    role: UserRole,
    tenant_id: Optional[str] = None,
    custom_permissions: Optional[List[str]] = None,
    credit_tier: str = "free",
) -> Dict[str, Any]:
    """
    Programmatically set Firebase Auth custom claims on a user record.
    Forces permission synchronization with the canonical RBAC matrix.
    """
    get_firebase_app()
    
    # Inherit canonical permissions
    base_permissions = list(ROLE_PERMISSIONS.get(role, []))
    if custom_permissions:
        for perm in custom_permissions:
            if perm not in base_permissions:
                base_permissions.append(perm)

    # For record labels and artists, validate tenant_id presence
    if role in (UserRole.RECORD_LABEL, UserRole.ARTIST_PRODUCER) and not tenant_id:
        if role == UserRole.RECORD_LABEL:
            # Self-tenant ID defaults to UID for standalone labels
            tenant_id = f"tenant_{uid}"

    claims = {
        "role": role.value,
        "tenant_id": tenant_id,
        "permissions": base_permissions,
        "credit_tier": credit_tier,
    }

    # Firebase custom claims size limit is 1000 bytes
    auth.set_custom_user_claims(uid, claims)
    return claims


def verify_id_token_claims(id_token: str) -> Dict[str, Any]:
    """
    Verifies and decodes a Firebase ID token, returning verified claims.
    Raises auth.InvalidIdTokenError or auth.ExpiredIdTokenError on failure.
    """
    get_firebase_app()
    decoded_token = auth.verify_id_token(id_token, check_revoked=True)
    return decoded_token


def validate_user_scope(claims: Dict[str, Any], required_scope: str) -> bool:
    """
    Validates whether the user's claims satisfy the required scope.
    Supports wildcard matching ('*' or 'admin:*').
    """
    role = claims.get("role")
    if role == UserRole.SUPER_ADMIN.value:
        return True

    user_permissions: List[str] = claims.get("permissions", [])
    if "*" in user_permissions:
        return True

    if required_scope in user_permissions:
        return True

    # Check prefix wildcard (e.g. 'label:*' matches 'label:analytics')
    req_prefix = required_scope.split(":")[0] + ":*"
    if req_prefix in user_permissions:
        return True

    return False


def get_user_role(claims: Dict[str, Any]) -> UserRole:
    """Extract and validate UserRole enum from custom claims."""
    raw_role = claims.get("role", UserRole.GUEST_VISITOR.value)
    try:
        return UserRole(raw_role)
    except ValueError:
        return UserRole.GUEST_VISITOR


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CloudiAudi RBAC Claims Management CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    assign_parser = subparsers.add_parser("assign", help="Assign claims to a user")
    assign_parser.add_argument("--uid", required=True, help="Firebase Auth UID")
    assign_parser.add_argument(
        "--role",
        required=True,
        choices=[r.value for r in UserRole],
        help="Target user role",
    )
    assign_parser.add_argument("--tenant", required=False, default=None, help="Tenant/Label ID")
    assign_parser.add_argument("--tier", required=False, default="free", help="Credit tier (free, artist, label)")

    get_parser = subparsers.add_parser("get", help="Retrieve claims for a user")
    get_parser.add_argument("--uid", required=True, help="Firebase Auth UID")

    args = parser.parse_args()

    if args.command == "assign":
        assigned = assign_user_custom_claims(
            uid=args.uid,
            role=UserRole(args.role),
            tenant_id=args.tenant,
            credit_tier=args.tier,
        )
        print(f"Successfully assigned claims to UID '{args.uid}':")
        for k, v in assigned.items():
            print(f"  {k}: {v}")

    elif args.command == "get":
        get_firebase_app()
        user_record = auth.get_user(args.uid)
        print(f"User '{args.uid}' Custom Claims:")
        claims = user_record.custom_claims or {}
        for k, v in claims.items():
            print(f"  {k}: {v}")
