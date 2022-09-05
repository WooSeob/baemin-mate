import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { NotificationType } from "../../const/NotificationType";
import { NotificationEntity } from "../../entity/notification.entity";

export class NotificationResponse {
  @ApiProperty({ description: "알림 id" })
  id: number;

  @ApiProperty({ description: "알림 타이틀" })
  title: string;

  @ApiProperty({ description: "알림 본문" })
  body: string;

  @ApiProperty({
    description: "알림 타입(주문 방 이벤트, 키워드 알림, 추천 등)",
  })
  type: NotificationType;

  @ApiProperty({ description: "알림 타입 별 추가 메타데이터" })
  metadata: string;

  @ApiProperty({ description: "읽음 여부" })
  isRead: boolean;

  @ApiProperty({ description: "생성 일자" })
  createdAt: number;

  static from(notification: NotificationEntity): NotificationResponse {
    const instance = new NotificationResponse();
    instance.id = notification.id;
    instance.title = notification.title;
    instance.body = notification.body;
    instance.type = notification.type;
    instance.metadata = notification.metadata;
    instance.isRead = notification.isRead;
    instance.createdAt = notification.createdAt;
    return instance;
  }
}
