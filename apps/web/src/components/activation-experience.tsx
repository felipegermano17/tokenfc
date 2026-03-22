"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { appBalance, getClubBySlug } from "@/lib/data";
import {
  ActivationStepper,
  BalanceCapsule,
  ClubCrest,
  Surface,
} from "@/components/tokenfc-ui";

const orderedSteps = [
  {
    label: "Login confirmado",
    detail: "A entrada social foi reconhecida e a conta pode seguir para o clube.",
  },
  {
    label: "Clube definido",
    detail: "A identidade do torcedor fica travada para abrir o contexto do clube.",
  },
  {
    label: "ClubPass liberado",
    detail: "A credencial do ecossistema e preparada em segundo plano.",
  },
  {
    label: "$1 TFC inicial",
    detail: "O saldo de entrada chega para abrir a campanha, a loja e o ranking.",
  },
];

export function ActivationExperience({
  clubSlug,
}: {
  clubSlug?: string;
  authProvider?: string;
}) {
  const club = getClubBySlug(clubSlug ?? "");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= orderedSteps.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => current + 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [activeIndex]);

  const steps = useMemo(
    () =>
      orderedSteps.map((step, index) => ({
        ...step,
        state: (
          index < activeIndex
            ? "done"
            : index === activeIndex
              ? "active"
              : "idle"
        ) as "done" | "active" | "idle",
      })),
    [activeIndex],
  );

  const ready = activeIndex >= orderedSteps.length;
  const progress = Math.min((activeIndex / orderedSteps.length) * 100, 100);
  if (!club) {
    return (
      <Surface className="activation-stage" tone="dark">
        <div className="activation-note">
          <p className="eyebrow">Escolha um clube</p>
          <h1>Defina seu clube para preparar o acesso.</h1>
          <p>O perfil e o saldo inicial aparecem depois que a identidade do torcedor e confirmada.</p>
        </div>
        <Link className="button button-primary" href="/onboarding">
          Voltar para a escolha do clube
        </Link>
      </Surface>
    );
  }

  return (
    <Surface className="activation-stage" tone="dark" style={{ ["--club-accent" as string]: club.accent }}>
      <div className="activation-stage-head">
        <div className="activation-club">
          <ClubCrest club={club} size="small" />
          <div>
            <p className="eyebrow">Preparando acesso</p>
            <h1>Seu acesso esta sendo preparado</h1>
            <p>
              ClubPass, saldo inicial e contexto do clube entram em sequencia para
              deixar o perfil pronto sem atrito.
            </p>
          </div>
        </div>
        <div className="activation-head-side">
          <BalanceCapsule balance={appBalance.onboarding} />
        </div>
      </div>

      <div className="activation-progress-shell" aria-hidden="true">
        <div className="activation-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="activation-reward-strip">
        <article className={activeIndex >= 3 ? "activation-reward activation-reward-ready" : "activation-reward"}>
          <span>ClubPass</span>
          <strong>{activeIndex >= 3 ? "Liberado" : activeIndex >= 2 ? "Desbloqueando" : "Aguardando"}</strong>
        </article>
        <article className={ready ? "activation-reward activation-reward-ready" : "activation-reward"}>
          <span>$1 TFC</span>
          <strong>{ready ? "Disponivel" : activeIndex >= 3 ? "Entrando na conta" : "Aguardando"}</strong>
        </article>
      </div>

      <ActivationStepper steps={steps} />

      <div className="activation-floating-bar" role="region" aria-label="Confirmacao da ativacao">
        <div className="activation-floating-bar-inner shell-width">
          <div className="activation-floating-copy">
            <ClubCrest club={club} size="small" />
            <div>
              <span>Status atual</span>
              <strong>{ready ? "Perfil pronto para entrar" : "Preparando seu perfil"}</strong>
            </div>
          </div>
          <Link
            className={ready ? "button button-primary" : "button button-secondary button-disabled"}
            href={`/club/${club.slug}`}
          >
            Entrar no meu clube
          </Link>
        </div>
      </div>
    </Surface>
  );
}
