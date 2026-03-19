import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    sameSite: "lax",
  });
}

export function removeAuthToken(): void {
  Cookies.remove(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!Cookies.get(TOKEN_KEY);
}
