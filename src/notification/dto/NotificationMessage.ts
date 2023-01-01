import { NotificationType } from "../const/NotificationType";

export class NotificationMessage {
  createNotification: boolean;
  type: NotificationType;
  metadata: string;
  title: string;
  body: string;
}
