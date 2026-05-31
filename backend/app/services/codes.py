from __future__ import annotations

import secrets
import string

CODE_ALPHABET = string.ascii_uppercase + string.digits


def generate_unique_code(length: int = 6) -> str:
    return "".join(secrets.choice(CODE_ALPHABET) for _ in range(length))
