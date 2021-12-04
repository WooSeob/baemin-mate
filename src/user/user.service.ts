import { Inject, Injectable } from "@nestjs/common";
import { AddMenuDto } from "./dto/request/add-menu.dto";
import { UpdateMenuDto } from "./dto/request/update-menu.dto";
import { IUserContainer } from "../core/container/IUserContainer";
import { IMatchContainer } from "../core/container/IMatchContainer";
import { IRoomContainer } from "../core/container/IRoomContainer";
import { v4 as uuidv4 } from "uuid";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @Inject("IMatchContainer") private matchContainer: IMatchContainer,
    @Inject("IRoomContainer") private roomContainer: IRoomContainer
  ) {}

  async isParticipant(uid: string, rid: string) {
    const room = this.roomContainer.findById(rid);
    const user = await this.findUserById(uid);
    return room.users.has(user);
  }

  async findUserById(id: string): Promise<User> {
    return await this.userRepository.findOne({ id: id });
  }

  async getMenus(rid: string, uid: string) {
    return this.roomContainer
      .findById(rid)
      .menus.getMenusByUser(await this.findUserById(uid));
  }

  async getMenu(rid: string, uid: string, menuId: string) {
    const room = this.roomContainer.findById(rid);
    const user = await this.findUserById(uid);
    return room.menus.getMenuMapByUser(user).get(menuId);
  }

  async addMenu(addMenuDto: AddMenuDto, rid: string, uid: string) {
    const room = this.roomContainer.findById(rid);
    const user = await this.findUserById(uid);
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
    updateMenuDto: UpdateMenuDto,
    rid: string,
    uid: string,
    mid: string
  ) {
    const room = this.roomContainer.findById(rid);
    const user = await this.findUserById(uid);
    room.menus.update(user, mid, {
      id: mid,
      ...updateMenuDto,
    });
  }

  async deleteMenu(rid: string, uid: string, mid: string) {
    const room = this.roomContainer.findById(rid);
    room.menus.delete(await this.findUserById(uid), mid);
  }

  async toggleReady(rid: string, uid: string) {
    const room = this.roomContainer.findById(rid);
    const user = await this.findUserById(uid);

    const isReady = room.users.getIsReady(user);
    room.users.setReady(user, !isReady);
    return !isReady;
  }
}
