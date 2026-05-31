from __future__ import annotations

import re
from typing import Optional


def _escape(value: str) -> str:
    return value.replace("\\", "\\\\").replace(";", "\\;").replace("\n", "\\n")


def build_vcard(
    *,
    full_name: str,
    job_title: Optional[str] = None,
    company: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    website: Optional[str] = None,
    linkedin: Optional[str] = None,
) -> str:
    lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        f"FN:{_escape(full_name)}",
        f"N:{_escape(full_name)};;;;",
    ]

    if job_title:
        lines.append(f"TITLE:{_escape(job_title)}")
    if company:
        lines.append(f"ORG:{_escape(company)}")
    if phone:
        digits = re.sub(r"\s", "", phone)
        lines.append(f"TEL;TYPE=CELL:{digits}")
    if email:
        lines.append(f"EMAIL;TYPE=INTERNET:{_escape(email)}")
    if website:
        url = website if website.startswith("http") else f"https://{website}"
        lines.append(f"URL:{url}")
    if linkedin:
        url = linkedin if linkedin.startswith("http") else f"https://linkedin.com/in/{linkedin.lstrip('/')}"
        lines.append(f"URL;TYPE=LinkedIn:{url}")

    lines.append("END:VCARD")
    return "\r\n".join(lines)


def vcard_filename(full_name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", full_name.lower()).strip("-") or "contact"
    return f"{slug}.vcf"
