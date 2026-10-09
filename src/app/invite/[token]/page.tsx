import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { db } from "@/lib/db";
import { acceptInvite } from "./actions";

export const metadata = { title: "Приглашение" };

export default async function InvitePage({ params }: PageProps<"/invite/[token]">) {
  const { token } = await params;
  const user = await db.user.findUnique({
    where: { inviteToken: token },
    select: { email: true, name: true, inviteExpiresAt: true, venue: { select: { name: true } } },
  });
  const valid = user?.inviteExpiresAt && user.inviteExpiresAt > new Date();

  return (
    <main className="mx-auto w-full max-w-sm px-4 py-16">
      <h1 className="sign mb-3 text-[44px]">Приглашение</h1>
      {!valid ? (
        <p className="text-muted">Ссылка недействительна или истекла. Попросите прислать новую.</p>
      ) : (
        <>
          <p className="mb-6 text-muted">
            {user.venue ? `«${user.venue.name}». ` : ""}Задайте пароль для входа под {user.email}.
          </p>
          <ActionForm action={acceptInvite} className="space-y-3">
            <input type="hidden" name="token" value={token} />
            <input name="name" defaultValue={user.name} placeholder="Имя" className="input" required />
            <input
              name="password"
              type="password"
              placeholder="Пароль (от 8 символов)"
              className="input"
              minLength={8}
              required
              autoComplete="new-password"
            />
            <input
              name="password2"
              type="password"
              placeholder="Повторите пароль"
              className="input"
              required
              autoComplete="new-password"
            />
            <SubmitButton className="btn-primary w-full">Сохранить и войти</SubmitButton>
          </ActionForm>
        </>
      )}
    </main>
  );
}
