# Шаверма — предзаказ

Next.js 16 + PostgreSQL (Prisma 7) + Auth.js + Leaflet/OpenStreetMap.

## Запуск

```bash
npm install
cp .env.example .env        # заполнить DATABASE_URL и AUTH_SECRET
npx prisma migrate dev      # создать схему
npx prisma db seed          # 5 тестовых заведений в Москве
npm run dev
```

## Переменные окружения

| Переменная      | Назначение                                        |
| --------------- | ------------------------------------------------- |
| `DATABASE_URL`  | строка подключения PostgreSQL                     |
| `AUTH_SECRET`   | секрет Auth.js (`npx auth secret`)                |
| `SEED_PASSWORD` | пароль всех тестовых пользователей (`password123`) |

## Тестовые пользователи

`admin@shawarma.local`, `owner-tverskaya@shawarma.local`, `cook-tverskaya@shawarma.local` (также `-myasnitskaya`, `-arbat`, `-kurskaya`, `-lesnaya`).

## Тесты

```bash
npm test
```
