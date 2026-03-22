"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createContext, useContext, type ReactNode } from "react";
import { monadTestnet } from "viem/chains";

type AuthRuntimeContextValue = {
  apiBaseUrl: string;
  privyEnabled: boolean;
};

const AuthRuntimeContext = createContext<AuthRuntimeContextValue>({
  apiBaseUrl: "http://127.0.0.1:4000",
  privyEnabled: false,
});

const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://127.0.0.1:4000";

export function useAuthRuntime() {
  return useContext(AuthRuntimeContext);
}

export function AppProviders({ children }: { children: ReactNode }) {
  const runtime = {
    apiBaseUrl,
    privyEnabled: Boolean(privyAppId),
  };

  if (!privyAppId) {
    return (
      <AuthRuntimeContext.Provider value={runtime}>
        {children}
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
        {children}
      </PrivyProvider>
    </AuthRuntimeContext.Provider>
  );
}
