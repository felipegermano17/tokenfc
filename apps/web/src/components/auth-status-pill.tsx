"use client";

import { useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthRuntime } from "@/components/app-providers";
import { resolvePrivyIdentity, tokenFcLoginMethods } from "@/lib/privy";

export function AuthStatusPill() {
  const { privyEnabled } = useAuthRuntime();

  if (!privyEnabled) {
    return (
      <div className="identity-pill" aria-label="Modo local ativo">
        <span className="identity-pill-avatar">T</span>
        <span className="identity-pill-copy">
          <small>Modo local</small>
          <strong>Demo sem login</strong>
        </span>
      </div>
    );
  }

  return <PrivyAuthStatusPill />;
}

function PrivyAuthStatusPill() {
  const { authenticated, login, ready, user } = usePrivy();
  const identity = useMemo(() => resolvePrivyIdentity(user), [user]);

  if (!ready) {
    return (
      <div className="identity-pill" aria-label="Preparando acesso">
        <span className="identity-pill-avatar">T</span>
        <span className="identity-pill-copy">
          <small>Preparando</small>
          <strong>Carregando acesso</strong>
        </span>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        aria-label="Acessar conta"
        className="identity-pill"
        onClick={() => login({ loginMethods: [...tokenFcLoginMethods] })}
        type="button"
      >
        <span className="identity-pill-avatar">+</span>
        <span className="identity-pill-copy">
          <small>Conta</small>
          <strong>Acessar conta</strong>
        </span>
      </button>
    );
  }

  return (
    <div className="identity-pill" aria-label={`${identity.meta} conectada`}>
      <span className="identity-pill-avatar">{identity.avatar}</span>
      <span className="identity-pill-copy">
        <small>{identity.meta}</small>
        <strong>{identity.label}</strong>
      </span>
    </div>
  );
}
