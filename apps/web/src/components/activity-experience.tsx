"use client";

import { useAuthRuntime, useTokenFcSession } from "@/components/app-providers";
import {
  ActivityLedgerTimeline,
  Surface,
} from "@/components/tokenfc-ui";
import { activityFeed, formatTfc } from "@/lib/data";
import { normalizeTfcNumber } from "@/lib/tfc";

export function ActivityExperience() {
  const { privyEnabled } = useAuthRuntime();
  const { state } = useTokenFcSession();
  const activitySummary = state?.activitySummary;
  const items = privyEnabled ? state?.activity ?? [] : activityFeed;
  const currentBalance = privyEnabled
    ? normalizeTfcNumber(activitySummary?.currentBalanceTfcRaw, 0)
    : 22;
  const lastSupport = privyEnabled
    ? normalizeTfcNumber(activitySummary?.lastSupportTfcRaw, 0)
    : 10;
  const lastOrder = privyEnabled
    ? normalizeTfcNumber(activitySummary?.lastOrderTfcRaw, 0)
    : 40;

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
            <strong>{formatTfc(currentBalance)}</strong>
          </div>
          <div>
            <span>Ultimo apoio</span>
            <strong>{formatTfc(lastSupport)}</strong>
          </div>
          <div>
            <span>Ultima compra</span>
            <strong>{formatTfc(lastOrder)}</strong>
          </div>
        </div>
      </Surface>

      <Surface className="activity-page-surface">
        <div className="section-heading">
          <p>Linha do tempo</p>
          <span>Ultimos movimentos confirmados</span>
        </div>
        {items.length ? (
          <ActivityLedgerTimeline items={items} />
        ) : (
          <p>A atividade aparece aqui assim que voce concluir sua primeira acao.</p>
        )}
      </Surface>
    </div>
  );
}
