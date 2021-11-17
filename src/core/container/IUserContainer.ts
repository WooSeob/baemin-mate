import { User } from "src/user/interfaces/user";

export interface IUserContainer {
  findAll(): User[];
  findBySection(section: string): User[];
  findById(id: string): User;
  push(user: User);
  delete(user: User);
}
