import { Test, TestingModule } from "@nestjs/testing";
import { OAuthService } from "./o-auth.service";

describe("OauthService", () => {
  let service: OAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OAuthService],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
