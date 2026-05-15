import { Injectable, Logger } from "@nestjs/common";
import * as mssql from "mssql";
import { loadEnv } from "../../config/env";

export interface LegacyDatabaseGateway {
  checkHealth(): Promise<{ status: "not_configured" | "ok" | "error" }>;
  query<T>(sqlText: string, params?: Record<string, unknown>): Promise<T[]>;
}

@Injectable()
export class LegacyDatabaseService implements LegacyDatabaseGateway {
  private readonly logger = new Logger(LegacyDatabaseService.name);
  private readonly env = loadEnv();
  private pool?: mssql.ConnectionPool;
  private connecting?: Promise<mssql.ConnectionPool>;

  private parseBoolean(value: string | undefined): boolean | undefined {
    if (!value) {
      return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1") {
      return true;
    }
    if (normalized === "false" || normalized === "0") {
      return false;
    }
    return undefined;
  }

  private parseLegacyDatabaseConfig(connectionString: string): mssql.config {
    const trimmed = connectionString.trim();
    const segments = trimmed
      .split(";")
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0);

    const baseSegment = segments.shift();
    if (!baseSegment) {
      throw new Error("Invalid LEGACY_DATABASE_URL: empty value.");
    }

    const baseUrl = new URL(baseSegment);
    const extraOptions = new Map<string, string>();
    for (const segment of segments) {
      const equalsIndex = segment.indexOf("=");
      if (equalsIndex < 0) {
        continue;
      }
      const key = segment.slice(0, equalsIndex).trim().toLowerCase();
      const value = segment.slice(equalsIndex + 1).trim();
      if (key.length > 0) {
        extraOptions.set(key, value);
      }
    }

    for (const [key, value] of baseUrl.searchParams.entries()) {
      if (!extraOptions.has(key.toLowerCase())) {
        extraOptions.set(key.toLowerCase(), value);
      }
    }

    const databaseFromPath = baseUrl.pathname.replace(/^\/+/, "").trim();
    const database = extraOptions.get("database") ?? (databaseFromPath.length > 0 ? databaseFromPath : undefined);
    const portFromUrl = baseUrl.port ? Number(baseUrl.port) : undefined;
    const parsedPort = Number.isInteger(portFromUrl) ? portFromUrl : undefined;

    if (!baseUrl.hostname) {
      throw new Error("Invalid LEGACY_DATABASE_URL: missing server host.");
    }

    const config: mssql.config = {
      server: baseUrl.hostname,
      user: decodeURIComponent(baseUrl.username),
      password: decodeURIComponent(baseUrl.password),
      port: parsedPort,
      database,
      options: {
        encrypt: this.parseBoolean(extraOptions.get("encrypt")) ?? true,
        trustServerCertificate: this.parseBoolean(extraOptions.get("trustservercertificate")) ?? false
      }
    };

    return config;
  }

  private async getPool(): Promise<mssql.ConnectionPool> {
    if (this.pool) {
      return this.pool;
    }

    if (!this.env.LEGACY_DATABASE_URL) {
      throw new Error("LEGACY_DATABASE_URL is not configured.");
    }

    if (!this.connecting) {
      const config = this.parseLegacyDatabaseConfig(this.env.LEGACY_DATABASE_URL);
      this.connecting = mssql.connect(config)
        .then((connectedPool) => {
          this.pool = connectedPool;
          this.connecting = undefined;
          return connectedPool;
        })
        .catch((error) => {
          this.connecting = undefined;
          throw error;
        });
    }

    return this.connecting;
  }

  async checkHealth(): Promise<{ status: "not_configured" | "ok" | "error" }> {
    if (!this.env.LEGACY_DATABASE_URL) {
      return { status: "not_configured" };
    }

    try {
      const pool = await this.getPool();
      await pool.request().query("SELECT 1 AS health");
      return { status: "ok" };
    } catch (error) {
      this.logger.error("Legacy database health check failed.", error as Error);
      return { status: "error" };
    }
  }

  async query<T>(sqlText: string, params?: Record<string, unknown>): Promise<T[]> {
    const pool = await this.getPool();
    const request = pool.request();

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (typeof value === "string") {
          request.input(key, mssql.NVarChar(mssql.MAX), value);
          continue;
        }
        request.input(key, value as string | number | boolean | Date | Buffer | null);
      }
    }

    const result = await request.query<T>(sqlText);
    return result.recordset;
  }
}

/*
  TODO(database-first):
  - Option B: Implement TypeORM datasource if compatibility/performance is validated.
  - Keep anti-corruption layer: never expose legacy schema directly to domain modules.
  - Add connection resiliency, timeout policy, and telemetry before production usage.
*/
