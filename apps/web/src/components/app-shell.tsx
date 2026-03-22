"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { CSSProperties, ReactNode } from "react";
import type { Club } from "@/lib/data";
import { withClubModal } from "@/lib/club-routing";
import { useTokenFcSession } from "@/components/app-providers";
import { AuthStatusPill } from "@/components/auth-status-pill";
import {
  BalanceCapsule,
  ClubCrest,
  TokenWordmark,
} from "@/components/tokenfc-ui";

export function AppShell({
  children,
  balance = 12,
  activeClub,
  mainClassName,
  shellClassName,
}: {
  children: ReactNode;
  balance?: number;
  activeClub?: Club | null;
  mainClassName?: string;
  shellClassName?: string;
}) {
  const rankingHref = activeClub ? withClubModal(activeClub.slug, "ranking") : "/?sheet=ranking";
  const balanceHref = activeClub ? withClubModal(activeClub.slug, "topup") : undefined;
  const { state } = useTokenFcSession();
  const resolvedBalance = useMemo(() => {
    const liveBalance = state?.balanceTfcRaw ? Number(state.balanceTfcRaw) : Number.NaN;

    return Number.isFinite(liveBalance) ? liveBalance : balance;
  }, [balance, state?.balanceTfcRaw]);

  return (
    <div
      className={shellClassName ? `app-shell ${shellClassName}` : "app-shell"}
      style={
        activeClub
          ? ({
              ["--club-accent" as string]: activeClub.accent,
              ["--club-accent-soft" as string]: activeClub.accentSoft,
              ["--club-dark" as string]: activeClub.dark,
              ["--club-glow" as string]: activeClub.glow,
            } as CSSProperties)
          : undefined
      }
    >
      <header className="app-topbar">
        <div className="app-topbar-inner">
          <TokenWordmark />
          <div className="app-shell-context">
            {activeClub ? (
              <>
                <ClubCrest club={activeClub} size="small" />
                <div className="app-shell-context-copy">
                  <span>Clube ativo</span>
                  <strong>{activeClub.name}</strong>
                </div>
              </>
            ) : (
              <div className="app-shell-context-copy">
                <span>Clube ativo</span>
                <strong>Defina seu clube</strong>
              </div>
            )}
          </div>
          <div className="app-topbar-side">
            <Link className="app-shell-anchor app-shell-anchor-muted" href={rankingHref}>
              Ranking geral
            </Link>
            <BalanceCapsule balance={resolvedBalance} href={balanceHref} />
            <AuthStatusPill />
          </div>
        </div>
      </header>
      <main className={mainClassName ? `app-main ${mainClassName}` : "app-main"}>{children}</main>
    </div>
  );
}
