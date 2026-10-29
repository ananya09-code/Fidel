export type AuthRedirectSearch = {
  redirect?: string;
};

const DEFAULT_SIGN_IN_REDIRECT = "/Home";

function isSafeInternalPath(value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) return false;
  if (value.includes("\\")) return false;

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return false;
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) return false;
  if (decoded.includes("\\")) return false;

  for (const character of decoded) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return false;
  }

  return true;
}

export function getSafeAuthRedirect(
  value: unknown,
  fallback = DEFAULT_SIGN_IN_REDIRECT,
): string {
  if (typeof value !== "string" || !isSafeInternalPath(value)) {
    return fallback;
  }

  return value;
}

export function validateAuthRedirectSearch(
  search: Record<string, unknown>,
): AuthRedirectSearch {
  return {
    redirect:
      typeof search.redirect === "string" ? search.redirect : undefined,
  };
}
