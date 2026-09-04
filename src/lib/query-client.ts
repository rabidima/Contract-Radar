import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000 } },
  });
}

let browserQueryClient: QueryClient | undefined;

/** Server renders get a fresh client every time (no cross-request cache
 * leakage); the browser keeps one client for the session. We don't
 * dehydrate/prefetch on the server here — the client just fetches on
 * mount, which is a fine trade for a small internal dashboard. */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
