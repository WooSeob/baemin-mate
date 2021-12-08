import { Test, TestingModule } from "@nestjs/testing";
import { MatchService } from "./match.service";
import { ContainerModule } from "../core/container/container.module";
import { IMatchContainer } from "../core/container/IMatchContainer";
import { SectionType } from "../user/interfaces/user";
import { CategoryType } from "./interfaces/category.interface";
import { Room } from "../domain/room/room";
import { RoomBuilder } from "../domain/room/room-builder";
import { User } from "../user/entity/user.entity";
import { Match } from "../domain/match/match";
import { Socket } from "socket.io-client";

describe("MatchService", () => {
  let service: MatchService;
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ContainerModule],
      providers: [MatchService],
    }).compile();

    service = module.get<MatchService>(MatchService);
    container = module.get<IMatchContainer>("IMatchContainer");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should be defined", () => {
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

    const room: Room = new RoomBuilder({
      shopName: "testshop",
      deliveryPriceAtLeast: 200,
      shopLink: "asdf",
      category: "japanese",
      section: "Bibong",
    })
      .setPurchaser(new User())
      .build();
    container.push(new Match(room));

    let matches = service.subscribeByCategory(
      {
        category: ["korean", "chinese"],
        section: ["Changzo", "Hoyoen"],
      },
      null
    );
    expect(matches).toHaveLength(6);

    matches = service.subscribeByCategory(
      {
        category: ["japanese", "chicken"],
        section: ["Bibong", "Hoyoen"],
      },
      null
    );
    expect(matches).toHaveLength(5);
    // expect(container.findAll()).toHaveLength(12);
  });
});
