import { ApiProperty } from "@nestjs/swagger";
import RoomUserView from "../../../room/dto/response/user-view.dto";
import { MatchEntity } from "../../entity/match.entity";

export default class MatchDetailResponseDto {
  @ApiProperty({ description: "room id" })
  id: string;

  @ApiProperty({ description: "방장 정보" })
  purchaser: RoomUserView;

  @ApiProperty({ description: "가게 이름" })
  shopName: string;

  @ApiProperty({ description: "음식 카테고리" })
  category: string;

  @ApiProperty({ description: "기숙사" })
  section: string;

  @ApiProperty({ description: "외부 배달앱 링크" })
  shopLink: string;

  @ApiProperty({ description: "방장이 지정한 최소주문 금액" })
  atLeast: number;

  @ApiProperty({ description: "현재 총 주문 금액" })
  totalPrice: number;

  @ApiProperty({ description: "방 생성 시각" })
  createdAt: number;

  @ApiProperty({ description: "참여자 수" })
  participants: number;

  static from(match: MatchEntity): MatchDetailResponseDto {
    const detail = new MatchDetailResponseDto();
    detail.id = match.room.id;
    detail.purchaser = RoomUserView.from(match.room.purchaser);
    detail.shopName = match.room.shopName;
    detail.category = match.room.category;
    detail.section = match.sectionName;
    detail.shopLink = match.room.linkFor3rdApp;
    detail.atLeast = match.room.atLeastPrice;
    detail.createdAt = match.room.createdAt;
    detail.totalPrice = match.room.getTotalPrice();
    detail.participants = match.room.getUserCount();
    return detail;
  }
}
