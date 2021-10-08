import { User } from "src/user/interfaces/user";

export interface IUserRepository {
  save(user: User): User;
  findById(id: string): User;
  delete(user: User);
}
