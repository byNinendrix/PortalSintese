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

function parseAuthSession(raw: string | null): AuthTokensResponse | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokensResponse;
  } catch {
    return null;
  }
}

function migrateSessionStorageToLocalStorage(): AuthTokensResponse | null {
  const legacyRaw = window.sessionStorage.getItem(AUTH_SESSION_KEY);
  const legacySession = parseAuthSession(legacyRaw);
  if (!legacySession) {
    return null;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(legacySession));
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  return legacySession;
}

export function readAuthSession(): AuthTokensResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const localSession = parseAuthSession(window.localStorage.getItem(AUTH_SESSION_KEY));
  if (localSession) {
    return localSession;
  }

  return migrateSessionStorageToLocalStorage();
}

export function saveAuthSession(payload: AuthTokensResponse): void {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(payload);
  window.localStorage.setItem(AUTH_SESSION_KEY, serialized);
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);
  notifyAuthSessionChanged();
}

export function clearAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_KEY);

  const removePrefixedKeys = (storage: Storage) => {
    const keysToRemove: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(USER_PROFILE_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => storage.removeItem(key));
  };

  removePrefixedKeys(window.localStorage);
  removePrefixedKeys(window.sessionStorage);
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

  const storageKey = `${USER_PROFILE_CACHE_PREFIX}${cpfDigits}`;
  const localRaw = window.localStorage.getItem(storageKey);
  if (localRaw) {
    try {
      return JSON.parse(localRaw) as UserProfileResponse;
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }

  const legacyRaw = window.sessionStorage.getItem(storageKey);
  if (!legacyRaw) {
    return null;
  }

  try {
    const parsed = JSON.parse(legacyRaw) as UserProfileResponse;
    window.localStorage.setItem(storageKey, legacyRaw);
    window.sessionStorage.removeItem(storageKey);
    return parsed;
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

  const storageKey = `${USER_PROFILE_CACHE_PREFIX}${cpfDigits}`;
  const serialized = JSON.stringify(profile);
  window.localStorage.setItem(storageKey, serialized);
  window.sessionStorage.removeItem(storageKey);
}
