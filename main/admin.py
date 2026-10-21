from django.contrib import admin
from .models import ParkingSpot, SpotObservation, SpotHourStat


@admin.register(ParkingSpot)
class ParkingSpotAdmin(admin.ModelAdmin):
    list_display = ("code", "block", "is_occupied", "status_updated_at")
    list_filter = ("block", "is_occupied")
    search_fields = ("code",)


@admin.register(SpotObservation)
class SpotObservationAdmin(admin.ModelAdmin):
    list_display = ("spot", "is_occupied", "observed_at")
    list_filter = ("is_occupied", "spot__block")


@admin.register(SpotHourStat)
class SpotHourStatAdmin(admin.ModelAdmin):
    list_display = ("spot", "weekday", "hour", "total", "free")
    list_filter = ("weekday", "hour")