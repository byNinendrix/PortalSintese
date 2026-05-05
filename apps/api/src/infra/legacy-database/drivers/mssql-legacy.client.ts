export interface MssqlLegacyClientContract {
  // TODO: define read contracts after inventory CSV validation.
  // Do not add table-specific methods before schema discovery.
  checkConnectivity(): Promise<"not_implemented">;
}

export class MssqlLegacyClient implements MssqlLegacyClientContract {
  async checkConnectivity(): Promise<"not_implemented"> {
    // Placeholder only. No real connection in this phase.
    return "not_implemented";
  }
}

