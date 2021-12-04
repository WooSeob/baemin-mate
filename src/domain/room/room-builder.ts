import { Room } from "./room";
import { CreateRoomDto } from "../../room/dto/request/create-room.dto";
import { User } from "../../user/entity/user.entity";

export class RoomBuilder {
  private dto: CreateRoomDto;
  private purchaser: User;

  constructor(dto: CreateRoomDto) {
    this.dto = dto;
  }

  public setPurchaser(val: User): RoomBuilder {
    this.purchaser = val;
    return this;
  }

  public build(): Room {
    if (!this.purchaser) {
      throw new Error("all attributes required");
    }
    return new Room(
      this.dto.shopName,
      this.dto.deliveryPriceAtLeast,
      this.dto.deliveryTipsInterval,
      this.purchaser,
      this.dto.category,
      this.dto.section
    );
  }
}
