import { User } from "../../user/entity/user.entity";

export interface IUserContainer {
  findAll(): User[];
  findBySection(section: string): User[];
  findById(id: string): User;
  push(user: User);
  delete(user: User);
}
