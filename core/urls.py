from django.http import JsonResponse
from django.urls import include, path
from rest_framework import routers

from tasks.views import GroupViewSet, TaskViewSet, UserViewSet

router = routers.DefaultRouter()
router.register(r"users", UserViewSet)
router.register(r"groups", GroupViewSet)
router.register(r"tasks", TaskViewSet)

def health(request):
    return JsonResponse({"status": "ok"})

# Wire up our API using automatic URL routing.
# Additionally, we include login URLs for the browsable API.
urlpatterns = [
    path("health/", health),
    path("", include(router.urls)),
    path("api-auth/", include("rest_framework.urls", namespace="rest_framework")),
    path('', include('django_prometheus.urls'))
]