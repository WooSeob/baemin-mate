export default class ApiVersion {
  readonly major: number;
  readonly miner: number;
  readonly hotfix: number;

  private constructor(major: number, miner: number, hotfix: number) {
    this.major = major;
    this.miner = miner;
    this.hotfix = hotfix;
  }

  static createFromDotSeperatedString(version: string): ApiVersion {
    const [major, miner, hotfix] = version.split(".").map((s) => parseInt(s));
    return new ApiVersion(major, miner, hotfix);
  }
}
