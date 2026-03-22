"use client";

import { useSendTransaction } from "@privy-io/react-auth";
import { useEffect, useMemo, useState } from "react";
import type { ClubDashboardContest } from "@/lib/api";
import { useAuthRuntime, useTokenFcSession } from "@/components/app-providers";
import {
  appBalance,
  campaignContext,
  contestArts,
  defaultContestArt,
  formatNumber,
  formatTfc,
  type Club,
} from "@/lib/data";
import { CampaignFocusStage, JerseyArtwork, Surface } from "@/components/tokenfc-ui";
import { normalizeTfcNumber } from "@/lib/tfc";

const supportPresets = [3, 5, 10, 20];
const liveGradients: Array<[string, string]> = [
  ["#dfe8f0", "#9fb1c2"],
  ["#eef1f5", "#c5ced8"],
  ["#dde2e8", "#8c98a5"],
  ["#eff3f7", "#b8c6d6"],
];

type CampaignArtView = {
  creator: string;
  gradient: [string, string];
  id: string;
  name: string;
  summary: string;
  supporters: number;
  totalTfc: number;
};

export function CampaignExperience({
  club,
  compact = false,
  contest,
}: {
  club: Club;
  compact?: boolean;
  contest?: ClubDashboardContest;
}) {
  const { privyEnabled } = useAuthRuntime();

  if (!privyEnabled || contest === undefined) {
    return <LocalCampaignExperience club={club} compact={compact} />;
  }

  if (contest === null) {
    return <LocalCampaignExperience club={club} compact={compact} />;
  }

  return <LiveCampaignExperience club={club} compact={compact} contest={contest} />;
}

function LiveCampaignExperience({
  club,
  compact,
  contest,
}: {
  club: Club;
  compact: boolean;
  contest: NonNullable<ClubDashboardContest>;
}) {
  const { sendTransaction } = useSendTransaction();
  const {
    authenticated,
    confirmContestSupport,
    prepareContestSupport,
    state,
  } = useTokenFcSession();
  const [localContest, setLocalContest] = useState(contest);
  const [selectedArtId, setSelectedArtId] = useState<string>(
    contest.designs[0]?.id ?? "",
  );
  const [supportAmount, setSupportAmount] = useState(10);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const liveArts = useMemo(
    () =>
      localContest.designs.map((design, index) => ({
        creator: design.creatorLabel,
        gradient: liveGradients[index % liveGradients.length] ?? liveGradients[0]!,
        id: design.id,
        name: design.title,
        summary: `Criada por ${design.creatorLabel} e acompanhada em tempo real dentro da campanha ativa.`,
        supporters: design.supportersCount,
        totalTfc: normalizeTfcNumber(design.totalTfcRaw),
      })),
    [localContest.designs],
  );
  const latestSupport = state?.latestSupport ?? null;
  const lockedDesignId =
    latestSupport?.contestId === localContest.id ? latestSupport.designId : null;
  const selectedArt = liveArts.find((art) => art.id === selectedArtId) ?? liveArts[0];
  const currentBalance = safeNumber(state?.balanceTfcRaw, 0);
  const afterBalance = Math.max(currentBalance - supportAmount, 0);
  const nextTotal = selectedArt ? selectedArt.totalTfc + supportAmount : supportAmount;
  const confirmDisabled =
    status === "processing" ||
    !selectedArt ||
    (authenticated && Boolean(state?.membership) && currentBalance < supportAmount);

  useEffect(() => {
    setLocalContest(contest);
  }, [contest]);

  useEffect(() => {
    const preferredDesignId =
      latestSupport?.contestId === localContest.id
        ? latestSupport.designId
        : localContest.designs[0]?.id ?? "";

    if (preferredDesignId) {
      setSelectedArtId(preferredDesignId);
    }
  }, [latestSupport?.contestId, latestSupport?.designId, localContest]);

  async function handleConfirm() {
    if (!selectedArt) {
      return;
    }

    if (!authenticated) {
      setError("Acesse sua conta antes de apoiar a campanha.");
      return;
    }

    if (!state?.membership) {
      setError("Defina seu clube antes de apoiar a campanha.");
      return;
    }

    if (currentBalance < supportAmount) {
      setError("Seu saldo atual nao cobre esse apoio.");
      return;
    }

    setStatus("processing");
    setError(null);

    try {
      const prepared = await prepareContestSupport(
        localContest.id,
        selectedArt.id,
        supportAmount,
      );
      const embeddedWalletAddress =
        state?.wallets.find((wallet) => wallet.isEmbedded)?.address ?? undefined;
      const transaction = await sendTransaction(
        {
          chainId: prepared.transaction.chainId,
          data: prepared.transaction.data,
          gasLimit: prepared.transaction.gasLimit,
          to: prepared.transaction.to,
          value: prepared.transaction.value,
        },
        {
          ...(embeddedWalletAddress ? { address: embeddedWalletAddress } : {}),
          sponsor: true,
        },
      );

      await confirmContestSupport(localContest.id, prepared.intentId, transaction.hash);
      setLocalContest((current) =>
        updateContestAfterSupport(
          current,
          selectedArt.id,
          supportAmount,
          lockedDesignId === null,
        ),
      );
      setStatus("done");
    } catch (caughtError) {
      setStatus("idle");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel confirmar seu apoio agora.",
      );
    }
  }

  return (
    <CampaignCanvas
      afterBalance={afterBalance}
      arts={liveArts}
      club={club}
      compact={compact}
      currentBalance={currentBalance}
      error={error}
      lockedDesignId={lockedDesignId}
      nextTotal={nextTotal}
      onConfirm={() => void handleConfirm()}
      onSelectArt={(artId) => {
        if (lockedDesignId && artId !== lockedDesignId) {
          return;
        }

        setStatus("idle");
        setError(null);
        setSelectedArtId(artId);
      }}
      onSelectAmount={(amount) => {
        setStatus("idle");
        setError(null);
        setSupportAmount(amount);
      }}
      confirmDisabled={confirmDisabled}
      selectedArt={selectedArt}
      selectedArtId={selectedArtId}
      status={status}
      supportAmount={supportAmount}
    />
  );
}

