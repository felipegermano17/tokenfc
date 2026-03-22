export function resolveDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
  if (!rawUrl) {
    throw new Error("DATABASE_URL is required");
  }

  // Cloud Run uses the Unix socket query param, but local dev on Windows goes
  // through Cloud SQL Auth Proxy on 127.0.0.1:5432 instead.
  if (process.platform === "win32" && rawUrl.includes("?host=%2Fcloudsql%2F")) {
    return rawUrl
      .replace(/\?host=.*$/, "")
      .replace("@localhost/", "@127.0.0.1:5432/");
  }

  return rawUrl;
}
