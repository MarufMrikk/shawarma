export type MenuOption = { id: string; name: string; priceDelta: number };
export type MenuGroup = { id: string; name: string; minSelect: number; maxSelect: number; options: MenuOption[] };
export type MenuItemData = {
  id: string;
  name: string;
  description: string;
  price: number;
  groups: MenuGroup[];
};

export type ModifierSnapshot = { group: string; name: string; priceDelta: number };

export type PricedLine =
  | { ok: true; unitPrice: number; modifiers: ModifierSnapshot[] }
  | { ok: false; error: string };

/** Validates selected option ids against the item's groups and computes the unit price. */
export function priceLine(item: MenuItemData, optionIds: string[]): PricedLine {
  const selected = new Set(optionIds);
  if (selected.size !== optionIds.length) return { ok: false, error: "Повторяющиеся добавки" };

  const modifiers: ModifierSnapshot[] = [];
  let matched = 0;
  for (const group of item.groups) {
    const chosen = group.options.filter((o) => selected.has(o.id));
    matched += chosen.length;
    if (chosen.length < group.minSelect) return { ok: false, error: `Выберите: ${group.name}` };
    if (chosen.length > group.maxSelect) return { ok: false, error: `Слишком много: ${group.name}` };
    for (const o of chosen) modifiers.push({ group: group.name, name: o.name, priceDelta: o.priceDelta });
  }
  if (matched !== selected.size) return { ok: false, error: "Неизвестная добавка" };

  return { ok: true, unitPrice: item.price + modifiers.reduce((s, m) => s + m.priceDelta, 0), modifiers };
}
