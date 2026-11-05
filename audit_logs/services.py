from .models import AuditLog


class AuditLogService:
    @staticmethod
    def log(
        *,
        organization,
        user,
        module,
        action,
        object_type,
        object_id=None,
        description="",
        old_values=None,
        new_values=None,
    ):
        if organization is None:
            raise ValueError(
                "Organization is required for Audit Log."
            )

        return AuditLog.objects.create(
            organization=organization,
            user=user,
            module=module,
            action=action,
            object_type=object_type,
            object_id=str(object_id) if object_id is not None else None,
            description=description,
            old_values=old_values or {},
            new_values=new_values or {},
        )