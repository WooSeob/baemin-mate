import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { randomInt } from "crypto";

@Injectable()
export class GenerationService {
  public createSessionKey(): string {
    return uuid();
  }

  public createAuthCode(): string {
    return String(randomInt(10000, 100000));
  }
}
