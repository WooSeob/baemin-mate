export const SECTION = {
  NARAE: "Narae",
  HOYOEN: "Hoyoen",
  CHANGZO: "Changzo",
  BIBONG: "Bibong",
} as const;
export type SectionType = typeof SECTION[keyof typeof SECTION];
export class User {
  private readonly id: string;
  private readonly section: SectionType;
  private mannerRate: number;

  constructor(id, section, mannerRate) {
    this.id = id;
    this.section = section;
    this.mannerRate = mannerRate;
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
