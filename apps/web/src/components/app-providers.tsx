"use client";

import {
  PrivyProvider,
  usePrivy,
  useToken,
  useWallets,
} from "@privy-io/react-auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { monadTestnet } from "viem/chains";
import { mapPrivyWalletsForSession } from "@/lib/privy";

type AuthRuntimeContextValue = {
  apiBaseUrl: string;
  privyEnabled: boolean;
};

type AppWalletState = {
  address: string;
  isEmbedded: boolean;
  provider: string;
};

type AppMembershipState = {
  clubId: string;
  clubPassTokenId: string | null;
  clubSlug: string;
  clubName: string;
} | null;

type ActivationState = {
  intentId: string;
  status: string;
} | null;

type LatestTopupState = {
  customerStatus: string;
  id: string;
  internalStatus: string;
  tfcAmountRaw: string;
} | null;

export type TokenFcAppState = {
  activation: ActivationState;
  balanceTfcRaw: string;
  latestTopup: LatestTopupState;
  membership: AppMembershipState;
  wallets: AppWalletState[];
};

type TopupCreateResponse = {
  ok: true;
  order: {
    brlAmount: string;
    customerStatus: string;
    expiresAt: string | null;
    id: string;
    pixCode: string | null;
    pixQrPayload: string | null;
    tfcAmountRaw: string;
  };
  projectedBalanceTfcRaw: string;
};

type TopupApproveResponse = {
  ok: true;
  order: {
    customerStatus: string;
    id: string;
    internalStatus: string;
    tfcAmountRaw: string;
  } | null;
  processingState: string;
} & TokenFcAppState;

type TokenFcSessionContextValue = {
  authenticated: boolean;
  error: string | null;
  loading: boolean;
  state: TokenFcAppState | null;
  createPixTopup: (amountTfc: number) => Promise<TopupCreateResponse>;
  approvePixTopup: (orderId: string) => Promise<TopupApproveResponse>;
  refresh: () => Promise<TokenFcAppState | null>;
};

const AuthRuntimeContext = createContext<AuthRuntimeContextValue>({
  apiBaseUrl: "http://127.0.0.1:4000",
  privyEnabled: false,
});
const TokenFcSessionContext = createContext<TokenFcSessionContextValue>({
  authenticated: false,
  error: null,
  loading: false,
  state: null,
  createPixTopup: async () => {
    throw new Error("Sessao Token F.C. indisponivel.");
  },
  approvePixTopup: async () => {
    throw new Error("Sessao Token F.C. indisponivel.");
  },
  refresh: async () => null,
});

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:4000";

export function useAuthRuntime() {
  return useContext(AuthRuntimeContext);
}

export function useTokenFcSession() {
  return useContext(TokenFcSessionContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const runtime = {
    apiBaseUrl,
    privyEnabled: Boolean(privyAppId),
  };

  if (!privyAppId) {
    return (
      <AuthRuntimeContext.Provider value={runtime}>
        <TokenFcSessionContext.Provider
          value={{
            authenticated: false,
            error: null,
            loading: false,
            state: null,
            createPixTopup: async () => {
              throw new Error("Ative o Privy para usar o saldo real.");
            },
            approvePixTopup: async () => {
              throw new Error("Ative o Privy para usar o saldo real.");
            },
            refresh: async () => null,
          }}
        >
          {children}
        </TokenFcSessionContext.Provider>
      </AuthRuntimeContext.Provider>
    );
  }

  return (
    <AuthRuntimeContext.Provider value={runtime}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          defaultChain: monadTestnet,
          supportedChains: [monadTestnet],
          loginMethods: ["google", "apple", "email", "passkey"],
          embeddedWallets: {
            // MVP: usamos a embedded wallet padrao da Privy pela velocidade de demo.
            // Futuramente podemos migrar para um modelo mais restrito se a portabilidade deixar de ser desejada.
            ethereum: { createOnLogin: "all-users" },
            showWalletUIs: false,
          },
        }}
      >
        <PrivyTokenFcSessionProvider>{children}</PrivyTokenFcSessionProvider>
      </PrivyProvider>
    </AuthRuntimeContext.Provider>
  );
}

