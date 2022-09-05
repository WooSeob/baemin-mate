import { BadRequestException, GoneException } from "@nestjs/common";
import { ClientVersionControlConfig } from "../../../config";
import VersionCheckPolicy from "./policy/VersionCheckPolicy";
import ApiVersion from "./ApiVersion";

export default class VersionChecker {
  readonly supportedTypes = ["ios", "aos"];

  readonly policy: VersionCheckPolicy;

  readonly type: string;

  readonly version: ApiVersion;

  constructor(policy: VersionCheckPolicy, type: string, version: string) {
    if (!this.supportedTypes.includes(type.toLowerCase())) {
      throw new BadRequestException("클라이언트 타입이 올바르지 않습니다.");
    }

    this.policy = policy;
    this.type = type.toLowerCase();
    this.version = ApiVersion.createFromDotSeperatedString(version);
  }

  check() {
    let versionString: string;
    if (this.type == "ios") {
      versionString = ClientVersionControlConfig.ios.minimum;
    } else {
      versionString = ClientVersionControlConfig.aos.minimum;
    }

    const minimum = ApiVersion.createFromDotSeperatedString(versionString);
    if (!this.policy.isSatisfy(this.version, minimum)) {
      throw new GoneException("클라이언트 업데이트가 필요합니다.");
    }
  }
}
