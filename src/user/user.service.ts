import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserBuilder } from "./entity/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>
  ) {}

  async createUserByNaver(
    id: string,
    name: string,
    mobile_e164: string,
    univId: number
  ): Promise<User> {
    const newUser = new User();
    newUser.id = id;
    newUser.name = name;
    newUser.phone = mobile_e164;
    newUser.verified = true;
    newUser.universityId = univId;
    await this.userRepository.save(newUser);
    return newUser;
  }

  /**
   * id로 유저를 찾고
   * 없으면 name이 "(알수없음)" 으로 설정된 기본 유저를 반환합니다.
   * */
  async findUserOrUnknownIfNotExist(id: string): Promise<User> {
    //TODO async 최적화?
    const user = await this.findUserById(id);
    return user
      ? user
      : new UserBuilder().setId(id).setName("(알수없음)").build();
  }

  findUserById(id: string): Promise<User> {
    return this.userRepository.findOne({ id: id });
  }

  async verify(user: User) {
    user.verified = true;
    await this.userRepository.save(user);
  }

  async getJoinedRoomIds(userId: string) {
    //TODO 트랜잭션?

    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.rooms", "rooms")
      .where("user.id = :id", { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException("존재하지 않는 회원입니다.");
    }

    return user.rooms.map((participant) => participant.roomId);
  }
}
