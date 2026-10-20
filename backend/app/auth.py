"""
Authentication module for Sol-Era.
Handles password hashing, JWT token creation/verification, and
FastAPI dependency for extracting the current authenticated user.
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

import jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

try:
    from app.database import get_db
    from app.models import User, Citizen
except ImportError:
    from backend.app.database import get_db
    from backend.app.models import User, Citizen


# ---------------------------------------------------------------------------
# Password hashing (direct bcrypt)
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        hash_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


# ---------------------------------------------------------------------------
# JWT token helpers
# ---------------------------------------------------------------------------
# Secret key for signing JWTs — override in .env for production
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sol-era-dev-jwt-secret-2026-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_HOURS = 72  # 3-day tokens for convenience


def create_access_token(user_id: str, email: str) -> str:
    """Create a signed JWT with the user's ID and email embedded."""
    payload = {
        "sub": user_id,
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_ACCESS_TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on invalid/expired."""
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired. Please login again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.")


# ---------------------------------------------------------------------------
# FastAPI dependency — extract current user from Bearer token
# ---------------------------------------------------------------------------
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that extracts and validates the Bearer JWT,
    then returns the corresponding User row from the database.
    """
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated. Please login.")
    
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated.")
    
    return user


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Same as get_current_user but returns None instead of raising
    when no token is provided. Useful for endpoints that work both
    for logged-in and anonymous users.
    """
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
