import { TipBoundary } from "../interfaces/shop.interface";

export class CreateMatchDto {
  userId: string;
  shopName: string;
  deliveryPriceAtLeast: number;
  deliveryTipsInterval: TipBoundary[];
}
