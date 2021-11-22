import { Test, TestingModule } from "@nestjs/testing";
import { Match, MatchBuilder } from "../../match/domain/match";
import { CreateMatchDto } from "../../match/dto/create-match.dto";
import { CATEGORY } from "../../match/interfaces/category.interface";
import { SECTION, User } from "../../user/interfaces/user";
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

  it("push", () => {
    let createDtos: CreateMatchDto[] = [
      {
        userId: "wooseob",
        shopName: "서브웨이",
        deliveryPriceAtLeast: 3000,
        deliveryTipsInterval: [
          { price: 3000, tip: 2000 },
          { price: 12000, tip: 0 },
        ],
        category: CATEGORY.CHICKEN,
        section: SECTION.NARAE,
      },
      {
        userId: "gildong",
        shopName: "맥도날드",
        deliveryPriceAtLeast: 3000,
        deliveryTipsInterval: [
          { price: 3000, tip: 2000 },
          { price: 12000, tip: 0 },
        ],
        category: CATEGORY.KOREAN,
        section: SECTION.BIBONG,
      },
    ];

    for (let dto of createDtos) {
      let match: Match = new MatchBuilder(dto)
        .setPerchaser(new User(dto.userId, SECTION.NARAE, 37))
        .build();
      container.push(match);
    }
    expect(container.findById("0").perchaser.getId()).toBe("kiwoong");
  });

  it("find by section narae", () => {
    let bySection: Match[] = container.findBySection(SECTION.NARAE);
    expect(bySection.length).toBe(1); //1
  });

  it("find by section bibong", () => {
    let bySection: Match[] = container.findBySection(SECTION.BIBONG);
    expect(bySection.length).toBe(1);
  });

  it("find by section hoyoen", () => {
    let byCategory: Match[] = container.findBySection(SECTION.HOYOEN);
    expect(byCategory.length).toBe(0);
  });

  it("find by category chicken", () => {
    let byCategory: Match[] = container.findByCategory(CATEGORY.CHICKEN);
    expect(byCategory.length).toBe(1); //1
  });

  it("find by category korean", () => {
    let byCategory: Match[] = container.findByCategory(CATEGORY.KOREAN);
    expect(byCategory.length).toBe(1);
  });

  it("find by category western", () => {
    let byCategory: Match[] = container.findByCategory(CATEGORY.WESTERN);
    expect(byCategory.length).toBe(0);
  });
});
