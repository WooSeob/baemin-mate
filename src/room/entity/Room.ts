import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomState } from "../const/RoomState";
import { User } from "../../user/entity/user.entity";
import { CategoryType } from "../../match/interfaces/category.interface";
import { Participant, ParticipantBuilder } from "./Participant";
import { ImageFile } from "./ImageFile";
import { CreateRoomDto } from "../dto/request/create-room.dto";
import { NotFoundException } from "@nestjs/common";
import RoomBlackList, { RoomBlackListReason } from "./RoomBlackList";
import University from "../../university/entity/University";
import { BigIntTransformer } from "../../common/BigIntTransformer";
import Dormitory from "../../university/entity/Dormitory";
import {
  AlreadyInProgressRoomJoinedException,
  AlreadyJoinedException,
  AlreadyReadyRoomExistException,
  AnotherUnivJoinNotAllowedException,
  BannedUserJoinNotAllowedException,
  CantChangePhaseException,
  CantLeaveBcsReadyException,
  InProgressRoomJoinNotAllowedException,
  KickAtAfterFixNotAllowedException,
  KickPurchaserNotAllowedException,
  NotAllowedPhaseException,
  OrderCheckScreenShotNotFoundException,
  PurchaserCantLeaveException,
} from "../exceptions/room.exception";

export enum RoomRole {
  PURCHASER = "purchaser",
  MEMBER = "member",
}

@Entity()
export class Room {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * 생성시 받아야 할 항목들
   * */

  @Column({
    nullable: false,
  })
  shopName: string;

  @Column()
  purchaserId: string;

  //TODO 유저가 탈퇴해버리면?
  @ManyToOne(() => User)
  @JoinColumn()
  purchaser: User;

  @Column({
    nullable: false,
  })
  category: CategoryType;

  @Column()
  sectionId: number;

  @ManyToOne(() => Dormitory, { eager: true })
  @JoinColumn()
  section: Dormitory;

  @Column({
    nullable: false,
  })
  linkFor3rdApp: string;

  @Column({
    nullable: false,
  })
  atLeastPrice: number;

