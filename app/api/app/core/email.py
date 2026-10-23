import smtplib
from email.message import EmailMessage

import logging

from app.core.config import settings
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

ROLE_LABELS = {"trainer": "trainer", "staff": "staff member", "manager": "manager", "admin": "admin"}


def _smtp_configured() -> bool:
    return bool(settings.SMTP_USER and settings.SMTP_PASSWORD and settings.EMAIL_FROM)


def _dev_print(kind: str, email: str, content: str) -> None:
    """Without SMTP, development prints the email (incl. links) to the console.
    Production never writes links or tokens to logs."""
    if settings.is_production:
        logger.error("SMTP is not configured; %s email to %s was not sent.", kind, email)
        return
    print(f"\n[DEV MODE EMAIL] {kind} to {email}:\n{content}\n")


def send_registration_otp(email: str, otp: str) -> None:
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.EMAIL_FROM:
        if not settings.is_production or settings.ALLOW_TEST_OTP_IN_PRODUCTION:
            _dev_print("Registration OTP", email, f"Verification code: {otp}\n(Note: Check Spam/Junk folder if not in Inbox)")
            return
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email delivery is not configured. Please contact support.",
        )

    message = EmailMessage()
    message["Subject"] = f"{otp} is your REPSI verification code"
    message["From"] = f"REPSI <{settings.EMAIL_FROM}>" if "<" not in settings.EMAIL_FROM else settings.EMAIL_FROM
    message["To"] = email

    # Plain text fallback
    plain_text = (
        f"Your REPSI Verification Code: {otp}\n\n"
        f"Enter this 6-digit code to verify your account and continue your setup.\n"
        f"This code will expire in {settings.OTP_EXPIRE_MINUTES} minutes.\n\n"
        "IMPORTANT NOTE ON SPAM FOLDER:\n"
        "If this email arrived in your Spam or Junk folder, please move it to your Inbox\n"
        "or mark REPSI as 'Not Spam' to ensure you receive vital billing receipts, member\n"
        "notifications, and system alerts.\n\n"
        "Security Note: Never share this code with anyone. REPSI support will never ask for your verification code.\n\n"
        "If you did not request this code, you can safely ignore this email.\n\n"
        "--------------------------------------------------\n"
        "REPSI Technologies - The Modern Gym & Fitness Operating System\n"
        "https://repsi.app\n"
    )
    message.set_content(plain_text)

    # Professional HTML template
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REPSI Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F7F7F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F7F7F5; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E4E2DC; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden;">
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 40px 24px 40px; text-align: left; border-bottom: 1px solid #E4E2DC;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color: #18B968; width: 36px; height: 36px; border-radius: 8px; text-align: center; vertical-align: middle;">
                    <span style="color: #FFFFFF; font-size: 20px; font-weight: 800; line-height: 36px; display: inline-block;">R</span>
                  </td>
                  <td style="padding-left: 12px;">
                    <span style="font-size: 20px; font-weight: 700; color: #17191C; letter-spacing: -0.5px;">REPSI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 40px 24px 40px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #17191C; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #6B6F76;">
                Thank you for choosing REPSI. Use the verification code below to confirm your email and continue setting up your fitness business:
              </p>

              <!-- OTP Code Card -->
              <div style="background-color: #F0FDF4; border: 1.5px solid #BBF7D0; border-radius: 12px; padding: 24px 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #15803D; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <div style="font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, Monaco, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #0F172A; padding: 4px 0 4px 12px; user-select: all; -webkit-user-select: all;">
                  {otp}
                </div>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #166534;">
                  Double-click or press &amp; hold to copy
                </p>
              </div>

              <!-- Spam / Junk Folder Advisory Callout -->
              <div style="background-color: #FFFBEB; border: 1px solid #FDE68A; border-radius: 10px; padding: 14px 16px; margin: 20px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align: top; width: 24px; font-size: 16px; line-height: 20px;">📬</td>
                    <td style="padding-left: 10px; font-size: 13px; line-height: 19px; color: #92400E;">
                      <strong>Check your Spam or Junk folder:</strong><br>
                      If you didn&apos;t find this email in your Primary Inbox, please check your <strong>Spam</strong> or <strong>Junk</strong> folder and click <strong>&ldquo;Report not spam&rdquo;</strong> to guarantee future billing receipts and member alerts reach you promptly.
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Notice & Expiry -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 16px; background-color: #F7F7F5; border-radius: 8px; padding: 14px 16px;">
                <tr>
                  <td style="font-size: 13px; line-height: 20px; color: #6B6F76;">
                    ⏱ <strong>Expires in {settings.OTP_EXPIRE_MINUTES} minutes.</strong><br>
                    🛡️ <strong>Security reminder:</strong> Never share this code with anyone. REPSI team members will never ask for your verification code.
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 20px; color: #A6A8AC;">
                If you did not initiate this request, you can safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F7F7F5; border-top: 1px solid #E4E2DC; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #A6A8AC;">
                © 2026 REPSI. All rights reserved. The Modern Gym &amp; Fitness Operating System.
              </p>
              <p style="margin: 0; font-size: 12px; color: #A6A8AC;">
                Questions? Visit <a href="https://repsi.app" style="color: #18B968; text-decoration: none; font-weight: 500;">repsi.app</a> or reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    message.add_alternative(html_content, subtype="html")

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send the verification email right now. Please try again.",
        ) from exc


