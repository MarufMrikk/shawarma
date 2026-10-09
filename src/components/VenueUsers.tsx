import { ActionForm, SubmitButton, type FormAction } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { inviteUrl } from "@/lib/invite";

const ROLE_LABELS = { ADMIN: "Админ", OWNER: "Владелец", STAFF: "Повар/кассир" } as const;

/** Venue accounts with pending invite links, plus an invite form. */
export async function VenueUsers({
  venueId,
  inviteAction,
  removeAction,
  allowOwnerRole,
}: {
  venueId: string;
  inviteAction: FormAction;
  removeAction?: FormAction;
  allowOwnerRole: boolean;
}) {
  const users = await db.user.findMany({
    where: { venueId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, email: true, name: true, role: true, passwordHash: true, inviteToken: true, inviteExpiresAt: true },
  });
  const now = new Date();
  const rows = await Promise.all(
    users.map(async (u) => ({
      ...u,
      link: u.inviteToken && u.inviteExpiresAt && u.inviteExpiresAt > now ? await inviteUrl(u.inviteToken) : null,
    })),
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        {rows.map((u) => (
          <li key={u.id} className="rounded-lg border border-neutral-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{u.name}</span>
              <span className="text-neutral-500">{u.email}</span>
              <span className="rounded bg-neutral-100 px-2 text-xs">{ROLE_LABELS[u.role]}</span>
              {!u.passwordHash && <span className="text-xs text-orange-600">приглашён</span>}
              {removeAction && u.role === "STAFF" && (
                <ActionForm action={removeAction} className="ml-auto">
                  <input type="hidden" name="id" value={u.id} />
                  <SubmitButton className="text-xs text-red-600 underline" confirm={`Удалить ${u.email}?`}>
                    удалить
                  </SubmitButton>
                </ActionForm>
              )}
            </div>
            {u.link && (
              <div className="mt-2">
                <div className="text-xs text-neutral-500">Ссылка-приглашение (отправьте её сотруднику):</div>
                <input readOnly value={u.link} className="input mt-1 font-mono text-xs" />
              </div>
            )}
            {!u.passwordHash && !u.link && (
              <div className="mt-1 text-xs text-red-600">Приглашение истекло — отправьте заново формой ниже.</div>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="text-neutral-500">Нет сотрудников</li>}
      </ul>

      <ActionForm action={inviteAction} className="flex flex-wrap items-end gap-2 text-sm">
        <input type="hidden" name="venueId" value={venueId} />
        <input name="email" type="email" placeholder="Email" className="input max-w-xs" required />
        <input name="name" placeholder="Имя" className="input max-w-[12rem]" />
        {allowOwnerRole ? (
          <select name="role" className="input w-auto" defaultValue="STAFF">
            <option value="STAFF">{ROLE_LABELS.STAFF}</option>
            <option value="OWNER">{ROLE_LABELS.OWNER}</option>
          </select>
        ) : (
          <input type="hidden" name="role" value="STAFF" />
        )}
        <SubmitButton className="btn-secondary">Пригласить</SubmitButton>
      </ActionForm>
    </div>
  );
}
