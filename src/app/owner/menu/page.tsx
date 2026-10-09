import Link from "next/link";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { requireVenueUser } from "@/lib/session";
import { createCategory, createItem, deleteCategory, toggleItemAvailable, updateCategory } from "../actions";

export const metadata = { title: "Меню" };

export default async function OwnerMenuPage() {
  const user = await requireVenueUser("OWNER");
  const venue = await db.venue.findUniqueOrThrow({ where: { id: user.venueId }, select: { currency: true } });
  const categories = await db.menuCategory.findMany({
    where: { venueId: user.venueId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { groups: true } } },
      },
    },
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <section className="space-y-6">
        <h1 className="text-xl font-bold">Меню</h1>
        {categories.length === 0 && <p className="text-neutral-500">Создайте первую категорию справа.</p>}
        {categories.map((cat) => (
          <div key={cat.id} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start gap-2">
              <ActionForm action={updateCategory} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={cat.id} />
                <input name="name" defaultValue={cat.name} className="input max-w-xs font-semibold" required />
                <input
                  name="sortOrder"
                  type="number"
                  defaultValue={cat.sortOrder}
                  className="input w-20"
                  title="Порядок"
                />
                <SubmitButton className="btn-secondary text-sm">Сохранить</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteCategory}>
                <input type="hidden" name="id" value={cat.id} />
                <SubmitButton
                  className="btn-secondary text-sm text-red-600"
                  confirm={`Удалить категорию «${cat.name}» вместе со всеми позициями?`}
                >
                  Удалить
                </SubmitButton>
              </ActionForm>
            </div>

            <ul className="mt-3 divide-y divide-neutral-100">
              {cat.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-2 text-sm">
                  <Link href={`/owner/menu/${item.id}`} className="flex-1 hover:text-orange-600">
                    <span className={item.available ? "font-medium" : "text-neutral-400 line-through"}>
                      {item.name}
                    </span>
                    {item._count.groups > 0 && (
                      <span className="ml-2 text-neutral-500">добавок: {item._count.groups}</span>
                    )}
                  </Link>
                  <span>{formatMoney(item.price, venue.currency)}</span>
                  <ActionForm action={toggleItemAvailable}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="available" value={String(!item.available)} />
                    <SubmitButton className="btn-secondary px-2 py-1 text-xs">
                      {item.available ? "Скрыть" : "Вернуть"}
                    </SubmitButton>
                  </ActionForm>
                </li>
              ))}
              {cat.items.length === 0 && <li className="py-2 text-sm text-neutral-500">Нет позиций</li>}
            </ul>
          </div>
        ))}
      </section>

      <aside className="space-y-6">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h2 className="mb-3 font-semibold">Новая категория</h2>
          <ActionForm action={createCategory} className="space-y-2">
            <input name="name" placeholder="Например, «Шаверма»" className="input" required />
            <SubmitButton>Добавить</SubmitButton>
          </ActionForm>
        </div>

        {categories.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h2 className="mb-3 font-semibold">Новая позиция</h2>
            <ActionForm action={createItem} className="space-y-2">
              <select name="categoryId" className="input" required>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input name="name" placeholder="Название" className="input" required />
              <input name="description" placeholder="Описание" className="input" />
              <input name="price" placeholder={`Цена, ${venue.currency}`} className="input" inputMode="decimal" required />
              <SubmitButton>Добавить</SubmitButton>
            </ActionForm>
          </div>
        )}
      </aside>
    </div>
  );
}
