import Link from "next/link";
import { TokenWordmark } from "@/components/tokenfc-ui";

export default function NotFound() {
  return (
    <div className="simple-flow-page">
      <header className="marketing-header shell-width">
        <TokenWordmark />
      </header>
      <main className="shell-width flow-main">
        <section className="surface empty-state">
          <p className="eyebrow">Rota nao encontrada</p>
          <h1>Essa tela nao esta disponivel agora.</h1>
          <p>Volte para a plataforma e siga pelas rotas principais do Token F.C.</p>
          <Link className="button button-primary" href="/">
            Voltar para a landing
          </Link>
        </section>
      </main>
    </div>
  );
}
