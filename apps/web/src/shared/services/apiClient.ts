const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";
const API_TIMEOUT_MS = 15000;

export class ApiRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

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
    let errorMessage = `API request failed: ${response.status}`;
    let errorCode: string | undefined;

    try {
      const payload = (await response.clone().json()) as { message?: string | string[] | { message?: string; code?: string } ; code?: string };
      if (typeof payload.code === "string") {
        errorCode = payload.code;
      }
      if (Array.isArray(payload.message)) {
        errorMessage = payload.message.join(" ");
      } else if (payload.message && typeof payload.message === "object") {
        if (typeof payload.message.code === "string") {
          errorCode = payload.message.code;
        }
        if (typeof payload.message.message === "string" && payload.message.message.trim().length > 0) {
          errorMessage = payload.message.message;
        }
      } else if (typeof payload.message === "string" && payload.message.trim().length > 0) {
        errorMessage = payload.message;
      }
    } catch {
      const rawText = await response.text();
      if (rawText.trim().length > 0) {
        errorMessage = rawText;
      }
    }

    throw new ApiRequestError(errorMessage, response.status, errorCode);
  }

  return (await response.json()) as T;
}
