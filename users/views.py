from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.serializers import ModelSerializer
import random
from datetime import timedelta
import os

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.models import User

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import EmailVerificationCode

class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_staff",
        ]

    def create(self, validated_data):
        password = self.context["request"].data.get("password")

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        return user


class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.all().order_by("id")
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
            "is_staff": request.user.is_staff,
            "is_superuser": request.user.is_superuser,
        })
class SendEmailCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.email:
            return Response(
                {"detail": "User has no email."},
                status=400
            )

        code = f"{random.randint(0, 999999):06d}"

        EmailVerificationCode.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        send_mail(
            subject="ERP Verification Code",
            message=f"Your verification code is: {code}",
            from_email=None,
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response({
            "detail": "Verification code sent."
        })
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        credential = request.data.get("credential")

        if not credential:
            return Response(
                {"detail": "Google credential is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify the token with Google
            google_user = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                os.getenv("GOOGLE_CLIENT_ID"),
            )

            email = google_user.get("email")
            first_name = google_user.get("given_name", "")
            last_name = google_user.get("family_name", "")
            email_verified = google_user.get("email_verified", False)

            if not email or not email_verified:
                return Response(
                    {"detail": "Google email is not verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Find existing user by email
            user = User.objects.filter(email__iexact=email).first()

            # First Google login -> create Django user
            if not user:
                base_username = email.split("@")[0]
                username = base_username
                counter = 1

                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                )

                # No local password for Google-created account
                user.set_unusable_password()
                user.save()

            # Create the same JWT type used by normal login
            refresh = RefreshToken.for_user(user)

            return Response({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                },
            })

        except ValueError:
            return Response(
                {"detail": "Invalid Google credential."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        except Exception as error:
            print("Google login error:", error)

            return Response(
                {"detail": "Google login failed."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )