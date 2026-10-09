// Builds the static customer-side demo for GitHub Pages into ./out.
// It strips everything that needs a server (partner portal, API, proxy, server actions),
// so it rewrites the working tree: run it only in CI or a throwaway checkout.
// Needs DATABASE_URL pointing at a migrated + seeded database: data is baked in at build time.
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

if (!process.env.CI && !process.argv.includes("--force")) {
  console.error("build-demo rewrites src/. Run it in CI or pass --force in a throwaway checkout.");
  process.exit(1);
}

const rm = (p) => rmSync(p, { recursive: true, force: true });
const edit = (p, fn) => writeFileSync(p, fn(readFileSync(p, "utf8")));

// 1. Server-only surfaces are not part of the demo.
for (const p of ["src/app/partner", "src/app/api", "src/proxy.ts", "src/app/order"]) rm(p);

// 2. Order ticket lives in the browser.
mkdirSync("src/app/order", { recursive: true });
writeFileSync(
  "src/app/order/page.tsx",
  'export const metadata = { title: "Заказ" };\nexport { default } from "@/demo/DemoOrderPage";\n',
);

// 3. No server actions in a static export.
writeFileSync(
  "src/app/v/[slug]/actions.ts",
  `export async function placeOrder(_input: unknown): Promise<{ ok: true; orderId: string } | { ok: false; error: string }> {
  return { ok: false, error: "Демо-версия" };
}
`,
);

// 4. Pages are prerendered from the seeded database.
edit("src/app/layout.tsx", (s) => s.replace('export const dynamic = "force-dynamic";\n', ""));
edit(
  "src/app/v/[slug]/page.tsx",
  (s) =>
    s +
    `
export const dynamicParams = false;

export async function generateStaticParams() {
  const venues = await db.venue.findMany({ where: { approved: true }, select: { slug: true } });
  return venues.map((v) => ({ slug: v.slug }));
}
`,
);

execSync("npx next build", { stdio: "inherit", env: { ...process.env, NEXT_PUBLIC_DEMO: "1" } });
if (!existsSync("out/index.html")) throw new Error("export produced no out/index.html");
writeFileSync("out/.nojekyll", "");
console.log("Demo built into ./out");
