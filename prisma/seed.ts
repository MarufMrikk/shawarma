import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const password = process.env.SEED_PASSWORD ?? "password123";

type SeedVenue = {
  key: string;
  name: string;
  country: string;
  currency: string;
  timezone: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  /** multiplier from base RUB-kopeck prices to this currency's minor units */
  priceFactor: number;
  hours: { opensAt: number; closesAt: number };
};

const venues: SeedVenue[] = [
  {
    key: "msk",
    name: "Шаверма на Тверской",
    country: "RU",
    currency: "RUB",
    timezone: "Europe/Moscow",
    city: "Москва",
    address: "Тверская ул., 12",
    lat: 55.7616,
    lng: 37.6094,
    phone: "+74951234567",
    priceFactor: 1,
    hours: { opensAt: 0, closesAt: 1440 },
  },
  {
    key: "ala",
    name: "Донер Алматы",
    country: "KZ",
    currency: "KZT",
    timezone: "Asia/Almaty",
    city: "Алматы",
    address: "пр. Абая, 45",
    lat: 43.2389,
    lng: 76.8897,
    phone: "+77272345678",
    priceFactor: 6,
    hours: { opensAt: 9 * 60, closesAt: 2 * 60 },
  },
  {
    key: "tas",
    name: "Шаурма Ташкент",
    country: "UZ",
    currency: "UZS",
    timezone: "Asia/Tashkent",
    city: "Ташкент",
    address: "ул. Амира Темура, 7",
    lat: 41.3111,
    lng: 69.2797,
    phone: "+998712345678",
    priceFactor: 140,
    hours: { opensAt: 10 * 60, closesAt: 23 * 60 },
  },
];

const menu = [
  {
    category: "Шаверма",
    items: [
      { name: "Классическая", description: "Курица, овощи, соус", price: 32000 },
      { name: "Говяжья", description: "Говядина, овощи, соус", price: 39000 },
      { name: "Сырная", description: "Курица, сыр, овощи", price: 36000 },
    ],
  },
  {
    category: "Напитки",
    items: [
      { name: "Айран", description: "0,5 л", price: 12000 },
      { name: "Морс", description: "0,5 л", price: 10000 },
    ],
  },
];

async function main() {
  await db.$transaction([
    db.leadNote.deleteMany(),
    db.orderItem.deleteMany(),
    db.order.deleteMany(),
    db.user.deleteMany(),
    db.venue.deleteMany(),
    db.lead.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash(password, 10);

  await db.user.create({
    data: { email: "admin@shawarma.local", name: "Администратор", role: "ADMIN", passwordHash },
  });

  for (const v of venues) {
    const venue = await db.venue.create({
      data: {
        slug: v.key,
        name: v.name,
        country: v.country,
        currency: v.currency,
        timezone: v.timezone,
        city: v.city,
        address: v.address,
        lat: v.lat,
        lng: v.lng,
        phone: v.phone,
        approved: true,
        commissionPercent: 10,
        hours: {
          create: Array.from({ length: 7 }, (_, weekday) => ({ weekday, ...v.hours })),
        },
        users: {
          create: [
            { email: `owner-${v.key}@shawarma.local`, name: `Владелец ${v.city}`, role: "OWNER", passwordHash },
            { email: `cook-${v.key}@shawarma.local`, name: `Повар ${v.city}`, role: "STAFF", passwordHash },
          ],
        },
      },
    });

    for (const [ci, cat] of menu.entries()) {
      const category = await db.menuCategory.create({
        data: { venueId: venue.id, name: cat.category, sortOrder: ci },
      });
      for (const [ii, item] of cat.items.entries()) {
        const isShawarma = ci === 0;
        await db.menuItem.create({
          data: {
            venueId: venue.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: item.price * v.priceFactor,
            sortOrder: ii,
            groups: isShawarma
              ? {
                  create: [
                    {
                      name: "Размер",
                      minSelect: 1,
                      maxSelect: 1,
                      sortOrder: 0,
                      options: {
                        create: [
                          { name: "Стандарт", priceDelta: 0, sortOrder: 0 },
                          { name: "Большая", priceDelta: 9000 * v.priceFactor, sortOrder: 1 },
                        ],
                      },
                    },
                    {
                      name: "Соус",
                      minSelect: 0,
                      maxSelect: 2,
                      sortOrder: 1,
                      options: {
                        create: [
                          { name: "Чесночный", priceDelta: 0, sortOrder: 0 },
                          { name: "Острый", priceDelta: 0, sortOrder: 1 },
                          { name: "Сырный", priceDelta: 3000 * v.priceFactor, sortOrder: 2 },
                        ],
                      },
                    },
                    {
                      name: "Убрать",
                      minSelect: 0,
                      maxSelect: 3,
                      sortOrder: 2,
                      options: {
                        create: [
                          { name: "Без лука", sortOrder: 0 },
                          { name: "Без огурцов", sortOrder: 1 },
                          { name: "Без помидоров", sortOrder: 2 },
                        ],
                      },
                    },
                  ],
                }
              : undefined,
          },
        });
      }
    }
  }

  await db.lead.create({
    data: {
      venueName: "Шаверма у вокзала",
      country: "BY",
      city: "Минск",
      address: "ул. Кирова, 3",
      contactName: "Иван",
      phone: "+375291234567",
      status: "contacted",
    },
  });

  console.log(`Seeded. Password for all users: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
