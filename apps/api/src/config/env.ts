import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotEnv } from "dotenv";

const envCandidates = [
  path.resolve(process.cwd(), "apps/api/.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env")
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadDotEnv({ path: envPath });
    break;
  }
}

export interface AppEnv {
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  CORS_ORIGIN: string;
  LEGACY_DATABASE_URL?: string;
  DATABASE_URL?: string;
  JWT_ACCESS_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!isNonEmpty(value)) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Invalid PORT: expected integer between 1 and 65535.");
  }

  return parsed;
}

function validateOptionalUrl(name: string, value: string | undefined): string | undefined {
  if (!isNonEmpty(value)) {
    return undefined;
  }

  // Keep validation generic because SQL Server connection strings may use URI-like variations.
  if (!value.includes("://")) {
    throw new Error(`Invalid ${name}: expected connection string with protocol prefix.`);
  }

  return value;
}

function parseNodeEnv(value: string | undefined): AppEnv["NODE_ENV"] {
  if (value === "production" || value === "test") {
    return value;
  }
  return "development";
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  const env: AppEnv = {
    NODE_ENV: parseNodeEnv(source.NODE_ENV),
    PORT: parsePort(source.PORT, 3000),
    CORS_ORIGIN: source.CORS_ORIGIN ?? "http://localhost:5173",
    LEGACY_DATABASE_URL: validateOptionalUrl("LEGACY_DATABASE_URL", source.LEGACY_DATABASE_URL),
    DATABASE_URL: validateOptionalUrl("DATABASE_URL", source.DATABASE_URL),
    JWT_ACCESS_SECRET: source.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: source.JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRES_IN: source.JWT_ACCESS_EXPIRES_IN ?? "15m",
    JWT_REFRESH_EXPIRES_IN: source.JWT_REFRESH_EXPIRES_IN ?? "7d"
  };

  return env;
}
