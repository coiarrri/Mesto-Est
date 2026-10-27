# Место есть: фронтенд прототипа

Обычные HTML, CSS и JavaScript без сборки.

## Что где лежит
- `index.html`: страница целиком (для просмотра без Django)
- `templates/mesto_prototype.html`: та же страница для Django (пути через `{% static %}`)
- `static/css/mesto.css`: все стили
- `static/js/mesto-data.js`: демо-данные района (зоны, аренда). Потом заменяются данными из API
- `static/js/mesto-app.js`: интерфейс: вкладки, отметки «Свободно / Занято», прогноз, аренда, договор, аккаунт

## Карта
Карты в этой папке нет, вкладка «Карта» показывает заглушку. Карта живёт в отдельных файлах `mesto-map.js` и `mesto-map.css` и подключается двумя строками в `index.html`. Приложение вызывает карту только через объект `MAP`, поэтому её можно заменить, не трогая остальное.

## Подключение к Django (для бэкенда)
1. Скопировать `static/css/mesto.css`, `static/js/mesto-app.js`, `static/js/mesto-data.js` в `static/` проекта.
2. Скопировать `templates/mesto_prototype.html` в `templates/`.
3. В `views.py`: `return render(request, 'mesto_prototype.html')`
4. Данные из `mesto-data.js` (зоны, места, аренда) заменить запросами к API.

## Бэкенд (Django)

### Запуск
```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py import_spots main/data/spots.geojson
python manage.py seed_fake_data      # ТЕСТОВЫЕ данные (если команда есть)
python manage.py rebuild_stats
python manage.py runserver
```
Сайт: http://127.0.0.1:8000/

### Модели (main/models.py)
- ParkingSpot: парковочное место (code, геометрия, текущий статус)
- SpotObservation: журнал замеров «занято/свободно»
- SpotHourStat: счётчики по месту, дате, дню недели и часу

### API
- GET /api/spots/ : все места в GeoJSON со статусом и «обычно свободно, %»
- POST /api/spots/<code>/status/ : принять {"is_occupied": true/false}
- GET /api/spots/<code>/heatmap/ : матрица «час × день недели»

### Данные
- main/data/spots.geojson: места, оцифрованные по спутнику
- Команды: import_spots (загрузка), rebuild_stats (пересчёт), seed_fake_data (тестовые данные, `--clear` удаляет)
- db.sqlite3 в Git не хранится: после клонирования выполнить команды из раздела «Запуск»