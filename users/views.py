from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework.serializers import ModelSerializer
import random
from datetime import timedelta

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