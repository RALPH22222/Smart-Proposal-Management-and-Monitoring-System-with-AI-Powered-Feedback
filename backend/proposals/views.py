from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.core.cache import cache
from .utils import send_otp_email

@api_view(["POST"])
def send_otp(request):
    email = request.data.get("email")
    if not email:
        return Response({"error": "Email is required"}, status=400)

    otp = send_otp_email(email)
    cache.set(email, otp, timeout=300)  # OTP expires in 5 min

    return Response({"message": "OTP sent!"})

@api_view(["POST"])
def verify_otp(request):
    email = request.data.get("email")
    otp = request.data.get("otp")
    saved_otp = cache.get(email)

    if saved_otp and str(saved_otp) == str(otp):
        return Response({"message": "OTP verified!"})
    return Response({"error": "Invalid or expired OTP"}, status=400)
