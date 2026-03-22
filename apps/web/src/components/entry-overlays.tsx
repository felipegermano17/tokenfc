"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { useRouter } from "next/navigation";
import { RankingOverview } from "@/components/ranking-overview";

function useOverlayFocus(close: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !ref.current) {
        return;
      }

      const focusable = ref.current.querySelectorAll<HTMLElement>(
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
  }, [close, ref]);
}

function OverlayChrome({
  title,
  copy,
  closeHref,
  variant,
  children,
}: {
  title: string;
  copy: string;
  closeHref: string;
  variant: "bottom-sheet" | "modal-sheet";
  children: ReactNode;
}) {
  const router = useRouter();
  const titleId = useId();
  const descriptionId = useId();
  const shellRef = useRef<HTMLDivElement>(null);

  useOverlayFocus(() => router.replace(closeHref), shellRef);

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={variant === "bottom-sheet" ? "entry-overlay-backdrop entry-overlay-backdrop-bottom" : "entry-overlay-backdrop"}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          router.replace(closeHref);
        }
      }}
      role="dialog"
    >
      <div
        className={variant === "bottom-sheet" ? "entry-sheet entry-sheet-bottom" : "entry-sheet"}
        ref={shellRef}
        tabIndex={-1}
      >
        <div className="entry-sheet-head">
          <div>
            <p className="eyebrow">Token F.C.</p>
            <h2 id={titleId}>{title}</h2>
            <p id={descriptionId}>{copy}</p>
          </div>
          <button
            className="modal-close"
            onClick={() => router.replace(closeHref)}
            type="button"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function RankingSheet({ closeHref }: { closeHref: string }) {
  return (
    <OverlayChrome
      closeHref={closeHref}
      copy="Veja como a plataforma separa volume de torcida e forca economica sem sair da jornada principal."
      title="Ranking geral do ecossistema"
      variant="modal-sheet"
    >
      <RankingOverview />
    </OverlayChrome>
  );
}

export function HomeOverlay({ sheet }: { sheet?: string | null }) {
  if (sheet === "ranking") {
    return <RankingSheet closeHref="/" />;
  }

  return null;
}
