from django.urls import path
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path("api/spots/", views.spots_geojson),
    path("api/spots/<str:code>/status/", views.set_status),
    path("api/spots/<str:code>/heatmap/", views.spot_heatmap),
    path("map/", TemplateView.as_view(template_name="main/map.html")),
    path('', views.index)
]

