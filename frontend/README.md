# Место есть: фронтенд прототипа

Обычные HTML, CSS и JavaScript без сборки. Открывается двойным кликом по `index.html` (всё работает на демо-данных) или через Live Server в VS Code. Карта подгружается из интернета (Leaflet и плитки OpenStreetMap), нужен интернет.

## Что где лежит
| Файл | Что делает |
|---|---|
| `index.html` | страница целиком, для просмотра без Django |
| `templates/mesto_prototype.html` | та же страница для Django (пути через `{% static %}`) |
| `static/css/mesto.css` | основные стили |
| `static/css/mesto-owner.css` | стили блока «Я владелец места» |
| `static/css/mesto-map.css` | стили карты |
| `static/js/mesto-data.js` | демо-данные района: 66 зон, 734 места, объявления |
| `static/js/mesto-api.js` | связь с сервером, включается флагами |
| `static/js/mesto-app.js` | интерфейс: вкладки, отметки, прогноз, аренда, договор, аккаунт |
| `static/js/mesto-owner.js` | владелец места: переключатель, документы, статусы |
| `static/js/mesto-map.js` | карта (Leaflet) |
| `API.md` | какие адреса и поля ждёт фронтенд, для бэкенда |

Порядок подключения скриптов важен: `mesto-data`, `mesto-api`, `mesto-app`, `mesto-owner`, затем Leaflet и `mesto-map`.

## Как устроено, чтобы можно было менять по частям
- Карта, блок владельца и связь с сервером это отдельные файлы. Приложение обращается к ним через `MAP`, `OWN` и `API`; если файл не загрузился, остальное работает (на месте карты будет заглушка).
- Приложение сообщает о действиях событиями `mesto:mark`, `mesto:signup`, `mesto:publish` и т.д., а `mesto-api.js` отправляет их на сервер.
- Разделы API включаются по одному флагами в `window.MESTO_CONFIG` в шаблоне (`false` на `true`), пока флаг выключен, раздел работает на демо. Подробности в `API.md`.
- Всё, что вводит пользователь, перед вставкой в страницу проходит через `esc()`.

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
