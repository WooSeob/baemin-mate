import { Injectable } from "@nestjs/common";
import { IUserContainer } from "./IUserContainer";
import { User } from "../../user/entity/user.entity";

@Injectable()
export class UserContainer implements IUserContainer {
  private container: Map<string, User> = new Map<string, User>();

  findAll(): User[] {
    return [...this.container.values()];
  }

  findBySection(section: string): User[] {
    throw new Error("Method not implemented.");
  }

  findById(id: string): User {
    return this.container.get(id);
  }

  push(user: User) {
    this.container.set(user.id, user);
  }

  delete(user: User) {
    this.container.delete(user.id);
  }
}
