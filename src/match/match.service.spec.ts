import { Test, TestingModule } from "@nestjs/testing";
import { MatchService } from "./match.service";
import { SectionType } from "../user/interfaces/user";
import { CategoryType } from "./interfaces/category.interface";
import { UserEntity } from "../user/entity/user.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { db_test } from "../../config";
import { RoomEntity } from "../room/entity/room.entity";
import { MatchEntity } from "./entity/match.entity";
import { CreateRoomDto } from "../room/dto/request/create-room.dto";

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

const createRoomDto: CreateRoomDto = {
  shopName: "testshop",
  deliveryPriceAtLeast: 200,
  shopLink: "asdf",
  category: "japanese",
  section: "Bibong",
};

const mockRoomService = () => {};

describe("구독 테스트", () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...db_test, keepConnectionAlive: true }),
        TypeOrmModule.forFeature([MatchEntity]),
      ],
      providers: [MatchService],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  it("검색 필터대로 잘 와야한다.", () => {});
});

describe("이벤트 수신 테스트", () => {
  let service: MatchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({ ...db_test, keepConnectionAlive: true }),
        TypeOrmModule.forFeature([MatchEntity]),
      ],
      providers: [MatchService],
    }).compile();

    service = module.get<MatchService>(MatchService);
  });

  //TODO 해당하는 /match room 에 잘 브로드 캐스트 되는지 확인
  it("매치 추가 - 새로운 룸 생성", () => {});

  it("매치 추가 - 노출 가능 상태로 변경", () => {});

  it("매치 삭제 - 룸 삭제", () => {});

  it("매치 삭제 - 노출 불가능 상태로 변경", () => {});

  it("매치 삭제 - 룸 삭제", () => {});

  it("매치 수정 - 현재 합계금액", () => {});
  /**
   * 합계금액 변동
   * - 메뉴의 추가 수정 삭제가 이루어질때 일어난다.
   * - 메뉴를 가지고 있던 누군가 방을 나가면 메뉴의 삭제가 일어난다.
   * */
});
