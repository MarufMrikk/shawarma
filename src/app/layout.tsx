import type { Metadata, Viewport } from "next";
import { Golos_Text, Unbounded } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const display = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--nf-display", weight: ["500", "700", "800"] });
const text = Golos_Text({ subsets: ["latin", "cyrillic"], variable: "--nf-text" });

export const metadata: Metadata = {
  title: { default: "Шаверма заранее", template: "%s — Шаверма заранее" },
  description: "Закажите шаверму заранее в шавермной рядом и заберите без очереди",
};

export const viewport: Viewport = { themeColor: "#2A1F3D" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
