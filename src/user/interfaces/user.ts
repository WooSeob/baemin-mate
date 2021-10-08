export class User {
  private readonly id: string;
  private readonly section: string;
  private mannerRate: number;

  constructor(id, section, mannerRate) {
    this.id = id;
    this.section = section;
    this.mannerRate = mannerRate;
  }
  public getSection(): string {
    return this.section;
  }
  public getId(): string {
    return this.id;
  }
  public getMannerRate(): number {
    return this.mannerRate;
  }
}
