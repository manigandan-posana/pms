/*
 * A tiny JWT decoder used to extract the payload from an ID or
 * access token issued by Azure AD.  This avoids pulling in an
 * additional dependency for decoding JWTs.  The function does not
 * perform any signature verification – it simply base64‑decodes the
 * payload and parses the JSON.  Use it only for reading non‑sensitive
 * claims such as roles and expiry timestamps.
 */

export function jwtDecode<T = unknown>(token: string): T {
  if (!token) {
    throw new Error("Cannot decode an empty token");
  }
  const parts = token.split(".");
  if (parts.length < 2) {
    throw new Error("Invalid JWT token");
  }
  const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
  const json = decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  return JSON.parse(json) as T;
}