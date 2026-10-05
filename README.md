# Таиланд, 6–26 декабря — Vue-версия

Сайт поездки: маршрут из 7 остановок, все отели города на наши даты с разбором отзывов, районы, места, поездки до 2 часов, события и общие отметки «+/−».

Стек: **Vue 3 + TypeScript + Vite 8**, Pinia, vue-router (hash), TanStack Virtual, Leaflet + OpenStreetMap, Firebase Firestore, vite-plugin-pwa.

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # сборка в dist/
npm run typecheck  # vue-tsc
```

Деплой — автоматически через GitHub Actions при пуше в `main` (`.github/workflows/deploy.yml`). В настройках репозитория: **Settings → Pages → Source: GitHub Actions**.

## Как устроено

```
src/
  lib/            бизнес-логика без фреймворка (копия есть в React-версии)
    types.ts      типы данных
    rows.ts       строки таблицы для остановки: цена, расстояние, моя оценка, «Коротко об отеле»
    filters.ts    фильтры, сортировка, сохранение фильтров в адресе страницы
    marks.ts      отметки «+/−»: localStorage + Firestore, имя пользователя
    data.ts       загрузка JSON по требованию
  stores/trip.ts  Pinia: индекс маршрута, отели, цены, фильтры по остановкам
  composables/useMarks.ts  связка marks.ts с реактивностью Vue
  components/     UI
public/data/      данные: index.json, cities/<город>.json, prices/<остановка>.json
```

- **Данные грузятся по частям:** при старте только `index.json` (13 КБ gzip), отели города — когда открывают остановку.
- **Таблица виртуальная:** рисуются только видимые строки, «наш» отель закреплён первой строкой.
- **PWA:** после первого визита сайт и все данные работают без интернета; отметки досинхронизируются, когда появится сеть (Firestore offline cache).
- **Отметки** хранятся в `trips/<TRIP_ID>/people/p-<имя>` — та же схема, что у первой версии сайта, поэтому все версии видят одни и те же отметки.
