from django.urls import path

from api.views import analogs, find_analog, simulate_wear, targets


urlpatterns = [
    path("find-analog/", find_analog, name="find_analog"),
    path("simulate-wear/", simulate_wear, name="simulate_wear"),
    path("targets/", targets, name="targets"),
    path("analogs/", analogs, name="analogs"),
]
