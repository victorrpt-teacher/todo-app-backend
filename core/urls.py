from django.http import JsonResponse
from django.urls import include, path
from rest_framework import routers
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from tasks.views import GroupViewSet, TaskViewSet, UserViewSet
from diario.views import DaylogViewSet

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"groups", GroupViewSet)
router.register(r"tasks", TaskViewSet)
router.register(r"diario", DaylogViewSet)


def health(request):
    return JsonResponse({"status": "ok"})


# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path("health/", health),
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include('django_prometheus.urls'))
]
