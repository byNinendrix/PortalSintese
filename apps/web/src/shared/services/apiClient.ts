const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const API_TIMEOUT_MS = 15000;

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init,
    signal: controller.signal
  }).finally(() => clearTimeout(timeout));

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
