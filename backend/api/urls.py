from django.urls import path

from api.views import find_analog, simulate_wear


urlpatterns = [
    path("find-analog/", find_analog, name="find_analog"),
    path("simulate-wear/", simulate_wear, name="simulate_wear"),
]
