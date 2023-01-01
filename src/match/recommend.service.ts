import { Injectable } from "@nestjs/common";
import { SubscribeCategoryDto } from "./dto/request/subscribe-category.dto";
import { RoomService } from "../room/room.service";
import { RoomEventType } from "../room/const/RoomEventType";
import { RoomEntity } from "../room/entity/room.entity";
import { CategoryType } from "./interfaces/category.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SubscribeCategoryEntity } from "./entity/subscribe-category.entity";
import { NotificationService } from "../notification/notification.service";
import { Builder } from "builder-pattern";
import { NotificationMessage } from "../notification/dto/NotificationMessage";
import { NotificationType } from "../notification/const/NotificationType";
import { MatchEntity } from "./entity/match.entity";
import { UniversityService } from "../university/university.service";

@Injectable()
export class RecommendService {
  constructor(
    @InjectRepository(SubscribeCategoryEntity)
    private subscribeCategoryRepository: Repository<SubscribeCategoryEntity>,
    @InjectRepository(MatchEntity)
    private matchRepository: Repository<MatchEntity>,
    private universityService: UniversityService,
    private roomService: RoomService,
    private notificationService: NotificationService
  ) {
    roomService.on(RoomEventType.CREATE, async (room: RoomEntity) => {
      const userIds: string[] = (
        await this.getSubscriptionsByCategory(room.category, room.targetUnivId)
      ).map((e) => e.userId);

      console.log(userIds);

      if (userIds.length < 1) {
        return;
      }

      const dormitory = await this.universityService.getDormitoryById(
        room.sectionId
      );

      const match = await this.matchRepository.save(
        MatchEntity.fromSubscription(room, dormitory.name)
      );

      await notificationService.publishPushAndNotification(
        userIds,
        Builder<NotificationMessage>()
          .createNotification(true)
          .type(NotificationType.RecommendEvent)
          .metadata(match.id)
          .title(`${room.category} 와 관련된 방이 생성되었어요`)
          .body("지금 바로 참가해 보세요.")
          .build()
      );
    });
  }

  async getSubscriptionsByCategory(category: CategoryType, univId: number) {
    return (
      await this.subscribeCategoryRepository.find({
        category: category,
        univId: univId,
      })
    ).filter((subscription) => subscription.expiresAt > Date.now());
  }

  async subscribeCategory(
    userId: string,
    univId: number,
    subscribeCategoryDto: SubscribeCategoryDto
  ) {
    const entities = subscribeCategoryDto.categories.map((category) => {
      return Builder<SubscribeCategoryEntity>()
        .univId(univId)
        .userId(userId)
        .category(category)
        .expiresAt(Date.now() + 1000 * 60 * 60)
        .build();
    });

    await this.subscribeCategoryRepository.save(entities);
  }

  async getSubscriptions(userId: string) {
    return (
      await this.subscribeCategoryRepository.find({
        userId: userId,
      })
    ).filter((subscription) => subscription.expiresAt > Date.now());
  }

  async deleteSubscription(userId: string, category: CategoryType) {
    await this.subscribeCategoryRepository.delete({
      userId: userId,
      category: category,
    });
  }

  async getSubscribersOfCategory(univId: number, category: CategoryType) {
    const subscriptions = await this.subscribeCategoryRepository.find({
      univId: univId,
      category: category,
    });

    return subscriptions.filter(
      (subscription) => subscription.expiresAt > Date.now()
    ).length;
  }
}
