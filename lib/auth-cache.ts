export const authCacheKey = "kokoro:is-signed-in";

export function readCachedSignedIn() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(authCacheKey) === "true";
  } catch {
    return false;
  }
}

export function cacheSignedIn(value: boolean) {
  if (typeof window === "undefined") return;

  try {
    if (value) {
      window.localStorage.setItem(authCacheKey, "true");
    } else {
      window.localStorage.removeItem(authCacheKey);
    }
  } catch {
    // Storage can be unavailable in private browsing contexts.
  }
}
