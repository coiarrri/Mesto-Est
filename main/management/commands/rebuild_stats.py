from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import ExtractHour, ExtractIsoWeekDay, TruncDate

from main.models import SpotObservation, SpotHourStat


class Command(BaseCommand):
    help = "Пересчитать почасовую статистику (дата, день недели, час)"

    @transaction.atomic
    def handle(self, *args, **opts):
        rows = (SpotObservation.objects
                .annotate(d=TruncDate("observed_at"),
                          wd=ExtractIsoWeekDay("observed_at"),
                          hour=ExtractHour("observed_at"))
                .values("spot_id", "d", "wd", "hour")
                .annotate(total=Count("id"),
                          free=Count("id", filter=Q(is_occupied=False))))
        SpotHourStat.objects.all().delete()
        SpotHourStat.objects.bulk_create([
            SpotHourStat(spot_id=r["spot_id"], date=r["d"], weekday=r["wd"],
                         hour=r["hour"], total=r["total"], free=r["free"])
            for r in rows
        ])
        self.stdout.write(self.style.SUCCESS(f"Готово: {len(rows)} строк"))