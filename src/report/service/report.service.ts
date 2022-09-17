import { Injectable } from "@nestjs/common";
import ReportReason from "../dto/ReportReason";

@Injectable()
export class ReportService {
  constructor() {}

  async putReportForMessage(messageId: string, reason: ReportReason) {}
}