function PrivyTokenFcSessionProvider({ children }: { children: ReactNode }) {
  const { apiBaseUrl } = useAuthRuntime();
  const { authenticated, ready } = usePrivy();
  const { getAccessToken } = useToken();
  const { wallets } = useWallets();
  const [state, setState] = useState<TokenFcAppState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const syncPromiseRef = useRef<Promise<TokenFcAppState | null> | null>(null);
  const walletPayload = useMemo(() => mapPrivyWalletsForSession(wallets), [wallets]);
  const walletFingerprint = useMemo(
    () => JSON.stringify(walletPayload),
    [walletPayload],
  );

  const withAccessToken = useCallback(async () => {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error("A sessao nao ficou pronta para continuar.");
    }

    return accessToken;
  }, [getAccessToken]);

  const refresh = useCallback(async () => {
    if (!ready || !authenticated) {
      setState(null);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const accessToken = await withAccessToken();
      const payload = (await requestJson(`${apiBaseUrl}/auth/me`, {
        accessToken,
        method: "GET",
      })) as TokenFcAppState & { ok: true };
      const nextState = extractAppState(payload);
      setState(nextState);
      return nextState;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "Nao foi possivel atualizar sua conta.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, authenticated, ready, withAccessToken]);

  const syncSession = useCallback(async () => {
    if (!ready || !authenticated) {
      setState(null);
      return null;
    }

    if (syncPromiseRef.current) {
      return syncPromiseRef.current;
    }

    const promise = (async () => {
      setLoading(true);
      setError(null);

      try {
        const accessToken = await withAccessToken();
        const payload = (await requestJson(`${apiBaseUrl}/auth/session`, {
          accessToken,
          body: { wallets: walletPayload },
          method: "POST",
        })) as TokenFcAppState & { ok: true };
        const nextState = extractAppState(payload);
        setState(nextState);
        return nextState;
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Nao foi possivel preparar sua conta.";
        setError(message);
        return null;
      } finally {
        syncPromiseRef.current = null;
        setLoading(false);
      }
    })();

    syncPromiseRef.current = promise;
    return promise;
  }, [apiBaseUrl, authenticated, ready, walletPayload, withAccessToken]);

  const createPixTopup = useCallback(
    async (amountTfc: number) => {
      const accessToken = await withAccessToken();

      return (await requestJson(`${apiBaseUrl}/topup/pix`, {
        accessToken,
        body: { amountTfc },
        method: "POST",
      })) as TopupCreateResponse;
    },
    [apiBaseUrl, withAccessToken],
  );

  const approvePixTopup = useCallback(
    async (orderId: string) => {
      const accessToken = await withAccessToken();
      const payload = (await requestJson(`${apiBaseUrl}/topup/pix/${orderId}/approve`, {
        accessToken,
        method: "POST",
      })) as TopupApproveResponse;
      setState(extractAppState(payload));
      return payload;
    },
    [apiBaseUrl, withAccessToken],
  );

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!authenticated) {
      setState(null);
      setError(null);
      setLoading(false);
      return;
    }

    void syncSession();
  }, [authenticated, ready, syncSession, walletFingerprint]);

  return (
    <TokenFcSessionContext.Provider
      value={{
        authenticated,
        error,
        loading,
        state,
        createPixTopup,
        approvePixTopup,
        refresh,
      }}
    >
      {children}
    </TokenFcSessionContext.Provider>
  );
}

function extractAppState(payload: {
  activation?: ActivationState;
  balanceTfcRaw?: string;
  latestTopup?: LatestTopupState;
  membership?: AppMembershipState;
  wallets?: AppWalletState[];
}) {
  return {
    activation: payload.activation ?? null,
    balanceTfcRaw: payload.balanceTfcRaw ?? "0",
    latestTopup: payload.latestTopup ?? null,
    membership: payload.membership ?? null,
    wallets: payload.wallets ?? [],
  };
}

async function requestJson(
  url: string,
  options: {
    accessToken: string;
    body?: unknown;
    method?: "GET" | "POST";
  },
) {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${options.accessToken}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json().catch(() => null);
}

async function readErrorMessage(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  return payload?.error ?? "Nao foi possivel concluir esta etapa.";
}
