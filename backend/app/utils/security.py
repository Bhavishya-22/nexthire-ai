import base64
import hashlib
import hmac
import json
import os
import time
from typing import Optional

JWT_SECRET = os.getenv("JWT_SECRET_KEY", "nexthire-ai-secret-key-change-in-production")


def hash_password(password: str) -> str:
    """
    Hashes a password with a random salt using PBKDF2-HMAC-SHA256.
    """
    salt = os.urandom(16).hex()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000)
    return f"{salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against the stored salt$hash.
    """
    try:
        salt, dk_hex = hashed_password.split("$")
        dk = hashlib.pbkdf2_hmac("sha256", plain_password.encode(), salt.encode(), 100_000)
        return hmac.compare_digest(dk.hex(), dk_hex)
    except Exception:
        return False


def create_access_token(data: dict, expires_in_seconds: int = 86400 * 7) -> str:
    """
    Creates an HS256 JWT access token without external dependencies.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_seconds

    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

    signing_input = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(signature).decode().rstrip("=")

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict:
    """
    Decodes and verifies an HS256 JWT access token.
    """
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    header_b64, payload_b64, sig_b64 = parts

    signing_input = f"{header_b64}.{payload_b64}".encode()
    expected_sig = hmac.new(JWT_SECRET.encode(), signing_input, hashlib.sha256).digest()

    sig_padding = (4 - len(sig_b64) % 4) % 4
    sig_padded = sig_b64 + ("=" * sig_padding)
    provided_sig = base64.urlsafe_b64decode(sig_padded.encode())

    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("Invalid token signature")

    payload_padding = (4 - len(payload_b64) % 4) % 4
    payload_padded = payload_b64 + ("=" * payload_padding)
    payload_data = json.loads(base64.urlsafe_b64decode(payload_padded.encode()).decode())

    if payload_data.get("exp", 0) < time.time():
        raise ValueError("Token has expired")

    return payload_data