  @Column({
    nullable: false,
    default: RoomState.PREPARE,
  })
  phase: RoomState;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
    transformer: [BigIntTransformer],
  })
  createdAt: number;

  @Column()
  targetUnivId: number;

  @ManyToOne(() => University)
  @JoinColumn()
  targetUniv: University;

  //TODO 유저가 탈퇴해버리면?
  @OneToMany(() => Participant, (participant) => participant.room, {
    cascade: true,
    eager: true,
  })
  participants: Participant[];

  @Column({
    nullable: false,
    default: 0,
  })
  deliveryTip: number;

  @OneToMany(() => ImageFile, (imageFile) => imageFile.room, {
    cascade: true,
    lazy: true,
  })
  orderCheckScreenShots: Promise<ImageFile[]>;

  @OneToMany(() => RoomBlackList, (b) => b.room, {
    cascade: true,
    eager: true,
  })
  blackList: RoomBlackList[];

  private static phaseGraph: Map<RoomState, Set<RoomState>> =
    Room.createPhaseGraph();

  private static createPhaseGraph(): Map<RoomState, Set<RoomState>> {
    const graph: Map<RoomState, Set<RoomState>> = new Map();
    graph.set(RoomState.PREPARE, new Set([RoomState.ALL_READY]));
    graph.set(
      RoomState.ALL_READY,
      new Set([RoomState.PREPARE, RoomState.ORDER_FIX])
    );
    graph.set(
      RoomState.ORDER_FIX,
      new Set([RoomState.ALL_READY, RoomState.ORDER_CHECK])
    );
    graph.set(
      RoomState.ORDER_CHECK,
      new Set([RoomState.ALL_READY, RoomState.ORDER_DONE])
    );
    graph.set(RoomState.ORDER_DONE, new Set());
    graph.set(RoomState.ORDER_CANCELED, new Set());
    return graph;
  }

  getTotalPrice(): number {
    return this.participants
      .map((participant) => participant.getTotalPrice())
      .reduce((prev, current) => prev + current, 0);
  }

  private isAllReady(): boolean {
    return (
      this.participants.length > 1 &&
      this.participants
        .filter((participant) => {
          return this.purchaserId != participant.userId;
        })
        .map((participant) => {
          return participant.isReady;
        })
        .reduce((prev, current) => {
          return prev && current;
        }, true)
    );
  }

  updateAllReadyState() {
    if (
      !(this.phase == RoomState.PREPARE || this.phase == RoomState.ALL_READY)
    ) {
      return;
    }
    this.changePhase(
      this.isAllReady() ? RoomState.ALL_READY : RoomState.PREPARE
    );
  }

  isParticipant(userId: string) {
    return this.participants
      .map((p) => {
        return p.userId === userId;
      })
      .reduce((prev, current) => prev || current, false);
  }

  canTransitionTo(state: RoomState): boolean {
    return this.phase == state || Room.phaseGraph.get(this.phase).has(state);
  }

  onlyAt(...phases: RoomState[]) {
    if (!new Set(phases).has(this.phase)) {
      throw new NotAllowedPhaseException();
    }
  }

  cancel() {
    this.phase = RoomState.ORDER_CANCELED;
    this.participants.forEach((p) => {
      p.isReady = false;
    });
  }

  private changePhase(phase: RoomState) {
    if (this.canTransitionTo(phase)) {
      this.phase = phase;
    } else {
      throw new CantChangePhaseException(this.phase, phase);
    }
  }

  getUserCount(): number {
    return this.participants.length;
  }

  fixOrder() {
    this.changePhase(RoomState.ORDER_FIX);
  }

  async checkOrder(deliveryTip: number) {
    this.canTransitionTo(RoomState.ORDER_CHECK);
    if ((await this.orderCheckScreenShots).length == 0) {
      throw new OrderCheckScreenShotNotFoundException();
    }
    this.deliveryTip = deliveryTip;

    for (const participant of this.participants) {
      participant.deliveryTip = Math.floor(deliveryTip / this.getUserCount());
    }

    this.changePhase(RoomState.ORDER_CHECK);
  }

  doneOrder() {
    this.changePhase(RoomState.ORDER_DONE);
  }

  getReceiptForUser(userId: string) {
    this.onlyAt(RoomState.ORDER_CHECK, RoomState.ORDER_DONE);

    const participant = this.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    //TODO DTO 만들기
    return {
      totalDeliveryTip: this.deliveryTip,
      tipForUser: participant.deliveryTip,
      totalPrice: participant.getTotalPrice() + participant.deliveryTip,
    };
  }

  getParticipant(userId: string) {
    const participant = this.participants.find((p) => p.userId === userId);
    if (!participant) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }
    return participant;
  }

  // 레디 하기
  setReady(userId: string, state: boolean) {
    // 참여중인 방 중 prepare 단계의 방은 모두 나가기 처리 해줘야함.
    // 작성한 메뉴가 있어야 레디할 수 있음.
    this.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);

    // 멤버만 레디 / 언레디 가능
    // prepare & allReady 상태에서만 수행가능
    const pIdx = this.participants.findIndex((p) => p.userId === userId);
    if (pIdx < 0) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    const participant = this.participants[pIdx];
    participant.isReady = state;
    this.updateAllReadyState();
  }

  leave(userId: string): Participant {
    this.onlyAt(
      RoomState.PREPARE,
      RoomState.ALL_READY,
      RoomState.ORDER_DONE,
      RoomState.ORDER_CANCELED
    );

    const pIdx = this.participants.findIndex((p) => p.userId === userId);
    if (pIdx < 0) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    const participant = this.participants[pIdx];

    if (this.phase == RoomState.PREPARE || this.phase == RoomState.ALL_READY) {
      if (participant.role == RoomRole.PURCHASER) {
        if (this.getUserCount() > 1) {
          throw new PurchaserCantLeaveException();
        }
      } else {
        if (participant.isReady) {
          throw new CantLeaveBcsReadyException();
        }
      }
    }

    const target = this.participants.splice(pIdx, 1)[0];
    this.updateAllReadyState();
    return target;
  }

  kickUser(targetUserId: string, reason: RoomBlackListReason): Participant {
    // 방장만 수행 가능한 액션
    // 대상 유저가 참여자
    // order-fix 이전만 수행 가능
    const idx = this.participants.findIndex((p) => p.userId === targetUserId);
    if (idx < 0) {
      throw new NotFoundException("참여자를 찾을 수 없습니다.");
    }

    if (reason == RoomBlackListReason.KICKED_BY_PURCHASER) {
      try {
        this.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
      } catch (e) {
        throw new KickAtAfterFixNotAllowedException();
      }
      if (targetUserId === this.purchaserId) {
        throw new KickPurchaserNotAllowedException();
      }
    }

    //블랙리스트 추가
    this.blackList.push(new RoomBlackList(this, targetUserId, reason));

    const target = this.participants.splice(idx, 1)[0];
    this.updateAllReadyState();
    return target;
  }

  /**
   * 유저 기준 조건
   * - user 가 참여한 방 중 [allReady, orderFix, orderCheck] 사이의 방이 있어선 안됨.
   * - user 가 purchaser 인 방 중 [prepare, allReady, orderFix, orderCheck] 사이의 방이 있어선 안됨.
   *
   * 방 기준 조건
   * - 참여하려는 해당 방의 phase 가 [prepare, allReady] 사이여야 함.
   * - 참여하려는 유저는 해당 방의 블랙리스트가 아니어야 함.
   * */
  //Room.ts
  join(user: User) {
    // 참여하려는 방의 상태는 PREPARE, ALL_READY 여야 함.
    try {
      this.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
    } catch (e) {
      throw new InProgressRoomJoinNotAllowedException();
    }

    // 강퇴당한 이력이 있는 유저는 입장할 수 없음
    const isInBlackList = this.blackList.find((b) => b.userId === user.id);
    if (isInBlackList) {
      throw new BannedUserJoinNotAllowedException();
    }

    if (this.participants.findIndex((p) => p.userId === user.id) > -1) {
      throw new AlreadyJoinedException();
    }

    // 유저 기준 조건
    Room.validateJoin(user);

    // 같은 대학의 방에만 참가 가능
    if (this.targetUnivId !== user.universityId) {
      throw new AnotherUnivJoinNotAllowedException();
    }

    // 참가자 추가
    this.participants.push(
      new ParticipantBuilder()
        .setRoom(this)
        .setUser(user)
        .setRole(RoomRole.MEMBER)
        .build()
    );

    this.updateAllReadyState();
  }

  private static validateJoin(user) {
    for (const participation of user.rooms) {
      if (participation.role == RoomRole.PURCHASER) {
        try {
          participation.room.onlyAt(
            RoomState.ORDER_DONE,
            RoomState.ORDER_CANCELED
          );
        } catch (e) {
          throw new AlreadyInProgressRoomJoinedException();
        }
      } else if (participation.role == RoomRole.MEMBER) {
        try {
          participation.room.onlyAt(
            RoomState.PREPARE,
            RoomState.ORDER_DONE,
            RoomState.ORDER_CANCELED
          );
        } catch (e) {
          throw new AlreadyInProgressRoomJoinedException();
        }
        if (
          participation.room.phase == RoomState.PREPARE &&
          participation.isReady
        ) {
          throw new AlreadyReadyRoomExistException();
        }
      } else {
        throw new Error("잘못된 Role 입니다.");
      }
    }
  }

  static create(user: User, dto: CreateRoomDto): Room {
    //사용자가 참여한 방에 OrderFix ~ OrderDone 단계의 방이 하나라도 있으면 안됨.
    //사용자가 참여한 방에 준비완료한 방이 있으면 안됨(OrderDone 제외)
    //기존 참여 방중 방장으로서 활성 상태(order done 이하)인 방도 있으면 안됨.
    for (const participation of user.rooms) {
      try {
        participation.room.onlyAt(
          RoomState.ORDER_DONE,
          RoomState.ORDER_CANCELED
        );
      } catch (e) {
        throw new AlreadyInProgressRoomJoinedException();
      }
    }

    const room = new Room();
    room.purchaser = user;
    room.shopName = dto.shopName;
    room.category = dto.category;
    room.sectionId = dto.section;
    room.linkFor3rdApp = dto.shopLink;
    room.atLeastPrice = dto.deliveryPriceAtLeast;
    room.targetUnivId = user.universityId;
    room.participants = [
      new ParticipantBuilder()
        .setRoom(room)
        .setUser(user)
        .setRole(RoomRole.PURCHASER)
        .build(),
    ];
    return room;
  }
}
