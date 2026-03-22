import type { Club } from "@/lib/data";
import { getClubBySlug } from "@/lib/data";

export function resolveActiveClub(
  pathSlug?: string | null,
  clubQuery?: string | null,
): Club | null {
  const candidates = [pathSlug, clubQuery].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const club = getClubBySlug(candidate);

    if (club) {
      return club;
    }
  }

  return null;
}

export function withClubQuery(href: string, clubSlug?: string | null) {
  if (!clubSlug) {
    return href;
  }

  const [path = "", hashFragment] = href.split("#");
  const [pathname = "", queryString] = path.split("?");
  const searchParams = new URLSearchParams(queryString ?? "");

  searchParams.set("club", clubSlug);

  const nextHref = `${pathname}?${searchParams.toString()}`;

  return hashFragment ? `${nextHref}#${hashFragment}` : nextHref;
}

export function withClubModal(
  slug: string,
  modal?: string | null,
  extras?: Record<string, string | number | null | undefined>,
) {
  const searchParams = new URLSearchParams();

  if (modal) {
    searchParams.set("modal", modal);
  }

  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      if (value !== null && value !== undefined && value !== "") {
        searchParams.set(key, String(value));
      }
    }
  }

  const query = searchParams.toString();

  return query ? `/club/${slug}?${query}` : `/club/${slug}`;
}
