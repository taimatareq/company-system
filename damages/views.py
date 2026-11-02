from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import DamageCreateSerializer, DamageListSerializer
from .models import Damage
from .services import DamageService


class DamageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    def list(self, request):
        damages = Damage.objects.select_related(
            "warehouse",
            "created_by"
        ).prefetch_related(
            "items__item"
        ).order_by("-damage_date", "-id")

        serializer = DamageListSerializer(damages, many=True)
        return Response(serializer.data)
    def create(self, request):
        serializer = DamageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        damage = DamageService.create_damage(
            validated_data=serializer.validated_data,
            user=request.user
        )

        return Response(
            {
                "id": damage.id,
                "message": "Damage created successfully"
            },
            status=status.HTTP_201_CREATED
        )