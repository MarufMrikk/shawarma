import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { formatMoney, toMajorString } from "@/lib/money";
import { requireVenueUser } from "@/lib/session";
import { createGroup, createOption, deleteGroup, deleteItem, deleteOption, updateGroup, updateItem } from "../../actions";

export const metadata = { title: "Позиция меню" };

export default async function MenuItemPage({ params }: PageProps<"/owner/menu/[itemId]">) {
  const user = await requireVenueUser("OWNER");
  const { itemId } = await params;
  const item = await db.menuItem.findFirst({
    where: { id: itemId, venueId: user.venueId },
    include: {
      venue: { select: { currency: true } },
      groups: { orderBy: { sortOrder: "asc" }, include: { options: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!item) notFound();
  const categories = await db.menuCategory.findMany({
    where: { venueId: user.venueId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });
  const currency = item.venue.currency;

  return (
    <div className="space-y-8">
      <Link href="/owner/menu" className="text-sm text-muted hover:text-chili">
        ← Меню
      </Link>

      <section className="max-w-lg rounded-xl border border-line bg-white p-4">
        <h1 className="sign mb-3 text-[44px]">{item.name}</h1>
        <ActionForm action={updateItem} className="space-y-3">
          <input type="hidden" name="id" value={item.id} />
          <label className="block text-sm">
            Название
            <input name="name" defaultValue={item.name} className="input mt-1" required />
          </label>
          <label className="block text-sm">
            Описание
            <input name="description" defaultValue={item.description} className="input mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Цена, {currency}
              <input
                name="price"
                defaultValue={toMajorString(item.price, currency)}
                className="input mt-1"
                inputMode="decimal"
                required
              />
            </label>
            <label className="block text-sm">
              Порядок
              <input name="sortOrder" type="number" defaultValue={item.sortOrder} className="input mt-1" />
            </label>
          </div>
          <label className="block text-sm">
            Категория
            <select name="categoryId" defaultValue={item.categoryId} className="input mt-1">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="available" defaultChecked={item.available} />
            Доступна для заказа
          </label>
          <SubmitButton>Сохранить</SubmitButton>
        </ActionForm>
        <ActionForm action={deleteItem} className="mt-4 border-t border-line pt-4">
          <input type="hidden" name="id" value={item.id} />
          <SubmitButton className="btn-secondary text-sm text-chili" confirm="Удалить позицию?">
            Удалить позицию
          </SubmitButton>
        </ActionForm>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Добавки</h2>
        <p className="text-sm text-muted">
          Группа с минимумом 1 и максимумом 1 — обязательный выбор (например, размер). Минимум 0 — по желанию
          (соусы, «без лука»).
        </p>

        {item.groups.map((g) => (
          <div key={g.id} className="max-w-2xl rounded-xl border border-line bg-white p-4">
            <div className="flex flex-wrap items-end gap-2">
              <ActionForm action={updateGroup} className="flex flex-1 flex-wrap items-end gap-2">
                <input type="hidden" name="id" value={g.id} />
                <label className="text-sm">
                  Группа
                  <input name="name" defaultValue={g.name} className="input mt-1" required />
                </label>
                <label className="text-sm">
                  Мин.
                  <input name="minSelect" type="number" min={0} defaultValue={g.minSelect} className="input mt-1 w-20" />
                </label>
                <label className="text-sm">
                  Макс.
                  <input name="maxSelect" type="number" min={1} defaultValue={g.maxSelect} className="input mt-1 w-20" />
                </label>
                <SubmitButton className="btn-secondary text-sm">Сохранить</SubmitButton>
              </ActionForm>
              <ActionForm action={deleteGroup}>
                <input type="hidden" name="id" value={g.id} />
                <input type="hidden" name="menuItemId" value={item.id} />
                <SubmitButton className="btn-secondary text-sm text-chili" confirm={`Удалить группу «${g.name}»?`}>
                  Удалить
                </SubmitButton>
              </ActionForm>
            </div>

            <ul className="mt-3 space-y-1 text-sm">
              {g.options.map((o) => (
                <li key={o.id} className="flex items-center gap-3">
                  <span className="flex-1">{o.name}</span>
                  {o.priceDelta !== 0 && <span className="text-muted">+{formatMoney(o.priceDelta, currency)}</span>}
                  <ActionForm action={deleteOption}>
                    <input type="hidden" name="id" value={o.id} />
                    <SubmitButton className="text-xs text-chili underline">удалить</SubmitButton>
                  </ActionForm>
                </li>
              ))}
            </ul>

            <ActionForm action={createOption} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="groupId" value={g.id} />
              <input name="name" placeholder="Вариант" className="input max-w-xs" required />
              <input
                name="priceDelta"
                placeholder={`Доплата, ${currency}`}
                className="input w-36"
                inputMode="decimal"
              />
              <SubmitButton className="btn-secondary text-sm">Добавить</SubmitButton>
            </ActionForm>
          </div>
        ))}

        <div className="max-w-2xl rounded-xl border border-dashed border-line p-4">
          <h3 className="mb-2 font-medium">Новая группа добавок</h3>
          <ActionForm action={createGroup} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="menuItemId" value={item.id} />
            <label className="text-sm">
              Название
              <input name="name" placeholder="Соус" className="input mt-1" required />
            </label>
            <label className="text-sm">
              Мин.
              <input name="minSelect" type="number" min={0} defaultValue={0} className="input mt-1 w-20" />
            </label>
            <label className="text-sm">
              Макс.
              <input name="maxSelect" type="number" min={1} defaultValue={1} className="input mt-1 w-20" />
            </label>
            <SubmitButton className="btn-secondary text-sm">Создать</SubmitButton>
          </ActionForm>
        </div>
      </section>
    </div>
  );
}