def send_gym_invitation(
    email: str, name: str, role: str, gym_name: str, invite_url: str
) -> None:
    role_label = ROLE_LABELS.get(role.lower(), "member")
    subject = f"Invitation to join {gym_name} as a {role_label.capitalize()}"

    content = f"""Hello {name},

You've been invited to join {gym_name} as a {role_label}.
Accept your invitation and create your password to get started:

{invite_url}

If you did not expect this invitation, you can safely ignore this email.
"""

    if not _smtp_configured():
        _dev_print("Invitation", email, content)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(content)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.error("Failed to send invitation email to %s: %s", email, type(exc).__name__)


def send_direct_credentials_email(
    email: str, name: str, role: str, gym_name: str, password: str, login_url: str
) -> None:
    role_label = ROLE_LABELS.get(role.lower(), "member")
    subject = f"Welcome to {gym_name} — Your Account Access"

    content = f"""Hello {name},

You have been added to {gym_name} as a {role_label.capitalize()}.

Your account is now ready. For your security, passwords are never sent in plain text. Please log in to your account and finalize your profile:

{login_url}

If you ever need to set or update your password, use the 'Forgot Password' link on the login page.
"""

    if not _smtp_configured():
        _dev_print("Welcome notification", email, content)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(content)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.error("Failed to send notification email to %s: %s", email, type(exc).__name__)


def send_password_reset_email(
    email: str, name: str, reset_url: str
) -> None:
    subject = "Reset your REPSI account password"
    content = f"""Hello {name},

We received a request to set or reset your password for your REPSI account.

Click the link below to choose your new password:
{reset_url}

This link is valid for {settings.PASSWORD_RESET_EXPIRE_MINUTES} minutes. If you did not request this, you can safely ignore this email.
"""

    if not _smtp_configured():
        _dev_print("Password reset", email, content)
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.EMAIL_FROM
    message["To"] = email
    message.set_content(content)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        logger.error("Failed to send password reset email to %s: %s", email, type(exc).__name__)




def send_notification_email(email: str, subject: str, body: str) -> tuple[str, str | None]:
    """
    Plain-text notification (broadcasts, reminders, receipts) for the delivery log.
    Returns (status, error): "sent" only once the SMTP server accepted the message;
    "skipped_not_configured" without SMTP (nothing is sent or printed); "failed" otherwise.
    """
    if not _smtp_configured():
        return "skipped_not_configured", "SMTP is not configured"
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"REPSI <{settings.EMAIL_FROM}>" if "<" not in settings.EMAIL_FROM else settings.EMAIL_FROM
    message["To"] = email
    message.set_content(body)
    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
    except (OSError, smtplib.SMTPException) as exc:
        return "failed", f"SMTP error: {type(exc).__name__}"
    return "sent", None
