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
  address: string;
  lat: number;
  lng: number;
  phone: string;
  /** price multiplier relative to the base menu */
  priceFactor: number;
  hours: { opensAt: number; closesAt: number };
};

const venues: SeedVenue[] = [
  {
    key: "tverskaya",
    name: "Шаверма на Тверской",
    address: "Тверская ул., 12",
    lat: 55.7616,
    lng: 37.6094,
    phone: "+74951234567",
    priceFactor: 1.1,
    hours: { opensAt: 0, closesAt: 1440 },
  },
  {
    key: "myasnitskaya",
    name: "Лаваш и гриль",
    address: "Мясницкая ул., 24",
    lat: 55.7637,
    lng: 37.6365,
    phone: "+74952345678",
    priceFactor: 1,
    hours: { opensAt: 9 * 60, closesAt: 2 * 60 },
  },
  {
    key: "arbat",
    name: "Дёнер на Арбате",
    address: "ул. Арбат, 38",
    lat: 55.7495,
    lng: 37.59,
    phone: "+74953456789",
    priceFactor: 1.2,
    hours: { opensAt: 10 * 60, closesAt: 23 * 60 },
  },
  {
    key: "kurskaya",
    name: "Шаурма у Курской",
    address: "ул. Земляной Вал, 29",
    lat: 55.757,
    lng: 37.6595,
    phone: "+74954567890",
    priceFactor: 0.9,
    hours: { opensAt: 8 * 60, closesAt: 24 * 60 },
  },
  {
    key: "lesnaya",
    name: "Шаверма на Лесной",
    address: "Лесная ул., 5",
    lat: 55.7765,
    lng: 37.5838,
    phone: "+74955678901",
    priceFactor: 1,
    hours: { opensAt: 11 * 60, closesAt: 23 * 60 },
  },
];

/** Base prices in kopecks. */
const menu = [
  {
    category: "Шаверма",
    withAddons: true,
    items: [
      { name: "Классическая", description: "Курица на гриле, капуста, огурцы, помидоры, чесночный соус", price: 32000 },
      { name: "Говяжья", description: "Говядина, маринованный лук, помидоры, соус тахини", price: 39000 },
      { name: "Сырная", description: "Курица, сыр, картофель фри внутри, сырный соус", price: 36000 },
      { name: "С фалафелем", description: "Фалафель, хумус, свежие овощи, соус тахини", price: 30000 },
    ],
  },
  {
    category: "Гарниры",
    withAddons: false,
    items: [
      { name: "Картофель фри", description: "Порция 150 г", price: 15000 },
      { name: "Хумус с лавашем", description: "Нутовая паста, оливковое масло, паприка", price: 22000 },
    ],
  },
  {
    category: "Напитки",
    withAddons: false,
    items: [
      { name: "Айран", description: "0,5 л", price: 12000 },
      { name: "Морс клюквенный", description: "0,5 л", price: 10000 },
      { name: "Чай с чабрецом", description: "0,4 л", price: 9000 },
    ],
  },
];

/** Applies the venue factor and rounds to whole 10 ₽. */
const venuePrice = (base: number, factor: number) => Math.round((base * factor) / 1000) * 1000;

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
        country: "RU",
        currency: "RUB",
        timezone: "Europe/Moscow",
        city: "Москва",
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
            { email: `owner-${v.key}@shawarma.local`, name: `Владелец ${v.name}`, role: "OWNER", passwordHash },
            { email: `cook-${v.key}@shawarma.local`, name: `Повар ${v.name}`, role: "STAFF", passwordHash },
          ],
        },
      },
    });

    for (const [ci, cat] of menu.entries()) {
      const category = await db.menuCategory.create({
        data: { venueId: venue.id, name: cat.category, sortOrder: ci },
      });
      for (const [ii, item] of cat.items.entries()) {
        const isShawarma = cat.withAddons;
        await db.menuItem.create({
          data: {
            venueId: venue.id,
            categoryId: category.id,
            name: item.name,
            description: item.description,
            price: venuePrice(item.price, v.priceFactor),
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
                          { name: "Большая", priceDelta: 9000, sortOrder: 1 },
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
                          { name: "Сырный", priceDelta: 3000, sortOrder: 2 },
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
      venueName: "Шаверма у Павелецкой",
      country: "RU",
      city: "Москва",
      address: "Павелецкая пл., 1",
      contactName: "Иван",
      phone: "+79161234567",
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
