import { MatchEntity } from "../../entity/match.entity";

export default class MatchInfo {
  id: string;
  shopName: string;
  section: string;
  total: number;
  priceAtLeast: number;
  purchaserName: string;
  createdAt: number;

  static from(match: MatchEntity): MatchInfo {
    const res = new MatchInfo();
    res.id = match.id;
    res.shopName = match.shopName;
    res.section = match.sectionName;
    res.total = match.totalPrice;
    res.priceAtLeast = match.atLeastPrice;
    res.purchaserName = match.purchaserName;
    res.createdAt = match.createdAt;
    return res;
  }
}
