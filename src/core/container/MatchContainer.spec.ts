import { Test, TestingModule } from "@nestjs/testing";
import { IMatchContainer } from "./IMatchContainer";
import { MatchContainer } from "./MatchContainer";

const MatchContainerProvider = {
  provide: "IMatchContainer",
  useClass: MatchContainer,
};

describe("MatchContainer", () => {
  let container: IMatchContainer;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchContainerProvider],
    }).compile();

    container = module.get<IMatchContainer>("IMatchContainer");
  });

  it("should be defined", () => {
    console.log(container);
    expect(container).toBeDefined();
  });
});
