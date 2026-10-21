"""Phone number normalization and per-country validation (E.164)."""
from typing import Optional

import phonenumbers
from fastapi import HTTPException, status


def normalize_phone(raw: Optional[str], country: Optional[str] = None) -> Optional[str]:
    """
    Returns the E.164 form ("+919876543210") of a valid mobile/fixed number, or None.
    `country` is an ISO-3166 alpha-2 hint used when `raw` has no leading "+".
    """
    if not raw or not raw.strip():
        return None
    try:
        parsed = phonenumbers.parse(raw.strip(), (country or "").upper() or None)
    except phonenumbers.NumberParseException:
        return None
    if not phonenumbers.is_valid_number(parsed):
        return None
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def require_phone(raw: Optional[str], country: Optional[str] = None, field: str = "phone") -> str:
    normalized = normalize_phone(raw, country)
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Enter a valid {field} number for the selected country.",
        )
    return normalized


def optional_phone(raw: Optional[str], country: Optional[str] = None, field: str = "phone") -> Optional[str]:
    if not raw or not raw.strip():
        return None
    return require_phone(raw, country, field)


def mask_phone(e164: str) -> str:
    if len(e164) <= 6:
        return e164
    return f"{e164[:3]}{'•' * (len(e164) - 6)}{e164[-3:]}"
