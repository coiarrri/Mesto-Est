import json
from django.core.management.base import BaseCommand
from main.models import ParkingSpot


class Command(BaseCommand):
    help = "Импорт парковочных мест из GeoJSON"

    def add_arguments(self, parser):
        parser.add_argument("path")

    def handle(self, *args, **opts):
        with open(opts["path"], encoding="utf-8") as f:
            data = json.load(f)
        count = 0
        for i, feat in enumerate(data["features"], 1):
            props = feat.get("properties") or {}
            ParkingSpot.objects.update_or_create(
                code=str(props.get("id") or f"spot-{i}"),
                defaults={"block": props.get("block", ""),
                          "geometry": feat["geometry"]},
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f"Загружено мест: {count}"))