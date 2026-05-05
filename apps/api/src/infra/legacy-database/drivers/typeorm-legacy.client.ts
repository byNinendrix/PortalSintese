export interface TypeormLegacyClientContract {
  // TODO: define read contracts after inventory CSV validation.
  // Do not add entity/table assumptions before schema discovery.
  checkConnectivity(): Promise<"not_implemented">;
}

export class TypeormLegacyClient implements TypeormLegacyClientContract {
  async checkConnectivity(): Promise<"not_implemented"> {
    // Placeholder only. No real connection in this phase.
    return "not_implemented";
  }
}

