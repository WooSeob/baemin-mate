import { ChatBody, Message, SystemBody } from "./message.response";
import RoomChatEntity from "../../entity/room-chat.entity";

export class SystemMessageResponse implements Message<SystemBody> {
  at: string;
  body: SystemBody;
  id: string;
  idx: number;
  type: string;
  static from(roomChat: RoomChatEntity, body: SystemBody) {
    const m = new SystemMessageResponse();
    m.at = String(roomChat.createdAt);
    m.body = body;
    m.id = String(roomChat.id);
    m.idx = roomChat.id;
    m.type = "system";
    return m;
  }
}

export class ChatMessageResponse implements Message<ChatBody> {
  at: string;
  body: ChatBody;
  id: string;
  idx: number;
  type: string;
  static from(roomChat: RoomChatEntity, body: ChatBody) {
    const m = new ChatMessageResponse();
    m.at = String(roomChat.createdAt);
    m.body = body;
    m.id = String(roomChat.id);
    m.idx = roomChat.id;
    m.type = "chat";
    return m;
  }
}
