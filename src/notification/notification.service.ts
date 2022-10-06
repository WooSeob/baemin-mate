import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { RoomService } from "../room/room.service";
import { RoomEventType } from "../room/const/RoomEventType";
import { FcmService } from "../infra/fcm/fcm.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserDeviceTokenEntity } from "./entity/user-device-token.entity";
import { RoomEntity } from "../room/entity/room.entity";
import RoomVoteEntity from "../room/entity/room-vote.entity";
import { NotificationEntity } from "./entity/notification.entity";
import { NotificationType } from "./const/NotificationType";
import { UserService } from "../user/user.service";
import { UserEvent } from "../user/const/UserEvent";
import { UserEntity } from "../user/entity/user.entity";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger("NotificationService");

  constructor(
    private roomService: RoomService,
    private fcmService: FcmService,
    private userService: UserService,
    @InjectRepository(UserDeviceTokenEntity)
    private tokenRepository: Repository<UserDeviceTokenEntity>,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>
  ) {
    roomService.on(RoomEventType.ALL_READY, async (roomId: string) => {
      const room = await roomService.findRoomById(roomId);
      return this.toPurchaser(room, {
        title: room.shopName,
        body: "모두 준비완료 했습니다!",
      });
    });

    roomService.on(RoomEventType.ORDER_FIXED, async (roomId: string) => {
      const room = await roomService.findRoomById(roomId);

      const notificationMsg = {
        title: room.shopName,
        body: "방장이 진행을 확정했습니다!",
      };

      const notifications: NotificationEntity[] = room.currentParticipants.map(
        (p) => {
          return new NotificationEntity(
            p.user,
            NotificationType.RoomEvent,
            roomId,
            notificationMsg.title,
            notificationMsg.body
          );
        }
      );

      await Promise.all([
        this.toParticipants(room, notificationMsg),
        this.notificationRepository.save(notifications),
      ]);
    });

    roomService.on(RoomEventType.ORDER_CHECKED, async (roomId: string) => {
      const room = await roomService.findRoomById(roomId);

      const notificationMsg = {
        title: room.shopName,
        body: "주문내역과 금액을 확인해보세요",
      };

      const notifications: NotificationEntity[] = room.currentParticipants.map(
        (p) => {
          return new NotificationEntity(
            p.user,
            NotificationType.RoomEvent,
            roomId,
            notificationMsg.title,
            notificationMsg.body
          );
        }
      );

      await Promise.all([
        this.toParticipants(room, notificationMsg),
        this.notificationRepository.save(notifications),
      ]);
    });

    roomService.on(RoomEventType.ORDER_DONE, async (roomId: string) => {
      const room = await roomService.findRoomById(roomId);

      const notificationMsg = {
        title: room.shopName,
        body: "방장이 주문을 완료했습니다!",
      };

      const notifications: NotificationEntity[] = room.currentParticipants.map(
        (p) => {
          return new NotificationEntity(
            p.user,
            NotificationType.RoomEvent,
            roomId,
            notificationMsg.title,
            notificationMsg.body
          );
        }
      );

      await Promise.all([
        this.toParticipants(room, notificationMsg),
        this.notificationRepository.save(notifications),
      ]);
    });

    roomService.on(RoomEventType.ORDER_CANCELED, async (roomId: string) => {
      const room = await roomService.findRoomById(roomId);
      return this.toParticipants(room, {
        title: room.shopName,
        body: "진행이 취소되었습니다.",
      });
    });

    roomService.on(
      RoomEventType.KICK_VOTE_CREATED,
      async (vote: RoomVoteEntity) => {
        return this.toParticipants(vote.room, {
          title: vote.room.shopName,
          body: "강퇴 투표가 시작되었습니다.",
        });
      }
    );

    roomService.on(
      RoomEventType.KICK_VOTE_FINISHED,
      async (vote: RoomVoteEntity) => {
        return this.toParticipants(vote.room, {
          title: vote.room.shopName,
          body: "강퇴 투표가 종료되었습니다.",
        });
      }
    );

    roomService.on(
      RoomEventType.RESET_VOTE_CREATED,
      async (vote: RoomVoteEntity) => {
        return this.toParticipants(vote.room, {
          title: vote.room.shopName,
          body: "진행 취소 투표가 시작되었습니다.",
        });
      }
    );

    roomService.on(
      RoomEventType.RESET_VOTE_FINISHED,
      async (vote: RoomVoteEntity) => {
        return this.toParticipants(vote.room, {
          title: vote.room.shopName,
          body: "진행 취소 투표가 종료되었습니다.",
        });
      }
    );

    userService.on(UserEvent.DELETED, async (user: UserEntity) => {
      await this.deleteDeviceTokenByUser(user.id);
    });
  }

  async findNotificationsByUserId(userId: string) {
    return this.notificationRepository.find({ userId: userId });
  }

  async findNotificationById(notificationId: number) {
    return this.notificationRepository.findOne(notificationId);
  }

  // TODO Guard로 접근제어 하기
  async setReadFlagOnNotification(notificationId: number, userId: string) {
    const notification = await this.findNotificationById(notificationId);

    if (!notification) {
      throw new NotFoundException("존재하지 않는 알림입니다.");
    }

    if (notification.userId != userId) {
      throw new ForbiddenException(
        "다른 유저의 알림 상태를 수정할 수 없습니다."
      );
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);
  }

  async publishChatNotification(
    roomId: string,
    userId: string,
    message: string
  ) {
    const room = await this.roomService.findRoomById(roomId);
    return this.toParticipants(room, {
      title: room.shopName,
      body: message,
    });
  }

  private async toPurchaser(room, message) {
    const deviceTokens = (await this.getDeviceTokensOfPurchaser(room)).map(
      (deviceToken) => deviceToken.deviceToken
    );
    if (deviceTokens.length == 0) {
      return;
    }
    this.fcmService.multicastNotification(deviceTokens, message);
  }

  private async toParticipants(room, message) {
    const deviceTokens = (await this.getDeviceTokensOfParticipants(room)).map(
      (deviceToken) => deviceToken.deviceToken
    );
    if (deviceTokens.length == 0) {
      return;
    }
    this.fcmService.multicastNotification(deviceTokens, message);
  }

  getDeviceTokensOfPurchaser(room: RoomEntity) {
    return this.tokenRepository.find({ user: room.purchaser, enabled: true });
  }

  getDeviceTokensOfParticipants(room: RoomEntity) {
    return this.tokenRepository
      .createQueryBuilder("token")
      .leftJoinAndSelect("token.user", "user")
      .where("userId IN (:id)", {
        id: room.currentParticipants.map((p) => p.userId),
      })
      .andWhere("enabled = :state", { state: true })
      .andWhere("user.deletedAt IS NULL")
      .getMany();
  }

  async deleteDeviceTokenByUser(userId: string) {
    await this.tokenRepository.delete({
      userId: userId,
    });
  }

  async put(uid: string, token: string) {
    let userToken = await this.tokenRepository.findOne({ deviceToken: token });

    if (!userToken) {
      userToken = this.tokenRepository.create({
        userId: uid,
        deviceToken: token,
      });
    }

    return this.tokenRepository.save(userToken);
  }

  async setEnabled(uid: string, state: boolean) {
    const userTokens = await this.tokenRepository.find({ userId: uid });

    if (!userTokens) {
      throw new NotFoundException("존재하지 않는 유저입니다.");
    }

    for (const userToken of userTokens) {
      userToken.enabled = state;
    }

    return this.tokenRepository.save(userTokens);
  }
}

/**
 * 알람 보낼때
 - 채팅 메시지
 - allready(방장만), fix, check, done, cancel
 - vote created & finished
  나가기 이벤트 액션 타입 3개로 분할
 - 나가기 = (leave, kicked, kickedbyvote)
 * */
