import { ApiProperty } from "@nestjs/swagger";

export class DormitoryResponse {
  @ApiProperty({ description: "기숙사 id" })
  id: number;

  @ApiProperty({ description: "기숙사 이름(국문)" })
  name: string;
}
