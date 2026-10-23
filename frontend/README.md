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
