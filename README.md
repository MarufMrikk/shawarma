# Шаверма — предзаказ

Next.js 16 + PostgreSQL (Prisma 7) + Auth.js + Leaflet/OpenStreetMap.

## Запуск

```bash
npm install
cp .env.example .env        # заполнить DATABASE_URL и AUTH_SECRET
npx prisma migrate dev      # создать схему
npx prisma db seed          # 3 тестовых заведения (RU, KZ, UZ)
npm run dev
```

## Переменные окружения

| Переменная      | Назначение                                        |
| --------------- | ------------------------------------------------- |
| `DATABASE_URL`  | строка подключения PostgreSQL                     |
| `AUTH_SECRET`   | секрет Auth.js (`npx auth secret`)                |
| `SEED_PASSWORD` | пароль всех тестовых пользователей (`password123`) |

## Тестовые пользователи

`admin@shawarma.local`, `owner-msk@…`, `cook-msk@…` (также `-ala`, `-tas`) — домен `shawarma.local`.

## Тесты

```bash
npm test
```
