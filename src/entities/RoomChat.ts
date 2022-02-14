import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Room } from "./Room";
import { RoomEventType } from "./RoomEventType";

@Entity()
export default class RoomChat {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable: false,
    type: "bigint",
    default: Date.now(),
  })
  createdAt: number;

  // 공통
  @Column({ nullable: false })
  type: RoomEventType;

  @Column({ nullable: true })
  eventMetadataId: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  message: string;

  // 공통
  @Column()
  roomId: string;

  @ManyToOne(() => Room, { onDelete: "CASCADE" })
  room: Room;
}

abstract class RoomChatBuilder {
  protected obj = new RoomChat();
  setType(type: RoomEventType) {
    this.obj.type = type;
    return this;
  }
  setRoom(roomId: string) {
    this.obj.roomId = roomId;
    return this;
  }
  protected validate() {
    return this.obj.type != undefined && this.obj.roomId != undefined;
  }
  abstract build(): RoomChat;
}

export class SystemMessageBuilder extends RoomChatBuilder {
  setType(type: RoomEventType): this {
    return super.setType(type);
  }

  setMetadataId(id: string) {
    this.obj.eventMetadataId = id;
    return this;
  }

  protected validate(): boolean {
    return super.validate() && this.obj.eventMetadataId != undefined;
  }

  build(): RoomChat {
    if (!this.validate()) {
      throw new Error("SystemMessage를 위한 정보가 부족합니다.");
    }
    return this.obj;
  }
}

export class ChatMessageBuilder extends RoomChatBuilder {
  setUser(userId: string) {
    this.obj.userId = userId;
    return this;
  }

  setMessage(message: string) {
    this.obj.message = message;
    return this;
  }

  protected validate(): boolean {
    return (
      super.validate() &&
      this.obj.userId != undefined &&
      this.obj.message != undefined
    );
  }

  build(): RoomChat {
    super.setType(RoomEventType.CHAT);
    if (!this.validate()) {
      throw new Error("ChatMessage를 위한 정보가 부족합니다.");
    }
    return this.obj;
  }
}
/**
 * 공통 room, type
 * Chat room, type, user, message
 * System room, type, metadata
 *
 * */
