import { HomeOverlay } from "@/components/entry-overlays";
import {
  LinkButton,
  TokenWordmark,
} from "@/components/tokenfc-ui";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sheet?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="marketing-page marketing-page-home">
      <header className="marketing-header">
        <div className="marketing-header-inner shell-width">
          <TokenWordmark />
          <nav className="marketing-actions">
            <LinkButton className="button-compact" href="/?sheet=ranking" variant="ghost">
              Ver ranking
            </LinkButton>
            <LinkButton className="button-compact" href="/onboarding?auth=google" variant="secondary">
              Entrar
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="shell-width marketing-main marketing-main-home">
        <section className="landing-hero landing-hero-home">
          <div className="landing-copy landing-hero-copy">
            <h1>
              <span>O token que transforma</span>
              <span>torcida em economia</span>
            </h1>
            <p className="landing-home-lead">
              <span className="landing-home-line">
                Com TFC, o torcedor participa e compra dentro do clube.
              </span>
              <span className="landing-home-line">
                Entre com PIX, receba TFC e use o token no ecossistema oficial.
              </span>
            </p>
            <div className="hero-actions hero-actions-home">
              <LinkButton className="button-compact hero-entry-button" href="/onboarding?auth=google">
                Entrar no ecossistema
              </LinkButton>
            </div>
          </div>

          <div aria-hidden="true" className="hero-stage-minimal">
            <div className="hero-stage-aura hero-stage-aura-left" />
            <div className="hero-stage-aura hero-stage-aura-right" />
            <div className="hero-stage-frame">
              <div className="hero-stage-orbit hero-stage-orbit-outer" />
              <div className="hero-stage-orbit hero-stage-orbit-inner" />
              <div className="hero-stage-core">
                <span className="hero-stage-mark">T</span>
              </div>
              <div className="hero-stage-node hero-stage-node-top" />
              <div className="hero-stage-node hero-stage-node-right" />
              <div className="hero-stage-node hero-stage-node-bottom" />
            </div>
          </div>
        </section>
      </main>

      <HomeOverlay sheet={params.sheet} />
    </div>
  );
}
