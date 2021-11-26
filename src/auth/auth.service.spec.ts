import { Test, TestingModule } from "@nestjs/testing";
import { IUserContainer } from "../core/container/IUserContainer";
import { AuthModule } from "./auth.module";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;
  let userContainer: IUserContainer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userContainer = module.get("IUserContainer");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should login fail", () => {
    const ret = service.login({
      userId: "wooseob",
      password: "qwe",
    });
    expect(ret).toBe(null);
  });

  it("should login success", () => {
    const ret = service.login({
      userId: "wooseob",
      password: "qwer",
    });

    expect(ret).toBe(userContainer.findById("wooseob").sessionId);
  });
});
