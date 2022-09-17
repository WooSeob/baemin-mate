import { Injectable } from "@nestjs/common";
import ReportReason from "../dto/ReportReason";
import { Builder } from "builder-pattern";

@Injectable()
export class ReportReasonService {
  private readonly reasonsForMessage = [];

  constructor() {
    /**
     * TODO
     * api 확장성을 위해서
     * 1. report reason list 조회
     * 2. 특정 reasonId 로 신고
     * 하는 로직으로 구성함.
     * 일단. 신고 사유 목록 자체는 db 까지는 안가고 app 단에서 관리함
     * */
    this.reasonsForMessage.push(
      Builder<ReportReason>()
        .reasonId("report-message-reason-1")
        .description("욕설 및 음담패설")
        .build(),
      Builder<ReportReason>()
        .reasonId("report-message-reason-2")
        .description("기타")
        .build()
    );
  }

  async getReasonsForMessage(messageId: string): Promise<ReportReason[]> {
    return this.reasonsForMessage;
  }
}
