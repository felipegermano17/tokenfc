"use client";

import { useMemo, useState } from "react";
import { appBalance, formatCurrency, formatTfc, topupOptions } from "@/lib/data";
import { Surface } from "@/components/tokenfc-ui";

type FlowState = "review" | "pix" | "released";

const pixCodePrefix = "00020126580014BR.GOV.BCB.PIX0136TOKENFC-PIX";

export function CreditFlowPanel() {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [flowState, setFlowState] = useState<FlowState>("review");

  const projectedBalance = useMemo(
    () => appBalance.main + selectedAmount,
    [selectedAmount],
  );
  const pixCode = `${pixCodePrefix}${String(selectedAmount).padStart(3, "0")}5204000053039865802BR5925TOKEN FC PIX6009SAO PAULO62070503***6304ABCD`;

  return (
    <Surface className="credit-flow-panel credit-flow-panel-simple">
      <div className="credit-flow-head">
        <div>
          <p className="eyebrow">Credito via PIX</p>
          <h1>Adicionar TFC</h1>
          <p>Escolha um valor, gere o PIX e confirme o pagamento.</p>
        </div>
        <div
          className={
            flowState === "review"
              ? "status-pill status-pill-neutral"
              : flowState === "pix"
                ? "status-pill status-pill-warning"
                : "status-pill status-pill-success"
          }
        >
          {flowState === "review"
            ? "Escolha um valor"
            : flowState === "pix"
              ? "Aguardando pagamento"
              : "Saldo liberado"}
        </div>
      </div>

      <div className="support-presets support-presets-credit">
        {topupOptions.map((option) => (
          <button
            className={
              selectedAmount === option ? "support-preset support-preset-active" : "support-preset"
            }
            key={option}
            onClick={() => {
              setSelectedAmount(option);
              setFlowState("review");
            }}
            type="button"
          >
            {formatTfc(option)}
          </button>
        ))}
      </div>

      <div className="credit-flow-ledger credit-flow-ledger-compact">
        <div>
          <span>Saldo atual</span>
          <strong>{formatTfc(appBalance.main)}</strong>
        </div>
        <div>
          <span>Valor escolhido</span>
          <strong>{formatTfc(selectedAmount)}</strong>
        </div>
        <div>
          <span>Em reais</span>
          <strong>{formatCurrency(selectedAmount)}</strong>
        </div>
        <div>
          <span>Saldo apos credito</span>
          <strong>{formatTfc(projectedBalance)}</strong>
        </div>
      </div>

      {flowState === "review" ? (
        <>
          <div className="trust-note trust-note-inline">
            <span>Resumo</span>
            <strong>{formatTfc(selectedAmount)} entram na conta apos a confirmacao.</strong>
            <p>Saldo atual, valor escolhido e saldo final aparecem antes de seguir.</p>
          </div>

          <div className="credit-flow-actions">
            <button
              className="button button-primary"
              onClick={() => setFlowState("pix")}
              type="button"
            >
              Gerar PIX
            </button>
          </div>
        </>
      ) : (
        <div className="credit-pix-stage credit-pix-stage-simple">
          <div className="credit-pix-card credit-pix-card-dominant">
            <div className="section-heading">
              <p>QR PIX</p>
              <span>{formatCurrency(selectedAmount)}</span>
            </div>
            <div className="pix-qr-shell">
              <div className="pix-qr-art" aria-hidden="true">
                <div className="pix-qr-finder pix-qr-finder-tl" />
                <div className="pix-qr-finder pix-qr-finder-tr" />
                <div className="pix-qr-finder pix-qr-finder-bl" />
                <div className="pix-qr-noise" />
              </div>
            </div>
            <div className="pix-code-shell">
              <span>Codigo PIX</span>
              <code>{pixCode}</code>
            </div>
          </div>

          <div className="credit-status-card credit-status-card-simple">
            <div className="section-heading">
              <p>Status do credito</p>
              <span>{flowState === "released" ? "Concluido" : "Pagamento aguardando"}</span>
            </div>
            <div className="credit-status-list">
              <article className="credit-status-row credit-status-row-done">
                <strong>01</strong>
                <div>
                  <span>PIX gerado</span>
                  <p>Codigo e QR prontos para o pagamento.</p>
                </div>
              </article>
              <article className={flowState === "released" ? "credit-status-row credit-status-row-done" : "credit-status-row credit-status-row-active"}>
                <strong>02</strong>
                <div>
                  <span>Pagamento</span>
                  <p>{flowState === "released" ? "Pagamento confirmado." : "Aguardando confirmacao do pagamento."}</p>
                </div>
              </article>
              <article className={flowState === "released" ? "credit-status-row credit-status-row-done" : "credit-status-row"}>
                <strong>03</strong>
                <div>
                  <span>Saldo liberado</span>
                  <p>{flowState === "released" ? `Novo saldo: ${formatTfc(projectedBalance)}.` : "O novo saldo entra na conta apos a confirmacao."}</p>
                </div>
              </article>
            </div>
            <button
              className={flowState === "released" ? "button button-primary button-success" : "button button-primary"}
              onClick={() => setFlowState("released")}
              type="button"
            >
              {flowState === "released" ? "Saldo liberado" : "Confirmar pagamento"}
            </button>
          </div>
        </div>
      )}
    </Surface>
  );
}
