import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "../user/entity/user.entity";
import { Menu } from "./Menu";
import { Room, RoomRole } from "./Room";
import { RoomState } from "./RoomState";

@Entity()
export class Participant {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  roomId: string;

  @Column()
  userId: string;

  @ManyToOne(() => Room, (room) => room.participants, {
    onDelete: "CASCADE",
  })
  room!: Room;

  @ManyToOne(() => User, (u) => u.rooms, {
    onDelete: "CASCADE",
  })
  user!: User;

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

  @OneToMany(() => Menu, (menu) => menu.participant, {
    eager: true,
    cascade: true,
  })
  menus!: Menu[];

  getTotalPrice() {
    if (!this.menus) {
      return 0;
    }
    return this.menus
      .map((menu) => menu.getPriceSum())
      .reduce((prev, current) => prev + current, 0);
  }

  // 메뉴 추가
  addMenu(menu: Menu) {
    this.room.onlyAt(RoomState.PREPARE, RoomState.ALL_READY);
    this.menus.push(menu);
  }

  // 메뉴 수정
  updateMenu(menu: Menu) {
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
  private readonly object: Participant;

  constructor() {
    this.object = new Participant();
  }

  setRoom(room: Room): ParticipantBuilder {
    this.object.room = room;
    return this;
  }

  setUser(user: User): ParticipantBuilder {
    this.object.user = user;
    return this;
  }

  setRole(role: RoomRole): ParticipantBuilder {
    this.object.role = role;
    return this;
  }

  build(): Participant {
    return this.object;
  }
}