function LocalCampaignExperience({
  club,
  compact,
}: {
  club: Club;
  compact: boolean;
}) {
  const [selectedArtId, setSelectedArtId] = useState(defaultContestArt.id);
  const [supportAmount, setSupportAmount] = useState(10);
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const selectedArt =
    contestArts.find((art) => art.id === selectedArtId) ?? defaultContestArt;
  const nextTotal = useMemo(
    () => selectedArt.totalTfc + supportAmount,
    [selectedArt.totalTfc, supportAmount],
  );
  const afterBalance = Math.max(appBalance.main - supportAmount, 0);

  function handleConfirm() {
    setStatus("processing");
    window.setTimeout(() => {
      setStatus("done");
    }, 1100);
  }

  return (
    <CampaignCanvas
      afterBalance={afterBalance}
      arts={contestArts}
      club={club}
      compact={compact}
      confirmDisabled={false}
      currentBalance={appBalance.main}
      error={null}
      lockedDesignId={null}
      nextTotal={nextTotal}
      onConfirm={handleConfirm}
      onSelectArt={(artId) => {
        setStatus("idle");
        setSelectedArtId(artId);
      }}
      onSelectAmount={(amount) => {
        setStatus("idle");
        setSupportAmount(amount);
      }}
      selectedArt={selectedArt}
      selectedArtId={selectedArtId}
      status={status}
      supportAmount={supportAmount}
    />
  );
}

function EmptyCampaignExperience({
  club,
  compact,
}: {
  club: Club;
  compact: boolean;
}) {
  return (
    <div className={compact ? "campaign-modal-simple" : "campaign-layout"}>
      <Surface
        className={compact ? "campaign-modal-stage" : "campaign-stage"}
        style={{ ["--club-accent" as string]: club.accent }}
        tone="dark"
      >
        <div className="campaign-stage-copy">
          <p className="eyebrow">Campanha ativa</p>
          <h2>Nenhuma campanha aberta neste clube agora.</h2>
          <p>
            Quando uma disputa entrar no ar, a escolha da arte e o apoio em TFC
            aparecem aqui no mesmo fluxo do painel.
          </p>
        </div>
        <JerseyArtwork className="campaign-stage-art" club={club} />
      </Surface>
    </div>
  );
}

