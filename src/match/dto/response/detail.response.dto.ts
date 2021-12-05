import { Match } from "../../../domain/match/match";
import { ApiProperty } from "@nestjs/swagger";

export default class MatchDetailResponseDto {
  @ApiProperty({ description: "match id" })
  id: string;

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

  @ApiProperty({ description: "참여자 수" })
  participants: number;

  static from(match: Match): MatchDetailResponseDto {
    const detail = new MatchDetailResponseDto();
    detail.id = match.id;
    detail.shopName = match.info.shopName;
    detail.category = match.info.category;
    detail.section = match.info.section;
    detail.shopLink = match.info.linkFor3rdApp;
    detail.atLeast = match.atLeast;
    detail.participants = match.users;
    return detail;
  }
}
