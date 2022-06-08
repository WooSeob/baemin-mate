import VersionCheckPolicy from "./VersionCheckPolicy";
import ApiVersion from "../ApiVersion";

export default class MinerVersionCheckPolicy implements VersionCheckPolicy {
  isSatisfy(clients: ApiVersion, minimum: ApiVersion): boolean {
    return !(clients.major < minimum.major || clients.miner < minimum.miner);
  }
}
