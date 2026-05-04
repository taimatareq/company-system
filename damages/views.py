from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .serializers import DamageCreateSerializer
from .services import DamageService


class DamageViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

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