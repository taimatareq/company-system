from django.contrib.auth.models import User
from rest_framework import generics
from rest_framework.permissions import IsAdminUser
from rest_framework import serializers
import random
from datetime import timedelta
from rest_framework.permissions import BasePermission
import os
from .models import EmailVerificationCode, UserProfile
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib.auth.models import User
from organizations.models import OrganizationMembership
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated


class UserSerializer(serializers.ModelSerializer):
    phone = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    auth_provider = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "auth_provider",
            "first_name",
            "last_name",
            "email",
            "phone",
            "profile_image",
            "is_active",
            "is_staff",
            "role",
            "organization",
            "is_superuser",
        ]

    def get_phone(self, user):
        profile, created = UserProfile.objects.get_or_create(
            user=user
        )
        return profile.phone
    def get_auth_provider(self, user):
        profile, _ = UserProfile.objects.get_or_create(
            user=user
        )
        return profile.auth_provider
    def get_role(self, user):
        membership = OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__is_active=True,
        ).first()

        if membership:
            return membership.role

        return None


    def get_organization(self, user):
        membership = OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__is_active=True,
        ).select_related("organization").first()

        if membership:
            return {
                "id": membership.organization.id,
                "name": membership.organization.name,
            }

        return None
    def get_profile_image(self, user):
        profile, created = UserProfile.objects.get_or_create(
            user=user
        )

        request = self.context.get("request")

        if profile.profile_image:
            if request:
                return request.build_absolute_uri(
                    profile.profile_image.url
                )
            return profile.profile_image.url

        if profile.google_picture_url:
            return profile.google_picture_url

        return None

    def create(self, validated_data):
        password = self.context["request"].data.get(
            "password"
        )

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        UserProfile.objects.get_or_create(
            user=user
        )

        return user

    def update(self, instance, validated_data):
        request = self.context["request"]

        # Update User fields
        for field in [
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
        ]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()

        # Get or create profile
        profile, _ = UserProfile.objects.get_or_create(
            user=instance
        )

        # Update phone
        if "phone" in request.data:
            profile.phone = request.data.get(
                "phone",
                ""
            ).strip()

        # Remove profile image
        if request.data.get("remove_profile_image") == "true":

            if profile.profile_image:
                profile.profile_image.delete(save=False)

            profile.profile_image = None
            profile.google_picture_url = None

        # Upload / replace profile image
        elif "profile_image" in request.FILES:

            if profile.profile_image:
                profile.profile_image.delete(save=False)

            profile.profile_image = request.FILES["profile_image"]

            # Uploaded image takes priority over Google image
            profile.google_picture_url = None

        # مهم: الحفظ خارج الشروط
        profile.save()

        return instance
        
class IsSystemOrCompanyAdmin(BasePermission):
    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        # System Admin
        if user.is_superuser:
            return True

        # Company Admin
        return OrganizationMembership.objects.filter(
            user=user,
            role="company_admin",
            is_active=True,
            organization__is_active=True,
        ).exists()
class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsSystemOrCompanyAdmin]

    def get_queryset(self):
        user = self.request.user

        # System Admin can see all users
        if user.is_superuser:
            return User.objects.all().order_by("id")

        membership = OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__is_active=True,
        ).first()

        if not membership:
            return User.objects.none()

        return User.objects.filter(
            organization_membership__organization=membership.organization,
            organization_membership__is_active=True,
        ).order_by("id")    
    def perform_create(self, serializer):
        current_user = self.request.user

        # Create the new user
        new_user = serializer.save()

        # Role selected from frontend
        role = self.request.data.get("role", "user")

        # Only allow valid organization roles
        if role not in ["company_admin", "user"]:
            role = "user"

        # Find current user's organization
        membership = OrganizationMembership.objects.filter(
            user=current_user,
            is_active=True,
            organization__is_active=True,
        ).first()

        # Add new user to the same organization
        if membership:
            OrganizationMembership.objects.create(
                user=new_user,
                organization=membership.organization,
                role=role,
                is_active=True,
            )
class UserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    http_method_names = ["patch"]

    def patch(self, request, *args, **kwargs):
        target_user = self.get_object()

        if (
            target_user == request.user
            and request.data.get("is_active") is False
        ):
            return Response(
                {
                    "detail":
                    "You cannot deactivate your own account."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().patch(
            request,
            *args,
            **kwargs
        )
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        profile, created = UserProfile.objects.get_or_create(
            user=user
        )
        membership = OrganizationMembership.objects.filter(
            user=user,
            is_active=True,
            organization__is_active=True,
        ).select_related("organization").first()

        profile_image = None

        if profile.profile_image:
            profile_image = request.build_absolute_uri(
                profile.profile_image.url
            )
        elif profile.google_picture_url:
            profile_image = profile.google_picture_url

        return Response({
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "is_active": user.is_active,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
            "phone": profile.phone,
            "profile_image": profile_image,
            "auth_provider": profile.auth_provider,

            "organization": {
                "id": membership.organization.id,
                "name": membership.organization.name,
            } if membership else None,

            "role": membership.role if membership else None,
        })

    def patch(self, request):
        user = request.user

        profile, created = UserProfile.objects.get_or_create(
            user=user
        )

        if "first_name" in request.data:
            user.first_name = request.data.get(
                "first_name",
                ""
            ).strip()

        if "last_name" in request.data:
            user.last_name = request.data.get(
                "last_name",
                ""
            ).strip()

        if "phone" in request.data:
            profile.phone = request.data.get(
                "phone",
                ""
            ).strip()

        if "profile_image" in request.FILES:
            image = request.FILES["profile_image"]

            allowed_types = [
                "image/jpeg",
                "image/png",
                "image/webp",
            ]

            if image.content_type not in allowed_types:
                return Response(
                    {
                        "detail":
                        "Only JPG, PNG and WEBP images are allowed."
                    },
                    status=400
                )

            max_size = 5 * 1024 * 1024

            if image.size > max_size:
                return Response(
                    {
                        "detail":
                        "Image must be smaller than 5 MB."
                    },
                    status=400
                )

            profile.profile_image = image

        user.save()
        profile.save()

        profile_image = None

        if profile.profile_image:
            profile_image = request.build_absolute_uri(
                profile.profile_image.url
            )
        elif profile.google_picture_url:
            profile_image = profile.google_picture_url

        return Response({
            "detail": "Profile updated successfully.",
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": profile.phone,
            "profile_image": profile_image,
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
            google_picture = google_user.get("picture", "")

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
                if not user.is_active:
                    return Response(
                        {
                            "detail":
                            "This account has been deactivated."
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            # # Block inactive users
            # if not user.is_active:
            #     return Response(
            #         {
            #             "detail":
            #             "This account has been deactivated."
            #         },
            #         status=status.HTTP_403_FORBIDDEN,
            #     )

            # Get or create user profile
            profile, created = UserProfile.objects.get_or_create(
                user=user
            )

            # Mark this account as using Google login
            profile.auth_provider = "google"

            # Save Google profile picture if no uploaded image exists
            if google_picture and not profile.profile_image:
                profile.google_picture_url = google_picture

            profile.save()

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