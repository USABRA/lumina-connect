from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage
from typing import Iterable

from sqlalchemy.orm import Session

from app.config import settings
from app.models import Lead, Product, User

logger = logging.getLogger(__name__)


def _smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from)


def _company_recipient_emails(db: Session, company_id: int) -> list[str]:
    rows = (
        db.query(User.email)
        .filter(User.company_id == company_id)
        .all()
    )
    return [email for (email,) in rows if email]


def _resolve_recipients(db: Session, company_id: int) -> list[str]:
    if settings.lead_notify_emails:
        return settings.lead_notify_emails_list
    return _company_recipient_emails(db, company_id)


def _send_email(subject: str, body: str, recipients: Iterable[str]) -> None:
    recipient_list = [r.strip() for r in recipients if r and r.strip()]
    if not recipient_list:
        return
    if not _smtp_configured():
        logger.info("Lead notification skipped — SMTP not configured")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from
    message["To"] = ", ".join(recipient_list)
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        server.starttls()
        if settings.smtp_user and settings.smtp_password:
            server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)


def notify_new_lead(db: Session, lead: Lead, product: Product) -> None:
    company_id = product.campaign.company_id
    recipients = _resolve_recipients(db, company_id)
    if not recipients and not _smtp_configured():
        return

    campaign_name = product.campaign.name
    subject = f"Novo lead — {lead.name} ({product.unique_code})"
    body = "\n".join(
        [
            "Novo contato capturado na landing page.",
            "",
            f"Campanha: {campaign_name}",
            f"Produto: {product.product_type} ({product.unique_code})",
            "",
            f"Nome: {lead.name}",
            f"E-mail: {lead.email}",
            f"Telefone: {lead.phone or '—'}",
            f"Empresa: {lead.company or '—'}",
        ]
    )

    try:
        _send_email(subject, body, recipients)
    except Exception:
        logger.exception("Failed to send lead notification email")
