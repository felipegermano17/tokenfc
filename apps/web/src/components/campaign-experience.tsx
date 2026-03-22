"use client";

import { useMemo, useState } from "react";
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

const supportPresets = [3, 5, 10, 20];

export function CampaignExperience({
  club,
  compact = false,
}: {
  club: Club;
  compact?: boolean;
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

  if (compact) {
    return (
      <div className="campaign-modal-simple">
        <Surface className="campaign-modal-stage" tone="dark" style={{ ["--club-accent" as string]: club.accent }}>
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
              {contestArts.map((art) => (
                <button
                  className={
                    art.id === selectedArt.id
                      ? "campaign-modal-option campaign-modal-option-active"
                      : "campaign-modal-option"
                  }
                  key={art.id}
                  onClick={() => {
                    setStatus("idle");
                    setSelectedArtId(art.id);
                  }}
                  type="button"
                >
                  <div className="campaign-modal-option-copy">
                    <strong>{art.name}</strong>
                    <p>{formatNumber(art.supporters)} apoiadores</p>
                  </div>
                  <span className="campaign-modal-option-value">{formatTfc(art.totalTfc)}</span>
                </button>
              ))}
            </div>
          </Surface>

          <Surface className="campaign-modal-support">
            <div className="section-heading">
              <p>Defina o apoio</p>
              <span>Saldo atual {formatTfc(appBalance.main)}</span>
            </div>
            <div className="support-presets" aria-label="Valores de apoio">
              {supportPresets.map((preset) => (
                <button
                  className={preset === supportAmount ? "support-preset support-preset-active" : "support-preset"}
                  key={preset}
                  onClick={() => {
                    setStatus("idle");
                    setSupportAmount(preset);
                  }}
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

            <button
              className={
                status === "done"
                  ? "button button-primary button-success campaign-modal-confirm"
                  : "button button-primary campaign-modal-confirm"
              }
              onClick={handleConfirm}
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
            <h2>{compact ? "Escolha arte e valor" : campaignContext.title}</h2>
            <p>
              {compact
                ? "Defina a arte, ajuste o valor em TFC e confirme a participacao."
                : campaignContext.rule}
            </p>
          </div>

          {!compact ? (
            <div className="trust-note">
              <span>Arte em foco</span>
              <strong>{selectedArt.name}</strong>
              <p>{selectedArt.summary}</p>
            </div>
          ) : null}

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
              <strong>{formatTfc(appBalance.main)}</strong>
            </div>
            <div>
              <span>Saldo apos apoio</span>
              <strong>{formatTfc(afterBalance)}</strong>
            </div>
          </div>

          <div className="support-presets" aria-label="Valores de apoio">
            {supportPresets.map((preset) => (
              <button
                className={preset === supportAmount ? "support-preset support-preset-active" : "support-preset"}
              key={preset}
              onClick={() => {
                setStatus("idle");
                setSupportAmount(preset);
              }}
              type="button"
            >
              {formatTfc(preset)}
            </button>
          ))}
        </div>

          <button
            className={
              status === "done"
                ? "button button-primary button-success"
                : "button button-primary"
            }
            onClick={handleConfirm}
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
            <p>{compact ? "Artes na disputa" : "Ranking das artes"}</p>
            <span>Restam {campaignContext.timeLeft}</span>
          </div>
          <div className="contest-option-list">
            {contestArts.map((art) => (
              <button
                className={
                  art.id === selectedArt.id
                    ? "contest-option contest-option-active"
                    : "contest-option"
                }
                key={art.id}
                onClick={() => {
                  setStatus("idle");
                  setSelectedArtId(art.id);
                }}
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
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
