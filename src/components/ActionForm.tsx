"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

export type FormAction = (prev: string | null, formData: FormData) => Promise<string | null>;

/** Form bound to a server action that returns an error message (or null on success). */
export function ActionForm({
  action,
  className,
  children,
}: {
  action: FormAction;
  className?: string;
  children: React.ReactNode;
}) {
  const [error, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {children}
      {error && <p className="w-full text-sm text-chili">{error}</p>}
    </form>
  );
}

export function SubmitButton({
  children,
  className = "btn-primary",
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      disabled={pending}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
