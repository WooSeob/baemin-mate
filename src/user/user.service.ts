import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { IUserContainer } from "../core/container/IUserContainer";
import { v4 as uuidv4 } from "uuid";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user.entity";
import { Repository } from "typeorm";
import { RoomService } from "../room/room.service";
import { Room } from "../domain/room/room";
import { MenuItem } from "../match/interfaces/shop.interface";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject("IUserContainer") private userContainer: IUserContainer,
    @Inject(forwardRef(() => RoomService)) private roomService: RoomService
  ) {}

  async isParticipant(uid: string, rid: string) {
    const room = this.roomService.findRoomById(rid);
    const user = await this.findUserById(uid);
    return room.users.has(user);
  }

  async createUserByNaver(
    id: string,
    name: string,
    mobile_e164: string
  ): Promise<User> {
    const newUser = new User();
    newUser.id = id;
    newUser.name = name;
    newUser.phone = mobile_e164;
    await this.userRepository.save(newUser);
    return newUser;
  }

  async findUserById(id: string): Promise<User> {
    //TODO anti pattern (sync-async분기에 따라 달라짐)
    let user = this.userContainer.findById(id);
    if (!user) {
      user = await this.userRepository.findOne({ id: id });
      if (!user) {
        return null;
      }
      this.userContainer.push(user);
    }
    return user;
  }

  async verify(user: User) {
    user.verified = true;
    await this.userRepository.save(user);
  }

  async getMenus(room: Room, user: User): Promise<MenuItem[]> {
    return room.menus.getMenusByUser(user);
  }

  async getMenu(room: Room, user: User, menuId: string) {
    return room.menus.getMenuMapByUser(user).get(menuId);
  }

  async addMenu(
    room: Room,
    user: User,
    addMenuDto: AddMenuDto
  ): Promise<string> {
    const menuId = uuidv4();
    room.menus.add(user, {
      id: menuId,
      name: addMenuDto.name,
      quantity: Number(addMenuDto.quantity),
      description: addMenuDto.description,
      price: Number(addMenuDto.price),
    });
    return menuId;
  }

  async updateMenu(
    room: Room,
    user: User,
    mid: string,
    updateMenuDto: UpdateMenuDto
  ) {
    //TODO MenuItem 객체를 먼저 찾고, menus의 key를 객체로 바꾸기. mid에 해당하는 MenuItem없을때 처리 해줘야함.
    room.menus.update(user, mid, {
      id: mid,
      ...updateMenuDto,
    });
  }

  async deleteMenu(room: Room, user: User, mid: string) {
    room.menus.delete(user, mid);
  }

  async toggleReady(room: Room, user: User) {
    const isReady = room.users.getIsReady(user);
    room.users.setReady(user, !isReady);
    return !isReady;
  }
}
