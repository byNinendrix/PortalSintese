import type { AuthTokensResponse } from "@sintese/types";
import type { UserProfileResponse } from "@sintese/types";

const AUTH_SESSION_KEY = "portal_sintese_auth_session";
const USER_PROFILE_CACHE_PREFIX = "portal_sintese_user_profile_";
export const AUTH_SESSION_CHANGED_EVENT = "portal_sintese_auth_session_changed";

function notifyAuthSessionChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
}

export function readAuthSession(): AuthTokensResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokensResponse;
  } catch {
    return null;
  }
}

export function saveAuthSession(payload: AuthTokensResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(payload));
  notifyAuthSessionChanged();
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_SESSION_KEY);

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(USER_PROFILE_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  notifyAuthSessionChanged();
}

export function hasAuthSession(): boolean {
  return readAuthSession() !== null;
}

export function readCachedUserProfile(cpf: string): UserProfileResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cpfDigits = cpf.replace(/\D/g, "");
  if (!cpfDigits) {
    return null;
  }

  const raw = window.sessionStorage.getItem(`${USER_PROFILE_CACHE_PREFIX}${cpfDigits}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserProfileResponse;
  } catch {
    return null;
  }
}

export function saveCachedUserProfile(profile: UserProfileResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  const cpfDigits = profile.cpf.replace(/\D/g, "");
  if (!cpfDigits) {
    return;
  }

  window.sessionStorage.setItem(`${USER_PROFILE_CACHE_PREFIX}${cpfDigits}`, JSON.stringify(profile));
}
