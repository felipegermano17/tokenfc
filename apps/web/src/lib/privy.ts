import type { ConnectedWallet, User } from "@privy-io/react-auth";

export const tokenFcLoginMethods = ["email"] as const;

export function mapPrivyWalletsForSession(wallets: ConnectedWallet[]) {
  const byAddress = new Map<
    string,
    {
      address: string;
      isEmbedded: boolean;
      provider: string;
    }
  >();

  for (const wallet of wallets) {
    if (!wallet.address) {
      continue;
    }

    const walletClientType =
      "walletClientType" in wallet && typeof wallet.walletClientType === "string"
        ? wallet.walletClientType
        : "privy";
    const connectorType =
      "connectorType" in wallet && typeof wallet.connectorType === "string"
        ? wallet.connectorType
        : "";

    byAddress.set(wallet.address.toLowerCase(), {
      address: wallet.address,
      isEmbedded:
        walletClientType.startsWith("privy") ||
        connectorType.includes("embedded"),
      provider: walletClientType,
    });
  }

  return [...byAddress.values()];
}

export function resolvePrivyIdentity(user: User | null) {
  if (user?.google?.email) {
    return {
      avatar: "G",
      label: user.google.email,
      meta: "Google",
    };
  }

  if (user?.apple?.email) {
    return {
      avatar: "A",
      label: user.apple.email,
      meta: "Apple",
    };
  }

  if (user?.email?.address) {
    return {
      avatar: "E",
      label: user.email.address,
      meta: "Email",
    };
  }

  return {
    avatar: "T",
    label: "Conta conectada",
    meta: "Token F.C.",
  };
}
