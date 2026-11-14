from django.urls import path

from api.views import find_analog


urlpatterns = [
    path("find-analog/", find_analog, name="find_analog"),
]