function CampaignCanvas({
  afterBalance,
  arts,
  club,
  compact,
  currentBalance,
  error,
  lockedDesignId,
  nextTotal,
  onConfirm,
  onSelectArt,
  onSelectAmount,
  confirmDisabled,
  selectedArt,
  selectedArtId,
  status,
  supportAmount,
}: {
  afterBalance: number;
  arts: CampaignArtView[];
  club: Club;
  compact: boolean;
  currentBalance: number;
  error: string | null;
  lockedDesignId: string | null;
  nextTotal: number;
  onConfirm: () => void;
  onSelectArt: (artId: string) => void;
  onSelectAmount: (amount: number) => void;
  confirmDisabled: boolean;
  selectedArt?: CampaignArtView;
  selectedArtId: string;
  status: "idle" | "processing" | "done";
  supportAmount: number;
}) {
  if (!selectedArt) {
    return null;
  }

  if (compact) {
    return (
      <div className="campaign-modal-simple">
        <Surface
          className="campaign-modal-stage"
          style={{ ["--club-accent" as string]: club.accent }}
          tone="dark"
        >
          <div className="campaign-modal-stage-copy">
            <div className="campaign-modal-stage-head">
              <span>Arte selecionada</span>
              <em>{campaignContext.timeLeft}</em>
            </div>
            <h3>{selectedArt.name}</h3>
            <p>{selectedArt.summary}</p>
            <div className="campaign-modal-stage-stats">
              <div>
                <span>Total atual</span>
                <strong>{formatTfc(selectedArt.totalTfc)}</strong>
              </div>
              <div>
                <span>Apoiadores</span>
                <strong>{formatNumber(selectedArt.supporters)}</strong>
              </div>
            </div>
          </div>
          <JerseyArtwork className="campaign-modal-stage-art" club={club} />
        </Surface>

        <div className="campaign-modal-controls">
          <Surface className="campaign-modal-choice">
            <div className="section-heading">
              <p>Escolha a arte</p>
              <span>Uma decisao</span>
            </div>
            <div className="campaign-modal-option-list">
              {arts.map((art) => {
                const disabled = Boolean(lockedDesignId && art.id !== lockedDesignId);

                return (
                  <button
                    className={
                      art.id === selectedArtId
                        ? "campaign-modal-option campaign-modal-option-active"
                        : "campaign-modal-option"
                    }
                    disabled={disabled}
                    key={art.id}
                    onClick={() => onSelectArt(art.id)}
                    type="button"
                  >
                    <div className="campaign-modal-option-copy">
                      <strong>{art.name}</strong>
                      <p>{formatNumber(art.supporters)} apoiadores</p>
                    </div>
                    <span className="campaign-modal-option-value">
                      {formatTfc(art.totalTfc)}
                    </span>
                  </button>
                );
              })}
            </div>
          </Surface>

          <Surface className="campaign-modal-support">
            <div className="section-heading">
              <p>Defina o apoio</p>
              <span>Saldo atual {formatTfc(currentBalance)}</span>
            </div>
            <div className="support-presets" aria-label="Valores de apoio">
              {supportPresets.map((preset) => (
                <button
                  className={
                    preset === supportAmount
                      ? "support-preset support-preset-active"
                      : "support-preset"
                  }
                  key={preset}
                  onClick={() => onSelectAmount(preset)}
                  type="button"
                >
                  {formatTfc(preset)}
                </button>
              ))}
            </div>

            <div className="campaign-modal-ledger">
              <div>
                <span>Apoio</span>
                <strong>{formatTfc(supportAmount)}</strong>
              </div>
              <div>
                <span>Saldo apos</span>
                <strong>{formatTfc(afterBalance)}</strong>
              </div>
            </div>

            {lockedDesignId ? (
              <p className="eyebrow">
                Depois do primeiro apoio, nesta demo voce so pode aumentar a mesma arte.
              </p>
            ) : null}
            {error ? (
              <p className="eyebrow" role="alert">
                {error}
              </p>
            ) : null}

            <button
              className={
                status === "done"
                  ? "button button-primary button-success campaign-modal-confirm"
                  : "button button-primary campaign-modal-confirm"
              }
              disabled={confirmDisabled}
              onClick={onConfirm}
              type="button"
            >
              {status === "processing"
                ? "Confirmando apoio..."
                : status === "done"
                  ? "Apoio confirmado"
                  : "Confirmar apoio"}
            </button>
          </Surface>
        </div>
      </div>
    );
  }

  return (
    <div className="campaign-layout">
      <CampaignFocusStage art={selectedArt} club={club} />

      <div className="campaign-layout-grid">
        <Surface className="support-rail">
          <div className="support-rail-copy">
            <p className="eyebrow">Seu apoio</p>
            <h2>{campaignContext.title}</h2>
            <p>{campaignContext.rule}</p>
          </div>

          <div className="trust-note">
            <span>Arte em foco</span>
            <strong>{selectedArt.name}</strong>
            <p>{selectedArt.summary}</p>
          </div>

          <div className="support-rail-ledger">
            <div>
              <span>Sua escolha</span>
              <strong>{selectedArt.name}</strong>
            </div>
            <div>
              <span>Apoio atual</span>
              <strong>{formatTfc(supportAmount)}</strong>
            </div>
            <div>
              <span>Saldo atual</span>
              <strong>{formatTfc(currentBalance)}</strong>
            </div>
            <div>
              <span>Saldo apos apoio</span>
              <strong>{formatTfc(afterBalance)}</strong>
            </div>
          </div>

          <div className="support-presets" aria-label="Valores de apoio">
            {supportPresets.map((preset) => (
              <button
                className={
                  preset === supportAmount
                    ? "support-preset support-preset-active"
                    : "support-preset"
                }
                key={preset}
                onClick={() => onSelectAmount(preset)}
                type="button"
              >
                {formatTfc(preset)}
              </button>
            ))}
          </div>

          {lockedDesignId ? (
            <p className="eyebrow">
              Depois do primeiro apoio, nesta demo voce so pode aumentar a mesma arte.
            </p>
          ) : null}
          {error ? (
            <p className="eyebrow" role="alert">
              {error}
            </p>
          ) : null}

          <button
            className={
              status === "done"
                ? "button button-primary button-success"
                : "button button-primary"
            }
            disabled={confirmDisabled}
            onClick={onConfirm}
            type="button"
          >
            {status === "processing"
              ? "Confirmando apoio..."
              : status === "done"
                ? "Apoio confirmado"
                : "Confirmar apoio"}
          </button>

          <div className="trust-note">
            <span>Consequencia imediata</span>
            <strong>{formatTfc(nextTotal)} apos seu apoio</strong>
            <p>{campaignContext.warning}</p>
          </div>
        </Surface>

        <Surface className="contest-ranking">
          <div className="section-heading">
            <p>Ranking das artes</p>
            <span>Restam {campaignContext.timeLeft}</span>
          </div>
          <div className="contest-option-list">
            {arts.map((art) => {
              const disabled = Boolean(lockedDesignId && art.id !== lockedDesignId);

              return (
                <button
                  className={
                    art.id === selectedArtId
                      ? "contest-option contest-option-active"
                      : "contest-option"
                  }
                  disabled={disabled}
                  key={art.id}
                  onClick={() => onSelectArt(art.id)}
                  type="button"
                >
                  <div>
                    <strong>{art.name}</strong>
                    <p>{art.summary}</p>
                  </div>
                  <div className="contest-option-meta">
                    <span>{art.supporters} apoiadores</span>
                    <strong>{formatTfc(art.totalTfc)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        </Surface>
      </div>
    </div>
  );
}

function updateContestAfterSupport(
  contest: NonNullable<ClubDashboardContest>,
  designId: string,
  amountTfc: number,
  incrementSupporters: boolean,
) {
  const nextDesigns = contest.designs
    .map((design) =>
      design.id === designId
        ? {
            ...design,
            supportersCount: design.supportersCount + (incrementSupporters ? 1 : 0),
            totalTfcRaw: String(Number(design.totalTfcRaw) + amountTfc),
          }
        : design,
    )
    .sort((left, right) => {
      const leftTotal = Number(left.totalTfcRaw);
      const rightTotal = Number(right.totalTfcRaw);

      if (leftTotal === rightTotal) {
        return Number(left.onchainDesignId) - Number(right.onchainDesignId);
      }

      return rightTotal - leftTotal;
    });

  return {
    ...contest,
    designs: nextDesigns,
  };
}

function safeNumber(value: string | undefined, fallback: number) {
  return normalizeTfcNumber(value, fallback);
}
