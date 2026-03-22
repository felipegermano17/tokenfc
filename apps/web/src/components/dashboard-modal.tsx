"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Club, Product } from "@/lib/data";
import {
  activityFeed,
  campaignContext,
  defaultProduct,
  formatTfc,
} from "@/lib/data";
import { CampaignExperience } from "@/components/campaign-experience";
import { CheckoutExperience } from "@/components/checkout-experience";
import { CreditFlowPanel } from "@/components/credit-flow-panel";
import {
  ActivityLedgerTimeline,
  ProductSpotlightCard,
  Surface,
} from "@/components/tokenfc-ui";
import { withClubModal } from "@/lib/club-routing";
import { RankingOverview } from "@/components/ranking-overview";

export type DashboardModalKey =
  | "campaign"
  | "topup"
  | "shop"
  | "checkout"
  | "activity"
  | "ranking";

const modalCopy: Record<
  DashboardModalKey,
  { eyebrow: string; title: string; copy: string }
> = {
  campaign: {
    eyebrow: "Campanha ativa",
    title: campaignContext.title,
    copy: "Escolha a arte, defina o valor em TFC e confirme sua participacao sem sair do clube.",
  },
  topup: {
    eyebrow: "Adicionar saldo",
    title: "Coloque mais TFC na conta",
    copy: "Credito claro, leitura imediata de saldo e confirmacao sem desviar da jornada principal.",
  },
  shop: {
    eyebrow: "Loja oficial",
    title: "Compre dentro do ecossistema do clube",
    copy: "Produtos, campanha e saldo aparecem no mesmo contexto para a decisao ficar simples.",
  },
  checkout: {
    eyebrow: "Confirmar pedido",
    title: "Revise e conclua com TFC",
    copy: "Pedido, saldo final e confirmacao aparecem no mesmo quadro para reduzir atrito.",
  },
  activity: {
    eyebrow: "Atividade recente",
    title: "Tudo o que aconteceu na sua conta",
    copy: "Saldo, apoio e compras organizados em uma leitura curta e direta.",
  },
  ranking: {
    eyebrow: "Ranking geral",
    title: "Maior Torcida e Torcida Mais Forte",
    copy: "Os dois rankings do produto aparecem aqui sem misturar popularidade com forca economica.",
  },
};

function ShopModalContent({ club }: { club: Club }) {
  const spotlightProduct = defaultProduct;

  return (
    <div className="modal-stack">
      <ProductSpotlightCard
        club={club}
        href={withClubModal(club.slug, "checkout", { product: spotlightProduct.id })}
        product={spotlightProduct}
      />
    </div>
  );
}

function ActivityModalContent() {
  return (
    <div className="modal-stack">
      <Surface className="activity-summary">
        <div className="section-heading">
          <p>Resumo do ciclo</p>
          <span>O que mais pesa agora na sua conta</span>
        </div>
        <div className="credit-flow-ledger">
          <div>
            <span>Saldo atual</span>
            <strong>{formatTfc(22)}</strong>
          </div>
          <div>
            <span>Ultimo apoio</span>
            <strong>{formatTfc(10)}</strong>
          </div>
          <div>
            <span>Ultima compra</span>
            <strong>{formatTfc(40)}</strong>
          </div>
        </div>
      </Surface>

      <Surface className="activity-page-surface">
        <div className="section-heading">
          <p>Linha do tempo</p>
          <span>Ultimos movimentos confirmados</span>
        </div>
        <ActivityLedgerTimeline items={activityFeed} />
      </Surface>
    </div>
  );
}

export function DashboardModal({
  club,
  modal,
  product,
}: {
  club: Club;
  modal: DashboardModalKey;
  product: Product;
}) {
  const router = useRouter();
  const content = modalCopy[modal];
  const titleId = useId();
  const descriptionId = useId();
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shellRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        router.replace(withClubModal(club.slug));
        return;
      }

      if (event.key !== "Tab" || !shellRef.current) {
        return;
      }

      const focusable = shellRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const focusTargets = Array.from(focusable);

      if (!focusTargets.length) {
        event.preventDefault();
        return;
      }

      const first = focusTargets[0]!;
      const last = focusTargets[focusTargets.length - 1]!;
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [club.slug, router]);

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="dashboard-modal-backdrop"
      role="dialog"
    >
      <div className="dashboard-modal-shell" ref={shellRef} tabIndex={-1}>
        <div className="dashboard-modal-head">
          <div>
            <p className="eyebrow">{content.eyebrow}</p>
            <h2 id={titleId}>{content.title}</h2>
            <p id={descriptionId}>{content.copy}</p>
          </div>
          <button
            className="modal-close"
            onClick={() => router.replace(withClubModal(club.slug))}
            type="button"
          >
            Fechar
          </button>
        </div>

        <div className="dashboard-modal-body">
          {modal === "campaign" ? <CampaignExperience club={club} compact /> : null}
          {modal === "topup" ? <CreditFlowPanel /> : null}
          {modal === "shop" ? <ShopModalContent club={club} /> : null}
          {modal === "checkout" ? <CheckoutExperience productId={product.id} /> : null}
          {modal === "activity" ? <ActivityModalContent /> : null}
          {modal === "ranking" ? <RankingOverview /> : null}
        </div>

        <div className="dashboard-modal-footer">
          <Link className="button button-ghost" href={withClubModal(club.slug)}>
            Voltar ao painel
          </Link>
          {modal === "shop" ? (
            <Link
              className="button button-primary"
              href={withClubModal(club.slug, "checkout", { product: defaultProduct.id })}
            >
              Ir para checkout
            </Link>
          ) : null}
          {modal === "checkout" ? (
            <Link className="button button-secondary" href={withClubModal(club.slug, "shop")}>
              Voltar para a loja
            </Link>
          ) : null}
          {modal === "campaign" ? (
            <Link className="button button-secondary" href={withClubModal(club.slug, "topup")}>
              Adicionar saldo
            </Link>
          ) : null}
          {modal === "topup" ? (
            <Link className="button button-secondary" href={withClubModal(club.slug, "campaign")}>
              Abrir campanha
            </Link>
          ) : null}
          {modal === "activity" ? (
            <Link className="button button-secondary" href={withClubModal(club.slug, "shop")}>
              Abrir loja
            </Link>
          ) : null}
          {modal === "ranking" ? (
            <Link className="button button-secondary" href={withClubModal(club.slug, "campaign")}>
              Abrir campanha
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
