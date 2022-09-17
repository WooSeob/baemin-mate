import { Module } from "@nestjs/common";
import { ReportController } from "./report.controller";
import { ReportService } from "./service/report.service";
import { ReportReasonService } from "./service/report-reason.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [ReportController],
  providers: [ReportService, ReportReasonService],
})
export class ReportModule {}
