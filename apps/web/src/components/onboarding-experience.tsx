"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clubs, normalizeSearchValue } from "@/lib/data";
import {
  ClubCrest,
  PageIntro,
  Surface,
} from "@/components/tokenfc-ui";

export function OnboardingExperience() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const filteredClubs = useMemo(() => {
    const normalized = normalizeSearchValue(query);

    if (!normalized) {
      return clubs;
    }

    return clubs.filter((club) =>
      [club.name, club.shortName, ...club.aliases]
        .map(normalizeSearchValue)
        .some((term) => term.includes(normalized)),
    );
  }, [query]);

  const selectedClub =
    clubs.find((club) => club.slug === selectedSlug) ?? null;

  return (
    <div className="stack-2xl onboarding-layout">
      <Surface className="onboarding-stage onboarding-stage-reset">
        <div className="onboarding-stage-top onboarding-stage-top-inline">
          <PageIntro
            eyebrow="Novo perfil"
            title="Escolha seu clube"
            copy="Busque pelo seu time ou escolha entre os destaques."
          />
          <label className="search-shell onboarding-search-inline" htmlFor="club-search">
            <span>Buscar meu time</span>
            <input
              id="club-search"
              name="club-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar meu time"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="onboarding-club-block">
          <div className="onboarding-choice-label">
            <p>{query ? "Resultados da busca" : "Clubes em destaque"}</p>
            <span>Selecione um clube para continuar</span>
          </div>

          {filteredClubs.length ? (
            <div className="club-choice-grid">
              {filteredClubs.map((club) => (
                <button
                  aria-pressed={club.slug === selectedSlug}
                  className={club.slug === selectedSlug ? "club-choice-button club-choice-button-selected" : "club-choice-button"}
                  key={club.slug}
                  onClick={() => setSelectedSlug(club.slug)}
                  style={
                    {
                      ["--club-accent" as string]: club.accent,
                      ["--club-accent-soft" as string]: club.accentSoft,
                    }
                  }
                  type="button"
                >
                  <div className="club-choice-card">
                    <ClubCrest club={club} size="small" />
                    <div className="club-choice-copy">
                      <strong>{club.name}</strong>
                      <span>{club.city}</span>
                    </div>
                    {club.slug === selectedSlug ? (
                      <span className="club-choice-state">Selecionado</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Surface className="empty-state">
              <p className="eyebrow">Nao encontrei meu time</p>
              <h3>Nao encontramos esse clube na selecao atual.</h3>
              <p>Tente o nome oficial, o apelido ou a sigla.</p>
            </Surface>
          )}
        </div>
        {selectedClub ? (
          <div className="onboarding-confirm-bar" role="region" aria-label="Confirmacao do clube selecionado">
            <div className="onboarding-confirm-copy">
              <ClubCrest club={selectedClub} size="small" />
              <div>
                <span>Voce escolheu</span>
                <strong>{selectedClub.name}</strong>
              </div>
            </div>
            <Link
              className="button button-primary"
              href={`/activating?club=${selectedClub.slug}&auth=google`}
            >
              Continuar com {selectedClub.name}
            </Link>
          </div>
        ) : null}
      </Surface>
    </div>
  );
}
