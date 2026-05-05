import { Injectable } from "@nestjs/common";

@Injectable()
export class ParceirosService {
  async findAll() {
    return {
      message: "Parceiros listing scaffolded. Data shape to be confirmed during migration mapping."
    };
  }
}

