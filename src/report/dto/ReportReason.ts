import { ApiProperty } from "@nestjs/swagger";

export default class ReportReason {
  @ApiProperty({ description: "신고 사유 id" })
  reasonId: string;

  @ApiProperty({ description: "신고 사유에 대한 설명" })
  description: string;
}
