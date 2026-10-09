"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { MenuCategoryData } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import { ARRIVE_OPTIONS } from "@/lib/orderStatus";
import { priceLine, type MenuItemData } from "@/lib/pricing";
import { placeOrder } from "./actions";

type CartLine = { key: string; itemId: string; quantity: number; optionIds: string[] };

const CUSTOMER_KEY = "customer";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function VenueMenu({
  slug,
  currency,
  menu,
  canOrder,
}: {
  slug: string;
  currency: string;
  menu: MenuCategoryData[];
  canOrder: boolean;
}) {
  const router = useRouter();
  const cartKey = `cart:${slug}`;
  const itemsById = useMemo(() => new Map(menu.flatMap((c) => c.items).map((i) => [i.id, i])), [menu]);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<MenuItemData | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [arriveIn, setArriveIn] = useState<number>(15);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const stored = readStorage<CartLine[]>(cartKey, []);
    setCart(stored.filter((l) => itemsById.has(l.itemId)));
    const customer = readStorage(CUSTOMER_KEY, { name: "", phone: "" });
    setName(customer.name);
    setPhone(customer.phone);
    setLoaded(true);
  }, [cartKey, itemsById]);

  useEffect(() => {
    if (loaded) writeStorage(cartKey, cart);
  }, [cart, cartKey, loaded]);

  const pricedCart = cart.flatMap((line) => {
    const item = itemsById.get(line.itemId);
    if (!item) return [];
    const priced = priceLine(item, line.optionIds);
    return priced.ok ? [{ line, item, ...priced }] : [];
  });
  const total = pricedCart.reduce((s, l) => s + l.unitPrice * l.line.quantity, 0);

  function addToCart(item: MenuItemData, optionIds: string[]) {
    const key = `${item.id}|${[...optionIds].sort().join(",")}`;
    setCart((prev) => {
      const existing = prev.find((l) => l.key === key);
      if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + 1) } : l));
      return [...prev, { key, itemId: item.id, quantity: 1, optionIds }];
    });
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.key !== key) return [l];
        const quantity = Math.min(20, l.quantity + delta);
        return quantity > 0 ? [{ ...l, quantity }] : [];
      }),
    );
  }

  function onItemClick(item: MenuItemData) {
    if (item.groups.length === 0) addToCart(item, []);
    else setEditing(item);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    writeStorage(CUSTOMER_KEY, { name, phone });
    startTransition(async () => {
      const result = await placeOrder({
        slug,
        name,
        phone,
        arriveInMinutes: arriveIn,
        lines: pricedCart.map(({ line }) => ({
          itemId: line.itemId,
          quantity: line.quantity,
          optionIds: line.optionIds,
        })),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCart([]);
      writeStorage(cartKey, []);
      router.push(`/order/${result.orderId}`);
    });
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        {menu.length === 0 && <p className="text-neutral-500">Меню пока пустое.</p>}
        {menu.map((cat) => (
          <section key={cat.id}>
            <h2 className="mb-3 text-lg font-semibold">{cat.name}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {cat.items.map((item) => (
                <div key={item.id} className="flex flex-col rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="font-medium">{item.name}</div>
                  {item.description && <div className="text-sm text-neutral-600">{item.description}</div>}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-semibold">{formatMoney(item.price, currency)}</span>
                    <button className="btn-primary text-sm" disabled={!canOrder} onClick={() => onItemClick(item)}>
                      {item.groups.length ? "Выбрать" : "В корзину"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <aside className="h-fit rounded-xl border border-neutral-200 bg-white p-4 lg:sticky lg:top-4">
        <h2 className="mb-3 text-lg font-semibold">Корзина</h2>
        {pricedCart.length === 0 ? (
          <p className="text-sm text-neutral-500">Пока пусто</p>
        ) : (
          <ul className="mb-4 space-y-3">
            {pricedCart.map(({ line, item, unitPrice, modifiers }) => (
              <li key={line.key} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{item.name}</span>
                  <span>{formatMoney(unitPrice * line.quantity, currency)}</span>
                </div>
                {modifiers.length > 0 && (
                  <div className="text-neutral-500">{modifiers.map((m) => m.name).join(", ")}</div>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <button className="h-7 w-7 rounded border" onClick={() => changeQty(line.key, -1)}>
                    −
                  </button>
                  <span className="w-6 text-center">{line.quantity}</span>
                  <button className="h-7 w-7 rounded border" onClick={() => changeQty(line.key, 1)}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pricedCart.length > 0 && (
          <form onSubmit={submit} className="space-y-3 border-t border-neutral-200 pt-4">
            <div className="flex justify-between font-semibold">
              <span>Итого</span>
              <span>{formatMoney(total, currency)}</span>
            </div>
            <input
              className="input"
              placeholder="Имя"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={60}
              autoComplete="given-name"
            />
            <input
              className="input"
              placeholder="Телефон, +7…"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              type="tel"
              autoComplete="tel"
            />
            <div>
              <div className="mb-1 text-sm text-neutral-600">Приду через</div>
              <div className="grid grid-cols-4 gap-2">
                {ARRIVE_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setArriveIn(m)}
                    className={`rounded-lg border py-2 text-sm ${
                      arriveIn === m ? "border-orange-600 bg-orange-50 font-semibold" : "border-neutral-300"
                    }`}
                  >
                    {m} мин
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary w-full" disabled={pending || !canOrder}>
              {pending ? "Отправляем…" : "Заказать"}
            </button>
            <p className="text-xs text-neutral-500">Оплата при получении в заведении.</p>
          </form>
        )}
      </aside>

      {editing && (
        <ItemDialog
          item={editing}
          currency={currency}
          onClose={() => setEditing(null)}
          onAdd={(optionIds) => {
            addToCart(editing, optionIds);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ItemDialog({
  item,
  currency,
  onClose,
  onAdd,
}: {
  item: MenuItemData;
  currency: string;
  onClose: () => void;
  onAdd: (optionIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    item.groups.filter((g) => g.minSelect > 0).flatMap((g) => g.options.slice(0, g.minSelect).map((o) => o.id)),
  );
  const priced = priceLine(item, selected);

  function toggle(groupId: string, optionId: string) {
    const group = item.groups.find((g) => g.id === groupId)!;
    const groupIds = new Set(group.options.map((o) => o.id));
    setSelected((prev) => {
      if (group.maxSelect === 1) return [...prev.filter((id) => !groupIds.has(id)), optionId];
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      if (prev.filter((id) => groupIds.has(id)).length >= group.maxSelect) return prev;
      return [...prev, optionId];
    });
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{item.name}</h3>
        {item.description && <p className="text-sm text-neutral-600">{item.description}</p>}
        <div className="mt-4 space-y-4">
          {item.groups.map((g) => (
            <fieldset key={g.id}>
              <legend className="mb-2 text-sm font-medium">
                {g.name}
                <span className="ml-1 font-normal text-neutral-500">
                  {g.maxSelect === 1 ? (g.minSelect ? "(обязательно)" : "(одно)") : `(до ${g.maxSelect})`}
                </span>
              </legend>
              <div className="space-y-1">
                {g.options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type={g.maxSelect === 1 ? "radio" : "checkbox"}
                      name={g.id}
                      checked={selected.includes(o.id)}
                      onChange={() => toggle(g.id, o.id)}
                      onClick={() => {
                        if (g.maxSelect === 1 && g.minSelect === 0 && selected.includes(o.id)) {
                          setSelected((prev) => prev.filter((id) => id !== o.id));
                        }
                      }}
                    />
                    <span className="flex-1">{o.name}</span>
                    {o.priceDelta !== 0 && (
                      <span className="text-neutral-500">+{formatMoney(o.priceDelta, currency)}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        {!priced.ok && <p className="mt-3 text-sm text-red-600">{priced.error}</p>}
        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={onClose}>
            Отмена
          </button>
          <button className="btn-primary flex-1" disabled={!priced.ok} onClick={() => onAdd(selected)}>
            Добавить{priced.ok ? ` · ${formatMoney(priced.unitPrice, currency)}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
