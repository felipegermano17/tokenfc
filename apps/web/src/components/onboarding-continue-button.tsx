"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy, useToken, useWallets } from "@privy-io/react-auth";
import { useAuthRuntime } from "@/components/app-providers";
import { mapPrivyWalletsForSession, tokenFcLoginMethods } from "@/lib/privy";

const pendingClubStorageKey = "tokenfc:selected-club";

export function OnboardingContinueButton({
  clubName,
  clubSlug,
}: {
  clubName: string;
  clubSlug: string;
}) {
  const { privyEnabled } = useAuthRuntime();

  if (!privyEnabled) {
    return (
      <Link
        className="button button-primary"
        href={`/activating?club=${clubSlug}&auth=local`}
      >
        Continuar com {clubName}
      </Link>
    );
  }

  return <PrivyOnboardingContinueButton clubName={clubName} clubSlug={clubSlug} />;
}

function PrivyOnboardingContinueButton({
  clubName,
  clubSlug,
}: {
  clubName: string;
  clubSlug: string;
}) {
  const router = useRouter();
  const { apiBaseUrl } = useAuthRuntime();
  const { authenticated, login, ready } = usePrivy();
  const { getAccessToken } = useToken();
  const { wallets } = useWallets();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "auth" | "sync" | "error">("idle");
  const pendingClubRef = useRef<string | null>(null);
  const syncInFlightRef = useRef(false);

  const walletPayload = useMemo(
    () => mapPrivyWalletsForSession(wallets),
    [wallets],
  );

  const completeOnboarding = useCallback(
    async (slug: string) => {
      if (syncInFlightRef.current) {
        return;
      }

      syncInFlightRef.current = true;
      setError(null);
      setStatus("sync");

      try {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          throw new Error("A sessao nao ficou pronta para continuar.");
        }

        await postJson(`${apiBaseUrl}/auth/session`, accessToken, {
          wallets: walletPayload,
        });
        await postJson(`${apiBaseUrl}/onboarding/select-club`, accessToken, {
          clubSlug: slug,
        });

        window.localStorage.removeItem(pendingClubStorageKey);
        pendingClubRef.current = null;
        router.push(`/activating?club=${slug}&auth=privy`);
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Nao foi possivel preparar seu perfil agora.";

        setError(message);
        setStatus("error");
      } finally {
        syncInFlightRef.current = false;
      }
    },
    [apiBaseUrl, getAccessToken, router, walletPayload],
  );

  useEffect(() => {
    if (!ready || !authenticated) {
      return;
    }

    const pendingClub =
      pendingClubRef.current ?? window.localStorage.getItem(pendingClubStorageKey);

    if (!pendingClub) {
      return;
    }

    void completeOnboarding(pendingClub);
  }, [authenticated, completeOnboarding, ready]);

  function handleContinue() {
    pendingClubRef.current = clubSlug;
    window.localStorage.setItem(pendingClubStorageKey, clubSlug);
    setError(null);

    if (!ready) {
      setStatus("auth");
      return;
    }

    if (authenticated) {
      void completeOnboarding(clubSlug);
      return;
    }

    setStatus("auth");
    login({ loginMethods: [...tokenFcLoginMethods] });
  }

  const label =
    status === "sync"
      ? "Preparando perfil..."
      : status === "auth"
        ? "Abrindo acesso..."
        : `Continuar com ${clubName}`;

  return (
    <div>
      <button
        className="button button-primary"
        disabled={status === "sync"}
        onClick={handleContinue}
        type="button"
      >
        {label}
      </button>
      {error ? (
        <p className="eyebrow" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function postJson(url: string, accessToken: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    throw new Error(payload?.error ?? "Nao foi possivel concluir esta etapa.");
  }

  return response.json().catch(() => null);
}
