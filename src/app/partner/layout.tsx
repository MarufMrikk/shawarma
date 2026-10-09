import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Кабинет шавермных", template: "%s — Шаверма заранее для бизнеса" },
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: LayoutProps<"/partner">) {
  return children;
}
