import { SiteHeader } from "@/components/SiteHeader";
import { COUNTRIES } from "@/lib/countries";
import { ConnectForm } from "./ConnectForm";

export const metadata = { title: "Подключить заведение" };

export default function ConnectPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="font-display text-2xl font-bold">Подключить шавермную</h1>
        <p className="mb-6 mt-2 text-muted">
          Гости будут заказывать заранее и забирать без очереди, а вы — видеть заказы на экране кухни. Оставьте
          контакты, мы перезвоним.
        </p>
        <ConnectForm countries={COUNTRIES} />
      </main>
    </>
  );
}
