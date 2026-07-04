from rest_framework import permissions, viewsets
from diario.models import Daylog
from diario.serializers import DaylogSerializer

class DaylogViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allow users to view a list of their Daylog
    """

    queryset = Daylog.objects.all()
    serializer_class = DaylogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)