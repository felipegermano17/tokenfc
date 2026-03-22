import Link from "next/link";
import type { CSSProperties } from "react";
import type { ActivityItem, Club, Product } from "@/lib/data";
import { formatTfc } from "@/lib/data";

function clubActionTheme(club: Club): CSSProperties {
  return {
    "--club-accent": club.accent,
    "--club-accent-soft": club.accentSoft,
    "--club-dark": club.dark,
    "--club-glow": club.glow,
  } as CSSProperties;
}

export function ClubActionDeck({
  club,
  balance,
  leader,
  campaignTimeLeft,
  product,
  recentActivity,
  hrefs,
}: {
  club: Club;
  balance: number;
  leader: string;
  campaignTimeLeft: string;
  product: Product;
  recentActivity: ActivityItem;
  hrefs: {
    campaign: string;
    topup: string;
    shop: string;
    activity: string;
  };
}) {
  return (
    <section
      aria-label="Escolha sua proxima acao"
      className="club-action-deck"
      style={clubActionTheme(club)}
    >
      <div className="club-command-board">
        <Link className="club-command-feature club-command-feature-campaign" href={hrefs.campaign}>
          <div className="club-command-feature-head">
            <span>Campanha</span>
            <em>{campaignTimeLeft}</em>
          </div>
          <div className="club-command-feature-main">
            <strong>{leader}</strong>
            <p>Arte lider na votacao da camisa do clube.</p>
          </div>
          <div className="club-command-feature-footer">
            <span className="club-command-cta club-command-cta-inverse">Abrir campanha</span>
          </div>
        </Link>

        <div className="club-command-side">
          <Link className="club-command-topup" href={hrefs.topup}>
            <div className="club-command-topup-head">
              <span>Comprar TFC</span>
              <em>PIX</em>
            </div>
            <strong>{formatTfc(balance)}</strong>
            <p>Credite saldo sem sair do clube.</p>
            <div className="club-command-topup-footer">
              <span className="club-command-cta club-command-cta-inverse club-command-cta-inverse-soft">
                Comprar agora
              </span>
              <small>PIX imediato</small>
            </div>
          </Link>

          <div className="club-command-list">
            <Link className="club-command-row club-command-row-shop" href={hrefs.shop}>
              <div className="club-command-row-copy">
                <span>Loja</span>
                <strong>{product.name}</strong>
                <p>{formatTfc(product.price)}</p>
              </div>
              <div className="club-command-row-meta">
                <span className="club-command-cta club-command-cta-plain">Ver loja</span>
              </div>
            </Link>

            <Link className="club-command-row club-command-row-activity" href={hrefs.activity}>
              <div className="club-command-row-copy">
                <span>Atividade</span>
                <strong>{recentActivity.title}</strong>
                <p>{recentActivity.detail}</p>
              </div>
              <div className="club-command-row-meta">
                <small>{recentActivity.amount}</small>
                <span className="club-command-cta club-command-cta-plain">Ver atividade</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
