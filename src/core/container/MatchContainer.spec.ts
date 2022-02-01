import { Test, TestingModule } from "@nestjs/testing";
import { IMatchContainer } from "./IMatchContainer";
import { MatchContainer } from "./MatchContainer";
import { SECTION, SectionType } from "../../user/interfaces/user";
import { RoomBuilder } from "../../domain/room/room-builder";
import { Room } from "../../domain/room/room";
import { User } from "../../user/entity/user.entity";
import { Match } from "../../domain/match/match";
import {
  CATEGORY,
  CategoryType,
} from "../../match/interfaces/category.interface";

const MatchContainerProvider = {
  provide: "IMatchContainer",
  useClass: MatchContainer,
};

describe("MatchContainer", () => {
  let container: IMatchContainer;
  const sections = [
    "Narae" as SectionType,
    "Bibong" as SectionType,
    "Changzo" as SectionType,
    "Hoyoen" as SectionType,
  ];
  const categories = [
    "korean" as CategoryType,
    "chinese" as CategoryType,
    "japanese" as CategoryType,
    "western" as CategoryType,
    "porkcutlet" as CategoryType,
    "chicken" as CategoryType,
    "pizza" as CategoryType,
    "ddeock" as CategoryType,
    "fastfood" as CategoryType,
  ];
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchContainerProvider],
    }).compile();

    container = module.get<IMatchContainer>("IMatchContainer");
  });

  beforeEach(() => {
    container.clear();
  });

  it("should be defined", () => {
    expect(container).toBeDefined();
  });

  it("section test", () => {
    for (let section of sections) {
      const room: Room = new RoomBuilder({
        shopName: "testshop",
        deliveryPriceAtLeast: 200,
        shopLink: "asdf",
        category: "korean",
        section: section,
      })
        .setPurchaser(new User())
        .build();
      container.push(new Match(room));
    }

    for (let section of sections) {
      expect(container.findBySection(section)).toHaveLength(1);
    }
  });

  it("category test", () => {
    for (let category of categories) {
      const room: Room = new RoomBuilder({
        shopName: "testshop",
        deliveryPriceAtLeast: 200,
        shopLink: "asdf",
        category: category,
        section: "Narae",
      })
        .setPurchaser(new User())
        .build();
      container.push(new Match(room));
    }

    for (let category of categories) {
      expect(container.findByCategory(category)).toHaveLength(1);
    }
  });

  it("category x section product test", () => {
    for (let section of sections) {
      for (let category of categories) {
        const room: Room = new RoomBuilder({
          shopName: "testshop",
          deliveryPriceAtLeast: 200,
          shopLink: "asdf",
          category: category,
          section: section,
        })
          .setPurchaser(new User())
          .build();
        container.push(new Match(room));
      }
    }

    for (let section of sections) {
      for (let category of categories) {
        expect(
          container.findByCategoryAndSection(category, section)
        ).toHaveLength(1);
      }
    }
  });
});
