import random
from django.core.mail import send_mail
from django.conf import settings

def send_otp_email(email):
    otp = random.randint(100000, 999999)
    subject = "Proposal Management - Email Verification"
    message = f"""
    Hello,

    Your One-Time Password (OTP) is: {otp}

    This code will expire in 5 minutes. 
    If you didn’t request this, please ignore this email.

    Thanks,
    Proposal Management Team
    """

    send_mail(
        subject,
        message,
        settings.EMAIL_HOST_USER,
        [email],
        fail_silently=False,
    )
    return otp
