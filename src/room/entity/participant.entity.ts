import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "../../user/entity/user.entity";
import { MenuEntity } from "./menu.entity";
import { RoomEntity, RoomRole } from "./room.entity";
import { RoomState } from "../const/RoomState";

@Entity()
export class ParticipantEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  deliveryTip: number;

  @ManyToOne(() => RoomEntity, (room) => room.participants, {
    onDelete: "CASCADE",
  })
  room!: RoomEntity;

  @ManyToOne(() => UserEntity, (u) => u.rooms, {
    onDelete: "CASCADE",
    eager: true,
  })
  user!: UserEntity;

  @Column({
    nullable: false,
    default: 1,
  })
  role!: RoomRole;

  @Column({
    nullable: false,
    default: false,
  })
  isReady!: boolean;

  @OneToMany(() => MenuEntity, (menu) => menu.participant, {
    eager: true,
    cascade: true,
  })
  menus!: MenuEntity[];

  getTotalPrice() {
    if (!this.menus) {
      return 0;
    }
    return this.menus
      .map((menu) => menu.getPriceSum())
      .reduce((prev, current) => prev + current, 0);
  }

  // 메뉴 추가
  addMenu(menu: MenuEntity) {
    this.room.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
    this.menus.push(menu);
  }

  // 메뉴 수정
  updateMenu(menu: MenuEntity) {
    this.room.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
    this.menus.splice(this.findMenuIdx(menu.id), 1, menu);
  }

  // 메뉴 삭제
  deleteMenu(menuId: string) {
    this.room.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
    this.menus.splice(this.findMenuIdx(menuId), 1);
  }

  // 메뉴 조회
  getMenuById(menuId: string) {
    return this.menus[this.findMenuIdx(menuId)];
  }

  // 전체 메뉴 조회
  async getMenus() {
    return this.menus;
  }

  private findMenuIdx(menuId) {
    const idx = this.menus.findIndex((m) => m.id == menuId);
    if (idx == -1) {
      throw new Error("해당하는 메뉴가 없습니다.");
    }
    return idx;
  }
}

export class ParticipantBuilder {
  private readonly object: ParticipantEntity;

  constructor() {
    this.object = new ParticipantEntity();
  }

  setRoom(room: RoomEntity): ParticipantBuilder {
    this.object.room = room;
    return this;
  }

  setUser(user: UserEntity): ParticipantBuilder {
    this.object.user = user;
    return this;
  }

  setRole(role: RoomRole): ParticipantBuilder {
    this.object.role = role;
    return this;
  }

  build(): ParticipantEntity {
    return this.object;
  }
}
