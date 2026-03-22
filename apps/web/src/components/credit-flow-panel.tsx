"use client";

import { useMemo, useState } from "react";
import { appBalance, formatCurrency, formatTfc, topupOptions } from "@/lib/data";
import { useAuthRuntime, useTokenFcSession } from "@/components/app-providers";
import { Surface } from "@/components/tokenfc-ui";

type FlowState = "review" | "pix" | "released";

type LiveTopupOrder = {
  customerStatus: string;
  expiresAt: string | null;
  id: string;
  pixCode: string | null;
  pixQrPayload: string | null;
  tfcAmountRaw: string;
} | null;

export function CreditFlowPanel() {
  const { privyEnabled } = useAuthRuntime();

  if (!privyEnabled) {
    return <LocalCreditFlowPanel />;
  }

  return <LiveCreditFlowPanel />;
}

function LiveCreditFlowPanel() {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [flowState, setFlowState] = useState<FlowState>("review");
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<"create" | "approve" | null>(null);
  const [order, setOrder] = useState<LiveTopupOrder>(null);
  const { authenticated, approvePixTopup, createPixTopup, state } = useTokenFcSession();
  const currentBalance = safeNumber(state?.balanceTfcRaw, appBalance.main);
  const displayedAmount = safeNumber(order?.tfcAmountRaw, selectedAmount);
  const projectedBalance = useMemo(
    () => currentBalance + displayedAmount,
    [currentBalance, displayedAmount],
  );
  const pixCode = order?.pixCode ?? "";

  async function handleGeneratePix() {
    if (!authenticated) {
      setError("Acesse sua conta antes de adicionar saldo.");
      return;
    }

    if (!state?.membership) {
      setError("Defina seu clube antes de adicionar saldo.");
      return;
    }

    setOperation("create");
    setError(null);

    try {
      const payload = await createPixTopup(selectedAmount);
      setOrder(payload.order);
      setFlowState("pix");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel gerar o PIX agora.",
      );
    } finally {
      setOperation(null);
    }
  }

  async function handleApprove() {
    if (!order) {
      return;
    }

    setOperation("approve");
    setError(null);

    try {
      const payload = await approvePixTopup(order.id);

      if (payload.order) {
        const approvedOrder = payload.order;
        setOrder((current) =>
          current
            ? {
                ...current,
                customerStatus: approvedOrder.customerStatus,
                tfcAmountRaw: approvedOrder.tfcAmountRaw,
              }
            : current,
        );
      }

      setFlowState(payload.order?.customerStatus === "completed" ? "released" : "pix");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel confirmar o pagamento agora.",
      );
    } finally {
      setOperation(null);
    }
  }

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
            operation === "create" || operation === "approve"
              ? "status-pill status-pill-warning"
              : flowState === "review"
                ? "status-pill status-pill-neutral"
                : flowState === "pix"
                  ? "status-pill status-pill-warning"
                  : "status-pill status-pill-success"
          }
        >
          {operation === "create"
            ? "Gerando PIX"
            : operation === "approve"
              ? "Confirmando pagamento"
              : flowState === "review"
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
              setOrder(null);
              setError(null);
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
          <strong>{formatTfc(currentBalance)}</strong>
        </div>
        <div>
          <span>Valor escolhido</span>
          <strong>{formatTfc(displayedAmount)}</strong>
        </div>
        <div>
          <span>Em reais</span>
          <strong>{formatCurrency(displayedAmount)}</strong>
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
            <strong>{formatTfc(displayedAmount)} entram na conta apos a confirmacao.</strong>
            <p>Saldo atual, valor escolhido e saldo final aparecem antes de seguir.</p>
          </div>
          {error ? (
            <p className="eyebrow" role="alert">
              {error}
            </p>
          ) : null}

          <div className="credit-flow-actions">
            <button
              className="button button-primary"
              disabled={operation !== null}
              onClick={() => void handleGeneratePix()}
              type="button"
            >
              {operation === "create" ? "Gerando PIX..." : "Gerar PIX"}
            </button>
          </div>
        </>
      ) : (
        <div className="credit-pix-stage credit-pix-stage-simple">
          <div className="credit-pix-card credit-pix-card-dominant">
            <div className="section-heading">
              <p>QR PIX</p>
              <span>{formatCurrency(displayedAmount)}</span>
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
              <code>{pixCode || "Gerando codigo..."}</code>
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
            {error ? (
              <p className="eyebrow" role="alert">
                {error}
              </p>
            ) : null}
            <button
              className={flowState === "released" ? "button button-primary button-success" : "button button-primary"}
              disabled={!order || operation !== null}
              onClick={() => void handleApprove()}
              type="button"
            >
              {flowState === "released"
                ? "Saldo liberado"
                : operation === "approve"
                  ? "Confirmando pagamento..."
                  : "Confirmar pagamento"}
            </button>
          </div>
        </div>
      )}
    </Surface>
  );
}

function LocalCreditFlowPanel() {
  const [selectedAmount, setSelectedAmount] = useState(50);
  const [flowState, setFlowState] = useState<FlowState>("review");
  const projectedBalance = useMemo(
    () => appBalance.main + selectedAmount,
    [selectedAmount],
  );
  const pixCode = generatePixCode(selectedAmount);

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

function generatePixCode(amountTfc: number) {
  return `00020126580014BR.GOV.BCB.PIX0136TOKENFC-PIX${String(amountTfc).padStart(3, "0")}5204000053039865802BR5925TOKEN FC PIX6009SAO PAULO62070503***6304ABCD`;
}

function safeNumber(value: string | number | null | undefined, fallback: number) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value !== "string") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
