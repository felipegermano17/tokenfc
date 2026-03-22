"use client";

import { useMemo } from "react";
import { useTokenFcSession } from "@/components/app-providers";
import {
  BalanceCapsule,
  ClubCrest,
  JerseyArtwork,
  LinkButton,
  Surface,
} from "@/components/tokenfc-ui";
import type { Club } from "@/lib/data";
import { normalizeTfcNumber } from "@/lib/tfc";

export function LiveClubHero({
  club,
  balance,
  title,
  copy,
  ctaHref,
  ctaLabel,
  context,
}: {
  club: Club;
  balance: number;
  title: string;
  copy: string;
  ctaHref: string;
  ctaLabel: string;
  context: Array<{ label: string; value: string }>;
}) {
  const { state } = useTokenFcSession();
  const resolvedBalance = useMemo(
    () => normalizeTfcNumber(state?.balanceTfcRaw, balance),
    [balance, state?.balanceTfcRaw],
  );

  return (
    <Surface
      className="club-hero"
      tone="dark"
      style={{
        ["--club-accent" as string]: club.accent,
        ["--club-accent-soft" as string]: club.accentSoft,
        ["--club-dark" as string]: club.dark,
        ["--club-glow" as string]: club.glow,
      }}
    >
      <div className="club-hero-grid">
        <div className="club-hero-copy">
          <div className="hero-context">
            <ClubCrest club={club} size="small" />
            <div>
              <p className="eyebrow">{club.name}</p>
              <span>{club.story}</span>
            </div>
          </div>
          <h1>{title}</h1>
          <p>{copy}</p>
          <div className="hero-actions">
            <LinkButton href={ctaHref}>{ctaLabel}</LinkButton>
            <BalanceCapsule balance={resolvedBalance} />
          </div>
        </div>
        <div className="club-hero-stage">
          <JerseyArtwork className="club-hero-jersey" club={club} />
          <div className="club-hero-metrics">
            {context.map((item) => (
              <div className="hero-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Surface>
  );
}
