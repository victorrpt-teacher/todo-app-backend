from rest_framework import serializers

from diario.models import Daylog


class DaylogSerializer(serializers.HyperlinkedModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")

    class Meta:
        model = Daylog
        fields = [
            "url",
            "created",
            "day_highlights",
            "highlight",
            "owner",
        ]
