import { Body, Controller, Get, Logger, Param, Put } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ReportService } from "./service/report.service";
import ReportReason from "./dto/ReportReason";
import CreateMessageReportDto from "./dto/CreateMessageReportDto";
import { JustLoggedIn } from "../room/decorators/room.decorator";
import { ReportReasonService } from "./service/report-reason.service";

@ApiHeader({
  name: "Client-Version",
  description: "클라이언트 버전",
})
@Controller("report")
export class ReportController {
  private static API_TAG = "Report";
  private readonly logger = new Logger("ReportController");

  constructor(
    private reportService: ReportService,
    private reportReasonService: ReportReasonService
  ) {}

  @JustLoggedIn()
  @ApiOperation({
    tags: [ReportController.API_TAG],
    description: "특정 메시지에 대한 신고 사유 목록을 조회한다.",
  })
  @ApiResponse({
    type: [ReportReason],
  })
  @Get("v1/message/:mid/reason")
  async getReportReasons(
    @Param("mid") messageId: string
  ): Promise<ReportReason[]> {
    return this.reportReasonService.getReasonsForMessage(messageId);
  }

  /**
   * TODO
   * 해당 메시지를 수신한 이력이 있는 유저만 신고할 수 있어야함.
   * 하지만 아래 어노테이션은 단순 유저 인증만 수행함.
   * messageId 가 uuid 등 추측할 수 없는 값으로 이루어 진다면 이 id를 아는것 자체가 인가의 한 부분으로 볼 수도 있음
   * 정말로 특정 메시지 수신타겟 여부를 확인하려면 채팅 idx 이력 모두 뒤져야함
   */
  @JustLoggedIn()
  @ApiOperation({
    tags: [ReportController.API_TAG],
    description: "messageId에 해당하는 메시지를 reasonId의 이유로 신고한다.",
  })
  @Put("v1/message/:mid")
  async putReportForMessage(
    @Param("mid") messageId: string,
    @Body() putReportDto: CreateMessageReportDto
  ) {}
}
