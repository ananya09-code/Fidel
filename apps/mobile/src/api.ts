import type { ZodType } from "zod";

type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;
export type ApiToken = string | TokenGetter;
type ApiOptions = RequestInit & { session?: ApiToken };

export function authenticatedRequest(session: ApiToken): ApiOptions {
  return { session };
}

export async function apiFetch<T>(path: string, schema: ZodType<T>, options: ApiOptions = {}): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!base) throw new Error("Fidel’s API address is missing.");
  const { session, ...init } = options;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body) headers.set("Content-Type", "application/json");

  async function send(refresh: boolean) {
    if (session) {
      const token = typeof session === "function" ? await session({ skipCache: refresh }) : session;
      if (!token) throw new Error("Please sign in again to continue.");
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(base + path, { ...init, headers });
  }

  let response = await send(false);
  if (response.status === 401 && typeof session === "function") response = await send(true);
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
      ? payload.detail
      : null;
    throw new Error(detail ?? `Fidel could not complete the request (${response.status}).`);
  }
  return schema.parse(payload);
}
