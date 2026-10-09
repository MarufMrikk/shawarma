import type { Metadata, Viewport } from "next";
import { Alumni_Sans, Onest } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

const display = Alumni_Sans({ subsets: ["latin", "cyrillic"], variable: "--nf-display", weight: ["700", "800", "900"] });
const text = Onest({ subsets: ["latin", "cyrillic"], variable: "--nf-text" });

export const metadata: Metadata = {
  title: { default: "Шаверма заранее", template: "%s — Шаверма заранее" },
  description: "Закажите шаверму заранее в шавермной рядом и заберите без очереди",
};

export const viewport: Viewport = { themeColor: "#FFD21A" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${display.variable} ${text.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
