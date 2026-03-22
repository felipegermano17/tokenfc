const ONCHAIN_TFC_SCALE = BigInt(10) ** BigInt(18);

function parseTfcValue(value: string | number | bigint | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return null;
    }

    return BigInt(Math.trunc(value));
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

function normalizeTfcValue(value: bigint) {
  if (value >= ONCHAIN_TFC_SCALE && value % ONCHAIN_TFC_SCALE === BigInt(0)) {
    return value / ONCHAIN_TFC_SCALE;
  }

  return value;
}

export function normalizeTfcRawString(
  value: string | number | bigint | null | undefined,
  fallback = "0",
) {
  const parsed = parseTfcValue(value);

  if (parsed === null) {
    return fallback;
  }

  return normalizeTfcValue(parsed).toString();
}

export function normalizeTfcNumber(
  value: string | number | bigint | null | undefined,
  fallback = 0,
) {
  const parsed = Number(normalizeTfcRawString(value, String(fallback)));

  return Number.isFinite(parsed) ? parsed : fallback;
}
