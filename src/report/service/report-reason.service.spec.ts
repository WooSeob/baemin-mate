import { Test, TestingModule } from "@nestjs/testing";
import { ReportReasonService } from "./report-reason.service";

describe("ReportReasonService", () => {
  let service: ReportReasonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportReasonService],
    }).compile();

    service = module.get<ReportReasonService>(ReportReasonService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
