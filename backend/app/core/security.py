"""Cryptographic hashing, JWT token operations, and password validation utilities."""

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
import jwt

from app.core.config import settings

# Global Argon2 Password Hasher instance
_pwd_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id."""
    return _pwd_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against an Argon2id hash."""
    try:
        return _pwd_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError):
        return False


def validate_password_strength(password: str) -> None:
    """Enforce strict password complexity rules.

    Rules:
    - More than 8 characters (> 8)
    - At least one uppercase letter ([A-Z])
    - At least one lowercase letter ([a-z])
    - At least one special character ([^A-Za-z0-9])

    Raises:
        ValueError: If password violates complexity rules.
    """
    if len(password) <= 8:
        raise ValueError("Password must be more than 8 characters in length.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter.")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise ValueError("Password must contain at least one special character.")


def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Encode user claims into a signed JWT access token."""
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    if expires_delta:
        expire = now_utc + expires_delta
    else:
        expire = now_utc + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "iat": now_utc})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token.

    Raises:
        jwt.ExpiredSignatureError: When the token has expired.
        jwt.PyJWTError: When the signature or payload is invalid.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def generate_secure_reset_token() -> Tuple[str, str]:
    """Generate a high-entropy URL-safe reset token and its SHA-256 hash.

    Returns:
        Tuple[str, str]: (raw_token, token_hash)
    """
    raw_token = secrets.token_urlsafe(32)
    token_hash = hash_token(raw_token)
    return raw_token, token_hash


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hash of a reset token for secure lookup."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
