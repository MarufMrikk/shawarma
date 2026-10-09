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
| `PARTNER_HOST`  | необязательно: отдельный домен кабинета шавермных |
| `SITE_URL`      | необязательно: адрес клиентского сайта для ссылок из кабинета |

## Два сайта

- `/` — сайт для гостей: карта, меню, заказ. Без регистрации и без входа.
- `/partner` — кабинет шавермных: заявка на подключение, вход, кухня, меню, админка.
  Сессия сотрудника живёт только в `/partner`. С `PARTNER_HOST` кабинет открывается только на своём домене.

## Тестовые пользователи (вход: `/partner/login`)

`admin@shawarma.local`, `owner-tverskaya@shawarma.local`, `cook-tverskaya@shawarma.local` (также `-myasnitskaya`, `-arbat`, `-kurskaya`, `-lesnaya`).

## Тесты

```bash
npm test
```

## Демо на GitHub Pages

Workflow `.github/workflows/pages.yml` при пуше в `main` собирает статичную демо-версию клиентской части
(`scripts/build-demo.mjs`): данные берутся из сидов на этапе сборки, заказы хранятся только в браузере,
кабинет шавермных в демо не входит. Полная версия требует сервера и PostgreSQL.
