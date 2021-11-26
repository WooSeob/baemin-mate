import { v4 as uuidv4 } from "uuid";

export const SECTION = {
  NARAE: "Narae",
  HOYOEN: "Hoyoen",
  CHANGZO: "Changzo",
  BIBONG: "Bibong",
} as const;
export type SectionType = typeof SECTION[keyof typeof SECTION];
export class User {
  readonly sessionId: string;
  private readonly id: string;
  private readonly section: SectionType;
  private mannerRate: number;

  constructor(id, section, mannerRate) {
    this.id = id;
    this.section = section;
    this.mannerRate = mannerRate;
    this.sessionId = uuidv4();
  }
  public getSection(): SectionType {
    return this.section;
  }
  public getId(): string {
    return this.id;
  }
  public getMannerRate(): number {
    return this.mannerRate;
  }
}
