"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { IS_DEMO, saveDemoOrder } from "@/lib/demo";
import type { MenuCategoryData } from "@/lib/menu";
import { formatMoney } from "@/lib/money";
import { ARRIVE_OPTIONS } from "@/lib/orderStatus";
import { priceLine, type MenuItemData, type ModifierSnapshot } from "@/lib/pricing";
import { Pictogram, pictogramFor } from "@/components/Pictogram";
import { placeOrder } from "./actions";

type CartLine = { key: string; itemId: string; quantity: number; optionIds: string[] };
type PricedLine = { line: CartLine; item: MenuItemData; unitPrice: number; modifiers: ModifierSnapshot[] };

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

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

export function VenueMenu({
  slug,
  venueName,
  venueAddress,
  currency,
  menu,
  canOrder,
}: {
  slug: string;
  venueName: string;
  venueAddress: string;
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
  const [sheetOpen, setSheetOpen] = useState(false);
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

  const pricedCart: PricedLine[] = cart.flatMap((line) => {
    const item = itemsById.get(line.itemId);
    if (!item) return [];
    const priced = priceLine(item, line.optionIds);
    return priced.ok ? [{ line, item, unitPrice: priced.unitPrice, modifiers: priced.modifiers }] : [];
  });
  const total = pricedCart.reduce((s, l) => s + l.unitPrice * l.line.quantity, 0);
  const count = pricedCart.reduce((s, l) => s + l.line.quantity, 0);
  const qtyByItem = new Map<string, number>();
  for (const l of pricedCart) qtyByItem.set(l.item.id, (qtyByItem.get(l.item.id) ?? 0) + l.line.quantity);

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
    if (IS_DEMO) {
      if (!name.trim() || phone.replace(/\D/g, "").length < 10) {
        setError("Укажите имя и телефон");
        return;
      }
      const id = Math.random().toString(36).slice(2, 10);
      const now = Date.now();
      saveDemoOrder({
        id,
        venueName,
        venueSlug: slug,
        venueAddress,
        customerName: name.trim(),
        pickupCode: String(Math.floor(Math.random() * 10_000)).padStart(4, "0"),
        currency,
        createdAt: now,
        pickupAt: now + arriveIn * 60_000,
        items: pricedCart.map(({ item, line, unitPrice, modifiers }) => ({
          name: item.name,
          quantity: line.quantity,
          lineTotal: unitPrice * line.quantity,
          modifiers,
        })),
        totalAmount: total,
      });
      setCart([]);
      writeStorage(cartKey, []);
      router.push(`/order?id=${id}`);
      return;
    }
    startTransition(async () => {
      const result = await placeOrder({
        slug,
        name,
        phone,
        arriveInMinutes: arriveIn,
        lines: pricedCart.map(({ line }) => ({ itemId: line.itemId, quantity: line.quantity, optionIds: line.optionIds })),
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

  const cartPanel = (
    <CartPanel
      lines={pricedCart}
      total={total}
      currency={currency}
      canOrder={canOrder}
      changeQty={changeQty}
      name={name}
      setName={setName}
      phone={phone}
      setPhone={setPhone}
      arriveIn={arriveIn}
      setArriveIn={setArriveIn}
      error={error}
      pending={pending}
      onSubmit={submit}
    />
  );

  return (
    <>
      {menu.length > 1 && (
        <nav className="sticky top-0 z-20 border-b border-line bg-page/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
            {menu.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                className="shrink-0 rounded-md border-2 border-board/15 bg-white px-3.5 py-1.5 text-sm font-semibold hover:border-board"
              >
                {cat.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-32 pt-6 lg:grid-cols-[1fr_360px] lg:pb-12">
        <div>
          {!canOrder && (
            <p className="mb-6 rounded-lg border-2 border-chili bg-white px-4 py-3 text-sm font-medium text-chili">
              Сейчас шавермная не принимает заказы. Меню можно посмотреть.
            </p>
          )}
          {menu.length === 0 && <p className="text-muted">Меню пока пустое.</p>}
          {menu.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20 [&+&]:mt-12">
              <div className="flex items-end gap-3 border-b-2 border-board pb-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-kiosk text-board">
                  <Pictogram kind={pictogramFor(cat.name)} className="h-8 w-8" />
                </span>
                <h2 className="sign text-[40px]">{cat.name}</h2>
              </div>
              <ul className="divide-y divide-line">
                {cat.items.map((item) => {
                  const qty = qtyByItem.get(item.id) ?? 0;
                  return (
                    <li key={item.id} className="flex items-center gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="text-[17px] font-bold">{item.name}</div>
                        {item.description && <p className="mt-0.5 text-sm text-muted">{item.description}</p>}
                        {item.groups.length > 0 && (
                          <p className="mt-1 text-xs font-medium text-muted">
                            {item.groups.map((g) => g.name.toLowerCase()).join(", ")} на выбор
                          </p>
                        )}
                      </div>
                      <span className="price shrink-0 text-[34px]">{formatMoney(item.price, currency)}</span>
                      <button
                        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-board text-2xl leading-none font-medium text-kiosk transition-colors hover:bg-chili hover:text-white disabled:bg-line disabled:text-muted"
                        disabled={!canOrder}
                        onClick={() => onItemClick(item)}
                        aria-label={`Добавить «${item.name}»`}
                      >
                        +
                        {qty > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-chili px-1 text-xs font-bold text-white">
                            {qty}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-20">{cartPanel}</div>
        </aside>
      </div>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t-2 border-board bg-kiosk p-3 lg:hidden">
          <button className="btn-primary w-full justify-between py-3.5" onClick={() => setSheetOpen(true)}>
            <span>
              Корзина: {count} {plural(count, "позиция", "позиции", "позиций")}
            </span>
            <span className="font-display text-2xl font-extrabold leading-none">{formatMoney(total, currency)}</span>
          </button>
        </div>
      )}

      {sheetOpen && (
        <Sheet onClose={() => setSheetOpen(false)} label="Корзина">
          {cartPanel}
        </Sheet>
      )}

      {editing && (
        <Sheet onClose={() => setEditing(null)} label={editing.name}>
          <ItemOptions
            item={editing}
            currency={currency}
            onCancel={() => setEditing(null)}
            onAdd={(optionIds) => {
              addToCart(editing, optionIds);
              setEditing(null);
            }}
          />
        </Sheet>
      )}
    </>
  );
}

function Sheet({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-board/60 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal
      aria-label={label}
    >
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-page p-3 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function CartPanel({
  lines,
  total,
  currency,
  canOrder,
  changeQty,
  name,
  setName,
  phone,
  setPhone,
  arriveIn,
  setArriveIn,
  error,
  pending,
  onSubmit,
}: {
  lines: PricedLine[];
  total: number;
  currency: string;
  canOrder: boolean;
  changeQty: (key: string, delta: number) => void;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  arriveIn: number;
  setArriveIn: (v: number) => void;
  error: string | null;
  pending: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="receipt rounded-t-lg border-x-2 border-t-2 border-board px-5 pt-5">
      <h2 className="sign text-[36px]">Ваш заказ</h2>
      {lines.length === 0 ? (
        <p className="mt-2 pb-2 text-sm text-muted">Нажмите «+» у позиции в меню, чтобы добавить её сюда.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-dashed divide-line">
            {lines.map(({ line, item, unitPrice, modifiers }) => (
              <li key={line.key} className="py-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="font-semibold">{item.name}</span>
                  <span className="shrink-0 font-medium">{formatMoney(unitPrice * line.quantity, currency)}</span>
                </div>
                {modifiers.length > 0 && <div className="text-muted">{modifiers.map((m) => m.name).join(", ")}</div>}
                <div className="mt-2 inline-flex items-center rounded-full border border-line">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full text-lg hover:bg-page"
                    onClick={() => changeQty(line.key, -1)}
                    aria-label="Убрать одну"
                  >
                    −
                  </button>
                  <span className="w-6 text-center font-semibold">{line.quantity}</span>
                  <button
                    type="button"
                    className="h-8 w-8 rounded-full text-lg hover:bg-page"
                    onClick={() => changeQty(line.key, 1)}
                    aria-label="Добавить ещё одну"
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-t-2 border-dashed border-line pt-3">
            <span className="font-semibold">Итого</span>
            <span className="sign text-[34px]">{formatMoney(total, currency)}</span>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="cart-name" className="mb-1 block text-sm font-medium">
                Имя
              </label>
              <input
                id="cart-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={60}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="cart-phone" className="mb-1 block text-sm font-medium">
                Телефон
              </label>
              <input
                id="cart-phone"
                className="input"
                placeholder="+7 900 000-00-00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                type="tel"
                autoComplete="tel"
              />
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-medium">Приду через</legend>
              <div className="grid grid-cols-4 gap-1.5">
                {ARRIVE_OPTIONS.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setArriveIn(m)}
                    aria-pressed={arriveIn === m}
                    className={`rounded-lg border-2 py-2 text-sm font-semibold transition-colors ${
                      arriveIn === m ? "border-board bg-board text-kiosk" : "border-line bg-white hover:border-board"
                    }`}
                  >
                    {m} мин
                  </button>
                ))}
              </div>
            </fieldset>
            {error && <p className="text-sm font-medium text-chili">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={pending || !canOrder}>
              {pending ? "Отправляем заказ…" : `Заказать за ${formatMoney(total, currency)}`}
            </button>
            <p className="text-center text-xs text-muted">Оплата в шавермной при получении</p>
          </form>
        </>
      )}
    </div>
  );
}

function ItemOptions({
  item,
  currency,
  onCancel,
  onAdd,
}: {
  item: MenuItemData;
  currency: string;
  onCancel: () => void;
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
      if (prev.includes(optionId)) {
        const inGroup = prev.filter((id) => groupIds.has(id)).length;
        return inGroup > group.minSelect ? prev.filter((id) => id !== optionId) : prev;
      }
      if (group.maxSelect === 1) return [...prev.filter((id) => !groupIds.has(id)), optionId];
      if (prev.filter((id) => groupIds.has(id)).length >= group.maxSelect) return prev;
      return [...prev, optionId];
    });
  }

  return (
    <div className="rounded-xl bg-white p-5">
      <h3 className="sign text-[40px]">{item.name}</h3>
      {item.description && <p className="mt-1 text-sm text-muted">{item.description}</p>}
      <div className="mt-5 space-y-5">
        {item.groups.map((g) => (
          <fieldset key={g.id}>
            <legend className="mb-2 flex w-full items-baseline justify-between text-sm">
              <span className="font-semibold">{g.name}</span>
              <span className="text-muted">
                {g.minSelect > 0 && g.maxSelect === 1
                  ? "выберите один"
                  : g.maxSelect === 1
                    ? "по желанию"
                    : `до ${g.maxSelect}`}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const on = selected.includes(o.id);
                return (
                  <button
                    type="button"
                    key={o.id}
                    aria-pressed={on}
                    onClick={() => toggle(g.id, o.id)}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      on ? "border-board bg-kiosk text-board" : "border-line bg-white hover:border-board"
                    }`}
                  >
                    {o.name}
                    {o.priceDelta !== 0 && (
                      <span className={on ? "ml-1 font-semibold text-chili" : "ml-1 text-muted"}>
                        +{formatMoney(o.priceDelta, currency)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {!priced.ok && <p className="mt-3 text-sm text-chili">{priced.error}</p>}
      <div className="mt-6 flex gap-2">
        <button className="btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        <button className="btn-primary flex-1" disabled={!priced.ok} onClick={() => onAdd(selected)}>
          Добавить{priced.ok ? ` за ${formatMoney(priced.unitPrice, currency)}` : ""}
        </button>
      </div>
    </div>
  );
}
