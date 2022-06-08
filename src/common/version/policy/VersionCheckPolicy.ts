import ApiVersion from "../ApiVersion";

export default interface VersionCheckPolicy {
  isSatisfy(clients: ApiVersion, criteria: ApiVersion): boolean;
}
